import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AVAILABLE_MODELS, createAIService } from '../factory';
import { VercelAIAdapter } from '../vercel-adapter';
import { AIServer } from '../../../core/config/settings';

// Mock Vercel AI SDK providers
vi.mock('@ai-sdk/openai', () => ({
    createOpenAI: vi.fn().mockReturnValue('openai-provider-instance'),
}));

vi.mock('@ai-sdk/anthropic', () => ({
    createAnthropic: vi.fn().mockReturnValue('anthropic-provider-instance'),
}));

vi.mock('@ai-sdk/google', () => ({
    createGoogleGenerativeAI: vi.fn().mockReturnValue('google-provider-instance'),
}));

vi.mock('@ai-sdk/deepseek', () => ({
    createDeepSeek: vi.fn().mockReturnValue('deepseek-provider-instance'),
}));

vi.mock('@ai-sdk/azure', () => ({
    createAzure: vi.fn().mockReturnValue('azure-provider-instance'),
}));

vi.mock('@ai-sdk/openai-compatible', () => ({
    createOpenAICompatible: vi.fn().mockReturnValue('openai-compatible-provider-instance'),
}));

// Mock VercelAIAdapter to return a proper service instance
vi.mock('../vercel-adapter', () => ({
    VercelAIAdapter: vi.fn().mockImplementation(() => ({
        getWordDefinition: vi.fn().mockResolvedValue('mocked definition'),
        translateText: vi.fn().mockResolvedValue('mocked translation'),
    })),
}));

describe('AI Service Factory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create OpenAI service', () => {
        const server: AIServer = {
            id: 'test-openai',
            name: 'Test OpenAI',
            provider: 'openai',
            model: 'gpt-4o',
            settings: {
                apiKey: 'test-key',
            },
            isDefault: true,
        };

        const service = createAIService(server);
        expect(service).toBeDefined();
        expect(service.getWordDefinition).toBeDefined();
        expect(service.translateText).toBeDefined();
        expect(VercelAIAdapter).toHaveBeenCalledWith('openai-provider-instance', 'gpt-4o');
    });

    it('should create Anthropic service', () => {
        const server: AIServer = {
            id: 'test-anthropic',
            name: 'Test Anthropic',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet',
            settings: {
                apiKey: 'test-key',
            },
            isDefault: false,
        };

        const service = createAIService(server);
        expect(service).toBeDefined();
        expect(VercelAIAdapter).toHaveBeenCalledWith(
            'anthropic-provider-instance',
            'claude-3-5-sonnet',
        );
    });

    it('should create DeepSeek service', () => {
        const server: AIServer = {
            id: 'test-deepseek',
            name: 'Test DeepSeek',
            provider: 'deepseek',
            model: 'deepseek-chat',
            settings: {
                apiKey: 'test-key',
            },
            isDefault: false,
        };

        const service = createAIService(server);
        expect(service).toBeDefined();
        expect(VercelAIAdapter).toHaveBeenCalledWith('deepseek-provider-instance', 'deepseek-chat');
    });

    it('should throw error for unsupported provider', () => {
        const server: AIServer = {
            id: 'test-unsupported',
            name: 'Test Unsupported',
            provider: 'unsupported-provider',
            model: 'some-model',
            settings: {
                apiKey: 'test-key',
            },
            isDefault: false,
        };

        expect(() => createAIService(server)).toThrow('Unsupported provider: unsupported-provider');
    });

    it('should export AVAILABLE_MODELS with supported providers and models', () => {
        // Verify AVAILABLE_MODELS is exported and includes all supported providers
        expect(AVAILABLE_MODELS).toBeDefined();
        expect(AVAILABLE_MODELS).toHaveProperty('openai');
        expect(AVAILABLE_MODELS).toHaveProperty('anthropic');
        expect(AVAILABLE_MODELS).toHaveProperty('google');
        expect(AVAILABLE_MODELS).toHaveProperty('deepseek');
        expect(AVAILABLE_MODELS).toHaveProperty('openai-compatible');

        // Verify each provider has at least one available model
        Object.keys(AVAILABLE_MODELS).forEach((provider) => {
            if (provider !== 'openai-compatible') {
                expect(Array.isArray(AVAILABLE_MODELS[provider])).toBe(true);
                expect(AVAILABLE_MODELS[provider].length).toBeGreaterThan(0);
            } else {
                // openai-compatible is special - it can be empty as users will input model IDs
                expect(Array.isArray(AVAILABLE_MODELS[provider])).toBe(true);
            }
        });

        // Verify specific models exist
        expect(AVAILABLE_MODELS.openai).toContain('gpt-4o');
        expect(AVAILABLE_MODELS.anthropic).toContain('claude-3-5-sonnet');
        expect(AVAILABLE_MODELS.google).toContain('gemini-1.5-pro');
        expect(AVAILABLE_MODELS.deepseek).toContain('deepseek-chat');
        expect(AVAILABLE_MODELS.deepseek).toContain('deepseek-reasoner');
    });
});
