import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageManager } from '../index';
import * as settingsModule from '../../config/settings';
import { DEFAULT_SETTINGS } from '../../config/settings';
import { Settings, VocabularyData } from '../../types/storage';

// Mock loadSettings function
vi.mock('../../config/settings', () => {
    return {
        // Keep default settings export
        DEFAULT_SETTINGS: {
            general: {
                appLanguage: 'en',
                nativeLanguage: 'zh-CN',
                learnLanguage: 'en-US',
                languageLevel: 'B1',
            },
            subtitle: {
                showNativeSubtitles: true,
                showLearningSubtitles: true,
                subtitleSize: 20,
                subtitlePosition: 'bottom',
                subtitleColor: '#ffffff',
                subtitleBgColor: '#000000',
                subtitleBgOpacity: 80,
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
        // Mock loadSettings function
        loadSettings: vi.fn(),
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
                ...DEFAULT_SETTINGS,
                general: {
                    ...DEFAULT_SETTINGS.general,
                    nativeLanguage: 'ja-JP',
                },
            };

            // Mock loadSettings to return mock settings
            (settingsModule.loadSettings as any).mockResolvedValue(mockSettings);

            const result = await StorageManager.getSettings();

            expect(settingsModule.loadSettings).toHaveBeenCalled();
            expect(result).toEqual(mockSettings);
        });

        it('should return default settings when settings do not exist', async () => {
            // Mock loadSettings to return default settings
            (settingsModule.loadSettings as any).mockResolvedValue(DEFAULT_SETTINGS);

            const result = await StorageManager.getSettings();

            expect(settingsModule.loadSettings).toHaveBeenCalled();
            expect(result).toEqual(DEFAULT_SETTINGS);
        });
    });

    describe('saveSettings method', () => {
        it('should correctly save settings', async () => {
            const settings: Settings = {
                ...DEFAULT_SETTINGS,
                general: {
                    ...DEFAULT_SETTINGS.general,
                    learnLanguage: 'fr-FR',
                },
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
