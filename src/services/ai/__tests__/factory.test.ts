import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAIService } from '../factory';
import { DeepSeekAIService } from '../deepseek';
import { GPT4oMiniAIService } from '../gpt';
import { AIServiceConfig } from '../../../core/types/ai';

// Mock AI service implementation
vi.mock('../deepseek', () => ({
  DeepSeekAIService: vi.fn()
}));

vi.mock('../gpt', () => ({
  GPT4oMiniAIService: vi.fn()
}));

describe('AI service factory test', () => {
  const mockConfig: AIServiceConfig = {
    apiKey: 'test-api-key'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should create DeepSeek service instance', () => {
    createAIService('deepseek', mockConfig);
    expect(DeepSeekAIService).toHaveBeenCalledWith(mockConfig);
  });
  
  it('should create GPT-4o-mini service instance', () => {
    createAIService('gpt-4o-mini', mockConfig);
    expect(GPT4oMiniAIService).toHaveBeenCalledWith(mockConfig);
  });
  
  it('when providing unknown service type, should default to DeepSeek service instance', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    createAIService('unknown-service', mockConfig);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Unknown AI service type: unknown-service, using default DeepSeek service'
    );
    expect(DeepSeekAIService).toHaveBeenCalledWith(mockConfig);
    
    consoleSpy.mockRestore();
  });
}); 