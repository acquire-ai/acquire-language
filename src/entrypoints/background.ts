/**
 * Acquire Language Background Script
 */
import { defineBackground } from 'wxt/sandbox';
import { StorageManager } from '@/core/storage';
import { Word } from '@/core/types/storage';

export default defineBackground({
    main() {
        // Set up all listeners
        setupMessageListeners();
        setupSubtitleRequestListener();
    },
});

/**
 * Set up all message listeners
 */
function setupMessageListeners() {
    browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        console.log('Background received message:', message);

        if (message.type === 'SAVE_WORD') {
            // Save word to vocabulary
            saveWordToVocabulary(message.word, message.context, message.definition)
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
            return true; // Indicates that the response will be sent asynchronously
        }
    });
}

/**
 * Set up subtitle request listener
 */
function setupSubtitleRequestListener() {
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

async function saveWordToVocabulary(
    word: string,
    context: string,
    definition?: string,
): Promise<Word> {
    const vocabulary = await StorageManager.getVocabulary();

    // Check if word already exists
    if (vocabulary[word]) {
        // If word exists, add new context if not duplicate
        if (!vocabulary[word].contexts.includes(context)) {
            vocabulary[word].contexts.push(context);
        }
        // Update definition if provided
        if (definition) {
            vocabulary[word].definition = definition;
        }
    } else {
        // If word doesn't exist, create new entry
        vocabulary[word] = {
            word,
            contexts: [context],
            createdAt: new Date().toISOString(),
            definition,
        };
    }

    await StorageManager.saveVocabulary(vocabulary);

    return vocabulary[word];
}
