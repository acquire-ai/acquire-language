/**
 * 存储管理工具
 */
import {Settings, VocabularyData} from '../types/storage';

// 默认设置
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
 * 存储管理类
 */
export class StorageManager {
    /**
     * 获取存储数据
     * @param key 键
     * @returns 数据
     */
    static async get<T>(key: string): Promise<T | null> {
        const result = await browser.storage.local.get(key);
        return result[key] || null;
    }

    /**
     * 设置存储数据
     * @param key 键
     * @param value 值
     */
    static async set<T>(key: string, value: T): Promise<void> {
        await browser.storage.local.set({[key]: value});
    }

    /**
     * 获取设置
     * @returns 设置
     */
    static async getSettings(): Promise<Settings> {
        return await this.get<Settings>('settings') || DEFAULT_SETTINGS;
    }

    /**
     * 保存设置
     * @param settings 设置
     */
    static async saveSettings(settings: Settings): Promise<void> {
        await this.set('settings', settings);
    }

    /**
     * 获取生词本
     * @returns 生词本数据
     */
    static async getVocabulary(): Promise<VocabularyData> {
        return await this.get<VocabularyData>('vocabulary') || {};
    }

    /**
     * 保存生词本
     * @param vocabulary 生词本数据
     */
    static async saveVocabulary(vocabulary: VocabularyData): Promise<void> {
        await this.set('vocabulary', vocabulary);
    }
} 