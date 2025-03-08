/**
 * YouTube 字幕处理器
 * 
 * 这个类负责查找 YouTube 字幕，并以更美观的方式显示它们。
 * 它使用 MutationObserver 监听字幕变化，并定期检查字幕内容。
 */
export class YouTubeSubtitleHandler {
  // 自定义字幕容器
  private subtitleContainer: HTMLElement | null = null;
  
  // YouTube 原始字幕容器
  private originalSubtitleContainer: HTMLElement | null = null;
  
  // 当前显示的字幕文本
  private currentSubtitle: string = '';
  
  // 用于监听字幕变化的 MutationObserver
  private observer: MutationObserver | null = null;
  
  // 用于监听视频播放器区域变化的 MutationObserver
  private containerObserver: MutationObserver | null = null;
  
  // 上次检查时间戳
  private lastCheckTime: number = 0;
  
  // 检查间隔（毫秒）
  private checkInterval: number = 500;

  /**
   * 构造函数
   */
  constructor() {
    this.init();
  }

  /**
   * 初始化字幕处理器
   */
  async init() {

    // 创建自定义字幕容器
    this.createSubtitleContainer();
    
    // 观察视频播放器区域
    this.observeVideoPlayerArea();
    
    // 设置定期检查
    this.setupPeriodicCheck();
  }

  /**
   * 创建自定义字幕容器
   */
  private createSubtitleContainer() {
    // 查找原始字幕容器
    this.findOriginalSubtitleContainer();
    
    // 移除可能已存在的容器
    const existingSubtitle = document.getElementById('acquire-language-subtitle');
    if (existingSubtitle) {
      existingSubtitle.remove();
    }
    
    // 创建新的字幕容器
    this.subtitleContainer = document.createElement('div');
    this.subtitleContainer.id = 'acquire-language-subtitle';
    
    // 设置样式
    Object.assign(this.subtitleContainer.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'auto',
      maxWidth: '80%',
      textAlign: 'center',
      zIndex: '2147483647'
    });
    
    // 添加到文档
    document.body.appendChild(this.subtitleContainer);
    

    // 隐藏 YouTube 原始字幕
    this.hideYouTubeSubtitles();
    
