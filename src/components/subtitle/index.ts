/**
 * 字幕组件模块
 * 
 * 这个模块提供了可复用的字幕组件，用于显示和处理不同平台的字幕。
 */

// 直接导出所有组件
export { SubtitleDisplay } from './SubtitleDisplay';
export { WordProcessor } from './WordProcessor';
export { SubtitleController, type SubtitleParser } from './SubtitleController';
export { YouTubeSubtitleParser } from './YouTubeSubtitleParser';

// YouTubeSubtitleParser类的别名声明（解决直接访问问题）
import { YouTubeSubtitleParser as YoutubeParser } from './YouTubeSubtitleParser';
import { SubtitleController as Controller } from './SubtitleController';

/**
 * 创建YouTube字幕控制器
 * 这个方法使用内部导入的YouTubeSubtitleParser，避免外部引用问题
 */
export function createYouTubeSubtitleController(): Controller {
  // 使用上面导入的别名
  const parser = new YoutubeParser();
  return new Controller(parser);
} 