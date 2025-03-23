import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAIService } from '../factory';
import { DeepSeekAIService } from '../deepseek';
import { GPT4oMiniAIService } from '../gpt';
import { AIServiceConfig } from '../../../core/types/ai';

// 模拟 AI 服务实现
vi.mock('../deepseek', () => ({
  DeepSeekAIService: vi.fn()
}));

vi.mock('../gpt', () => ({
  GPT4oMiniAIService: vi.fn()
}));

describe('AI服务工厂测试', () => {
  const mockConfig: AIServiceConfig = {
    apiKey: 'test-api-key'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('应该创建DeepSeek服务实例', () => {
    createAIService('deepseek', mockConfig);
    expect(DeepSeekAIService).toHaveBeenCalledWith(mockConfig);
  });
  
  it('应该创建GPT-4o-mini服务实例', () => {
    createAIService('gpt-4o-mini', mockConfig);
    expect(GPT4oMiniAIService).toHaveBeenCalledWith(mockConfig);
  });
  
  it('当提供未知服务类型时，应该默认创建DeepSeek服务实例', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    createAIService('unknown-service', mockConfig);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '未知的 AI 服务类型: unknown-service，使用默认的 DeepSeek 服务'
    );
    expect(DeepSeekAIService).toHaveBeenCalledWith(mockConfig);
    
    consoleSpy.mockRestore();
  });
}); 