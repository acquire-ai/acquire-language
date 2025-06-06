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

        if (message.type === 'OPEN_SIDEPANEL') {
            console.log('Opening sidepanel for word:', message.data.word);

            // Open sidepanel when word is clicked
            // @ts-ignore - Chrome API
            if (browser.sidePanel && sender.tab?.windowId !== undefined) {
                try {
                    // Chrome API
                    // @ts-ignore
                    await browser.sidePanel.open({ windowId: sender.tab.windowId });
                    console.log('Sidepanel opened successfully');

                    // Store the word data for sidepanel to pick up when it initializes
                    await browser.storage.local.set({ pendingWordAnalysis: message.data });

                    // Also try to send message in case sidepanel is already loaded
                    setTimeout(() => {
                        browser.runtime
                            .sendMessage({
                                type: 'ANALYZE_WORD',
                                data: message.data,
                            })
                            .catch(() => {
                                // Ignore errors - sidepanel will pick up from storage
                                console.log('Direct message failed, sidepanel will use storage');
                            });
                    }, 50);
                } catch (error) {
                    console.error('Error opening sidepanel:', error);
                    // Fallback to popup window
                    openFallbackWindow(message.data);
                }
            }
            // @ts-ignore - Firefox API
            else if (browser.sidebarAction) {
                // Firefox API
                // @ts-ignore
                await browser.sidebarAction.open();

                // Store data for pickup
                await browser.storage.local.set({ pendingWordAnalysis: message.data });
            } else {
                console.error(
                    'Neither sidePanel nor sidebarAction API is available, using fallback window',
                );
                // Fallback to popup window
                openFallbackWindow(message.data);
            }
        } else if (message.type === 'CLOSE_SIDEPANEL') {
            // Close sidepanel
            // @ts-ignore - Chrome API
            if (browser.sidePanel) {
                // Chrome doesn't have a close method, user needs to close manually
                console.log('Sidepanel close requested - user needs to close manually');
            }
            // @ts-ignore - Firefox API
            else if (browser.sidebarAction) {
                // Firefox API
                // @ts-ignore
                await browser.sidebarAction.close();
            }
        } else if (message.type === 'SAVE_WORD') {
            // Save word to vocabulary
            saveWordToVocabulary(message.word, message.context, message.definition)
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
            return true; // Indicates that the response will be sent asynchronously
        }
    });
}

/**
 * Open a fallback window if sidepanel is not available
 */
async function openFallbackWindow(data: { word: string; context: string }) {
    try {
        // Store the data temporarily
        await browser.storage.local.set({ pendingWordAnalysis: data });

        // Open sidepanel.html in a new window
        const window = await browser.windows.create({
            url: browser.runtime.getURL('/sidepanel.html'),
            type: 'popup',
            width: 400,
            height: 600,
            left: screen.width - 420,
            top: 100,
        });

        console.log('Opened fallback window:', window);
    } catch (error) {
        console.error('Error opening fallback window:', error);
    }
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
