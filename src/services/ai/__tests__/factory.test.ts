import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAIService } from '../factory';
import { VercelAIAdapter } from '../vercel-adapter';
import { AIServiceConfig } from '../../../core/types/ai';

// Mock VercelAIAdapter
vi.mock('../vercel-adapter', () => ({
  VercelAIAdapter: vi.fn(),
  AVAILABLE_MODELS: {
    openai: ['gpt-4o', 'gpt-4o-mini'],
    deepseek: ['deepseek-chat', 'deepseek-reasoner']
  }
}));

describe('AI service factory test', () => {
  const mockConfig: AIServiceConfig = {
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an AI service for deepseek provider', () => {
    createAIService('deepseek', 'deepseek-chat', mockConfig);
    expect(VercelAIAdapter).toHaveBeenCalledWith({
      ...mockConfig,
      provider: 'deepseek',
      model: 'deepseek-chat'
    });
  });

  it('should create an AI service for OpenAI provider', () => {
    createAIService('openai', 'gpt-4o-mini', mockConfig);
    expect(VercelAIAdapter).toHaveBeenCalledWith({
      ...mockConfig,
      provider: 'openai',
      model: 'gpt-4o-mini'
    });
  });

  it('should accept any provider and model combination', () => {
    createAIService('any-provider', 'any-model', mockConfig);
    expect(VercelAIAdapter).toHaveBeenCalledWith({
      ...mockConfig,
      provider: 'any-provider',
      model: 'any-model'
    });
  });
}); 