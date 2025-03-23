import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeepSeekAIService } from '../deepseek';
import { AIServiceConfig } from '../../../core/types/ai';

// 模拟 fetch
global.fetch = vi.fn();

// 模拟 browser.storage.local
const mockStorage = {
  get: vi.fn(),
};

global.browser = {
  storage: {
    local: mockStorage,
  },
} as any;

describe('DeepSeek AI 服务测试', () => {
  const apiKey = 'test-api-key';
  const config: AIServiceConfig = { apiKey };
  let service: DeepSeekAIService;

  beforeEach(() => {
    service = new DeepSeekAIService(config);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getWordDefinition', () => {
    it('应该正确调用 API 获取单词释义', async () => {
      // 模拟存储返回
      mockStorage.get.mockResolvedValue({
        settings: { nativeLanguage: 'zh-CN' }
      });

      // 模拟 API 响应
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '测试单词释义' } }]
        })
      });

      const result = await service.getWordDefinition('test', 'test context', 'en-US');

      // 验证存储调用
      expect(mockStorage.get).toHaveBeenCalledWith('settings');

      // 验证 fetch 调用
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('https://api.deepseek.com/v1/chat/completions', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${apiKey}`
        }),
        body: expect.any(String)
      }));

      // 验证请求体包含正确的提示
      const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain('test');
      expect(requestBody.messages[0].content).toContain('test context');

      // 验证结果
      expect(result).toBe('测试单词释义');
    });

    it('当未设置 API 密钥时应该抛出错误', async () => {
      // 创建一个没有 API 密钥的服务实例
      const serviceWithoutKey = new DeepSeekAIService({ apiKey: '' });
      
      // 模拟存储返回
      mockStorage.get.mockResolvedValue({
        settings: { nativeLanguage: 'zh-CN' }
      });

      await expect(serviceWithoutKey.getWordDefinition('test', 'context', 'en-US'))
        .resolves.toContain('获取 "test" 的释义失败');
    });
  });

  describe('translateText', () => {
    it('应该正确调用 API 翻译文本', async () => {
      // 模拟 API 响应
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '测试翻译结果' } }]
        })
      });

      const result = await service.translateText('test text', 'en-US', 'zh-CN');

      // 验证 fetch 调用
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('https://api.deepseek.com/v1/chat/completions', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${apiKey}`
        }),
        body: expect.any(String)
      }));

      // 验证请求体包含正确的提示
      const requestBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain('test text');
      expect(requestBody.messages[0].content).toContain('英语');
      expect(requestBody.messages[0].content).toContain('中文');

      // 验证结果
      expect(result).toBe('测试翻译结果');
    });

    it('当 API 请求失败时应该返回错误信息', async () => {
      // 模拟 API 错误响应
      (global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({
          error: { message: 'API 错误' }
        })
      });

      const result = await service.translateText('test text', 'en-US', 'zh-CN');
      
      expect(result).toContain('翻译失败');
    });
  });
}); 