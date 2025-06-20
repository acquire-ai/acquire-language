import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageManager } from '../index';
import * as settingsModule from '../../config/settings';
import { DEFAULT_SETTINGS } from '../../config/settings';
import { Settings, VocabularyData } from '../../types/storage';

// Mock getSettings function
vi.mock('../../config/settings', () => {
    return {
        // Keep default settings export
        DEFAULT_SETTINGS: {
            general: {
                appLanguage: 'en',
                nativeLanguage: 'zh-cn',
                learnLanguage: 'en-us',
                languageLevel: 'b1',
            },
            subtitle: {
                showNativeSubtitles: true,
                showLearningSubtitles: true,
                fontSize: 20,
                position: 'bottom',
                textColor: '#ffffff',
                backgroundColor: '#000000',
                opacity: 0.8,
            },
            aiServers: [
                {
                    id: 'default',
                    name: 'Default DeepSeek',
                    provider: 'deepseek',
                    model: 'deepseek-chat',
                    settings: {
                        apiKey: '',
                        baseURL: '',
                    },
                    isDefault: true,
                },
            ],
            lastUpdated: Date.now(),
        },
        // Mock getSettings function
        getSettings: vi.fn(),
        // Mock saveSettings function
        saveSettings: vi.fn(),
    };
});

// Mock browser.storage.local API
const mockStorage = {
    local: {
        get: vi.fn(),
        set: vi.fn(),
    },
};

// Override global mocks
beforeEach(() => {
    vi.resetAllMocks();
    // Ensure global mock is overridden
    (global as any).browser = {
        storage: mockStorage,
    };
});

describe('Storage Manager Tests', () => {
    describe('get method', () => {
        it('should return data from storage', async () => {
            mockStorage.local.get.mockResolvedValue({ testKey: 'testValue' });

            const result = await StorageManager.get('testKey');

            expect(mockStorage.local.get).toHaveBeenCalledWith('testKey');
            expect(result).toBe('testValue');
        });

        it('should return null when data does not exist', async () => {
            mockStorage.local.get.mockResolvedValue({});

            const result = await StorageManager.get('testKey');

            expect(mockStorage.local.get).toHaveBeenCalledWith('testKey');
            expect(result).toBeNull();
        });
    });

    describe('set method', () => {
        it('should correctly set storage data', async () => {
            await StorageManager.set('testKey', 'testValue');

            expect(mockStorage.local.set).toHaveBeenCalledWith({ testKey: 'testValue' });
        });
    });

    describe('getSettings method', () => {
        it('should return stored settings', async () => {
            const mockSettings: Settings = {
                general: {
                    appLanguage: 'en',
                    nativeLanguage: 'zh-CN',
                    learnLanguage: 'en',
                    languageLevel: 'beginner',
                },
                subtitle: {
                    showNativeSubtitles: true,
                    showLearningSubtitles: true,
                    fontSize: 16,
                    position: 'bottom',
                    textColor: '#ffffff',
                    backgroundColor: '#000000',
                    opacity: 0.8,
                },
                aiServers: [
                    {
                        id: '1',
                        name: 'OpenAI',
                        provider: 'openai',
                        model: 'gpt-3.5-turbo',
                        settings: {
                            apiKey: 'test-key',
                            baseURL: 'https://api.openai.com/v1',
                        },
                        isDefault: true,
                    },
                ],
                theme: 'system',
                lastUpdated: Date.now(),
            };

            // Mock getSettings to return mock settings
            (settingsModule.getSettings as any).mockResolvedValue(mockSettings);

            const result = await StorageManager.getSettings();

            expect(settingsModule.getSettings).toHaveBeenCalled();
            expect(result).toEqual(mockSettings);
        });

        it('should return default settings when settings do not exist', async () => {
            // Mock getSettings to return default settings
            (settingsModule.getSettings as any).mockResolvedValue(DEFAULT_SETTINGS);

            const result = await StorageManager.getSettings();

            expect(settingsModule.getSettings).toHaveBeenCalled();
            expect(result).toEqual(DEFAULT_SETTINGS);
        });
    });

    describe('saveSettings method', () => {
        it('should correctly save settings', async () => {
            const settings: Settings = {
                general: {
                    appLanguage: 'zh',
                    nativeLanguage: 'zh',
                    learnLanguage: 'fr-fr',
                    languageLevel: 'c1',
                },
                subtitle: {
                    showNativeSubtitles: true,
                    showLearningSubtitles: true,
                    fontSize: 20,
                    position: 'bottom',
                    textColor: '#ffffff',
                    backgroundColor: '#000000',
                    opacity: 0.8,
                },
                aiServers: [
                    {
                        id: 'default',
                        name: 'Default DeepSeek',
                        provider: 'deepseek',
                        model: 'deepseek-chat',
                        settings: {
                            apiKey: '',
                            baseURL: '',
                        },
                        isDefault: true,
                    },
                ],
                theme: 'system',
                lastUpdated: Date.now(),
            };

            await StorageManager.saveSettings(settings);

            expect(settingsModule.saveSettings).toHaveBeenCalledWith(settings);
        });
    });

    describe('getVocabulary method', () => {
        it('should return stored vocabulary', async () => {
            const mockVocabulary: VocabularyData = {
                test: {
                    word: 'test',
                    contexts: ['This is a test'],
                    createdAt: '2023-01-01',
                },
            };

            mockStorage.local.get.mockResolvedValue({ vocabulary: mockVocabulary });

            const result = await StorageManager.getVocabulary();

            expect(mockStorage.local.get).toHaveBeenCalledWith('vocabulary');
            expect(result).toEqual(mockVocabulary);
        });

        it('should return empty object when vocabulary does not exist', async () => {
            mockStorage.local.get.mockResolvedValue({});

            const result = await StorageManager.getVocabulary();

            expect(mockStorage.local.get).toHaveBeenCalledWith('vocabulary');
            expect(result).toEqual({});
        });
    });

    describe('saveVocabulary method', () => {
        it('should correctly save vocabulary', async () => {
            const vocabulary: VocabularyData = {
                example: {
                    word: 'example',
                    contexts: ['This is an example'],
                    createdAt: '2023-01-01',
                },
            };

            await StorageManager.saveVocabulary(vocabulary);

            expect(mockStorage.local.set).toHaveBeenCalledWith({ vocabulary });
        });
    });
});
