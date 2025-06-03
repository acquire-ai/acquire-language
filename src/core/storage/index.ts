/**
 * Storage management utilities
 */
import { VocabularyData } from '../types/storage';
import {
    AIServer,
    AppSettings,
    GeneralSettings,
    getSettings,
    saveAIServers,
    saveGeneralSettings,
    saveSettings,
    saveSubtitleSettings,
    SubtitleSettings,
} from '../config/settings';

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
        try {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
        } catch (error) {
            console.error('Failed to get storage data:', error);
            return null;
        }
    }

    /**
     * Set storage data
     * @param key Key
     * @param value Value
     */
    static async set<T>(key: string, value: T): Promise<void> {
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch (error) {
            console.error('Failed to set storage data:', error);
            throw error;
        }
    }

    /**
     * Get settings (including environment variables)
     * @returns Settings
     */
    static async getSettings(): Promise<AppSettings> {
        return await getSettings();
    }

    /**
     * Save settings
     * @param settings Settings
     */
    static async saveSettings(settings: Partial<AppSettings>): Promise<void> {
        await saveSettings(settings);
    }

    /**
     * Save general settings
     * @param settings General settings
     */
    static async saveGeneralSettings(settings: GeneralSettings): Promise<void> {
        await saveGeneralSettings(settings);
    }

    /**
     * Save subtitle settings
     * @param settings Subtitle settings
     */
    static async saveSubtitleSettings(settings: SubtitleSettings): Promise<void> {
        await saveSubtitleSettings(settings);
    }

    /**
     * Save AI servers
     * @param aiServers AI servers
     */
    static async saveAIServers(aiServers: AIServer[]): Promise<void> {
        await saveAIServers(aiServers);
    }

    /**
     * Get vocabulary
     * @returns Vocabulary data
     */
    static async getVocabulary(): Promise<VocabularyData> {
        return (await this.get<VocabularyData>('vocabulary')) || {};
    }

    /**
     * Save vocabulary
     * @param vocabulary Vocabulary data
     */
    static async saveVocabulary(vocabulary: VocabularyData): Promise<void> {
        await this.set('vocabulary', vocabulary);
    }
}

// 导出新的类型和函数以便其他模块使用
export type { AppSettings, GeneralSettings, SubtitleSettings, AIServer } from '../config/settings';

export {
    getSettings,
    saveSettings,
    saveGeneralSettings,
    saveSubtitleSettings,
    saveAIServers,
    debounce,
    watchSettings,
} from '../config/settings';
