import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelAIAdapter, AVAILABLE_MODELS } from '../vercel-adapter';
import { AIServiceConfig } from '../../../core/types/ai';
import { generateText } from 'ai';

// Mock generateText function from Vercel AI SDK
vi.mock('ai', () => ({
    generateText: vi.fn().mockResolvedValue({ text: 'mocked response' })
}));

// Mock provider modules
vi.mock('@ai-sdk/openai', () => ({
    createOpenAI: vi.fn().mockReturnValue((modelName: string) => ({}))
}));

vi.mock('@ai-sdk/anthropic', () => ({
    createAnthropic: vi.fn().mockReturnValue((modelName: string) => ({}))
}));

vi.mock('@ai-sdk/google', () => ({
    createGoogleGenerativeAI: vi.fn().mockReturnValue((modelName: string) => ({}))
}));

// Fix DeepSeek mock implementation to use createDeepSeek properly
vi.mock('@ai-sdk/deepseek', () => ({
    createDeepSeek: vi.fn().mockImplementation(() => {
        return (modelName: string) => ({});
    })
}));

describe('VercelAIAdapter test', () => {
    const mockConfig: AIServiceConfig = {
        apiKey: 'test-api-key',
        provider: 'openai',
        model: 'gpt-4o-mini'
    };

    const deepseekConfig: AIServiceConfig = {
        apiKey: 'test-deepseek-key',
        provider: 'deepseek',
        model: 'deepseek-chat'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with the correct provider and model', () => {
        const adapter = new VercelAIAdapter(mockConfig);
        // @ts-ignore - accessing private properties for testing
        expect(adapter.provider).toBe('openai');
        // @ts-ignore - accessing private properties for testing
        expect(adapter.model).toBe('gpt-4o-mini');
    });

    it('should handle getWordDefinition correctly', async () => {
        const adapter = new VercelAIAdapter(mockConfig);
        const result = await adapter.getWordDefinition('test', 'This is a test context', 'en');

        expect(result).toBe('mocked response');
        expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
            prompt: expect.stringContaining('test'),
            maxTokens: 500,
            temperature: 0.3
        }));
    });

    it('should handle translateText correctly', async () => {
        const adapter = new VercelAIAdapter(mockConfig);
        const result = await adapter.translateText('Hello world', 'en', 'zh-CN');

        expect(result).toBe('mocked response');
        expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
            prompt: expect.stringContaining('Hello world'),
            maxTokens: 500,
            temperature: 0.3
        }));
    });

    it('should handle unknown provider gracefully', () => {
        const badConfig: AIServiceConfig = {
            apiKey: 'test-api-key',
            provider: 'unknown',
            model: 'model'
        };

        expect(() => new VercelAIAdapter(badConfig)).toThrow('Unsupported provider: unknown');
    });

    it('should expose available models for all supported providers', () => {
        expect(AVAILABLE_MODELS).toHaveProperty('openai');
        expect(AVAILABLE_MODELS).toHaveProperty('anthropic');
        expect(AVAILABLE_MODELS).toHaveProperty('google');
        expect(AVAILABLE_MODELS).toHaveProperty('deepseek');
    });

    // Add a test for DeepSeek provider specifically
    it('should initialize correctly with DeepSeek provider', () => {
        const adapter = new VercelAIAdapter(deepseekConfig);
        // @ts-ignore - accessing private properties for testing
        expect(adapter.provider).toBe('deepseek');
        // @ts-ignore - accessing private properties for testing
        expect(adapter.model).toBe('deepseek-chat');
    });

    // Test DeepSeek word definition functionality
    it('should handle getWordDefinition correctly with DeepSeek provider', async () => {
        const adapter = new VercelAIAdapter(deepseekConfig);
        const result = await adapter.getWordDefinition('phrase', 'This is a phrase in context', 'en');

        expect(result).toBe('mocked response');
        expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
            prompt: expect.stringContaining('phrase'),
            maxTokens: 500,
            temperature: 0.3
        }));
    });

    // Test DeepSeek translation functionality
    it('should handle translateText correctly with DeepSeek provider', async () => {
        const adapter = new VercelAIAdapter(deepseekConfig);
        const result = await adapter.translateText('你好世界', 'zh-CN', 'en');

        expect(result).toBe('mocked response');
        expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
            prompt: expect.stringContaining('你好世界'),
            maxTokens: 500,
            temperature: 0.3
        }));
    });
}); 