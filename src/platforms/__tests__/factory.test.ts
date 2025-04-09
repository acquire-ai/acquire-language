import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPlatformHandler } from '../factory';
import { YouTubePlatformHandler } from '../youtube';

// 模拟 isYouTubeVideoUrl 函数
vi.mock('@/core/utils', () => ({
  isYouTubeVideoUrl: (url: string) => url.includes('youtube.com/watch')
}));

// 模拟 YouTubePlatformHandler
vi.mock('../youtube', () => ({
  YouTubePlatformHandler: vi.fn().mockImplementation(() => {
    return { platform: 'youtube' };
  })
}));

describe('平台工厂测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该为YouTube URL创建YouTubePlatformHandler', () => {
    const handler = createPlatformHandler('https://www.youtube.com/watch?v=123456');
    
    expect(YouTubePlatformHandler).toHaveBeenCalled();
    expect(handler).toEqual({ platform: 'youtube' });
  });

  it('应该为非支持的URL返回null', () => {
    const handler = createPlatformHandler('https://www.example.com');
    
    expect(YouTubePlatformHandler).not.toHaveBeenCalled();
    expect(handler).toBeNull();
  });
}); 