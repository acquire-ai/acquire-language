/**
 * 视频平台和字幕处理器接口定义
 */
import { AIService } from './ai';

/**
 * 字幕处理器接口
 */
export interface SubtitleHandler {
  /**
   * 初始化字幕处理器
   */
  initialize(): Promise<void>;
  
  /**
   * 处理字幕文本
   * @param text 原始字幕文本
   * @returns 处理后的字幕文本
   */
  processSubtitle(text: string): string;
  
  /**
   * 添加单词点击事件
   */
  addWordClickEvents(): void;
  
  /**
   * 销毁字幕处理器
   */
  destroy(): void;
}

/**
 * 视频平台处理器接口
 */
export interface PlatformHandler {
  /**
   * 检查是否支持当前URL
   * @param url 当前URL
   * @returns 是否支持
   */
  isSupported(url: string): boolean;
  
  /**
   * 初始化平台处理器
   */
  initialize(): Promise<void>;
  
  /**
   * 创建字幕处理器
   * @param aiService AI服务
   * @returns 字幕处理器
   */
  createSubtitleHandler(aiService: AIService): SubtitleHandler;
} 