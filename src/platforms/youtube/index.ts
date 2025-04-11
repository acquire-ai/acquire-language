/**
 * YouTube Platform Handler
 */
import {SubtitleHandler} from '@/core/types/platform.ts';
import {AIService} from '@/core/types/ai.ts';
import {isYouTubeVideoUrl} from '@/core/utils';
import {BasePlatformHandler} from '../base/platform-handler';
import {YouTubeSubtitleHandler} from './subtitle-handler';

/**
 * YouTube Platform Handler
 */
export class YouTubePlatformHandler extends BasePlatformHandler {
    /**
     * Check if current URL is supported
     * @param url Current URL
     * @returns Whether the URL is supported
     */
    isSupported(url: string): boolean {
        return isYouTubeVideoUrl(url);
    }

    /**
     * Initialize platform handler
     */
    async initialize(): Promise<void> {
        console.log('Initializing YouTube platform handler');
    }

    /**
     * Create subtitle handler
     * @param aiService AI service
     * @returns Subtitle handler
     */
    createSubtitleHandler(aiService: AIService): SubtitleHandler {
        return new YouTubeSubtitleHandler(aiService);
    }
} 