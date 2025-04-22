/**
 * DeepSeek AI Service Implementation
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

    // Get word definition
    async getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string> {
        try {
            // Get settings from storage to get user's native language
            const result = await browser.storage.local.get('settings');
            const settings = result.settings || {nativeLanguage: 'zh-CN'};
            const nativeLanguage = settings.nativeLanguage;

            console.log(`Getting word definition: word="${word}", context="${context}", native language="${nativeLanguage}"`);

            // Build prompt
            const prompt = `
Please explain the meaning of the word "${word}" based on the following context.
Context: "${context}"
Please answer in ${this.getLanguageName(nativeLanguage)}, explaining the word's meaning in the current context concisely.
Please provide the following information using Markdown format but DO NOT use code blocks:

1. **Basic meaning**
   Brief explanation of the word's general meaning

2. **Meaning in current context**
   The specific meaning in this context

3. **Part of speech**
   Noun, verb, adjective, etc.

4. **Example sentences**
   - One example (with translation)
   - Another example (with translation)
`;

            return await this.callAPI(prompt);
        } catch (error: any) {
            console.error('Failed to get word definition:', error);
            return `Failed to get definition for "${word}": ${error.message}`;
        }
    }

    // Translate text
    async translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
        try {
            // Build prompt
            const prompt = `
Please translate the following ${this.getLanguageName(sourceLanguage)} text to ${this.getLanguageName(targetLanguage)}:
"${text}"
Please only return the translation result, without any additional explanations.
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
                throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Failed to call DeepSeek API:', error);
            throw error;
        }
    }

    // Get language name
    private getLanguageName(code: string): string {
        return getLanguageName(code);
    }
} 