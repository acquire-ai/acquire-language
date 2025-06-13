/**
 * AI Service Interface
 */

export interface AIService {
    getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string>;

    translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;

    // Stream version of getWordDefinition
    getWordDefinitionStream?(
        word: string,
        context: string,
        targetLanguage: string,
        onChunk: (chunk: string) => void,
    ): Promise<void>;

    // Chat functionality
    getChatResponse?(
        message: string,
        word: string,
        context: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }>,
        targetLanguage: string,
    ): Promise<string>;

    // Stream version of getChatResponse
    getChatResponseStream?(
        message: string,
        word: string,
        context: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }>,
        targetLanguage: string,
        onChunk: (chunk: string) => void,
    ): Promise<void>;
}
