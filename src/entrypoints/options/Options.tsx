import {useEffect, useState} from 'react';

// 语言水平选项
const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// 语言选项
const LANGUAGES = [
    {code: 'zh-CN', name: '中文 (简体)'},
    {code: 'en', name: 'English'},
    {code: 'ja', name: '日本語'},
    {code: 'ko', name: '한국어'},
    {code: 'fr', name: 'Français'},
    {code: 'de', name: 'Deutsch'},
    {code: 'es', name: 'Español'},
    {code: 'ru', name: 'Русский'},
];

// 设置接口
interface Settings {
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

// 默认设置
const DEFAULT_SETTINGS: Settings = {
    nativeLanguage: 'zh-CN',
    targetLanguage: 'en',
    languageLevel: 'B1',
    aiModel: 'deepseek',
    apiKey: '',
    subtitleSettings: {
        fontSize: 16,
        position: 'bottom',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        opacity: 0.8,
    },
};

function Options() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // 加载设置
    useEffect(() => {
        const loadSettings = async () => {
            const result = await browser.storage.local.get('settings');
            if (result.settings) {
                setSettings(result.settings);
            }
        };

        loadSettings();
    }, []);

    // 保存设置
    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await browser.storage.local.set({settings});
            setSaveMessage('设置已保存');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage(`保存失败: ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    // 处理输入变化
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setSettings(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof Settings],
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

    // 处理范围输入变化
    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        const [parent, child] = name.split('.');

        setSettings(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent as keyof Settings],
                [child]: parseFloat(value),
            },
        }));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">习得语言 - 设置</h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">语言设置</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">母语</label>
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
                        <label className="block text-sm font-medium mb-1">目标语言</label>
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
                        <label className="block text-sm font-medium mb-1">语言水平</label>
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
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">AI 设置</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">AI 模型</label>
                        <select
                            name="aiModel"
                            value={settings.aiModel}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                            <option value="deepseek">DeepSeek</option>
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <input
                            type="password"
                            name="apiKey"
                            value={settings.apiKey}
                            onChange={handleChange}
                            placeholder="输入您的 API Key"
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">字幕设置</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            字体大小: {settings.subtitleSettings.fontSize}px
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
                        <label className="block text-sm font-medium mb-1">位置</label>
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
                                <span>顶部</span>
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
                                <span>底部</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">背景颜色</label>
                        <input
                            type="color"
                            name="subtitleSettings.backgroundColor"
                            value={settings.subtitleSettings.backgroundColor}
                            onChange={handleChange}
                            className="p-1 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">文字颜色</label>
                        <input
                            type="color"
                            name="subtitleSettings.textColor"
                            value={settings.subtitleSettings.textColor}
                            onChange={handleChange}
                            className="p-1 border rounded"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            背景透明度: {Math.round(settings.subtitleSettings.opacity * 100)}%
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

                <div className="flex justify-center">
                    <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
                    >
                        {isSaving ? '保存中...' : '保存设置'}
                    </button>
                </div>

                {saveMessage && (
                    <div className="mt-4 text-center text-green-600 dark:text-green-400">
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Options; 