    // 显示初始提示
    this.showInitialMessage();
  }

  /**
   * 显示初始提示消息
   */
  private showInitialMessage() {
    if (!this.subtitleContainer) return;
    
    const message = this.createStyledContainer('字幕增强已启用 - 等待字幕出现...');
    this.subtitleContainer.innerHTML = message;
  }

  /**
   * 查找 YouTube 原始字幕容器
   */
  private findOriginalSubtitleContainer() {
    console.log('尝试查找 YouTube 字幕容器');
    
    // 可能的字幕容器选择器
    const selectors = [
      '.ytp-caption-segment',
      '.captions-text',
      '.caption-window',
      '.ytp-caption-window-container',
      '.ytp-caption-window',
      '.ytp-subtitles-player-content',
      '.ytp-caption-segment-container',
      '.ytp-subtitles'
    ];
    
    // 尝试每个选择器
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`找到字幕容器: ${selector}`, elements);
        this.originalSubtitleContainer = elements[0] as HTMLElement;
        
        // 开始观察找到的字幕容器
        if (this.originalSubtitleContainer) {
          this.observeSubtitles();
        }
        
        return;
      }
    }
    
    console.log('未找到字幕容器，将继续尝试');
  }

  /**
   * 设置定期检查
   */
  private setupPeriodicCheck() {
    // 定期检查字幕容器和内容
    setInterval(() => {
      const now = Date.now();
      
      // 限制检查频率
      if (now - this.lastCheckTime < this.checkInterval) return;
      this.lastCheckTime = now;
      
      // 如果没有找到字幕容器，尝试再次查找
      if (!this.originalSubtitleContainer) {
        this.findOriginalSubtitleContainer();
        return;
      }
      
      // 检查字幕容器是否仍在 DOM 中
      if (!document.contains(this.originalSubtitleContainer)) {
        console.log('字幕容器已从 DOM 中移除，重新查找');
        this.originalSubtitleContainer = null;
        this.findOriginalSubtitleContainer();
        return;
      }
      
      // 检查字幕内容
      this.checkSubtitleContent();
    }, this.checkInterval);
  }

  /**
   * 检查字幕内容
   */
  private checkSubtitleContent() {
    if (!this.originalSubtitleContainer) return;
    
    const newSubtitle = this.originalSubtitleContainer.textContent || '';
    
    // 只有当字幕变化且不为空时才更新
    if (newSubtitle && newSubtitle !== this.currentSubtitle) {
      console.log('检测到字幕变化:', newSubtitle);
      this.currentSubtitle = newSubtitle;
      this.updateSubtitle(newSubtitle);
    }
  }

  /**
   * 观察视频播放器区域
   */
  private observeVideoPlayerArea() {
    // 查找视频播放器区域
    const videoPlayer = document.querySelector('.html5-video-player');
    if (!videoPlayer) {
      console.log('未找到视频播放器区域，将在稍后重试');
      setTimeout(() => this.observeVideoPlayerArea(), 1000);
      return;
    }
    
    console.log('找到视频播放器区域，开始观察');
    
    // 创建 MutationObserver
    this.containerObserver = new MutationObserver((mutations) => {
      // 检查是否有字幕相关元素被添加
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 检查新添加的节点
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // 检查是否是字幕相关元素
              const className = node.className || '';
              if (
                className.includes('caption') || 
                className.includes('subtitle') || 
                node.querySelector('.ytp-caption-segment')
              ) {
                console.log('检测到新的字幕相关元素:', node);
                this.originalSubtitleContainer = node as HTMLElement;
                this.observeSubtitles();
              }
            }
          });
        }
      }
    });
    
    // 开始观察
    this.containerObserver.observe(videoPlayer, {
      childList: true,
      subtree: true
    });
    
    console.log('开始观察视频播放器区域的变化');
  }

  /**
   * 观察字幕变化
   */
  private observeSubtitles() {
    console.log('开始观察字幕容器的变化');
    
    // 断开之前的观察者
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (!this.originalSubtitleContainer) {
      console.log('没有找到原始字幕容器，无法观察字幕变化');
      return;
    }
    
    // 创建新的 MutationObserver
    this.observer = new MutationObserver(() => {
      // 检查字幕内容
      this.checkSubtitleContent();
    });
    
    // 开始观察
    this.startObserving();
  }

  /**
   * 开始观察字幕容器
   */
  private startObserving() {
    if (!this.originalSubtitleContainer || !this.observer) {
      console.log('无法开始观察，字幕容器或观察者不存在');
      return;
    }
    
    // 设置观察选项
    this.observer.observe(this.originalSubtitleContainer, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true
    });
    
    console.log('MutationObserver 已设置');
  }

  /**
   * 更新字幕显示
   */
  private updateSubtitle(subtitle: string) {
    if (!this.subtitleContainer) return;
    
    console.log('更新字幕:', subtitle);
    
    // 创建样式化的字幕容器
    const html = this.createStyledContainer(subtitle);
    
    // 更新字幕容器
    this.subtitleContainer.innerHTML = html;
  }

  /**
   * 创建样式化的容器
   */
  private createStyledContainer(text: string): string {
    return `
      <div style="
        background-color: rgba(0,0,0,0.7); 
        padding: 12px 20px; 
        border-radius: 8px; 
        display: inline-block; 
        max-width: 80%;
        font-size: 24px;
        font-weight: 500;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        letter-spacing: 0.5px;
        line-height: 1.4;
      ">
        ${text}
      </div>
    `;
  }

  /**
   * 隐藏 YouTube 原始字幕
   */
  private hideYouTubeSubtitles() {
    // 添加样式表
    const style = document.createElement('style');
    style.textContent = `
      .ytp-caption-segment,
      .caption-window,
      .ytp-caption-window-container {
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
    
    // 直接修改元素样式
    const selectors = ['.ytp-caption-segment', '.caption-window', '.ytp-caption-window-container'];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.opacity = '0';
          element.style.visibility = 'hidden';
        }
      });
    });
    
    console.log('已隐藏 YouTube 原始字幕');
  }
} 