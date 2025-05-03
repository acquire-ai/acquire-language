/**
 * Vercel provider SDK Implementation
 *
 * This implementation uses the Vercel provider SDK to interact with multiple provider providers
 * through a unified interface.
 */
import {generateText} from "ai";
import {AIService} from "@/core/types/ai";
import {getLanguageName} from "@/core/utils";
import {translatePrompt} from "@/prompts";


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
        targetLanguage: string
    ): Promise<string> {
        try {
            const result = await browser.storage.local.get("settings");
            const settings = result.settings;
            const nativeLanguage = settings.nativeLanguage;
            const prompt = translatePrompt(word, context, nativeLanguage);
            const {text} = await generateText({
                model: this.provider(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.3,
            });

            return text;
        } catch (error: any) {
            console.error(
                `Failed to get word definition with ${this.model}:`,
                error
            );
            return `Failed to get definition for "${word}": ${error.message}`;
        }
    }

    /**
     * Translate text using Vercel provider SDK
     */
    async translateText(
        text: string,
        sourceLanguage: string,
        targetLanguage: string
    ): Promise<string> {
        // TODO: This is incorrect, we should use the native language unite.
        try {
            const prompt = `
Please translate the following ${this.getLanguageName(
                sourceLanguage
            )} text to ${this.getLanguageName(targetLanguage)}:
"${text}"
Please only return the translation result, without any additional explanations.
`;

            const {text: translatedText} = await generateText({
                model: this.provider(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.3,
            });

            return translatedText;
        } catch (error: any) {
            console.error(
                `Failed to translate text with ${this.model}:`,
                error
            );
            return `Translation failed: ${error.message}`;
        }
    }

    private getLanguageName(code: string): string {
        return getLanguageName(code);
    }
}
