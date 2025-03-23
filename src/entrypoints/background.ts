/**
 * 习得语言 (Acquire Language) 后台脚本
 */
import {defineBackground} from "wxt/sandbox";
import {StorageManager} from "@/core/storage";
import {Word} from "@/core/types/storage";

export default defineBackground(() => {
    const processedSubtitleRequests = new Set<string>();

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (details.method !== "GET") return;
            
            const url = details.url;

            if (!url.includes("/api/timedtext") && !url.includes("timedtext")) {
                return;
            }

            try {
                const urlObject = new URL(url);

                const lang =
                    urlObject.searchParams.get("tlang") ||
                    urlObject.searchParams.get("lang") ||
                    "";

                const videoId =
                    urlObject.searchParams.get("v") ||
                    urlObject.pathname.split("/").pop() ||
                    "";

                const requestKey = `${videoId}:${lang}`;

                if (processedSubtitleRequests.has(requestKey)) {
                    return;
                }

                // limit cache size
                if (processedSubtitleRequests.size > 100) {
                    const iterator = processedSubtitleRequests.values();
                    for (let i = 0; i < 50; i++) {
                        processedSubtitleRequests.delete(iterator.next().value as string);
                    }
                }

                // send message to content script
                if (details.tabId > 0) {
                    chrome.tabs.sendMessage(details.tabId, {
                        type: "SUBTITLE_REQUEST_DETECTED",
                        data: {url: urlObject.href, lang, videoId},
                    }).catch(err => {
                        console.error("send message to content script failed:", err);
                    });
                }

                // mark as processed
                processedSubtitleRequests.add(requestKey);
            } catch (e) {
                console.error("Failed to capture subtitle request:", e);
            }
        },
        {urls: ["*://*.youtube.com/*timedtext*", "*://*.youtube.com/api/*"]}
    );


    // 监听来自内容脚本的消息
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // 在这里处理消息
        if (message.type === "SAVE_WORD") {
            // 保存单词到生词本
            saveWordToVocabulary(message.word, message.context)
                .then(() => sendResponse({success: true}))
                .catch((error) =>
                    sendResponse({success: false, error: error.message})
                );
            return true; // 表示将异步发送响应
        }

        // 处理获取字幕的消息
        if (message.type === "fetchSubtitle") {
            // 获取字幕内容
            fetch(message.url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `获取字幕失败: ${response.status} ${response.statusText}`
                        );
                    }
                    return response.text();
                })
                .then((text) => {
                    sendResponse({data: text});
                })
                .catch((error) => {
                    console.error("获取字幕失败:", error);
                    sendResponse({error: error.message});
                });

            // 返回 true 表示将异步发送响应
            return true;
        }
    });

    // 保存单词到生词本
    async function saveWordToVocabulary(
        word: string,
        context: string
    ): Promise<Word> {
        const vocabulary = await StorageManager.getVocabulary();

        // 检查单词是否已存在
        if (vocabulary[word]) {
            // 如果单词已存在，添加新的上下文（如果不重复）
            if (!vocabulary[word].contexts.includes(context)) {
                vocabulary[word].contexts.push(context);
            }
        } else {
            // 如果单词不存在，创建新条目
            vocabulary[word] = {
                word,
                contexts: [context],
                createdAt: new Date().toISOString(),
            };
        }

        // 保存更新后的生词本
        await StorageManager.saveVocabulary(vocabulary);

        // 返回更新后的单词条目
        return vocabulary[word];
    }
});
