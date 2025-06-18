import { useState, useEffect } from 'react';
import { getSettings, watchSettings, DEFAULT_SETTINGS } from '@/core/config/settings';

export function useGlobalTheme() {
    const [theme, setTheme] = useState<string>(DEFAULT_SETTINGS.theme);

    // 加载主题设置
    useEffect(() => {
        const loadTheme = async () => {
            const settings = await getSettings();
            setTheme(settings.theme);
        };

        loadTheme();
    }, []);

    // 监听设置变化
    useEffect(() => {
        const handleSettingsChange = (settings: any) => {
            if (settings.theme) {
                setTheme(settings.theme);
            }
        };

        watchSettings(handleSettingsChange);
    }, [theme]);

    return {
        theme,
    };
}
