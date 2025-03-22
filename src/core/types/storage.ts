/**
 * 存储相关接口定义
 */

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

/**
 * 设置接口
 */
export interface Settings {
    nativeLanguage: string;
    targetLanguage: string;
    languageLevel: string;
    aiModel: string;
    apiKey: string;
    subtitleSettings: {
        fontSize: number;
        position: 'top' | 'bottom';
        backgroundColor: string;
        textColor: string;
        opacity: number;
    };
} 