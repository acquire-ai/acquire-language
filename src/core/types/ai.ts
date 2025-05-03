/**
 * AI Service Interface
 */

export interface AIServiceConfig {
    apiKey: string;
    providerType: string;
    model: string;
    options?: Record<string, any>;
}


export interface AIService {
    getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string>;

    translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;
} 