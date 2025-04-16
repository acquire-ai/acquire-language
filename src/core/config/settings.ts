/**
 * Settings management module
 * Handles loading settings from environment variables and browser storage
 */
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

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

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  nativeLanguage: "zh-CN",
  targetLanguage: "en-US",
  languageLevel: "B1",
  aiModel: "deepseek",
  apiKey: "",
  subtitleSettings: {
    fontSize: 20,
    position: "bottom",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    textColor: "#ffffff",
    opacity: 0.9,
  },
};

function getEnvVar(key: string, fallback: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || fallback;
  }
  return fallback;
}


export function loadEnvSettings(): Partial<Settings> {
  const envSettings: Partial<Settings> = {
    nativeLanguage: getEnvVar('ACQUIRE_NATIVE_LANGUAGE', ''),
    targetLanguage: getEnvVar('ACQUIRE_TARGET_LANGUAGE', ''),
    languageLevel: getEnvVar('ACQUIRE_LANGUAGE_LEVEL', ''),
    aiModel: getEnvVar('ACQUIRE_AI_MODEL', ''),
    apiKey: getEnvVar('ACQUIRE_API_KEY', ''),
  };
  
  // Only include non-empty values
  return Object.fromEntries(
    Object.entries(envSettings).filter(([_, value]) => value !== '')
  ) as Partial<Settings>;
}

export async function loadStorageSettings(): Promise<Settings> {
  try {
    const result = await browser.storage.local.get("settings");
    return result.settings || DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to load settings from storage:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Load settings combining environment variables and stored settings
 * Environment variables take precedence over stored settings
 */
export async function loadSettings(): Promise<Settings> {
  const storageSettings = await loadStorageSettings();
  
  const envSettings = loadEnvSettings();
  
  // Merge settings with environment variables taking precedence
  const mergedSettings = {
    ...storageSettings,
    ...envSettings,
  };

  console.log("Settings loaded:", mergedSettings);
  return mergedSettings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await browser.storage.local.set({ settings });
    console.log("Settings saved:", settings);
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
} 