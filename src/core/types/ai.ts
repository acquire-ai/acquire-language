/**
 * AI Service Interface
 */

export interface AIServiceConfig {
    apiKey: string;
    providerType: string;
    model: string;
    // 基础选项
    providerName?: string;   // 提供商名称，适用于openai-compatible
    baseURL?: string;        // API基础URL
    // 将不常用选项放在options中
    options?: Record<string, any>; // 包含其他特定提供商选项如headers、queryParams等
}


export interface AIService {
    getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string>;

    translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;
} 