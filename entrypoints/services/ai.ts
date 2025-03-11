// AI 服务接口
export interface AIService {
  getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string>;
  translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;
}

// DeepSeek AI 服务
export class DeepSeekAIService implements AIService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
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
请提供以下信息：
1. 单词的基本含义
2. 在当前上下文中的具体含义
3. 词性 (名词、动词、形容词等)
4. 一到两个例句
`;
      
      // 调用 DeepSeek API
      const response = await this.callDeepSeekAPI(prompt);
      return response;
    } catch (error) {
      console.error('获取单词释义失败:', error);
      return `获取 "${word}" 的释义失败`;
    }
  }
  
  // 翻译文本
  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      // 构建提示
      const prompt = `
请将以下文本从${this.getLanguageName(sourceLanguage)}翻译成${this.getLanguageName(targetLanguage)}:
"${text}"
只需要提供翻译结果，不要添加任何解释或额外内容。
`;
      
      // 调用 DeepSeek API
      const response = await this.callDeepSeekAPI(prompt);
      return response;
    } catch (error) {
      console.error('翻译文本失败:', error);
      return `翻译失败`;
    }
  }
  
  // 调用 DeepSeek API
  private async callDeepSeekAPI(prompt: string): Promise<string> {
    try {
      // DeepSeek API 端点
      const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      
      // 构建请求
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });
      
      // 解析响应
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API 错误: ${data.error?.message || '未知错误'}`);
      }
      
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('调用 DeepSeek API 失败:', error);
      throw error;
    }
  }
  
  // 获取语言名称
  private getLanguageName(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'zh-CN': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'ru': '俄语',
    };
    
    return languageMap[languageCode] || languageCode;
  }
}

// GPT-4o Mini AI 服务
export class GPT4oMiniAIService implements AIService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  // 获取单词释义
  async getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string> {
    try {
      // 从存储中获取设置，获取用户的母语
      const result = await browser.storage.local.get('settings');
      const settings = result.settings || { nativeLanguage: 'zh-CN' };
      const nativeLanguage = settings.nativeLanguage;
      
      console.log(`获取单词释义 (GPT-4o-mini): 单词="${word}", 上下文="${context}", 母语="${nativeLanguage}"`);
      
      // 构建提示
      const prompt = `
请根据以下上下文，解释单词 "${word}" 的含义。
上下文: "${context}"
请用${this.getLanguageName(nativeLanguage)}回答，简洁明了地解释这个单词在当前上下文中的含义。
请提供以下信息：
1. 单词的基本含义
2. 在当前上下文中的具体含义
3. 词性 (名词、动词、形容词等)
4. 一到两个例句
`;
      
      // 调用 OpenAI API
      const response = await this.callOpenAIAPI(prompt);
      return response;
    } catch (error) {
      console.error('获取单词释义失败:', error);
      return `获取 "${word}" 的释义失败`;
    }
  }
  
  // 翻译文本
  async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    try {
      // 构建提示
      const prompt = `
请将以下文本从${this.getLanguageName(sourceLanguage)}翻译成${this.getLanguageName(targetLanguage)}:
"${text}"
只需要提供翻译结果，不要添加任何解释或额外内容。
`;
      
      // 调用 OpenAI API
      const response = await this.callOpenAIAPI(prompt);
      return response;
    } catch (error) {
      console.error('翻译文本失败:', error);
      return `翻译失败`;
    }
  }
  
  // 调用 OpenAI API
  private async callOpenAIAPI(prompt: string): Promise<string> {
    try {
      // OpenAI API 端点
      const apiUrl = 'https://api.openai.com/v1/chat/completions';
      
      // 构建请求
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });
      
      // 解析响应
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API 错误: ${data.error?.message || '未知错误'}`);
      }
      
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('调用 OpenAI API 失败:', error);
      throw error;
    }
  }
  
  // 获取语言名称
  private getLanguageName(languageCode: string): string {
    const languageMap: Record<string, string> = {
      'zh-CN': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'ru': '俄语',
    };
    
    return languageMap[languageCode] || languageCode;
  }
}

// 创建 AI 服务
export function createAIService(model: string, apiKey: string): AIService {
  switch (model) {
    case 'deepseek':
      return new DeepSeekAIService(apiKey);
    case 'gpt-4o-mini':
      return new GPT4oMiniAIService(apiKey);
    default:
      return new DeepSeekAIService(apiKey);
  }
} 