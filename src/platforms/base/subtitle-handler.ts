/**
 * 字幕处理器基类
 */
import { AIService } from "@/core/types/ai.ts";
import { SubtitleHandler } from "@/core/types/platform.ts";
import { WordPopup } from "@/components/word-popup";

/**
 * 抽象字幕处理器基类
 */
export abstract class BaseSubtitleHandler implements SubtitleHandler {
  /**
   * 字幕容器元素
   */
  protected container: HTMLElement | null = null;

  /**
   * 当前字幕文本（私有实现）
   */
  protected _currentSubtitle: string = "";

  /**
   * 当前字幕文本（只读属性）
   */
  get currentSubtitle(): string {
    return this._currentSubtitle;
  }

  /**
   * AI服务
   */
  protected aiService: AIService;

  /**
   * 单词弹出组件
   */
  protected wordPopup: WordPopup;

  /**
   * 设置
   */
  protected settings: any = null;

  /**
   * 构造函数
   * @param aiService AI服务
   */
  constructor(aiService: AIService) {
    this.aiService = aiService;
    this.wordPopup = new WordPopup();
  }

  /**
   * 初始化字幕处理器
   */
  abstract initialize(): Promise<void>;

  /**
   * 更新字幕
   * 从视频平台获取最新字幕并更新显示
   */
  abstract updateSubtitle(): void;

  /**
   * 获取当前字幕文本
   * @returns 当前字幕文本
   */
  getCurrentSubtitle(): string {
    return this._currentSubtitle;
  }

  /**
   * 处理字幕文本
   * @param text 原始字幕文本
   * @returns 处理后的字幕文本
   */
  abstract processSubtitle(text: string): string;

  /**
   * 添加单词点击事件
   */
  abstract addWordClickEvents(): void;

  /**
   * 加载设置
   */
  protected async loadSettings() {
    try {
      const result = await browser.storage.local.get("settings");
      this.settings = result.settings || {
        nativeLanguage: "zh-CN",
        targetLanguage: "en-US",
        languageLevel: "B1",
        aiModel: "deepseek",
        apiKey: "",
        subtitleSettings: {
          fontSize: 16,
          position: "bottom",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          textColor: "#ffffff",
          opacity: 0.9,
        },
      };

      console.log("已加载设置:", this.settings);
    } catch (error) {
      console.error("加载设置失败:", error);
    }
  }

  /**
   * 销毁字幕处理器
   */
  destroy(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    // 销毁单词弹出组件
    this.wordPopup.destroy();
  }
}
