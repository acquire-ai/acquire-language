/**
 * Acquire Language Content Script
 *
 * This script runs on platform pages and is responsible for initializing subtitle handlers.
 * It detects platform video pages and activates subtitle enhancement features after the video player loads.
 */
import { defineContentScript } from 'wxt/sandbox';
import { createPlatformHandler } from '@/platforms';
import { createAIService } from '@/services/ai';
import { getSettings, watchSettings } from '@/core/config/settings';
import { initializeOverlayPanel } from './overlay-panel';

export default defineContentScript({
    matches: ['*://*.youtube.com/*'],

    async main() {
        let subtitleHandler: any = null;
        let aiService: any = null;
        const processedSubtitleRequests = new Set<string>();

        // Initialize the overlay panel
        initializeOverlayPanel();

        async function initializeWithSettings() {
            const settings = await getSettings();
            // Get the default AI server or the first one if no default is set
            const defaultServer =
                settings.aiServers.find((server) => server.isDefault) || settings.aiServers[0];

            if (defaultServer) {
                aiService = createAIService(defaultServer);
            } else {
                console.error('No AI server configured');
                return;
            }

            if (subtitleHandler) {
                subtitleHandler.updateSettings(settings);
                subtitleHandler.updateAIService(aiService);
            }
        }

        await initializeWithSettings();
        watchSettings(async (newSettings) => {
            console.log('Settings changed, reinitializing with new settings');
            await initializeWithSettings();
        });

        if (window.location.pathname.includes('/watch')) {
            if (document.readyState === 'complete') {
                await initializeHandler();
            } else {
                window.addEventListener('load', async () => {
                    await initializeHandler();
                });
            }

            monitorUrlChanges();
        }

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SUBTITLE_REQUEST_DETECTED') {
                if (!subtitleHandler) {
                    initializeHandler().then(() => {
                        // Process subtitle request after initialization
                        processSubtitleRequest(message.data);
                    });
                    return true;
                }

                processSubtitleRequest(message.data);
            }

            return true;
        });

        function processSubtitleRequest(data: any) {
            const { url, lang, videoId } = data;

            const requestKey = `${videoId}:${lang}`;

            if (processedSubtitleRequests.has(requestKey)) {
                return;
            }

            processedSubtitleRequests.add(requestKey);

            if (processedSubtitleRequests.size > 100) {
                processedSubtitleRequests.clear();
            }

            window.dispatchEvent(
                new CustomEvent('acquireLanguageSubtitleData', {
                    detail: { url, lang, videoId },
                }),
            );
        }

        function monitorUrlChanges() {
            // when the url changes, we need to clear the processed subtitle requests
            let lastUrl = window.location.href;

            new MutationObserver(async () => {
                if (lastUrl !== window.location.href) {
                    lastUrl = window.location.href;

                    if (window.location.pathname.includes('/watch')) {
                        processedSubtitleRequests.clear();
                        await initializeHandler();
                    }
                }
            }).observe(document, { subtree: true, childList: true });
        }

        async function initializeHandler() {
            await waitForVideoPlayer();
        }

        /**
         * Wait for video player to load
         */
        async function waitForVideoPlayer() {
            return new Promise<void>((resolve) => {
                const checkForVideoPlayer = setInterval(async () => {
                    const videoPlayer = document.querySelector('video');
                    if (videoPlayer) {
                        clearInterval(checkForVideoPlayer);
                        clearTimeout(timeout);

                        try {
                            // Create platform handler
                            const platformHandler = createPlatformHandler(window.location.href);

                            if (platformHandler) {
                                // Initialize platform handler
                                await platformHandler.initialize();

                                subtitleHandler = platformHandler.createSubtitleHandler(aiService);

                                // Initialize subtitle handler
                                await subtitleHandler.initialize();
                            } else {
                                console.error('Failed to create platform handler');
                            }
                        } catch (error) {
                            console.error('Failed to initialize subtitle handler:', error);
                        }

                        resolve();
                    }
                }, 1000);

                const timeout = setTimeout(() => {
                    clearInterval(checkForVideoPlayer);
                    resolve();
                }, 10000);
            });
        }
    },
});
