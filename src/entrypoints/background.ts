/**
 * 习得语言 (Acquire Language) 后台脚本
 */
import {defineBackground} from "wxt/sandbox";
import {StorageManager} from "@/core/storage";
import {Word} from "@/core/types/storage";

export default defineBackground(() => {

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            if (details.method !== "GET") return;

            // ignore requests from chrome extension
            if (details.initiator?.startsWith("chrome-extension://")) {
                return;
            }
            
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



                // send message to content script
                if (details.tabId > 0) {
                    fetchSubtitle(urlObject.href)
                        .then(subtitleContent => {
                            chrome.tabs.sendMessage(details.tabId, {
                                type: "ACQ_SUBTITLE_FETCHED",
                                data: {url: urlObject.href, lang, videoId, response: subtitleContent},
                            }).catch(err => console.error("Failed to send message to content script:", err));
                        })
                        .catch(err => console.error("Failed to fetch subtitle:", err));
                }

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


async function fetchSubtitle(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch subtitle: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Failed to fetch subtitle:", error);
        throw error;
    }
}