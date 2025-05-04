import { describe, it, expect, vi, beforeEach } from 'vitest';
import { delay, isUrlMatch, isYouTubeVideoUrl, getLanguageName } from '../index';

describe('Utility Functions Tests', () => {
  describe('delay', () => {
    it('should resolve after the specified time', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      const elapsed = end - start;
      
      // Allow a small time error margin
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('isUrlMatch', () => {
    it('should correctly match URLs', () => {
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
    it('should correctly identify YouTube video URLs', () => {
      expect(isYouTubeVideoUrl('https://www.youtube.com/watch?v=123456')).toBe(true);
      expect(isYouTubeVideoUrl('https://www.youtube.com/playlist?list=123')).toBe(false);
      expect(isYouTubeVideoUrl('https://www.example.com')).toBe(false);
    });
  });

  describe('getLanguageName', () => {
    it('should return the correct language name', () => {
      // The actual implementation returns Chinese names for languages
      expect(getLanguageName('en-US')).toBe('英语');
      expect(getLanguageName('zh-CN')).toBe('中文');
      expect(getLanguageName('unknown-code')).toBe('unknown-code');
    });
  });
}); 