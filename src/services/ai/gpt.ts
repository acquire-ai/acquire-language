/**
 * GPT-4o Mini AI 服务实现
 */
import {AIService, AIServiceConfig} from '../../core/types/ai';
import {getLanguageName} from '../../core/utils';

export class GPT4oMiniAIService implements AIService {
    private apiKey: string;
    private model: string;

    constructor(config: AIServiceConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'gpt-4o-mini';
    }

    // 获取单词释义
    async getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string> {
        try {
            // 从存储中获取设置，获取用户的母语
            const result = await browser.storage.local.get('settings');
            const settings = result.settings || {nativeLanguage: 'zh-CN'};
            const nativeLanguage = settings.nativeLanguage;

            console.log(`获取单词释义 (GPT-4o-mini): 单词="${word}", 上下文="${context}", 母语="${nativeLanguage}"`);

            // 构建提示
            const prompt = `
请根据以下上下文，解释单词 "${word}" 的含义。
上下文: "${context}"
请用${this.getLanguageName(nativeLanguage)}回答，简洁明了地解释这个单词在当前上下文中的含义。
请提供以下信息，并使用Markdown格式：

## 基本含义
简要说明单词的基本含义

## 上下文含义
在当前上下文中的具体含义

## 词性
词性 (名词、动词、形容词等)

## 例句
1. 一个例句 (中文翻译)
2. 另一个例句 (中文翻译)
`;

            // 调用 OpenAI API
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
请将以下文本从${this.getLanguageName(sourceLanguage)}翻译成${this.getLanguageName(targetLanguage)}:
"${text}"
只需要提供翻译结果，不要添加任何解释或额外内容。
`;

            // 调用 OpenAI API
            return await this.callAPI(prompt);
        } catch (error: any) {
            console.error('翻译文本失败:', error);
            return `翻译失败: ${error.message}`;
        }
    }

    // 调用 OpenAI API
    private async callAPI(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('API 密钥未设置');
        }

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
                    model: this.model,
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
    private getLanguageName(code: string): string {
        return getLanguageName(code);
    }
} 