/**
 * AI Service Factory
 */
import {AIService, AIServiceConfig} from "../../core/types/ai";
import {createOpenAI} from "@ai-sdk/openai";
import {createAnthropic} from "@ai-sdk/anthropic";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {createDeepSeek} from "@ai-sdk/deepseek";
import {ProviderV1} from "@ai-sdk/provider";
import {VercelAIAdapter} from "./vercel-adapter";
// Provider type definitions
type ModelConfigType = Record<string, string[]>;

// Available models for each provider
export const AVAILABLE_MODELS: ModelConfigType = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    anthropic: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
    google: ["gemini-1.5-pro", "gemini-1.5-flash"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
};


/**
 * Create AI service
 * @param provider AI provider (openai, anthropic, google, deepseek)
 * @param model AI model name
 * @param config Other AI service configuration
 * @returns AI service instance
 */
export function createAIService(
    config: AIServiceConfig
): AIService {
    let ai: ProviderV1;

    switch (config.providerType) {
        case "openai":
            ai = createOpenAI({apiKey: config.apiKey});
            break;
        case "anthropic":
            ai = createAnthropic({apiKey: config.apiKey});
            break;
        case "google":
            ai = createGoogleGenerativeAI({apiKey: config.apiKey});
            break;
        case "deepseek":
            ai = createDeepSeek({apiKey: config.apiKey});
            break;
        default:
            throw new Error(`Unsupported provider: ${config.providerType}`);
    }
    return new VercelAIAdapter(ai, config.model);
}

/**
 * Get available AI providers and models for UI
 * @returns Object containing available providers and their models
 */
export function getAvailableAIModels() {
    return AVAILABLE_MODELS;
}
