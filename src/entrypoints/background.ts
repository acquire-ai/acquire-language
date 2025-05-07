/**
 * Acquire Language Background Script
 */
import { defineBackground } from 'wxt/sandbox';
import { StorageManager } from '@/core/storage';
import { Word } from '@/core/types/storage';
import { loadSettings, saveSettings } from '@/core/config/settings';

export default defineBackground({
    main() {
        // Initialize settings from environment variables
        initializeSettings();

        // Listen for updates from content scripts
        listenForSubtitleRequests();
    },
});

/**
 * Initialize settings from environment variables
 * This runs when the extension starts, applying any environment variables to the stored settings
 */
async function initializeSettings() {
    try {
        // Load current settings
        const settings = await loadSettings();

        // If this is a development build with injected environment variables
        if (typeof window !== 'undefined' && (window as any).__ENV__) {
            const env = (window as any).__ENV__;

            // Apply environment variables to settings
            if (env.ACQUIRE_API_KEY) settings.apiKey = env.ACQUIRE_API_KEY;
            if (env.ACQUIRE_NATIVE_LANGUAGE) settings.nativeLanguage = env.ACQUIRE_NATIVE_LANGUAGE;
            if (env.ACQUIRE_TARGET_LANGUAGE) settings.targetLanguage = env.ACQUIRE_TARGET_LANGUAGE;
            if (env.ACQUIRE_LANGUAGE_LEVEL) settings.languageLevel = env.ACQUIRE_LANGUAGE_LEVEL;
            if (env.ACQUIRE_AI_PROVIDER) settings.aiProvider = env.ACQUIRE_AI_PROVIDER;
            if (env.ACQUIRE_AI_MODEL) settings.aiModel = env.ACQUIRE_AI_MODEL;

            // Save the updated settings
            await saveSettings(settings);
        }
    } catch (error) {
        console.error('Failed to initialize settings from environment variables:', error);
    }
}

/**
 * Listen for subtitle requests from content scripts
 */
function listenForSubtitleRequests() {
    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (details.method !== 'GET') return;

            // ignore requests from chrome extension
            if (details.initiator?.startsWith('chrome-extension://')) {
                return;
            }

            const url = details.url;

            if (!url.includes('/api/timedtext') && !url.includes('timedtext')) {
                return;
            }

            try {
                const urlObject = new URL(url);

                const lang =
                    urlObject.searchParams.get('tlang') || urlObject.searchParams.get('lang') || '';

                const videoId =
                    urlObject.searchParams.get('v') || urlObject.pathname.split('/').pop() || '';

                // send message to content script
                if (details.tabId > 0) {
                    fetchSubtitle(urlObject.href)
                        .then((subtitleContent) => {
                            chrome.tabs
                                .sendMessage(details.tabId, {
                                    type: 'ACQ_SUBTITLE_FETCHED',
                                    data: {
                                        url: urlObject.href,
                                        lang,
                                        videoId,
                                        response: subtitleContent,
                                    },
                                })
                                .catch((err) =>
                                    console.error('Failed to send message to content script:', err),
                                );
                        })
                        .catch((err) => console.error('Failed to fetch subtitle:', err));
                }
            } catch (e) {
                console.error('Failed to capture subtitle request:', e);
            }
        },
        { urls: ['*://*.youtube.com/*timedtext*', '*://*.youtube.com/api/*'] },
    );

    // Listen for messages from content script
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SAVE_WORD') {
            // Save word to vocabulary
            saveWordToVocabulary(message.word, message.context)
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
            return true; // Indicates that the response will be sent asynchronously
        }
    });
}

async function fetchSubtitle(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch subtitle: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Failed to fetch subtitle:', error);
        throw error;
    }
}

async function saveWordToVocabulary(word: string, context: string): Promise<Word> {
    const vocabulary = await StorageManager.getVocabulary();

    // Check if word already exists
    if (vocabulary[word]) {
        // If word exists, add new context if not duplicate
        if (!vocabulary[word].contexts.includes(context)) {
            vocabulary[word].contexts.push(context);
        }
    } else {
        // If word doesn't exist, create new entry
        vocabulary[word] = {
            word,
            contexts: [context],
            createdAt: new Date().toISOString(),
        };
    }

    await StorageManager.saveVocabulary(vocabulary);

    return vocabulary[word];
}
