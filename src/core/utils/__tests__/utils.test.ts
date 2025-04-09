import { describe, it, expect, vi, beforeEach } from 'vitest';
import { delay, isUrlMatch, isYouTubeVideoUrl, getLanguageName } from '../index';

describe('工具函数测试', () => {
  describe('delay', () => {
    it('应该在指定的时间后解析', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      const elapsed = end - start;
      
      // 允许一定的时间误差
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('isUrlMatch', () => {
    it('应该正确匹配URL', () => {
      const urls = [
        'https://www.youtube.com/watch?v=123456',
        'https://example.com/page',
        'https://test.org/something'
      ];
      
      const patterns = [
        'youtube\\.com/watch',
        'example\\.com/.*'
      ];
      
      expect(isUrlMatch(urls[0], patterns)).toBe(true);
      expect(isUrlMatch(urls[1], patterns)).toBe(true);
      expect(isUrlMatch(urls[2], patterns)).toBe(false);
    });
  });

  describe('isYouTubeVideoUrl', () => {
    it('应该正确识别YouTube视频URL', () => {
      expect(isYouTubeVideoUrl('https://www.youtube.com/watch?v=123456')).toBe(true);
      expect(isYouTubeVideoUrl('https://www.youtube.com/playlist?list=123')).toBe(false);
      expect(isYouTubeVideoUrl('https://www.example.com')).toBe(false);
    });
  });

  describe('getLanguageName', () => {
    it('应该返回正确的语言名称', () => {
      expect(getLanguageName('en-US')).toBe('英语');
      expect(getLanguageName('zh-CN')).toBe('中文');
      expect(getLanguageName('unknown-code')).toBe('unknown-code');
    });
  });
}); 