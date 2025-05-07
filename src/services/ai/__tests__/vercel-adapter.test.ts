import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelAIAdapter } from '../vercel-adapter';
import { AIServiceConfig } from '../../../core/types/ai';
import { generateText } from 'ai';

// Mock browser.storage.local
global.browser = {
    storage: {
        local: {
            get: vi.fn().mockResolvedValue({
                settings: { nativeLanguage: 'zh-CN' },
            }),
        },
    },
} as any;

// Mock generateText function from Vercel AI SDK
vi.mock('ai', () => ({
    generateText: vi.fn().mockResolvedValue({ text: 'mocked response' }),
}));

// Mock the translatePrompt function
vi.mock('@/prompts', () => ({
    translatePrompt: vi.fn().mockReturnValue('mocked prompt template'),
}));

// Mock the getLanguageName function
vi.mock('@/core/utils', () => ({
    getLanguageName: vi.fn((code) => {
        const languages = {
            en: 'English',
            'zh-CN': 'Chinese',
            es: 'Spanish',
        };
        return languages[code] || code;
    }),
}));

describe('VercelAIAdapter test', () => {
    // Mock provider and model
    const mockProvider = vi.fn((modelName) => ({}));
    const mockModel = 'gpt-4o-mini';

    // DeepSeek mock setup
    const mockDeepSeekProvider = vi.fn((modelName) => ({}));
    const mockDeepSeekModel = 'deepseek-chat';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with the provided provider and model', () => {
        const adapter = new VercelAIAdapter(mockProvider, mockModel);

        expect(adapter.provider).toBe(mockProvider);
        expect(adapter.model).toBe(mockModel);
    });

    it('should handle getWordDefinition correctly', async () => {
        const adapter = new VercelAIAdapter(mockProvider, mockModel);
        const result = await adapter.getWordDefinition('test', 'This is a test context', 'en');

        expect(result).toBe('mocked response');
        expect(generateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: 'mocked prompt template',
                maxTokens: 500,
                temperature: 0.3,
            }),
        );
    });

    it('should handle translateText correctly', async () => {
        const adapter = new VercelAIAdapter(mockProvider, mockModel);
        const result = await adapter.translateText('Hello world', 'en', 'zh-CN');

        expect(result).toBe('mocked response');
        expect(generateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('Hello world'),
                maxTokens: 500,
                temperature: 0.3,
            }),
        );
    });

    it('should handle errors in getWordDefinition', async () => {
        vi.mocked(generateText).mockRejectedValueOnce(new Error('API error'));

        const adapter = new VercelAIAdapter(mockProvider, mockModel);
        const result = await adapter.getWordDefinition('test', 'This is a test context', 'en');

        expect(result).toContain('Failed to get definition');
        expect(result).toContain('API error');
    });

    it('should handle errors in translateText', async () => {
        vi.mocked(generateText).mockRejectedValueOnce(new Error('Translation error'));

        const adapter = new VercelAIAdapter(mockProvider, mockModel);
        const result = await adapter.translateText('Hello world', 'en', 'zh-CN');

        expect(result).toContain('Translation failed');
        expect(result).toContain('Translation error');
    });

    it('should use the provider function with the model name', async () => {
        const mockProviderWithSpy = vi.fn((model) => ({ modelUsed: model }));

        const adapter = new VercelAIAdapter(mockProviderWithSpy, 'test-model');
        await adapter.getWordDefinition('word', 'context', 'en');

        expect(mockProviderWithSpy).toHaveBeenCalledWith('test-model');
    });
});
