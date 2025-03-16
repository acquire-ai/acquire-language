/**
 * 习得语言 (Acquire Language) 后台脚本
 */
import { defineBackground } from "wxt/sandbox";
import { StorageManager } from "@/core/storage";
import { Word } from "@/core/types/storage";

export default defineBackground(() => {
  // 用于存储已处理的字幕请求，避免重复处理
  const processedSubtitleRequests = new Set<string>();

  // 使用 webRequest API 监听字幕请求
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      // 只处理 GET 请求
      if (details.method !== "GET") return;

      const url = details.url;

      // 检查是否是字幕请求
      if (!url.includes("/api/timedtext") && !url.includes("timedtext")) {
        return;
      }

      // 检查是否已经处理过这个请求
      if (processedSubtitleRequests.has(url)) {
        return;
      }

      try {
        const urlObject = new URL(url);

        // 获取字幕语言
        const lang =
          urlObject.searchParams.get("tlang") ||
          urlObject.searchParams.get("lang") ||
          "";

        // 获取视频ID
        const videoId =
          urlObject.searchParams.get("v") ||
          urlObject.pathname.split("/").pop() ||
          "";

        // 创建唯一标识符
        const requestKey = `${videoId}:${lang}`;

        // 检查是否已处理过这个组合
        if (processedSubtitleRequests.has(requestKey)) {
          return;
        }

        // 标记为已处理
        processedSubtitleRequests.add(requestKey);
        processedSubtitleRequests.add(url);

        // 限制缓存大小
        if (processedSubtitleRequests.size > 100) {
          const iterator = processedSubtitleRequests.values();
          for (let i = 0; i < 50; i++) {
            processedSubtitleRequests.delete(iterator.next().value as string);
          }
        }

        // 发送消息到内容脚本
        if (details.tabId > 0) {
          try {
            chrome.tabs.sendMessage(details.tabId, {
              type: "SUBTITLE_REQUEST_DETECTED",
              data: { url: urlObject.href, lang, videoId },
            });
          } catch (err) {
            console.error("发送字幕请求消息失败:", err);
          }
        }
      } catch (e) {
        console.error("处理字幕请求失败:", e);
      }
    },
    { urls: ["*://*.youtube.com/*timedtext*", "*://*.youtube.com/api/*"] }
  );

  // 监听来自内容脚本的消息
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 在这里处理消息
    if (message.type === "SAVE_WORD") {
      // 保存单词到生词本
      saveWordToVocabulary(message.word, message.context)
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message })
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
          sendResponse({ data: text });
        })
        .catch((error) => {
          console.error("获取字幕失败:", error);
          sendResponse({ error: error.message });
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
