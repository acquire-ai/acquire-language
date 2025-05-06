import { useEffect, useState } from 'react';
import {
    Settings,
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings as saveSetting,
} from '@/core/config/settings';
import { getAvailableAIModels, getAIProviderSettings } from '@/services/ai';

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

// Providers that require custom model input
const CUSTOM_MODEL_PROVIDERS = ['azure', 'openai-compatible'];

function Options() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [providerOptions, setProviderOptions] = useState<Record<string, any>>({});

    // Get available models
    const availableModels = getAvailableAIModels();

    useEffect(() => {
        const loadUserSettings = async () => {
            try {
                const userSettings = await loadSettings();
                setSettings(userSettings);

                // Initialize provider options
                if (userSettings.aiProvider) {
                    setProviderOptions(userSettings.options || {});
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };

        loadUserSettings();
    }, []);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            // Create the settings object with provider options
            const updatedSettings = {
                ...settings,
                options: providerOptions,
            };
            await saveSetting(updatedSettings);
            setSaveMessage('Settings saved successfully');
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
            setSettings((prev) => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof Settings] as Record<string, any>),
                    [child]: value,
                },
            }));
        } else {
            setSettings((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle option changes
    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Handle nested object properties (e.g., "options.queryParams.version")
        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                setProviderOptions((prev) => ({
                    ...prev,
                    [parts[0]]: {
                        ...(prev[parts[0]] || {}),
                        [parts[1]]: value,
                    },
                }));
            } else if (parts.length === 3) {
                // Handle 3 levels deep (e.g. "queryParams.version")
                setProviderOptions((prev) => ({
                    ...prev,
                    [parts[0]]: {
                        ...(prev[parts[0]] || {}),
                        [parts[1]]: {
                            ...(prev[parts[0]]?.[parts[1]] || {}),
                            [parts[2]]: value,
                        },
                    },
                }));
            }
        } else {
            setProviderOptions((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // Handle range input changes
    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [parent, child] = name.split('.');

        setSettings((prev) => ({
            ...prev,
            [parent]: {
                ...(prev[parent as keyof Settings] as Record<string, any>),
                [child]: parseFloat(value),
            },
        }));
    };

    // Handle AI provider change
    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;

        // Reset model and provider options when changing providers
        let defaultModel = '';
        if (
            !CUSTOM_MODEL_PROVIDERS.includes(newProvider) &&
            availableModels[newProvider].length > 0
        ) {
            defaultModel = availableModels[newProvider][0];
        }

        setSettings((prev) => ({
            ...prev,
            aiProvider: newProvider,
            aiModel: defaultModel,
        }));

        // Reset provider options
        setProviderOptions({});
    };

    // Get provider-specific configuration fields
    const providerFields = settings.aiProvider ? getAIProviderSettings(settings.aiProvider) : {};

    // Add this helper function to render fields recursively
    const renderConfigField = (field: any, key: string, parentKey: string = '') => {
        const fieldName = parentKey ? `${parentKey}.${key}` : key;

        // Skip apiKey as it's already handled above
        if (key === 'apiKey') return null;

        if (field.type === 'object' && field.properties) {
            return (
                <div
                    key={fieldName}
                    className="ml-4 mt-3 border-l-2 pl-3 border-gray-200 dark:border-gray-700"
                >
                    <label className="block text-sm font-medium mb-1">{field.name}</label>
                    <div>
                        {Object.entries(field.properties).map(([propKey, propField]) =>
                            renderConfigField(propField, propKey, fieldName),
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div key={fieldName} className="mb-3">
                <label className="block text-sm font-medium mb-1">
                    {field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'string' && (
                    <input
                        type="text"
                        name={fieldName}
                        value={
                            parentKey
                                ? providerOptions[parentKey.split('.')[0]]?.[
                                      parentKey.split('.')[1]
                                  ]?.[key] || ''
                                : providerOptions[key] || ''
                        }
                        onChange={handleOptionChange}
                        placeholder={field.description}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        required={field.required}
                    />
                )}

                {field.type === 'number' && (
                    <input
                        type="number"
                        name={fieldName}
                        value={
                            parentKey
                                ? providerOptions[parentKey.split('.')[0]]?.[
                                      parentKey.split('.')[1]
                                  ]?.[key] || ''
                                : providerOptions[key] || ''
                        }
                        onChange={handleOptionChange}
                        placeholder={field.description}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        required={field.required}
                    />
                )}

                {field.type === 'enum' && field.options && (
                    <select
                        name={fieldName}
                        value={
                            parentKey
                                ? providerOptions[parentKey.split('.')[0]]?.[
                                      parentKey.split('.')[1]
                                  ]?.[key] || ''
                                : providerOptions[key] || ''
                        }
                        onChange={handleOptionChange}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        required={field.required}
                    >
                        <option value="">Select an option</option>
                        {field.options.map((option: string) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                )}

                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
            </div>
        );
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
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
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
                            {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Language Level</label>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGE_LEVELS.map((level) => (
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
                            {Object.keys(availableModels).map((provider) => (
                                <option key={provider} value={provider}>
                                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">AI Model</label>
                        {CUSTOM_MODEL_PROVIDERS.includes(settings.aiProvider) ? (
                            <input
                                type="text"
                                name="aiModel"
                                value={settings.aiModel}
                                onChange={handleChange}
                                placeholder="Enter model name (e.g., gpt-4, claude-3, etc.)"
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            />
                        ) : (
                            <select
                                name="aiModel"
                                value={settings.aiModel}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                            >
                                {settings.aiProvider &&
                                availableModels[settings.aiProvider]?.length > 0 ? (
                                    availableModels[settings.aiProvider].map((model) => (
                                        <option key={model} value={model}>
                                            {model}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">Please select a provider first</option>
                                )}
                            </select>
                        )}
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

                    {/* Provider specific configuration fields */}
                    {settings.aiProvider && Object.entries(providerFields).length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="font-medium mb-3">Provider Configuration</h3>

                            {Object.entries(providerFields).map(([key, field]) =>
                                renderConfigField(field, key),
                            )}
                        </div>
                    )}
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
