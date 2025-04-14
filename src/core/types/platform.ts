/**
 * interface of platform handler
 */
import {AIService} from "./ai";

export interface SubtitleHandler {
    subtitles: string[];

    initialize(): Promise<void>;

    destroy(): void;
}


export interface PlatformHandler {
    isSupported(url: string): boolean;

    initialize(): Promise<void>;

    createSubtitleHandler(aiService: AIService): SubtitleHandler;
}
