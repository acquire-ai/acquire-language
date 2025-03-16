/**
 * 习得语言 (Acquire Language) 后台脚本
 */
import { defineBackground } from "wxt/sandbox";
import { StorageManager } from "@/core/storage";
import { Word } from "@/core/types/storage";

// 字幕数据接口
interface SubtitleData {
  url: string;
  lang: string;
  videoId: string;
  timestamp: number;
}

export default defineBackground(() => {
  // 用于存储已处理的字幕请求，避免重复处理
  const processedSubtitleRequests = new Set<string>();

  // 存储最近处理的字幕数据，用于页面刷新后恢复
  const recentSubtitles = new Map<string, SubtitleData>();

  // 加载已保存的字幕数据
  loadSavedSubtitles();

  // 定期保存字幕数据到存储
  setInterval(saveRecentSubtitles, 30000); // 每30秒保存一次

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

        // 存储最近的字幕数据
        recentSubtitles.set(requestKey, {
          url: urlObject.href,
          lang,
          videoId,
          timestamp: Date.now(),
        });

        // 保存到存储以便页面刷新后恢复
        saveRecentSubtitles();

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
    // 处理页面加载完成消息，尝试恢复字幕
    if (
      message.type === "PAGE_LOADED" &&
      message.data &&
      message.data.videoId
    ) {
      const videoId = message.data.videoId;
      // 查找该视频的最近字幕
      for (const [key, data] of recentSubtitles.entries()) {
        if (data.videoId === videoId) {
          // 发送字幕数据到内容脚本
          try {
            if (sender.tab && sender.tab.id) {
              chrome.tabs.sendMessage(sender.tab.id, {
                type: "SUBTITLE_REQUEST_DETECTED",
                data: {
                  url: data.url,
                  lang: data.lang,
                  videoId: data.videoId,
                },
              });
              sendResponse({ success: true });
              return true;
            }
          } catch (err) {
            console.error("恢复字幕失败:", err);
          }
          break;
        }
      }
      sendResponse({ success: false, reason: "没有找到该视频的字幕数据" });
      return true;
    }

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

  // 保存最近的字幕数据到存储
  async function saveRecentSubtitles() {
    try {
      // 只保留最近24小时内的字幕数据
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const subtitlesToSave: Record<string, any> = {};

      for (const [key, data] of recentSubtitles.entries()) {
        if (data.timestamp > oneDayAgo) {
          subtitlesToSave[key] = data;
        } else {
          recentSubtitles.delete(key);
        }
      }

      // 保存到存储
      await browser.storage.local.set({ recentSubtitles: subtitlesToSave });
    } catch (e) {
      console.error("保存字幕数据失败:", e);
    }
  }

  // 从存储加载字幕数据
  async function loadSavedSubtitles() {
    try {
      const result = await browser.storage.local.get("recentSubtitles");
      if (result.recentSubtitles) {
        // 只加载最近24小时内的字幕数据
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        for (const [key, data] of Object.entries(result.recentSubtitles)) {
          const subtitleData = data as SubtitleData;
          if (subtitleData.timestamp > oneDayAgo) {
            recentSubtitles.set(key, subtitleData);
            processedSubtitleRequests.add(key);
            if (subtitleData.url) {
              processedSubtitleRequests.add(subtitleData.url);
            }
          }
        }
      }
    } catch (e) {
      console.error("加载字幕数据失败:", e);
    }
  }
});
