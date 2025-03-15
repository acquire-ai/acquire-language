/**
 * AI 服务工厂
 */
import { AIService, AIServiceConfig } from '../../core/types/ai';
import { DeepSeekAIService } from './deepseek';

/**
 * 创建 AI 服务
 * @param type AI 服务类型
 * @param config AI 服务配置
 * @returns AI 服务实例
 */
export function createAIService(type: string, config: AIServiceConfig): AIService {
  switch (type) {
    case 'deepseek':
      return new DeepSeekAIService(config);
    default:
      console.warn(`未知的 AI 服务类型: ${type}，使用默认的 DeepSeek 服务`);
      return new DeepSeekAIService(config);
  }
} 