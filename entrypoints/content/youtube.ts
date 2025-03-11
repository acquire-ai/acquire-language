/**
 * YouTube 字幕处理器
 *
 * 这个类负责查找 YouTube 字幕，并以更美观的方式显示它们。
 * 它使用 MutationObserver 监听字幕变化，并定期检查字幕内容。
 */
import { WordPopup } from './WordPopup';
import { createAIService } from '../services/ai';

export class YouTubeSubtitleHandler {
    private subtitleContainer: HTMLElement | null = null;
    private originalSubtitleContainer: HTMLElement | null = null;
    private currentSubtitle: string = '';
    private observer: MutationObserver | null = null;
    private containerObserver: MutationObserver | null = null;
    private lastCheckTime: number = 0;
    private checkInterval: number = 500;
    private wordPopup: WordPopup;
    private aiService: any = null;
    private settings: any = null;

    constructor() {
        // 创建单词弹出组件
        this.wordPopup = new WordPopup();
        
        // 加载设置
        this.loadSettings().then(() => {
            this.init();
        });
    }

    async loadSettings() {
        console.log('加载设置...');
        try {
            // 从存储中获取设置
            const result = await browser.storage.local.get('settings');
            console.log('从存储中获取的设置:', result);
            
            this.settings = result.settings || {
                nativeLanguage: 'zh-CN',
                targetLanguage: 'en',
                languageLevel: 'B1',
                aiModel: 'deepseek',
                apiKey: ''
            };
            
            console.log('使用的设置:', this.settings);
            
            // 如果有 API 密钥，初始化 AI 服务
            if (this.settings.apiKey) {
                console.log(`使用 API 密钥初始化 AI 服务，模型: ${this.settings.aiModel}`);
                try {
                    this.aiService = createAIService(this.settings.aiModel, this.settings.apiKey);
                    console.log('AI 服务初始化成功');
                } catch (error) {
                    console.error('初始化 AI 服务失败:', error);
                }
            } else {
                console.warn('未设置 API 密钥，无法初始化 AI 服务');
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async init() {
        // 注入样式表
        this.injectStylesheet();

        // 创建自定义字幕容器
        this.createSubtitleContainer();

        // 观察视频播放器区域
        this.observeVideoPlayerArea();

        // 设置定期检查
        this.setupPeriodicCheck();
    }

    /**
     * 注入样式表
     */
    private injectStylesheet() {
        const styleId = 'acquire-language-styles';
        
        // 检查样式表是否已存在
        if (document.getElementById(styleId)) {
            return;
        }
        
        // 创建样式元素
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            #acquire-language-subtitle {
              position: fixed;
              bottom: 80px;
              left: 50%;
              transform: translateX(-50%);
              width: auto;
              max-width: 80%;
              text-align: center;
              z-index: 2147483647;
              transition: transform 0.2s ease;
            }
            
            #acquire-language-subtitle:hover {
              transform: translateX(-50%) scale(1.05);
            }
            
            .acquire-language-initial-message {
              background-color: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 10px 15px;
              border-radius: 8px;
              font-size: 14px;
              margin-bottom: 10px;
            }
            
            .acquire-language-subtitle-text {
              background-color: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 12px 18px;
              border-radius: 8px;
              font-size: 18px;
              line-height: 1.5;
              display: inline-block;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              transition: background-color 0.2s ease;
            }
            
            #acquire-language-subtitle:hover .acquire-language-subtitle-text {
              background-color: rgba(0, 0, 0, 0.9);
            }
            
            .acquire-language-word {
              cursor: pointer;
              position: relative;
              display: inline-block;
              margin: 0 2px;
              padding: 0 2px;
              border-radius: 3px;
              transition: all 0.2s ease;
            }
            
            .acquire-language-word:hover {
              text-decoration: underline;
              color: #ffcc00;
              background-color: rgba(255, 204, 0, 0.2);
              transform: scale(1.1);
            }
        `;
        
        // 添加到文档头部
        document.head.appendChild(style);
    }

    /**
     * 创建自定义字幕容器
     */
    private createSubtitleContainer() {
        // 查找原始字幕容器
        this.findOriginalSubtitleContainer();
        // 隐藏 YouTube 原始字幕
        this.hideYouTubeSubtitles();

        const existingSubtitle = document.getElementById('acquire-language-subtitle');
        if (existingSubtitle) {
            existingSubtitle.remove();
        }
        this.subtitleContainer = document.createElement('div');
        this.subtitleContainer.id = 'acquire-language-subtitle';

        // 添加到文档
        document.body.appendChild(this.subtitleContainer);

        // 添加鼠标悬停事件 - 暂停视频
        this.addSubtitleHoverEvents();

        // 显示初始提示
        this.showInitialMessage();
    }

    /**
     * 添加字幕悬停事件 - 暂停视频
     */
    private addSubtitleHoverEvents() {
        if (!this.subtitleContainer) return;
        let wasPlaying = false;

        // 鼠标进入字幕区域时暂停视频
        this.subtitleContainer.addEventListener('mouseenter', () => {
            const video = document.querySelector('video');
            if (video) {
                wasPlaying = !video.paused;
                if (wasPlaying) {
                    video.pause();
                }
            }
        });

        // 鼠标离开字幕区域时恢复视频播放
        this.subtitleContainer.addEventListener('mouseleave', () => {
            const video = document.querySelector('video');
            if (video && wasPlaying) {
                video.play();
                wasPlaying = false;
            }
        });
    }

    /**
     * 显示初始提示消息
     */
    private showInitialMessage() {
        if (this.subtitleContainer) {
            const message = document.createElement('div');
            message.className = 'acquire-language-initial-message';
            message.textContent = '习得语言已启动，正在等待字幕...';
            this.subtitleContainer.appendChild(message);
            
            // 5秒后移除提示
            setTimeout(() => {
                if (message.parentNode === this.subtitleContainer) {
                    this.subtitleContainer?.removeChild(message);
                }
            }, 5000);
        }
    }

    private findOriginalSubtitleContainer() {

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

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                this.originalSubtitleContainer = elements[0] as HTMLElement;
                if (this.originalSubtitleContainer) {
                    this.observeSubtitles();
                }
                return;
            }
        }
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
        
        this.currentSubtitle = subtitle;
        this.subtitleContainer.innerHTML = this.createStyledContainer(subtitle);
        
        // 添加单词点击事件
        this.addWordClickEvents();
    }

    /**
     * 创建样式化的字幕容器
     */
    private createStyledContainer(text: string): string {
        if (!text) return '';
        
        // 将文本分割成单词，并为每个单词添加可点击的样式
        const words = text.split(' ').map(word => {
            // 过滤掉标点符号等
            const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
            if (cleanWord.length < 2) return word; // 跳过短单词和标点
            
            return `<span class="acquire-language-word" data-word="${cleanWord}">${word}</span>`;
        }).join(' ');
        
        return `<div class="acquire-language-subtitle-text">${words}</div>`;
    }

    /**
     * 添加单词点击事件
     */
    private addWordClickEvents() {
        if (!this.subtitleContainer) {
            console.error('添加单词点击事件失败: subtitleContainer 不存在');
            return;
        }
        
        const wordElements = this.subtitleContainer.querySelectorAll('.acquire-language-word');

        wordElements.forEach(element => {
            element.addEventListener('click', async (event) => {
                // 阻止事件冒泡
                event.stopPropagation();
                
                // 获取单词和位置
                const word = element.getAttribute('data-word') || '';

                const rect = element.getBoundingClientRect();
                const position = {
                    x: rect.left + (window.scrollX/2),
                    y: rect.bottom + window.scrollY + 5
                };
                
                // 显示加载状态
                this.wordPopup.showLoading(word, position);

                // 获取单词释义
                try {
                    // 检查是否有 AI 服务
                    if (!this.aiService) {
                        console.log('AI 服务未初始化，尝试重新加载设置');
                        await this.loadSettings();
                        
                        if (!this.settings) {
                            console.error('加载设置失败');
                            this.wordPopup.show(word, '无法加载设置，请检查扩展配置。', position);
                            return;
                        }
                        

                        if (!this.settings.apiKey) {
                            console.error('API 密钥未设置');
                            this.wordPopup.show(word, `
                                <div style="text-align: center;">
                                    <p>请在设置中配置 API 密钥以启用单词释义功能。</p>
                                    <button id="open-options-btn" style="
                                        background-color: #4CAF50;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        padding: 8px 16px;
                                        font-size: 14px;
                                        cursor: pointer;
                                        margin-top: 10px;
                                    ">打开设置页面</button>
                                </div>
                            `, position);
                            
                            // 添加打开设置页面的点击事件
                            setTimeout(() => {
                                const openOptionsBtn = document.getElementById('open-options-btn');
                                if (openOptionsBtn) {
                                    openOptionsBtn.addEventListener('click', () => {
                                        this.openOptionsPage();
                                    });
                                }
                            }, 100);
                            
                            return;
                        }
                        
                        if (!this.aiService && this.settings.apiKey) {
                            this.aiService = createAIService(this.settings.aiModel, this.settings.apiKey);
                        }
                    }
                    
                    if (!this.aiService) {
                        console.error('无法创建 AI 服务');
                        this.wordPopup.show(word, '无法初始化 AI 服务，请检查设置和网络连接。', position);
                        return;
                    }
                    
                    console.log(`调用 AI 服务获取单词 "${word}" 的释义，上下文: "${this.currentSubtitle}"`);
                    
                    // 获取单词释义
                    const definition = await this.aiService.getWordDefinition(
                        word, 
                        this.currentSubtitle,
                        this.settings.targetLanguage
                    );
                    

                    // 显示单词释义
                    this.wordPopup.show(word, definition, position);
                } catch (error: any) {
                    console.error('获取单词释义失败:', error);
                    const errorMessage = error.message || '未知错误';
                    this.wordPopup.show(word, `获取释义失败: ${errorMessage}`, position);
                }
            });
        });
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
    }

    /**
     * 打开选项页面
     */
    private openOptionsPage() {
        browser.runtime.openOptionsPage();
    }
} 