/**
 * Settings management module
 * Handles loading settings from environment variables and browser storage
 */

// Define the settings type
export interface Settings {
    nativeLanguage: string;
    targetLanguage: string;
    languageLevel: string;
    aiProvider: string;
    aiModel: string;
    apiKey: string;
    options?: Record<string, any>; // Add options field for provider-specific configuration
    subtitleSettings: {
        fontSize: number;
        position: 'top' | 'bottom';
        backgroundColor: string;
        textColor: string;
        opacity: number;
    };
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
    nativeLanguage: 'zh-CN',
    targetLanguage: 'en-US',
    languageLevel: 'B1',
    aiProvider: 'deepseek',
    aiModel: 'deepseek-chat',
    apiKey: '',
    options: {}, // Initialize with empty object
    subtitleSettings: {
        fontSize: 20,
        position: 'bottom',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textColor: '#ffffff',
        opacity: 0.8,
    },
};

/**
 * Get environment variable
 * @param name Environment variable name
 * @param defaultValue Default value
 * @returns Environment variable value
 */
function getEnvVar(name: string, defaultValue: string): string {
    if (typeof window !== 'undefined' && (window as any).__ENV__) {
        const env = (window as any).__ENV__;
        return env[name] || defaultValue;
    }
    return defaultValue;
}

/**
 * Load settings from environment variables
 */
export function loadEnvSettings(): Partial<Settings> {
    const envSettings: Partial<Settings> = {
        nativeLanguage: getEnvVar('ACQUIRE_NATIVE_LANGUAGE', ''),
        targetLanguage: getEnvVar('ACQUIRE_TARGET_LANGUAGE', ''),
        languageLevel: getEnvVar('ACQUIRE_LANGUAGE_LEVEL', ''),
        aiProvider: getEnvVar('ACQUIRE_AI_PROVIDER', ''),
        aiModel: getEnvVar('ACQUIRE_AI_MODEL', ''),
        apiKey: getEnvVar('ACQUIRE_API_KEY', ''),
    };

    // Only include non-empty values
    return Object.fromEntries(
        Object.entries(envSettings).filter(([_, value]) => value !== ''),
    ) as Partial<Settings>;
}

/**
 * Load settings from browser storage
 */
export async function loadStorageSettings(): Promise<Settings> {
    try {
        const result = await chrome.storage.sync.get('settings');
        return result.settings || DEFAULT_SETTINGS;
    } catch (error) {
        console.error('Failed to load settings from storage:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Load settings combining environment variables and stored settings
 * Environment variables take precedence over stored settings
 */
export async function loadSettings(): Promise<Settings> {
    // First get settings from storage
    const storageSettings = await loadStorageSettings();

    // Then overlay with environment variables
    const envSettings = loadEnvSettings();

    // Merge settings with environment variables taking precedence
    const mergedSettings = {
        ...storageSettings,
        ...envSettings,
    };

    return mergedSettings;
}

/**
 * Save settings to browser storage
 */
export async function saveSettings(settings: Settings): Promise<void> {
    try {
        await chrome.storage.sync.set({ settings });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}
