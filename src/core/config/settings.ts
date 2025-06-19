/**
 * Settings management module for Acquire Language
 * Uses the new storage structure with improved organization
 */

// 定义设置类型
export interface GeneralSettings {
    appLanguage: string;
    nativeLanguage: string;
    learnLanguage: string;
    languageLevel: string; // 用户当前语言水平
}

export interface SubtitleSettings {
    showNativeSubtitles: boolean;
    showLearningSubtitles: boolean;
    fontSize: number;
    position: 'top' | 'bottom';
    textColor: string;
    backgroundColor: string;
    opacity: number; // 0-1 decimal instead of 0-100 percentage
}

export interface AIServer {
    id: string;
    name: string;
    provider: string;
    model: string;
    settings: Record<string, any>;
    isDefault: boolean;
}

export interface AppSettings {
    general: GeneralSettings;
    subtitle: SubtitleSettings;
    aiServers: AIServer[];
    theme: string; // 'light' | 'dark' | 'system'
    lastUpdated: number;
}

// 默认设置
export const DEFAULT_SETTINGS: AppSettings = {
    general: {
        appLanguage: 'en',
        nativeLanguage: 'en',
        learnLanguage: 'es',
        languageLevel: 'a1', // 默认为a1 - Beginner
    },
    subtitle: {
        showNativeSubtitles: true,
        showLearningSubtitles: true,
        fontSize: 20,
        position: 'bottom',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        opacity: 0.7,
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
    theme: 'system', // 默认跟随系统
    lastUpdated: Date.now(),
};

// 存储键
const STORAGE_KEY = 'acquire_language_settings';

// 检查是否在Chrome扩展环境中
const isChromeExtension = (): boolean => {
    return typeof chrome !== 'undefined' && chrome?.storage?.sync !== undefined;
};

// 保存设置
export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
    try {
        // 先获取当前设置
        const currentSettings = await getSettings();

        // 合并新设置
        const updatedSettings: AppSettings = {
            ...currentSettings,
            ...settings,
            lastUpdated: Date.now(),
        };

        if (isChromeExtension()) {
            // 使用Chrome扩展API保存
            return new Promise((resolve, reject) => {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                    chrome.storage.sync.set({ [STORAGE_KEY]: updatedSettings }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error saving settings:', chrome.runtime.lastError);
                            reject(chrome.runtime.lastError);
                        } else {
                            console.log('Settings saved successfully');
                            resolve();
                        }
                    });
                } else {
                    console.warn('Chrome storage API not available. Settings not saved.');
                    resolve(); // Resolve immediately as saving is skipped
                }
            });
        } else {
            // 降级到localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
            console.log('Settings saved to localStorage');
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
    }
};

// 获取设置
export const getSettings = async (): Promise<AppSettings> => {
    try {
        let storageSettings: AppSettings = DEFAULT_SETTINGS;

        if (isChromeExtension()) {
            // 使用Chrome扩展API获取
            storageSettings = await new Promise((resolve) => {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
                    chrome.storage.sync.get([STORAGE_KEY], (result) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error loading settings:', chrome.runtime.lastError);
                            resolve(DEFAULT_SETTINGS);
                        } else if (result && result[STORAGE_KEY]) {
                            console.log('Settings loaded from chrome.storage.sync');
                            resolve(result[STORAGE_KEY] as AppSettings);
                        } else {
                            console.log('No settings found, using defaults');
                            resolve(DEFAULT_SETTINGS);
                        }
                    });
                } else {
                    console.warn('Chrome storage API not available. Using default settings.');
                    resolve(DEFAULT_SETTINGS);
                }
            });
        } else {
            // 降级到localStorage
            const storedSettings = localStorage.getItem(STORAGE_KEY);
            if (storedSettings) {
                console.log('Settings loaded from localStorage');
                storageSettings = JSON.parse(storedSettings) as AppSettings;
            } else {
                console.log('No settings found, using defaults');
                storageSettings = DEFAULT_SETTINGS;
            }
        }

        const mergedSettings: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...storageSettings,
        };
        return mergedSettings;
    } catch (error) {
        console.error('Failed to load settings:', error);
        return DEFAULT_SETTINGS;
    }
};

// 保存特定部分的设置
export const saveGeneralSettings = async (settings: GeneralSettings): Promise<void> => {
    return saveSettings({ general: settings });
};

export const saveSubtitleSettings = async (settings: SubtitleSettings): Promise<void> => {
    return saveSettings({ subtitle: settings });
};

export const saveAIServers = async (aiServers: AIServer[]): Promise<void> => {
    return saveSettings({ aiServers });
};

export const saveTheme = async (theme: string): Promise<void> => {
    return saveSettings({ theme });
};

// 防抖函数，用于自动保存
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

/**
 * Watch for settings changes
 * @param callback Function to call when settings change
 */
export function watchSettings(callback: (settings: AppSettings) => void): void {
    if (isChromeExtension()) {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync' && changes[STORAGE_KEY]) {
                callback(changes[STORAGE_KEY].newValue);
            }
        });
    }
}

// 为了向后兼容，导出一些别名
export type Settings = AppSettings;
