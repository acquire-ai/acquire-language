/**
 * Vercel AI SDK Implementation
 *
 * This implementation uses the Vercel AI SDK to interact with multiple AI providers
 * through a unified interface.
 */
import {generateText} from "ai";
import {AIService, AIServiceConfig} from "@/core/types/ai";
import {getLanguageName} from "@/core/utils";

// Import Vercel AI SDK providers
import {createOpenAI} from "@ai-sdk/openai";
import {createAnthropic} from "@ai-sdk/anthropic";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {createDeepSeek} from "@ai-sdk/deepseek";

// Provider type definitions
type ProviderType = "openai" | "anthropic" | "google" | "deepseek";
type ModelConfigType = Record<string, string[]>;

// Available models for each provider
export const AVAILABLE_MODELS: ModelConfigType = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    anthropic: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
    google: ["gemini-1.5-pro", "gemini-1.5-flash"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
};

/**
 * AI Service Implementation using Vercel AI SDK
 */
export class VercelAIAdapter implements AIService {
    private apiKey: string;
    private provider: ProviderType;
    private model: string;
    private providerInstance: any;

    constructor(config: AIServiceConfig) {
        this.apiKey = config.apiKey;
        this.provider = config.provider as ProviderType;
        this.model = config.model as string;

        // Initialize provider instance
        this.providerInstance = this.initializeProvider();
    }

    /**
     * Initialize provider instance based on provider type
     */
    private initializeProvider() {
        switch (this.provider) {
            case "openai":
                return createOpenAI({apiKey: this.apiKey});
            case "anthropic":
                return createAnthropic({apiKey: this.apiKey});
            case "google":
                return createGoogleGenerativeAI({apiKey: this.apiKey});
            case "deepseek":
                return createDeepSeek({apiKey: this.apiKey});
            default:
                throw new Error(`Unsupported provider: ${this.provider}`);
        }
    }

    /**
     * Get word definition using Vercel AI SDK
     */
    async getWordDefinition(
        word: string,
        context: string,
        targetLanguage: string
    ): Promise<string> {
        try {
            const result = await browser.storage.local.get("settings");
            const settings = result.settings || {nativeLanguage: "zh-CN"};
            const nativeLanguage = settings.nativeLanguage;

            console.log(
                `Get word definition (${this.provider}:${this.model}): word="${word}", context="${context}", native language="${nativeLanguage}"`
            );

            const prompt = `
Please explain the meaning of the word "${word}" based on the following context.
Context: "${context}"
Please answer in ${this.getLanguageName(
                nativeLanguage
            )}, explaining the word's meaning in the current context concisely.
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
            const {text} = await generateText({
                model: this.providerInstance(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.3,
            });

            return text;
        } catch (error: any) {
            console.error(
                `Failed to get word definition with ${this.provider}:${this.model}:`,
                error
            );
            return `Failed to get definition for "${word}": ${error.message}`;
        }
    }

    /**
     * Translate text using Vercel AI SDK
     */
    async translateText(
        text: string,
        sourceLanguage: string,
        targetLanguage: string
    ): Promise<string> {
        try {
            const prompt = `
Please translate the following ${this.getLanguageName(
                sourceLanguage
            )} text to ${this.getLanguageName(targetLanguage)}:
"${text}"
Please only return the translation result, without any additional explanations.
`;

            const {text: translatedText} = await generateText({
                model: this.providerInstance(this.model),
                prompt,
                maxTokens: 500,
                temperature: 0.3,
            });

            return translatedText;
        } catch (error: any) {
            console.error(
                `Failed to translate text with ${this.provider}:${this.model}:`,
                error
            );
            return `Translation failed: ${error.message}`;
        }
    }

    private getLanguageName(code: string): string {
        return getLanguageName(code);
    }
}
