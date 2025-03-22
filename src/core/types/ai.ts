/**
 * AI服务接口定义
 */

/**
 * AI服务配置
 */
export interface AIServiceConfig {
    apiKey: string;
    model?: string;
    options?: Record<string, any>;
}

/**
 * AI服务接口
 */
export interface AIService {
    /**
     * 获取单词释义
     * @param word 单词
     * @param context 上下文
     * @param targetLanguage 目标语言
     * @returns 单词释义
     */
    getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string>;

    /**
     * 翻译文本
     * @param text 文本
     * @param sourceLanguage 源语言
     * @param targetLanguage 目标语言
     * @returns 翻译结果
     */
    translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;
} 