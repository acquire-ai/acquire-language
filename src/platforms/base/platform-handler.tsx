/**
 * Platform Handler Base Class
 */
import { AIService } from '@/core/types/ai.ts';
import { PlatformHandler, SubtitleHandler } from '@/core/types/platform.ts';

/**
 * Abstract Platform Handler Base Class
 */
export abstract class BasePlatformHandler implements PlatformHandler {
    abstract isSupported(url: string): boolean;

    abstract initialize(): Promise<void>;

    abstract createSubtitleHandler(aiService: AIService): SubtitleHandler;
}
