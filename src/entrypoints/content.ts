/**
 * 习得语言 (Acquire Language) 内容脚本
 *
 * 这个脚本在各平台页面上运行，负责初始化字幕处理器。
 * 它检测各平台视频页面，并在视频播放器加载后启动字幕增强功能。
 */
import {defineContentScript} from "wxt/sandbox";
import {createPlatformHandler} from "@/platforms";
import {createAIService} from "@/services/ai";
import {StorageManager} from "@/core/storage";

export default defineContentScript({
    matches: ["*://*.youtube.com/*"],

    async main() {
        let subtitleHandler: any = null;
        
        const settings = await StorageManager.getSettings();
        
        const aiService = createAIService(settings.aiModel, {
            apiKey: settings.apiKey,
        });

        const processedSubtitleRequests = new Set<string>();

        if (window.location.pathname.includes("/watch")) {
            if (document.readyState === "complete") {
                await initializeHandler();
            } else {
                window.addEventListener("load", async () => {
                    await initializeHandler();
                });
            }

            monitorUrlChanges();
        }

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === "SUBTITLE_REQUEST_DETECTED") {
                if (!subtitleHandler) {
                    initializeHandler().then(() => {
                        // 初始化完成后处理字幕请求
                        processSubtitleRequest(message.data);
                    });
                    return true;
                }

                processSubtitleRequest(message.data);
            }

            return true;
        });

        function processSubtitleRequest(data: any) {
            const {url, lang, videoId} = data;

            const requestKey = `${videoId}:${lang}`;

            if (processedSubtitleRequests.has(requestKey)) {
                return;
            }

            processedSubtitleRequests.add(requestKey);

            if (processedSubtitleRequests.size > 50) {
                processedSubtitleRequests.clear();
            }

            window.dispatchEvent(
                new CustomEvent("acquireLanguageSubtitleData", {
                    detail: {url, lang, videoId},
                })
            );
        }

        function monitorUrlChanges() {
            // when the url changes, we need to clear the processed subtitle requests
            let lastUrl = window.location.href;

            new MutationObserver(async () => {
                if (lastUrl !== window.location.href) {
                    lastUrl = window.location.href;

                    if (window.location.pathname.includes("/watch")) {
                        processedSubtitleRequests.clear();
                        await initializeHandler();
                    }
                }
            }).observe(document, {subtree: true, childList: true});
        }

        async function initializeHandler() {
            await waitForVideoPlayer();
        }

        /**
         * 等待视频播放器加载
         */
        async function waitForVideoPlayer() {
            return new Promise<void>((resolve) => {
                const checkForVideoPlayer = setInterval(async () => {
                    const videoPlayer = document.querySelector("video");
                    if (videoPlayer) {
                        clearInterval(checkForVideoPlayer);
                        clearTimeout(timeout);

                        try {
                            // 创建平台处理器
                            const platformHandler = createPlatformHandler(
                                window.location.href
                            );

                            if (platformHandler) {
                                // 初始化平台处理器
                                await platformHandler.initialize();

                                subtitleHandler = platformHandler.createSubtitleHandler(aiService);

                                // 初始化字幕处理器
                                await subtitleHandler.initialize();
                            } else {
                                console.error("无法创建平台处理器");
                            }
                        } catch (error) {
                            console.error("初始化字幕处理器失败:", error);
                        }

                        resolve();
                    }
                }, 1000);

                // 设置超时，避免无限等待
                const timeout = setTimeout(() => {
                    clearInterval(checkForVideoPlayer);
                    resolve();
                }, 10000);
            });
        }
    },
});
