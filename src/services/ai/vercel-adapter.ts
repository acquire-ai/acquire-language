/**
 * Vercel provider SDK Implementation
 *
 * This implementation uses the Vercel provider SDK to interact with multiple provider providers
 * through a unified interface.
 */
import { generateText, streamText } from 'ai';
import { AIService } from '@/core/types/ai';
import { getLanguageName } from '@/core/utils';
import { translatePrompt } from '@/prompts';
import { getSettings } from '@/core/config/settings';

export class VercelAIAdapter implements AIService {
    readonly provider: any;
    readonly model: string;

    constructor(provider: any, model: string) {
        this.provider = provider;
        this.model = model;
    }

    async getWordDefinition(
        word: string,
        context: string,
        targetLanguage: string,
    ): Promise<string> {
        try {
            const settings = await getSettings();
            const nativeLanguage = settings.general.nativeLanguage;
            const prompt = translatePrompt(word, context, nativeLanguage);
            const { text } = await generateText({
                model: this.provider(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.3,
            });

            return text;
        } catch (error: any) {
            console.error(`Failed to get word definition with ${this.model}:`, error);
            return `Failed to get definition for "${word}": ${error.message}`;
        }
    }

    async getWordDefinitionStream(
        word: string,
        context: string,
        targetLanguage: string,
        onChunk: (chunk: string) => void,
    ): Promise<void> {
        try {
            const settings = await getSettings();
            const nativeLanguage = settings.general.nativeLanguage;
            const prompt = translatePrompt(word, context, nativeLanguage);

            const { textStream } = await streamText({
                model: this.provider(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.3,
            });

            for await (const chunk of textStream) {
                onChunk(chunk);
            }
        } catch (error: any) {
            console.error(`Failed to get word definition stream with ${this.model}:`, error);
            throw new Error(`Failed to get definition for "${word}": ${error.message}`);
        }
    }

    /**
     * Translate text using Vercel provider SDK
     */
    async translateText(
        text: string,
        sourceLanguage: string,
        targetLanguage: string,
    ): Promise<string> {
        try {
            const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only provide the translation, no explanations:\n\n${text}`;
            const { text: translatedText } = await generateText({
                model: this.provider(this.model),
                prompt,
                maxTokens: 1000,
                temperature: 0.3,
            });

            return translatedText;
        } catch (error: any) {
            console.error(`Failed to translate text with ${this.model}:`, error);
            return `Failed to translate: ${error.message}`;
        }
    }

    async getChatResponse(
        message: string,
        word: string,
        context: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }>,
        targetLanguage: string,
    ): Promise<string> {
        try {
            const settings = await getSettings();
            const nativeLanguage = settings.general.nativeLanguage;

            // Build conversation history
            let conversationHistory = '';
            for (const msg of history) {
                conversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
            }

            const prompt = `You are a helpful language learning assistant. The user is learning the word "${word}" in the context: "${context}".

Previous conversation:
${conversationHistory}

User's new question: ${message}

Please provide a helpful response in ${nativeLanguage} that helps the user better understand the word "${word}". You can provide examples, synonyms, antonyms, etymology, usage tips, or answer any specific questions about the word.`;

            const { text } = await generateText({
                model: this.provider(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.7,
            });

            return text;
        } catch (error: any) {
            console.error(`Failed to get chat response with ${this.model}:`, error);
            return `Failed to get response: ${error.message}`;
        }
    }

    async getChatResponseStream(
        message: string,
        word: string,
        context: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }>,
        targetLanguage: string,
        onChunk: (chunk: string) => void,
    ): Promise<void> {
        try {
            const settings = await getSettings();
            const nativeLanguage = settings.general.nativeLanguage;

            // Build conversation history
            let conversationHistory = '';
            for (const msg of history) {
                conversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
            }

            const prompt = `You are a helpful language learning assistant. The user is learning the word "${word}" in the context: "${context}".

Previous conversation:
${conversationHistory}

User's new question: ${message}

Please provide a helpful response in ${nativeLanguage} that helps the user better understand the word "${word}". You can provide examples, synonyms, antonyms, etymology, usage tips, or answer any specific questions about the word.`;

            const { textStream } = await streamText({
                model: this.provider(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.7,
            });

            for await (const chunk of textStream) {
                onChunk(chunk);
            }
        } catch (error: any) {
            console.error(`Failed to get chat response stream with ${this.model}:`, error);
            throw new Error(`Failed to get response: ${error.message}`);
        }
    }

    private getLanguageName(code: string): string {
        return getLanguageName(code);
    }
}
