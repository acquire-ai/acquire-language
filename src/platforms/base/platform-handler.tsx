/**
 * Platform Handler Base Class
 */
import {AIService} from '../../core/types/ai';
import {PlatformHandler, SubtitleHandler} from '../../core/types/platform';

/**
 * Abstract Platform Handler Base Class
 */
export abstract class BasePlatformHandler implements PlatformHandler {
    /**
     * Check if current URL is supported
     * @param url Current URL
     * @returns Whether the URL is supported
     */
    abstract isSupported(url: string): boolean;

    /**
     * Initialize platform handler
     */
    abstract initialize(): Promise<void>;

    /**
     * Create subtitle handler
     * @param aiService AI service
     * @returns Subtitle handler
     */
    abstract createSubtitleHandler(aiService: AIService): SubtitleHandler;
}
