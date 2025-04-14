/**
 * 视频平台和字幕处理器接口定义
 */
import {AIService} from "./ai";

export interface SubtitleHandler {
    // 提供字幕数据的访问器
    subtitles: string[];

    initialize(): Promise<void>;

    destroy(): void;
}


export interface PlatformHandler {
    isSupported(url: string): boolean;

    initialize(): Promise<void>;

    createSubtitleHandler(aiService: AIService): SubtitleHandler;
}
