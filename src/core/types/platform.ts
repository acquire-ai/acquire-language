/**
 * 视频平台和字幕处理器接口定义
 */
import {AIService} from "./ai";

/**
 * 字幕处理器接口
 */
export interface SubtitleHandler {
    readonly currentSubtitle: string;

    initialize(): Promise<void>;

    getCurrentSubtitle(): string;
    
    updateSubtitle(): void;

    processSubtitle(text: string): string;

    addWordClickEvents(): void;

    destroy(): void;
}


export interface PlatformHandler {
    isSupported(url: string): boolean;

    initialize(): Promise<void>;

    createSubtitleHandler(aiService: AIService): SubtitleHandler;
}
