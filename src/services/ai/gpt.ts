/**
 * GPT-4o Mini AI Service Implementation
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

    // Get word definition
    async getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string> {
        try {
            // Get settings from storage, get user's native language
            const result = await browser.storage.local.get('settings');
            const settings = result.settings || {nativeLanguage: 'zh-CN'};
            const nativeLanguage = settings.nativeLanguage;

            console.log(`Get word definition (GPT-4o-mini): word="${word}", context="${context}", native language="${nativeLanguage}"`);

            // Build prompt
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

            // Call OpenAI API
            return await this.callAPI(prompt);
        } catch (error: any) {
            console.error('Failed to get word definition:', error);
            return `Failed to get definition for "${word}": ${error.message}`;
        }
    }

    // Translate text
    async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
        try {
            const prompt = `
请将以下文本从${this.getLanguageName(sourceLanguage)}翻译成${this.getLanguageName(targetLanguage)}:
"${text}"
只需要提供翻译结果，不要添加任何解释或额外内容。
`;

            return await this.callAPI(prompt);
        } catch (error: any) {
            console.error('Failed to translate text:', error);
            return `Translation failed: ${error.message}`;
        }
    }

    private async callAPI(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('API key not set');
        }

        try {
            const apiUrl = 'https://api.openai.com/v1/chat/completions';

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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
            }

            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Failed to call OpenAI API:', error);
            throw error;
        }
    }

    private getLanguageName(code: string): string {
        return getLanguageName(code);
    }
} 