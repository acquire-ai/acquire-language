/**
 * 习得语言 (Acquire Language) 后台脚本
 */
import { defineBackground } from 'wxt/sandbox';
import { StorageManager } from '../core/storage';
import { Word } from '../core/types/storage';

export default defineBackground(() => {
  console.log('习得语言 (Acquire Language) 背景脚本已加载', { id: browser.runtime.id });
  
  // 监听来自内容脚本的消息
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('收到消息:', message, '来自:', sender);
    
    // 在这里处理消息
    if (message.type === 'SAVE_WORD') {
      // 保存单词到生词本
      saveWordToVocabulary(message.word, message.context)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 表示将异步发送响应
    }
  });
  
  // 保存单词到生词本
  async function saveWordToVocabulary(word: string, context: string): Promise<Word> {
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
