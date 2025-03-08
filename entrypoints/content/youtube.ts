// YouTube 字幕处理器
import { AIService, createAIService } from '../services/ai';

export class YouTubeSubtitleHandler {
  private subtitleContainer: HTMLElement | null = null;
  private originalSubtitleContainer: HTMLElement | null = null;
  private translationContainer: HTMLElement | null = null;
  private tooltipContainer: HTMLElement | null = null;
  private settings: any = {};
  private currentSubtitle: string = '';
  private observer: MutationObserver | null = null;
  private aiService: AIService | null = null;

  constructor() {
    this.init();
  }

  // 初始化
  async init() {
    console.log('初始化 YouTube 字幕处理器');
    
    // 加载设置
    await this.loadSettings();
    
    // 初始化 AI 服务
    this.initAIService();
    
    // 创建字幕容器
    this.createSubtitleContainers();
    
    // 创建工具提示容器
    this.createTooltipContainer();
    
    // 观察 YouTube 字幕变化
    this.observeSubtitles();
    
    // 监听设置变化
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.settings) {
        this.settings = changes.settings.newValue;
        this.updateSubtitleStyle();
        this.initAIService();
      }
    });
  }

  // 初始化 AI 服务
  private initAIService() {
    const aiModel = this.settings.aiModel || 'deepseek';
    const apiKey = this.settings.apiKey || '';
    
    if (apiKey) {
      this.aiService = createAIService(aiModel, apiKey);
      console.log(`已初始化 ${aiModel} AI 服务`);
    } else {
      this.aiService = null;
      console.log('未提供 API Key，AI 服务未初始化');
    }
  }

  // 加载设置
  private async loadSettings() {
    const result = await browser.storage.local.get('settings');
    this.settings = result.settings || {};
    console.log('加载设置:', this.settings);
  }

  // 创建字幕容器
  private createSubtitleContainers() {
    // 查找原始字幕容器
    this.findOriginalSubtitleContainer();
    
    if (!this.originalSubtitleContainer) {
      console.log('未找到原始字幕容器，将在 5 秒后重试');
      setTimeout(() => this.createSubtitleContainers(), 5000);
      return;
    }
    
    console.log('创建自定义字幕容器');
    
    // 移除可能已存在的容器
    const existingSubtitle = document.getElementById('acquire-language-subtitle');
    const existingTranslation = document.getElementById('acquire-language-translation');
    
    if (existingSubtitle) {
      existingSubtitle.remove();
    }
    
    if (existingTranslation) {
      existingTranslation.remove();
    }
    
    // 创建自定义字幕容器
    this.subtitleContainer = document.createElement('div');
    this.subtitleContainer.id = 'acquire-language-subtitle';
    this.subtitleContainer.style.position = 'absolute';
    this.subtitleContainer.style.bottom = '80px';
    this.subtitleContainer.style.left = '0';
    this.subtitleContainer.style.width = '100%';
    this.subtitleContainer.style.textAlign = 'center';
    this.subtitleContainer.style.zIndex = '1000';
    this.subtitleContainer.style.pointerEvents = 'none';
    document.body.appendChild(this.subtitleContainer);
    
    // 创建翻译容器
    this.translationContainer = document.createElement('div');
    this.translationContainer.id = 'acquire-language-translation';
    this.translationContainer.style.position = 'absolute';
    this.translationContainer.style.bottom = '40px';
    this.translationContainer.style.left = '0';
    this.translationContainer.style.width = '100%';
    this.translationContainer.style.textAlign = 'center';
    this.translationContainer.style.zIndex = '1000';
    this.translationContainer.style.pointerEvents = 'none';
    document.body.appendChild(this.translationContainer);
    
    // 应用字幕样式
    this.updateSubtitleStyle();
    
    console.log('字幕容器创建完成');
  }

  // 查找原始字幕容器
  private findOriginalSubtitleContainer() {
    console.log('尝试查找 YouTube 字幕容器...');
    
    // 尝试多种可能的选择器
    const selectors = [
      '.ytp-caption-segment',
      '.captions-text',
      '.caption-window',
      '.ytp-caption-window-container',
      // 添加更多可能的选择器
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log(`找到字幕容器: ${selector}`, element);
        this.originalSubtitleContainer = element;
        return;
      }
    }
    
    // 如果没有找到，记录所有可见的元素类名，帮助调试
    console.log('未找到字幕容器，记录页面结构以帮助调试:');
    const allElements = document.querySelectorAll('*');
    const classNames = new Set<string>();
    
    allElements.forEach(el => {
      if (el.className && typeof el.className === 'string') {
        el.className.split(' ').forEach(cls => {
          if (cls.includes('caption') || cls.includes('subtitle') || cls.includes('text')) {
            classNames.add(cls);
          }
        });
      }
    });
    
    console.log('可能的字幕相关类名:', Array.from(classNames));
    console.log('未找到字幕容器，将在 5 秒后重试');
  }

  // 创建工具提示容器
  private createTooltipContainer() {
    this.tooltipContainer = document.createElement('div');
    this.tooltipContainer.id = 'acquire-language-tooltip';
    this.tooltipContainer.style.position = 'absolute';
    this.tooltipContainer.style.zIndex = '10000';
    this.tooltipContainer.style.display = 'none';
    this.tooltipContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.tooltipContainer.style.color = 'white';
    this.tooltipContainer.style.padding = '8px 12px';
    this.tooltipContainer.style.borderRadius = '4px';
    this.tooltipContainer.style.fontSize = '14px';
    this.tooltipContainer.style.maxWidth = '300px';
    this.tooltipContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    document.body.appendChild(this.tooltipContainer);
  }

  // 更新字幕样式
  private updateSubtitleStyle() {
    if (!this.subtitleContainer || !this.translationContainer) return;
    
    const subtitleSettings = this.settings.subtitleSettings || {
      fontSize: 16,
      position: 'bottom',
      backgroundColor: '#000000',
      textColor: '#ffffff',
      opacity: 0.8,
    };
    
    // 应用字幕样式
    const containers = [this.subtitleContainer, this.translationContainer];
    containers.forEach((container, index) => {
      if (!container) return;
      
      container.style.fontSize = `${subtitleSettings.fontSize}px`;
      container.style.color = subtitleSettings.textColor;
      container.style.backgroundColor = `${subtitleSettings.backgroundColor}${Math.round(subtitleSettings.opacity * 255).toString(16).padStart(2, '0')}`;
      container.style.padding = '4px 8px';
      container.style.borderRadius = '4px';
      container.style.display = 'inline-block';
      
      // 根据位置设置
      if (subtitleSettings.position === 'top') {
        container.style.bottom = 'auto';
        container.style.top = `${60 + index * 40}px`;
      } else {
        container.style.top = 'auto';
        container.style.bottom = `${80 - index * 40}px`;
      }
    });
  }

  // 观察字幕变化
  private observeSubtitles() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.handleSubtitleChange();
        }
      });
    });
    
    // 开始观察
    this.startObserving();
    
    // 定期检查字幕容器是否存在
    setInterval(() => {
      if (!document.contains(this.originalSubtitleContainer)) {
        this.findOriginalSubtitleContainer();
        this.startObserving();
      }
    }, 5000);
  }

  // 开始观察
  private startObserving() {
    if (this.originalSubtitleContainer && this.observer) {
      this.observer.observe(this.originalSubtitleContainer, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
  }

  // 处理字幕变化
  private async handleSubtitleChange() {
    if (!this.originalSubtitleContainer || !this.subtitleContainer) {
      console.log('字幕容器不存在，无法处理字幕变化');
      return;
    }
    
    const newSubtitle = this.originalSubtitleContainer.textContent || '';
    
    // 如果字幕没有变化，则不处理
    if (newSubtitle === this.currentSubtitle || !newSubtitle.trim()) return;
    
    this.currentSubtitle = newSubtitle;
    console.log('字幕变化:', newSubtitle);
    
    // 更新字幕
    this.updateSubtitle(newSubtitle);
    
    // 翻译字幕
    this.translateSubtitle(newSubtitle);
  }

  // 更新字幕
  private updateSubtitle(subtitle: string) {
    if (!this.subtitleContainer) return;
    
    // 为每个单词添加事件监听器
    const words = subtitle.split(/\s+/);
    const wordSpans = words.map(word => {
      // 移除标点符号
      const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
      const punctuation = word.substring(cleanWord.length);
      
      return `<span class="acquire-language-word" style="cursor: pointer; pointer-events: auto;">${cleanWord}</span>${punctuation} `;
    });
    
    this.subtitleContainer.innerHTML = wordSpans.join('');
    
    // 添加单词点击事件
    const wordElements = this.subtitleContainer.querySelectorAll('.acquire-language-word');
    wordElements.forEach(element => {
      element.addEventListener('click', (e) => this.handleWordClick(e));
      element.addEventListener('mouseover', (e) => this.handleWordHover(e));
      element.addEventListener('mouseout', () => this.hideTooltip());
    });
  }

  // 翻译字幕
  private async translateSubtitle(subtitle: string) {
    if (!this.translationContainer) return;
    
    try {
      if (this.aiService) {
        const sourceLanguage = this.settings.targetLanguage || 'en';
        const targetLanguage = this.settings.nativeLanguage || 'zh-CN';
        
        // 调用 AI 服务翻译
        const translation = await this.aiService.translateText(
          subtitle,
          sourceLanguage,
          targetLanguage
        );
        
        this.translationContainer.textContent = translation;
      } else {
        this.translationContainer.textContent = '[需要设置 API Key]';
      }
    } catch (error) {
      console.error('翻译字幕失败:', error);
      this.translationContainer.textContent = '[翻译失败]';
    }
  }

  // 处理单词点击
  private async handleWordClick(e: Event) {
    const target = e.target as HTMLElement;
    const word = target.textContent || '';
    
    if (!word.trim()) return;
    
    console.log('单词点击:', word);
    
    // 保存单词到生词本
    await this.saveWordToVocabulary(word, this.currentSubtitle);
    
    // 显示保存成功提示
    target.style.color = 'green';
    setTimeout(() => {
      target.style.color = '';
    }, 1000);
  }

  // 处理单词悬停
  private async handleWordHover(e: Event) {
    const target = e.target as HTMLElement;
    const word = target.textContent || '';
    
    if (!word.trim() || !this.tooltipContainer) return;
    
    // 获取单词释义
    const definition = await this.getWordDefinition(word);
    
    // 显示工具提示
    this.tooltipContainer.textContent = definition;
    this.tooltipContainer.style.display = 'block';
    
    // 定位工具提示
    const rect = target.getBoundingClientRect();
    this.tooltipContainer.style.left = `${rect.left}px`;
    this.tooltipContainer.style.top = `${rect.top - this.tooltipContainer.offsetHeight - 10}px`;
  }

  // 隐藏工具提示
  private hideTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.style.display = 'none';
    }
  }

  // 获取单词释义
  private async getWordDefinition(word: string): Promise<string> {
    try {
      if (this.aiService) {
        const targetLanguage = this.settings.nativeLanguage || 'zh-CN';
        
        // 调用 AI 服务获取单词释义
        return await this.aiService.getWordDefinition(
          word,
          this.currentSubtitle,
          targetLanguage
        );
      } else {
        return `${word}: [需要设置 API Key]`;
      }
    } catch (error) {
      console.error('获取单词释义失败:', error);
      return `${word}: [获取释义失败]`;
    }
  }

  // 保存单词到生词本
  private async saveWordToVocabulary(word: string, context: string) {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'SAVE_WORD',
        word,
        context,
      });
      
      console.log('保存单词响应:', response);
      return response.success;
    } catch (error) {
      console.error('保存单词失败:', error);
      return false;
    }
  }
} 