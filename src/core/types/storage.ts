/**
 * 存储相关接口定义
 */
import { Settings } from '@/core/config/settings';

/**
 * 单词接口
 */
export interface Word {
    word: string;
    contexts: string[];
    createdAt: string;
}

/**
 * 生词本数据接口
 */
export interface VocabularyData {
    [key: string]: Word;
}

// 导出Settings接口以保持向后兼容性
export type { Settings }; 