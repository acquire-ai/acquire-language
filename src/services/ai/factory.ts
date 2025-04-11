/**
 * AI Service Factory
 */
import {AIService, AIServiceConfig} from '../../core/types/ai';
import {DeepSeekAIService} from './deepseek';
import {GPT4oMiniAIService} from './gpt';

/**
 * Create AI service
 * @param type AI service type
 * @param config AI service configuration
 * @returns AI service instance
 */
export function createAIService(type: string, config: AIServiceConfig): AIService {
    switch (type) {
        case 'deepseek':
            return new DeepSeekAIService(config);
        case 'gpt-4o-mini':
            return new GPT4oMiniAIService(config);
        default:
            console.warn(`Unknown AI service type: ${type}, using default DeepSeek service`);
            return new DeepSeekAIService(config);
    }
} 