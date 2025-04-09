import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageManager, DEFAULT_SETTINGS } from '../index';
import { Settings, VocabularyData } from '../../types/storage';

// 模拟 browser.storage.local API
const mockStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn()
  }
};

// 全局模拟 browser API
global.browser = {
  storage: mockStorage
} as any;

describe('存储管理测试', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('get 方法', () => {
    it('应该返回存储中的数据', async () => {
      mockStorage.local.get.mockResolvedValue({ testKey: 'testValue' });
      
      const result = await StorageManager.get('testKey');
      
      expect(mockStorage.local.get).toHaveBeenCalledWith('testKey');
      expect(result).toBe('testValue');
    });

    it('当数据不存在时应该返回 null', async () => {
      mockStorage.local.get.mockResolvedValue({});
      
      const result = await StorageManager.get('testKey');
      
      expect(mockStorage.local.get).toHaveBeenCalledWith('testKey');
      expect(result).toBeNull();
    });
  });

  describe('set 方法', () => {
    it('应该正确设置存储数据', async () => {
      await StorageManager.set('testKey', 'testValue');
      
      expect(mockStorage.local.set).toHaveBeenCalledWith({ testKey: 'testValue' });
    });
  });

  describe('getSettings 方法', () => {
    it('应该返回存储的设置', async () => {
      const mockSettings: Settings = {
        ...DEFAULT_SETTINGS,
        nativeLanguage: 'ja-JP',
      };
      
      mockStorage.local.get.mockResolvedValue({ settings: mockSettings });
      
      const result = await StorageManager.getSettings();
      
      expect(mockStorage.local.get).toHaveBeenCalledWith('settings');
      expect(result).toEqual(mockSettings);
    });

    it('当设置不存在时应该返回默认设置', async () => {
      mockStorage.local.get.mockResolvedValue({});
      
      const result = await StorageManager.getSettings();
      
      expect(mockStorage.local.get).toHaveBeenCalledWith('settings');
      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings 方法', () => {
    it('应该正确保存设置', async () => {
      const settings: Settings = {
        ...DEFAULT_SETTINGS,
        targetLanguage: 'fr-FR',
      };
      
      await StorageManager.saveSettings(settings);
      
      expect(mockStorage.local.set).toHaveBeenCalledWith({ settings });
    });
  });

  describe('getVocabulary 方法', () => {
    it('应该返回存储的生词本', async () => {
      const mockVocabulary: VocabularyData = {
        'test': {
          word: 'test',
          contexts: ['This is a test'],
          createdAt: '2023-01-01'
        }
      };
      
      mockStorage.local.get.mockResolvedValue({ vocabulary: mockVocabulary });
      
      const result = await StorageManager.getVocabulary();
      
      expect(mockStorage.local.get).toHaveBeenCalledWith('vocabulary');
      expect(result).toEqual(mockVocabulary);
    });

    it('当生词本不存在时应该返回空对象', async () => {
      mockStorage.local.get.mockResolvedValue({});
      
      const result = await StorageManager.getVocabulary();
      
      expect(mockStorage.local.get).toHaveBeenCalledWith('vocabulary');
      expect(result).toEqual({});
    });
  });

  describe('saveVocabulary 方法', () => {
    it('应该正确保存生词本', async () => {
      const vocabulary: VocabularyData = {
        'example': {
          word: 'example',
          contexts: ['This is an example'],
          createdAt: '2023-01-01'
        }
      };
      
      await StorageManager.saveVocabulary(vocabulary);
      
      expect(mockStorage.local.set).toHaveBeenCalledWith({ vocabulary });
    });
  });
}); 