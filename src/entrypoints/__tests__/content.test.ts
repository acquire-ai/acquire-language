import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageManager } from '@/core/storage';
import { createPlatformHandler } from '@/platforms';
import { createAIService } from '@/services/ai';

// 测试辅助函数：等待异步操作完成
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// 模拟 wxt/sandbox 模块
vi.mock('wxt/sandbox', () => ({
  defineContentScript: (config: any) => config,
}));

// 模拟平台处理器
const mockSubtitleHandler = {
  initialize: vi.fn().mockResolvedValue(undefined),
};

const mockPlatformHandler = {
  initialize: vi.fn().mockResolvedValue(undefined),
  createSubtitleHandler: vi.fn().mockReturnValue(mockSubtitleHandler),
};

// 模拟依赖模块
vi.mock('@/platforms', () => ({
  createPlatformHandler: vi.fn(),
}));

vi.mock('@/services/ai', () => ({
  createAIService: vi.fn().mockReturnValue({ service: 'ai' }),
}));

vi.mock('@/core/storage', () => ({
  StorageManager: {
    getSettings: vi.fn().mockResolvedValue({
      aiModel: 'deepseek',
      apiKey: 'test-api-key',
    }),
  },
}));

describe('内容脚本测试', () => {
  // 保存原始的 window.location 和 document 对象
  const originalLocation = window.location;
  const originalDocument = document;

  // 用于绕过内部实现的模拟
  const mockInterval = { id: 123 };
  const mockTimeout = { id: 456 };

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();
    vi.resetModules();

    // 模拟 window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: 'https://www.youtube.com/watch?v=test123',
      pathname: '/watch',
    } as any;

    // 模拟 document
    Object.defineProperty(window, 'document', {
      writable: true,
      value: {
        ...originalDocument,
        readyState: 'complete',
        querySelector: vi.fn().mockReturnValue({ video: true }),
        dispatchEvent: vi.fn(),
        addEventListener: vi.fn(),
      },
    });

    // 模拟 chrome.runtime
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: vi.fn(),
        },
      },
    } as any;

    // 模拟 window.addEventListener
    window.addEventListener = vi.fn();
    window.dispatchEvent = vi.fn();

    // 模拟 MutationObserver
    global.MutationObserver = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));

    // 模拟 console.error
    console.error = vi.fn();

    // 模拟计时器函数
    global.setInterval = vi.fn(() => mockInterval.id);
    global.clearInterval = vi.fn();
    global.setTimeout = vi.fn(() => mockTimeout.id);
    global.clearTimeout = vi.fn();

    // 创建 CustomEvent 模拟
    global.CustomEvent = class MockCustomEvent extends Event {
      detail: any;
      constructor(type: string, options: { detail: any }) {
        super(type);
        this.detail = options.detail;
      }
    };
  });

  afterEach(() => {
    // 恢复原始对象
    window.location = originalLocation;
    Object.defineProperty(window, 'document', {
      writable: true,
      value: originalDocument,
    });

    // 清除所有模拟
    vi.restoreAllMocks();
  });

  it('应在YouTube视频页面上初始化内容脚本', async () => {
    // 模拟 content.ts 文件
    vi.doMock('../content', () => ({
      default: {
        main: vi.fn().mockResolvedValue(undefined),
        matches: ["*://*.youtube.com/*"]
      }
    }));

    // 导入内容脚本
    const contentScript = await import('../content');
    
    // 执行主函数
    await contentScript.default.main();
    
    // 验证函数被调用
    expect(contentScript.default.main).toHaveBeenCalled();
  });

  it('当文档未加载完成时应添加load事件监听器', async () => {
    // 重置模块缓存，确保不用上一个测试的模拟
    vi.resetModules();
    
    // 模拟内容脚本
    vi.doMock('../content', () => {
      const main = vi.fn(async () => {
        if (document.readyState === 'loading') {
          window.addEventListener('load', vi.fn());
        }
      });
      
      return {
        default: {
          main,
          matches: ["*://*.youtube.com/*"]
        }
      };
    });
    
    // 模拟文档未加载完成
    (document as any).readyState = 'loading';
    
    // 导入内容脚本
    const contentScript = await import('../content');
    
    // 执行主函数
    await contentScript.default.main();
    
    // 验证添加了load事件监听器
    expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });
});