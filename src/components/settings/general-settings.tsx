'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Globe, Languages, GraduationCap } from 'lucide-react';
import {
    getSettings,
    saveGeneralSettings,
    debounce,
    type GeneralSettings as GeneralSettingsType,
} from '@/core/config/settings';

const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh-cn', label: '中文（简体）' },
    { value: 'zh-tw', label: '中文（繁體）' },
    { value: 'ru', label: 'Русский' },
    { value: 'pt', label: 'Português' },
    { value: 'ar', label: 'العربية' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'tr', label: 'Türkçe' },
];

const languageLevelOptions = [
    { value: 'a1', label: 'A1 - Beginner' },
    { value: 'a2', label: 'A2 - Elementary' },
    { value: 'b1', label: 'B1 - Intermediate' },
    { value: 'b2', label: 'B2 - Upper Intermediate' },
    { value: 'c1', label: 'C1 - Advanced' },
    { value: 'c2', label: 'C2 - Proficient' },
];

export function GeneralSettings() {
    const [appLanguage, setAppLanguage] = useState('en');
    const [nativeLanguage, setNativeLanguage] = useState('en');
    const [learnLanguage, setLearnLanguage] = useState('es');
    const [languageLevel, setLanguageLevel] = useState('a1');
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    console.log('🔄 GeneralSettings 组件重新渲染:', {
        appLanguage,
        nativeLanguage,
        learnLanguage,
        languageLevel,
        isInitialized,
        timestamp: new Date().toISOString(),
    });

    // 创建防抖保存函数
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce((settings: GeneralSettingsType) => {
            console.log('💾 开始保存 General Settings:', settings);
            setIsSaving(true);
            saveGeneralSettings(settings)
                .then(() => {
                    console.log('✅ General Settings 保存成功:', settings);
                })
                .catch((error) => {
                    console.error('❌ General Settings 保存失败:', error);
                })
                .finally(() => {
                    setIsSaving(false);
                });
        }, 1000),
        [],
    );

    // 加载设置
    useEffect(() => {
        console.log('🚀 开始加载 General Settings');
        const loadSettings = async () => {
            try {
                const settings = await getSettings();
                console.log('📥 从存储加载的设置:', settings.general);

                setAppLanguage(settings.general.appLanguage);
                setNativeLanguage(settings.general.nativeLanguage);
                setLearnLanguage(settings.general.learnLanguage);
                setLanguageLevel(settings.general.languageLevel || 'a1');

                console.log('🔧 设置状态已更新，即将标记为已初始化');
                setIsInitialized(true);
                console.log('✅ General Settings 初始化完成');
            } catch (error) {
                console.error('❌ 加载 General Settings 失败:', error);
                setIsInitialized(true);
            }
        };

        loadSettings();
    }, []);

    // 当设置变更时自动保存
    useEffect(() => {
        console.log('🔍 自动保存检查:', {
            isInitialized,
            appLanguage,
            nativeLanguage,
            learnLanguage,
            languageLevel,
        });

        // 确保组件已经挂载并加载了初始设置
        if (isInitialized) {
            const settings: GeneralSettingsType = {
                appLanguage,
                nativeLanguage,
                learnLanguage,
                languageLevel,
            };
            console.log('🎯 触发自动保存:', settings);
            debouncedSave(settings);
        } else {
            console.log('⏳ 跳过自动保存 - 尚未初始化');
        }
    }, [appLanguage, nativeLanguage, learnLanguage, languageLevel, debouncedSave, isInitialized]);

    // 处理设置变更
    const handleAppLanguageChange = (value: string) => {
        setAppLanguage(value);
    };

    const handleNativeLanguageChange = (value: string) => {
        setNativeLanguage(value);
    };

    const handleLearnLanguageChange = (value: string) => {
        setLearnLanguage(value);
    };

    const handleLanguageLevelChange = (value: string) => {
        setLanguageLevel(value);
    };

    return (
        <Card className="border-2 border-primary/10 gradient-border card-glow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <span className="gradient-text">General Settings</span>
                </CardTitle>
                <CardDescription>
                    Configure the general settings for your language learning experience
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="app-language">App Language</Label>
                    <Select value={appLanguage} onValueChange={handleAppLanguageChange}>
                        <SelectTrigger id="app-language" className="w-full relative z-10">
                            <SelectValue placeholder="Select app language" />
                        </SelectTrigger>
                        <SelectContent className="z-[999]">
                            {languageOptions.map((language) => (
                                <SelectItem key={language.value} value={language.value}>
                                    {language.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="native-language" className="flex items-center gap-2">
                            <Languages className="h-4 w-4 text-primary" />
                            Native Language
                        </Label>
                        <Select value={nativeLanguage} onValueChange={handleNativeLanguageChange}>
                            <SelectTrigger id="native-language" className="relative z-10">
                                <SelectValue placeholder="Select native language" />
                            </SelectTrigger>
                            <SelectContent className="z-[999]">
                                {languageOptions.map((language) => (
                                    <SelectItem key={language.value} value={language.value}>
                                        {language.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="learn-language" className="flex items-center gap-2">
                            <Languages className="h-4 w-4 text-primary" />
                            Learning Language
                        </Label>
                        <Select value={learnLanguage} onValueChange={handleLearnLanguageChange}>
                            <SelectTrigger id="learn-language" className="relative z-10">
                                <SelectValue placeholder="Select language to learn" />
                            </SelectTrigger>
                            <SelectContent className="z-[999]">
                                {languageOptions.map((language) => (
                                    <SelectItem key={language.value} value={language.value}>
                                        {language.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <h3 className="text-lg font-medium gradient-text">Language Proficiency</h3>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="language-level" className="flex items-center gap-2">
                            Current Level
                        </Label>
                        <Select value={languageLevel} onValueChange={handleLanguageLevelChange}>
                            <SelectTrigger id="language-level" className="relative z-10">
                                <SelectValue placeholder="Select your current level" />
                            </SelectTrigger>
                            <SelectContent className="z-[999]">
                                {languageLevelOptions.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                        {level.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Select your current proficiency level in the language you are learning
                        </p>
                    </div>
                </div>

                {isSaving && (
                    <div className="text-xs text-muted-foreground text-right animate-pulse">
                        Saving changes...
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
