/**
 * Storage management utilities
 */
import {VocabularyData} from '../types/storage';
import {Settings, DEFAULT_SETTINGS, loadSettings, saveSettings as saveSettingsToStorage} from '../config/settings';

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
     * Get settings (including environment variables)
     * @returns Settings
     */
    static async getSettings(): Promise<Settings> {
        return await loadSettings();
    }

    /**
     * Save settings
     * @param settings Settings
     */
    static async saveSettings(settings: Settings): Promise<void> {
        await saveSettingsToStorage(settings);
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