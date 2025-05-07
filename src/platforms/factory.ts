/**
 * Platform factory
 */
import { PlatformHandler } from '@/core/types/platform';
import { isYouTubeVideoUrl } from '@/core/utils';
import { YouTubePlatformHandler } from './youtube';

/**
 * Create platform handler
 * @param url Current URL
 * @returns Platform handler instance or null
 */
export function createPlatformHandler(url: string): PlatformHandler | null {
    if (isYouTubeVideoUrl(url)) {
        return new YouTubePlatformHandler();
    }

    // Future support for more platforms
    return null;
}
