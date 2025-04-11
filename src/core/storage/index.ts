/**
 * Storage management utilities
 */
import {Settings, VocabularyData} from '../types/storage';

// Default settings
export const DEFAULT_SETTINGS: Settings = {
    nativeLanguage: 'zh-CN',
    targetLanguage: 'en-US',
    languageLevel: 'B1',
    aiModel: 'deepseek',
    apiKey: '',
    subtitleSettings: {
        fontSize: 16,
        position: 'bottom',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textColor: '#ffffff',
        opacity: 0.9,
    },
};

/**
 * Storage Manager
 */
export class StorageManager {
    /**
     * Get stored data
     * @param key Key
     * @returns Data
     */
    static async get<T>(key: string): Promise<T | null> {
        const result = await browser.storage.local.get(key);
        return result[key] || null;
    }

    /**
     * Set storage data
     * @param key Key
     * @param value Value
     */
    static async set<T>(key: string, value: T): Promise<void> {
        await browser.storage.local.set({[key]: value});
    }

    /**
     * Get settings
     * @returns Settings
     */
    static async getSettings(): Promise<Settings> {
        return await this.get<Settings>('settings') || DEFAULT_SETTINGS;
    }

    /**
     * Save settings
     * @param settings Settings
     */
    static async saveSettings(settings: Settings): Promise<void> {
        await this.set('settings', settings);
    }

    /**
     * Get vocabulary
     * @returns Vocabulary data
     */
    static async getVocabulary(): Promise<VocabularyData> {
        return await this.get<VocabularyData>('vocabulary') || {};
    }

    /**
     * Save vocabulary
     * @param vocabulary Vocabulary data
     */
    static async saveVocabulary(vocabulary: VocabularyData): Promise<void> {
        await this.set('vocabulary', vocabulary);
    }
} 