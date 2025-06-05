'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Subtitles,
    Palette,
    Type,
    AlignCenterIcon as AlignBottom,
    AlignCenterIcon as AlignTop,
} from 'lucide-react';
import { HexColorPicker } from './color-picker';
import {
    getSettings,
    saveSubtitleSettings,
    debounce,
    type SubtitleSettings as SubtitleSettingsType,
} from '@/core/config/settings';

export function SubtitleSettings() {
    const [showNativeSubtitles, setShowNativeSubtitles] = useState(true);
    const [showLearningSubtitles, setShowLearningSubtitles] = useState(true);
    const [fontSize, setFontSize] = useState(16);
    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
    const [textColor, setTextColor] = useState('#ffffff');
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [opacity, setOpacity] = useState(0.7); // 0-1 decimal
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // 创建防抖保存函数
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce((settings: SubtitleSettingsType) => {
            setIsSaving(true);
            saveSubtitleSettings(settings)
                .then(() => {
                    console.log('Subtitle settings saved automatically');
                })
                .catch((error) => {
                    console.error('Failed to save subtitle settings:', error);
                })
                .finally(() => {
                    setIsSaving(false);
                });
        }, 1000),
        [],
    );

    // 加载设置
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getSettings();
                setShowNativeSubtitles(settings.subtitle.showNativeSubtitles);
                setShowLearningSubtitles(settings.subtitle.showLearningSubtitles);
                setFontSize(settings.subtitle.fontSize);
                setPosition(settings.subtitle.position);
                setTextColor(settings.subtitle.textColor);
                setBackgroundColor(settings.subtitle.backgroundColor);
                setOpacity(settings.subtitle.opacity);
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to load subtitle settings:', error);
            }
        };

        loadSettings();
    }, []);

    // 当设置变更时自动保存
    useEffect(() => {
        // 确保组件已经挂载并加载了初始设置
        if (isInitialized) {
            const settings: SubtitleSettingsType = {
                showNativeSubtitles,
                showLearningSubtitles,
                fontSize,
                position,
                textColor,
                backgroundColor,
                opacity,
            };
            debouncedSave(settings);
        }
    }, [
        showNativeSubtitles,
        showLearningSubtitles,
        fontSize,
        position,
        textColor,
        backgroundColor,
        opacity,
        debouncedSave,
        isInitialized,
    ]);

    return (
        <Card className="border-2 border-primary/10 gradient-border card-glow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Subtitles className="h-5 w-5 text-primary" />
                    <span className="gradient-text">Subtitle Settings</span>
                </CardTitle>
                <CardDescription>Customize how subtitles appear in your videos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium gradient-text">Subtitle Display</h3>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="native-subtitles" className="flex items-center gap-2">
                            Show Native Language Subtitles
                        </Label>
                        <Switch
                            id="native-subtitles"
                            checked={showNativeSubtitles}
                            onCheckedChange={setShowNativeSubtitles}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="learning-subtitles" className="flex items-center gap-2">
                            Show Learning Language Subtitles
                        </Label>
                        <Switch
                            id="learning-subtitles"
                            checked={showLearningSubtitles}
                            onCheckedChange={setShowLearningSubtitles}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-primary" />
                        <h3 className="text-lg font-medium gradient-text">Subtitle Size</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="subtitle-size">Size: {fontSize}px</Label>
                        </div>
                        <Slider
                            id="subtitle-size"
                            min={12}
                            max={32}
                            step={1}
                            value={[fontSize]}
                            onValueChange={(value) => setFontSize(value[0])}
                            className="w-full"
                            color="primary"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <AlignBottom className="h-4 w-4 text-primary" />
                        <h3 className="text-lg font-medium gradient-text">Subtitle Position</h3>
                    </div>
                    <RadioGroup
                        value={position}
                        onValueChange={(value) => setPosition(value as 'top' | 'bottom')}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="top" id="position-top" />
                            <Label htmlFor="position-top" className="flex items-center gap-1">
                                <AlignTop className="h-4 w-4" /> Top
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bottom" id="position-bottom" />
                            <Label htmlFor="position-bottom" className="flex items-center gap-1">
                                <AlignBottom className="h-4 w-4" /> Bottom
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-medium gradient-text">Subtitle Color</h3>
                        </div>
                        <HexColorPicker color={textColor} onChange={setTextColor} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-medium gradient-text">Background Color</h3>
                        </div>
                        <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="bg-opacity">
                                    Opacity: {Math.round(opacity * 100)}%
                                </Label>
                            </div>
                            <Slider
                                id="bg-opacity"
                                min={0}
                                max={1}
                                step={0.01}
                                value={[opacity]}
                                onValueChange={(value) => setOpacity(value[0])}
                                className="w-full"
                                color="primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-lg border p-4 card-glow">
                    <h4 className="mb-2 font-medium gradient-text">Preview</h4>
                    <div className="relative h-16 w-full rounded-md bg-gray-800 flex items-center justify-center">
                        <div
                            className="px-4 py-2 rounded-md text-center"
                            style={{
                                color: textColor,
                                backgroundColor: `${backgroundColor}${Math.round(opacity * 255)
                                    .toString(16)
                                    .padStart(2, '0')}`,
                                fontSize: `${fontSize}px`,
                                maxWidth: '90%',
                                ...(position === 'top'
                                    ? { alignSelf: 'flex-start' }
                                    : { alignSelf: 'flex-end' }),
                            }}
                        >
                            {showLearningSubtitles && <div>Hello, how are you today?</div>}
                            {showNativeSubtitles && (
                                <div className="text-sm opacity-80">你好，今天怎么样？</div>
                            )}
                        </div>
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
