/**
 * 平台工厂
 */
import {PlatformHandler} from '@/core/types/platform';
import {isYouTubeVideoUrl} from '@/core/utils';
import {YouTubePlatformHandler} from './youtube';

/**
 * 创建平台处理器
 * @param url 当前URL
 * @returns 平台处理器实例或null
 */
export function createPlatformHandler(url: string): PlatformHandler | null {
    if (isYouTubeVideoUrl(url)) {
        return new YouTubePlatformHandler();
    }

    // 未来可以添加更多平台的支持
    // if (isUdemyUrl(url)) {
    //   return new UdemyPlatformHandler();
    // }

    return null;
} 