import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAIService, AVAILABLE_MODELS } from '../factory';
import { VercelAIAdapter } from '../vercel-adapter';
import { AIServiceConfig } from '../../../core/types/ai';

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

vi.mock('@ai-sdk/openai-compatible', () => ({
    createOpenAICompatible: vi.fn().mockReturnValue('openai-compatible-provider-instance'),
}));

// Mock VercelAIAdapter
vi.mock('../vercel-adapter', () => ({
    VercelAIAdapter: vi.fn(),
}));

describe('AI service factory test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create an AI service for deepseek provider', () => {
        const config: AIServiceConfig = {
            apiKey: 'test-api-key',
            providerType: 'deepseek',
            model: 'deepseek-chat',
        };

        createAIService(config);

        expect(VercelAIAdapter).toHaveBeenCalledWith('deepseek-provider-instance', 'deepseek-chat');
    });

    it('should create an AI service for OpenAI provider', () => {
        const config: AIServiceConfig = {
            apiKey: 'test-api-key',
            providerType: 'openai',
            model: 'gpt-4o-mini',
        };

        createAIService(config);

        expect(VercelAIAdapter).toHaveBeenCalledWith('openai-provider-instance', 'gpt-4o-mini');
    });

    it('should create an AI service for OpenAI Compatible provider', () => {
        const config: AIServiceConfig = {
            apiKey: 'test-api-key',
            providerType: 'openai-compatible',
            model: 'meta-llama/Llama-3-70b-chat-hf',
            providerName: 'llama',
            baseURL: 'https://api.llama.com/v1',
            options: {
                queryParams: { 'api-version': '1.0' },
            },
        };

        createAIService(config);

        expect(VercelAIAdapter).toHaveBeenCalledWith(
            'openai-compatible-provider-instance',
            'meta-llama/Llama-3-70b-chat-hf',
        );
    });

    it('should throw error for unsupported provider', () => {
        const config: AIServiceConfig = {
            apiKey: 'test-api-key',
            providerType: 'unsupported-provider',
            model: 'any-model',
        };

        expect(() => createAIService(config)).toThrow('Unsupported provider: unsupported-provider');
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
