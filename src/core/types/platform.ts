/**
 * 视频平台和字幕处理器接口定义
 */
import {AIService} from "./ai";

export interface SubtitleHandler {
    readonly currSubtitles: string;

    initialize(): Promise<void>;

    updateSubtitle(texts: string[]): void;

    destroy(): void;
}


export interface PlatformHandler {
    isSupported(url: string): boolean;

    initialize(): Promise<void>;

    createSubtitleHandler(aiService: AIService): SubtitleHandler;
}
