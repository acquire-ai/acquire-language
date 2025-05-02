import { useEffect, useState } from 'react';
import { Settings, DEFAULT_SETTINGS, loadSettings, saveSettings as saveSetting } from '@/core/config/settings';
import { getAvailableAIModels } from '@/services/ai';

// Language proficiency levels
const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Language options
const LANGUAGES = [
    { code: 'zh-CN', name: '中文 (简体)' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    { code: 'ru', name: 'Русский' },
];

function Options() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Get available models
    const availableModels = getAvailableAIModels();

    useEffect(() => {
        const loadUserSettings = async () => {
            try {
                const userSettings = await loadSettings();
                setSettings(userSettings);
            } catch (error) {
                console.error("Failed to load settings:", error);
            }
        };

        loadUserSettings();
    }, []);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await saveSetting(settings);
            setSaveMessage('Settings saved');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage(`Failed to save: ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setSettings(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof Settings] as Record<string, any>,
                    [child]: value,
                },
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle range input changes
    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [parent, child] = name.split('.');

        setSettings(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent as keyof Settings] as Record<string, any>,
                [child]: parseFloat(value),
            },
        }));
    };

    // Handle AI provider change
    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setSettings(prev => ({
            ...prev,
            aiProvider: newProvider,
            // Reset model to first available when changing provider
            aiModel: availableModels[newProvider][0]
        }));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Acquire Language - Settings</h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Language Settings</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Native Language</label>
                        <select
                            name="nativeLanguage"
                            value={settings.nativeLanguage}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Target Language</label>
                        <select
                            name="targetLanguage"
                            value={settings.targetLanguage}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Language Level</label>
                        <div className="flex space-x-2">
                            {LANGUAGE_LEVELS.map(level => (
                                <label key={level} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="languageLevel"
                                        value={level}
                                        checked={settings.languageLevel === level}
                                        onChange={handleChange}
                                        className="mr-1"
                                    />
                                    <span>{level}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">AI Settings</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">AI Provider</label>
                        <select
                            name="aiProvider"
                            value={settings.aiProvider}
                            onChange={handleProviderChange}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                            {Object.keys(availableModels).map(provider => (
                                <option key={provider} value={provider}>
                                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">AI Model</label>
                        <select
                            name="aiModel"
                            value={settings.aiModel}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                            {settings.aiProvider && availableModels[settings.aiProvider] ? 
                              availableModels[settings.aiProvider].map(model => (
                                <option key={model} value={model}>{model}</option>
                              )) : 
                              <option value="">please select a AI provider</option>
                            }
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <input
                            type="password"
                            name="apiKey"
                            value={settings.apiKey}
                            onChange={handleChange}
                            placeholder="Enter your API Key"
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Subtitle Settings</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Font Size: {settings.subtitleSettings.fontSize}px
                        </label>
                        <input
                            type="range"
                            name="subtitleSettings.fontSize"
                            min="12"
                            max="32"
                            value={settings.subtitleSettings.fontSize}
                            onChange={handleRangeChange}
                            className="w-full"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Position</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="subtitleSettings.position"
                                    value="top"
                                    checked={settings.subtitleSettings.position === 'top'}
                                    onChange={handleChange}
                                    className="mr-1"
                                />
                                <span>Top</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="subtitleSettings.position"
                                    value="bottom"
                                    checked={settings.subtitleSettings.position === 'bottom'}
                                    onChange={handleChange}
                                    className="mr-1"
                                />
                                <span>Bottom</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Background Color</label>
                        <input
                            type="color"
                            name="subtitleSettings.backgroundColor"
                            value={settings.subtitleSettings.backgroundColor}
                            onChange={handleChange}
                            className="w-full p-1 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Text Color</label>
                        <input
                            type="color"
                            name="subtitleSettings.textColor"
                            value={settings.subtitleSettings.textColor}
                            onChange={handleChange}
                            className="w-full p-1 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Opacity: {settings.subtitleSettings.opacity}
                        </label>
                        <input
                            type="range"
                            name="subtitleSettings.opacity"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.subtitleSettings.opacity}
                            onChange={handleRangeChange}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

                {saveMessage && (
                    <div className="mt-4 p-2 text-center text-sm text-green-600 dark:text-green-400">
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Options; 