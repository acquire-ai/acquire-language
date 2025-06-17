/**
 * Acquire Language Content Script
 *
 * This script runs on platform pages and is responsible for initializing subtitle handlers.
 * It detects platform video pages and activates subtitle enhancement features after the video player loads.
 */
import '@/assets/globals.css';
import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import { createPlatformHandler } from '@/platforms';
import { createAIService } from '@/services/ai';
import { getSettings, watchSettings } from '@/core/config/settings';
import { uiManager } from './ui-manager';

export default defineContentScript({
    matches: ['*://*.youtube.com/*'],
    cssInjectionMode: 'ui',

    async main(ctx) {
        let subtitleHandler: any = null;
        let aiService: any = null;
        const processedSubtitleRequests = new Set<string>();

        const ui = await createShadowRootUi(ctx, {
            name: 'acquire-language-ui',
            position: 'overlay',
            anchor: 'body',
            zIndex: 2147483647,
            append: 'first',
            onMount: (container) => {
                // Container is a body, and React warns when creating a root on the body, so create a wrapper div
                const wrapper = document.createElement('div');
                container.append(wrapper);

                // Create a root on the UI container but don't render anything yet
                const root = ReactDOM.createRoot(wrapper);

                // Initialize UIManager with the root and wrapper
                uiManager.initialize(root, wrapper);

                return { root, wrapper };
            },
            onRemove: (elements) => {
                // Clean up UIManager
                uiManager.cleanup();
                elements?.root.unmount();
                elements?.wrapper.remove();
            },
        });

        // Mount the UI (this creates the Shadow DOM but doesn't render React components yet)
        ui.mount();

        async function initializeWithSettings() {
            const settings = await getSettings();
            // Get the default AI server or the first one if no default is set
            const defaultServer =
                settings.aiServers.find((server) => server.isDefault) || settings.aiServers[0];

            if (defaultServer) {
                aiService = createAIService(defaultServer);
            } else {
                return;
            }

            if (subtitleHandler) {
                subtitleHandler.updateSettings(settings);
                subtitleHandler.updateAIService(aiService);
            }
        }

        await initializeWithSettings();
        watchSettings(async (newSettings) => {
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

        // Setup message listeners
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            // Handle overlay panel opening
            if (message.type === 'OPEN_OVERLAY_PANEL' && message.word) {
                uiManager.openPanel(message.word).then(() => {
                    sendResponse({ success: true });
                });
                return true;
            }

            // Handle subtitle request detection
            if (message.type === 'SUBTITLE_REQUEST_DETECTED') {
                if (!subtitleHandler) {
                    initializeHandler().then(() => {
                        processSubtitleRequest(message.data);
                    });
                    return true;
                }

                processSubtitleRequest(message.data);
            }

            return true;
        });

        // Listen for custom events from subtitle handler
        window.addEventListener('acquire-language-open-panel', (event: any) => {
            uiManager.openPanel(event.detail);
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
