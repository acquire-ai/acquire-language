/**
 * AI Service Factory
 */
import {AIService, AIServiceConfig} from "../../core/types/ai";
import {VercelAIAdapter, AVAILABLE_MODELS} from "./vercel-adapter";

/**
 * Create AI service
 * @param provider AI provider (openai, anthropic, google, deepseek)
 * @param model AI model name
 * @param config Other AI service configuration
 * @returns AI service instance
 */
export function createAIService(
    provider: string,
    model: string,
    config: Omit<AIServiceConfig, 'provider' | 'model'>
): AIService {
    return new VercelAIAdapter({
        ...config,
        provider,
        model
    });
}

/**
 * Get available AI providers and models
 * @returns Object containing available providers and their models
 */
export function getAvailableAIModels() {
    return AVAILABLE_MODELS;
}
