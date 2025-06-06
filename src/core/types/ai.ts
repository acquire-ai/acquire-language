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
}
