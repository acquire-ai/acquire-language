import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YouTubePlatformHandler } from '../index';
import { YouTubeSubtitleHandler } from '../subtitle-handler';
import { AIService } from '@/core/types/ai';

// 模拟依赖
vi.mock('../subtitle-handler', () => ({
  YouTubeSubtitleHandler: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('YouTube平台处理器测试', () => {
  let platformHandler: YouTubePlatformHandler;
  let mockConsole: any;

  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks();
    
    // 创建处理器实例
    platformHandler = new YouTubePlatformHandler();
    
    // 模拟控制台
    mockConsole = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('URL支持检查', () => {
    it('应该支持YouTube视频URL', () => {
      expect(platformHandler.isSupported('https://www.youtube.com/watch?v=test123')).toBe(true);
    });

    it('不应该支持非YouTube视频URL', () => {
      expect(platformHandler.isSupported('https://www.youtube.com/playlist?list=123')).toBe(false);
      expect(platformHandler.isSupported('https://www.example.com')).toBe(false);
    });
  });

  describe('初始化', () => {
    it('应该正确初始化平台处理器', async () => {
      await platformHandler.initialize();
      
      // 验证日志记录
      expect(mockConsole).toHaveBeenCalledWith('初始化 YouTube 平台处理器');
    });
  });

  describe('字幕处理器创建', () => {
    it('应该创建YouTube字幕处理器', () => {
      // 创建模拟AI服务
      const mockAIService: AIService = {
        getWordDefinition: vi.fn().mockResolvedValue('单词释义'),
        translateText: vi.fn().mockResolvedValue('翻译结果')
      };
      
      // 创建字幕处理器
      const subtitleHandler = platformHandler.createSubtitleHandler(mockAIService);
      
      // 验证处理器创建
      expect(YouTubeSubtitleHandler).toHaveBeenCalledWith(mockAIService);
      expect(subtitleHandler).toBeDefined();
    });
  });
});