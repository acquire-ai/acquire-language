/**
 * DeepSeek AI 服务实现
 */
import {AIService, AIServiceConfig} from '@/core/types/ai.ts';
import {getLanguageName} from '@/core/utils';

export class DeepSeekAIService implements AIService {
  private apiKey: string;
  private model: string;
  
  constructor(config: AIServiceConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'deepseek-chat';
  }
  
  // 获取单词释义
  async getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string> {
    try {
      // 从存储中获取设置，获取用户的母语
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || { nativeLanguage: 'zh-CN' };
      const nativeLanguage = settings.nativeLanguage;
      
      console.log(`获取单词释义: 单词="${word}", 上下文="${context}", 母语="${nativeLanguage}"`);
      
      // 构建提示
      const prompt = `
请根据以下上下文，解释单词 "${word}" 的含义。
上下文: "${context}"
请用${this.getLanguageName(nativeLanguage)}回答，简洁明了地解释这个单词在当前上下文中的含义。
请提供以下信息，并使用Markdown格式：
1. 单词的基本含义
2. 在当前上下文中的具体含义
3. 词性 (名词、动词、形容词等)
4. 一到两个例句
`;
      
      // 调用 DeepSeek API
      return await this.callAPI(prompt);
    } catch (error: any) {
      console.error('获取单词释义失败:', error);
      return `获取 "${word}" 的释义失败: ${error.message}`;
    }
  }
  
  // 翻译文本
  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      // 构建提示
      const prompt = `
请将以下${this.getLanguageName(sourceLanguage)}文本翻译成${this.getLanguageName(targetLanguage)}：
"${text}"
请只返回翻译结果，不要包含其他解释。
`;
      
      // 调用 DeepSeek API
      return await this.callAPI(prompt);
    } catch (error: any) {
      console.error('翻译文本失败:', error);
      return `翻译失败: ${error.message}`;
    }
  }
  
  // 调用 DeepSeek API
  private async callAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API 密钥未设置');
    }
    
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 请求失败: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('调用 DeepSeek API 失败:', error);
      throw error;
    }
  }
  
  // 获取语言名称
  private getLanguageName(code: string): string {
    return getLanguageName(code);
  }
} 