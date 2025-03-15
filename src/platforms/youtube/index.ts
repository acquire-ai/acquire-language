/**
 * YouTube 平台处理器
 */
import { PlatformHandler, SubtitleHandler } from '../../core/types/platform';
import { AIService } from '../../core/types/ai';
import { isYouTubeVideoUrl } from '../../core/utils';
import { YouTubeSubtitleHandler } from './subtitle-handler';

/**
 * YouTube 平台处理器
 */
export class YouTubePlatformHandler implements PlatformHandler {
  /**
   * 检查是否支持当前URL
   * @param url 当前URL
   * @returns 是否支持
   */
  isSupported(url: string): boolean {
    return isYouTubeVideoUrl(url);
  }
  
  /**
   * 初始化平台处理器
   */
  async initialize(): Promise<void> {
    console.log('初始化 YouTube 平台处理器');
    // 这里可以添加 YouTube 平台特定的初始化逻辑
  }
  
  /**
   * 创建字幕处理器
   * @param aiService AI服务
   * @returns 字幕处理器
   */
  createSubtitleHandler(aiService: AIService): SubtitleHandler {
    return new YouTubeSubtitleHandler(aiService);
  }
} 