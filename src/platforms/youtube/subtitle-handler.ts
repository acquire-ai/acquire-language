/**
 * YouTube 字幕处理器
 *
 * 这个类负责查找 YouTube 字幕，并以更美观的方式显示它们。
 * 它使用 MutationObserver 监听字幕变化，并定期检查字幕内容。
 */
import { BaseSubtitleHandler } from '../base/subtitle-handler';
import { AIService } from '../../core/types/ai';

export class YouTubeSubtitleHandler extends BaseSubtitleHandler {
    private originalSubtitleContainer: HTMLElement | null = null;
    private observer: MutationObserver | null = null;
    private containerObserver: MutationObserver | null = null;
    private lastCheckTime: number = 0;
    private checkInterval: number = 500;

    constructor(aiService: AIService) {
        super(aiService);
    }

    /**
     * 初始化字幕处理器
     */
    async initialize(): Promise<void> {
        // 加载设置
        await this.loadSettings();
        
        // 查找原始字幕容器
        this.findOriginalSubtitleContainer();
        
        // 创建自定义字幕容器
        this.createSubtitleContainer();
        
        // 开始监听字幕变化
        this.startObserving();
        
        // 定期检查字幕内容
        this.startPeriodicCheck();
    }

    /**
     * 查找原始字幕容器
     */
    private findOriginalSubtitleContainer() {
        // YouTube 字幕容器选择器
        const selectors = [
            '.ytp-caption-segment', // 字幕片段
            '.caption-visual-line', // 字幕行
            '.captions-text', // 字幕文本
            '.ytp-caption-window-container', // 字幕窗口容器
        ];
        
        // 尝试查找字幕容器
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                this.originalSubtitleContainer = elements[0] as HTMLElement;
                console.log('找到原始字幕容器:', selector, this.originalSubtitleContainer);
                break;
            }
        }
        
        if (!this.originalSubtitleContainer) {
            console.warn('未找到原始字幕容器');
        }
    }

    /**
     * 创建自定义字幕容器
     */
    private createSubtitleContainer() {
        // 隐藏 YouTube 原始字幕
        this.hideYouTubeSubtitles();
        
        // 创建自定义字幕容器
        this.container = document.createElement('div');
        this.container.id = 'acquire-language-subtitle';
        
        // 设置样式
        this.applySubtitleStyles();
        
        // 添加到文档
        document.body.appendChild(this.container);
        
        // 添加字幕悬停事件 - 暂停视频
        this.addSubtitleHoverEvents();
    }

    /**
     * 隐藏 YouTube 原始字幕
     */
    private hideYouTubeSubtitles() {
        // 添加样式以隐藏原始字幕
        const style = document.createElement('style');
        style.textContent = `
            .ytp-caption-segment {
                opacity: 0 !important;
            }
            .caption-visual-line {
                opacity: 0 !important;
            }
            .captions-text {
                opacity: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 应用字幕样式
     */
    private applySubtitleStyles() {
        if (!this.container) return;
        
        // 获取视频播放器
        const videoPlayer = document.querySelector('video');
        if (!videoPlayer) return;
        
        // 获取视频播放器尺寸和位置
        const videoRect = videoPlayer.getBoundingClientRect();
        
        // 设置字幕容器样式
        this.container.style.cssText = `
            position: absolute;
            z-index: 1000;
            left: ${videoRect.left}px;
            width: ${videoRect.width}px;
            text-align: center;
            padding: 10px;
            font-family: Arial, sans-serif;
            font-size: ${this.settings.subtitleSettings.fontSize}px;
            color: ${this.settings.subtitleSettings.textColor};
            background-color: ${this.settings.subtitleSettings.backgroundColor};
            opacity: ${this.settings.subtitleSettings.opacity};
            border-radius: 4px;
            transition: opacity 0.3s ease;
            pointer-events: auto;
            user-select: none;
        `;
        
        // 根据设置设置字幕位置
        if (this.settings.subtitleSettings.position === 'top') {
            this.container.style.top = `${videoRect.top + 10}px`;
        } else {
            // 调整底部位置，避免遮挡控制栏
            // YouTube控制栏高度约为40-45px，我们设置60px的间距以确保不会遮挡
            this.container.style.bottom = `${window.innerHeight - videoRect.bottom + 60}px`;
        }
        
        // 监听窗口大小变化，更新字幕位置
        window.addEventListener('resize', () => {
            this.updateSubtitlePosition();
        });
        
        // 监听视频播放器大小变化
        this.containerObserver = new MutationObserver(() => {
            this.updateSubtitlePosition();
        });
        
        this.containerObserver.observe(videoPlayer, {
            attributes: true,
            attributeFilter: ['style', 'class'],
        });
    }

    /**
     * 更新字幕位置
     */
    private updateSubtitlePosition() {
        if (!this.container) return;
        
        // 获取视频播放器
        const videoPlayer = document.querySelector('video');
        if (!videoPlayer) return;
        
        // 获取视频播放器尺寸和位置
        const videoRect = videoPlayer.getBoundingClientRect();
        
        // 更新字幕容器位置
        this.container.style.left = `${videoRect.left}px`;
        this.container.style.width = `${videoRect.width}px`;
        
        // 根据设置更新字幕位置
        if (this.settings.subtitleSettings.position === 'top') {
            this.container.style.top = `${videoRect.top + 10}px`;
            this.container.style.bottom = 'auto';
        } else {
            // 调整底部位置，避免遮挡控制栏
            this.container.style.bottom = `${window.innerHeight - videoRect.bottom + 60}px`;
            this.container.style.top = 'auto';
        }
    }

    /**
     * 添加字幕悬停事件 - 暂停视频
     */
    private addSubtitleHoverEvents() {
        if (!this.container) return;
        
        // 记录视频播放状态
        let wasPlaying = false;
        
        // 鼠标进入字幕区域时暂停视频
        this.container.addEventListener('mouseenter', () => {
            const video = document.querySelector('video');
            if (video) {
                wasPlaying = !video.paused;
                if (wasPlaying) {
                    video.pause();
                }
            }
        });
        
        // 鼠标离开字幕区域时恢复视频播放
        this.container.addEventListener('mouseleave', () => {
            const video = document.querySelector('video');
            if (video && wasPlaying) {
                video.play();
                wasPlaying = false;
            }
        });
    }

    /**
     * 开始监听字幕变化
     */
    private startObserving() {
        // 如果没有找到原始字幕容器，则定期检查
        if (!this.originalSubtitleContainer) {
            setTimeout(() => {
                this.findOriginalSubtitleContainer();
                if (this.originalSubtitleContainer) {
                    this.startObserving();
                }
            }, 1000);
            return;
        }
        
        // 创建 MutationObserver 监听字幕变化
        this.observer = new MutationObserver((mutations) => {
            // 检查是否有文本变化
            for (const mutation of mutations) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    this.updateSubtitle();
                    break;
                }
            }
        });
        
        // 开始监听
        this.observer.observe(this.originalSubtitleContainer, {
            childList: true,
            characterData: true,
            subtree: true,
        });
        
        // 立即更新字幕
        this.updateSubtitle();
    }

    /**
     * 开始定期检查字幕内容
     */
    private startPeriodicCheck() {
        // 定期检查字幕内容，以防 MutationObserver 没有捕获到变化
        setInterval(() => {
            // 如果距离上次检查时间超过了检查间隔，则更新字幕
            if (Date.now() - this.lastCheckTime > this.checkInterval) {
                this.updateSubtitle();
            }
        }, this.checkInterval);
    }

    /**
     * 更新字幕
     */
    updateSubtitle(): void {
        // 更新上次检查时间
        this.lastCheckTime = Date.now();
        
        // 如果没有找到原始字幕容器，则尝试再次查找
        if (!this.originalSubtitleContainer) {
            this.findOriginalSubtitleContainer();
            if (!this.originalSubtitleContainer) return;
        }
        
        // 获取原始字幕文本
        const originalText = this.originalSubtitleContainer.textContent || '';
        
        // 如果字幕没有变化，则不更新
        if (originalText === this._currentSubtitle) return;
        
        // 更新当前字幕
        this._currentSubtitle = originalText;
        
        // 处理字幕
        const processedText = this.processSubtitle(originalText);
        
        // 更新字幕容器
        if (this.container) {
            this.container.innerHTML = processedText;
            
            // 添加单词点击事件
            this.addWordClickEvents();
        }
    }

    /**
     * 处理字幕文本
     * @param text 原始字幕文本
     * @returns 处理后的字幕文本
     */
    processSubtitle(text: string): string {
        if (!text) return '';
        
        // 分割文本为单词
        const words = text.split(/(\s+|[,.!?;:'"()[\]{}])/);
        
        // 处理每个单词
        const processedWords = words.map(word => {
            // 跳过空白字符和标点符号
            if (!word.trim() || /^[,.!?;:'"()[\]{}]$/.test(word)) {
                return word;
            }
            
            // 将单词包装在可点击的 span 中
            return `<span class="acquire-language-word" data-word="${word}">${word}</span>`;
        });
        
        // 合并处理后的单词
        return processedWords.join('');
    }

    /**
     * 添加单词点击事件
     */
    addWordClickEvents() {
        if (!this.container) return;
        
        // 获取所有单词元素
        const wordElements = this.container.querySelectorAll('.acquire-language-word');
        
        // 为每个单词添加点击事件
        wordElements.forEach((element: Element) => {
            element.addEventListener('click', async (event: Event) => {
                // 阻止事件冒泡
                event.stopPropagation();
                
                // 获取单词和位置
                const word = element.getAttribute('data-word') || '';
                const rect = element.getBoundingClientRect();
                const position = {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY + 10
                };
                
                // 显示加载状态
                this.wordPopup.showLoading(word, position);
                
                // 获取单词释义
                try {
                    // 调用 AI 服务获取释义
                    const definition = await this.aiService.getWordDefinition(
                        word, 
                        this._currentSubtitle,
                        this.settings.targetLanguage
                    );
                    
                    // 显示单词释义
                    this.wordPopup.show(word, definition, position);
                } catch (error: any) {
                    console.error('获取单词释义失败:', error);
                    this.wordPopup.show(word, `获取释义失败: ${error.message}`, position);
                }
            });
        });
    }

    /**
     * 销毁字幕处理器
     */
    destroy() {
        // 停止监听
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.containerObserver) {
            this.containerObserver.disconnect();
            this.containerObserver = null;
        }
        
        // 调用基类的销毁方法
        super.destroy();
    }
} 