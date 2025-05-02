import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelAIAdapter, AVAILABLE_MODELS } from '../vercel-adapter';
import { AIServiceConfig } from '../../../core/types/ai';
import { generateText } from 'ai';

// Mock generateText function from Vercel AI SDK
vi.mock('ai', () => ({
    generateText: vi.fn().mockResolvedValue({ text: 'mocked response' })
}));

// Mock browser storage API
vi.mock('webextension-polyfill', () => ({
    default: {
        storage: {
            local: {
                get: vi.fn().mockResolvedValue({
                    settings: {
                        nativeLanguage: 'zh-CN'
                    }
                })
            }
        }
    }
}));

// Mock provider modules
vi.mock('@ai-sdk/openai', () => ({
    createOpenAI: vi.fn().mockReturnValue(modelName => ({}))
}));

vi.mock('@ai-sdk/anthropic', () => ({
    createAnthropic: vi.fn().mockReturnValue(modelName => ({}))
}));

vi.mock('@ai-sdk/google', () => ({
    createGoogleGenerativeAI: vi.fn().mockReturnValue(modelName => ({}))
}));

vi.mock('@ai-sdk/deepseek', () => ({
    createDeepSeek: vi.fn().mockReturnValue(modelName => ({}))
}));

describe('VercelAIAdapter test', () => {
    const mockConfig: AIServiceConfig = {
        apiKey: 'test-api-key',
        provider: 'openai',
        model: 'gpt-4o-mini'
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
}); 