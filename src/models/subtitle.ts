import { createStore, createEvent, createEffect, combine, sample } from 'effector';
import { SubtitleData } from '@/core/types/subtitle';
import { SubtitleController } from '@/core/subtitle/subtitle-controller';

// 字幕项接口
export interface SubtitleItem {
    start: number; // 开始时间（毫秒）
    end: number; // 结束时间（毫秒）
    text: string; // 字幕文本
}

// 字幕设置接口
export interface SubtitleSettings {
    fontSize: number;
    position: 'top' | 'bottom';
    backgroundColor: string;
    textColor: string;
    opacity: number;
}

// 创建事件
export const subtitleDataReceived = createEvent<SubtitleItem[]>();
export const subtitleProcessed = createEvent<string>();
export const currentTimeChanged = createEvent<number>();
export const subtitleToggled = createEvent<boolean>();
export const subtitleSettingsChanged = createEvent<Partial<SubtitleSettings>>();
export const subtitleControllerChanged = createEvent<SubtitleController | null>();
export const setSubtitle = createEvent<string>();
export const setCurrentSubtitle = createEvent<SubtitleData | null>();
export const setSubtitleEnabled = createEvent<boolean>();

// 导出辅助函数
export const setCurrent = setCurrentSubtitle;
export const toggleEnabled = setSubtitleEnabled;

// 获取状态函数
export const getSubtitleState = () => $subtitleState.getState();
export const getSubtitleSettings = () => $subtitleSettings.getState();

// 创建Effect
export const parseSubtitleFx = createEffect<string, SubtitleItem[]>(
    async (response) => {
        try {
            // 解析逻辑会在平台特定的解析器中实现
            // 这里只返回空数组作为默认值
            return [];
        } catch (error) {
            console.error('Failed to parse subtitle:', error);
            return [];
        }
    }
);

export const findCurrentSubtitleFx = createEffect<{time: number, subtitles: SubtitleItem[]}, SubtitleItem | null>(
    ({time, subtitles}) => {
        if (!subtitles.length) return null;
        
        // 二分查找算法找到当前时间对应的字幕
        let low = 0;
        let high = subtitles.length - 1;
        
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const subtitle = subtitles[mid];
            
            if (time < subtitle.start) {
                // 提前200ms显示
                if (subtitle.start - time < 200) {
                    return subtitle;
                }
                high = mid - 1;
            } else if (time > subtitle.end) {
                low = mid + 1;
            } else {
                // 找到匹配的字幕
                return subtitle;
            }
        }
        
        return null;
    }
);

// 创建Store
export const $subtitleData = createStore<SubtitleItem[]>([])
    .on(subtitleDataReceived, (_, data) => data);

export const $currentTime = createStore<number>(0)
    .on(currentTimeChanged, (_, time) => time);

export const $subtitleEnabled = createStore<boolean>(false)
    .on(subtitleToggled, (_, enabled) => enabled)
    .on(setSubtitleEnabled, (_, enabled) => enabled);

export const $subtitleSettings = createStore<SubtitleSettings>({
    fontSize: 16,
    position: 'bottom',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: '#ffffff',
    opacity: 0.9,
}).on(subtitleSettingsChanged, (state, changes) => ({
    ...state,
    ...changes
}));

export const $currentSubtitle = createStore<SubtitleItem | null>(null)
    .on(setCurrentSubtitle, (_, subtitle) => subtitle as unknown as SubtitleItem | null);

export const $processedSubtitleText = createStore<string>('')
    .on(subtitleProcessed, (_, text) => text);

export const $subtitleText = createStore<string>('')
    .on(setSubtitle, (_, text) => text);

// 创建组合状态
export const $subtitleState = combine({
    data: $subtitleData,
    current: $currentSubtitle,
    enabled: $subtitleEnabled,
    settings: $subtitleSettings,
    processedText: $processedSubtitleText,
});

// 根据当前时间更新当前字幕
sample({
    source: combine({
        time: $currentTime,
        subtitles: $subtitleData,
        enabled: $subtitleEnabled
    }),
    filter: ({enabled}) => enabled,
    fn: ({time, subtitles}) => ({time, subtitles}),
    target: findCurrentSubtitleFx
});

// 保存查找结果到当前字幕
sample({
    source: findCurrentSubtitleFx.doneData,
    target: $currentSubtitle
}); 