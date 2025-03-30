/**
 * YouTube 字幕处理器
 *
 * 这个类负责获取 YouTube 字幕，并以更美观的方式显示它们。
 * 它使用webRequest拦截 YouTube 的字幕请求，获取完整的字幕数据。
 */
import {BaseSubtitleHandler} from "../base/subtitle-handler";
import {AIService} from "@/core/types/ai.ts";
import React from 'react';
// 导入最新的React DOM客户端API
import { createRoot } from 'react-dom/client';
import { SubtitleDisplay } from '@/components/subtitle';
import { 
  subtitleSettingsChanged,
  $subtitleSettings,
  $subtitleState,
  setCurrent,
  toggleEnabled,
  setSubtitle,
  getSubtitleState
} from '@/models/subtitle';

// 字幕项接口
interface SubtitleItem {
    start: number; // 开始时间（毫秒）
    end: number; // 结束时间（毫秒）
    text: string; // 字幕文本
}

export class YouTubeSubtitleHandler extends BaseSubtitleHandler {
    // 使用protected访问权限与基类保持一致
    protected containerObserver: MutationObserver | null = null;
    protected subtitleEnabled = false;
    protected subtitleText = '';
    protected reactRoot: any = null;
    protected subtitleData: any[] = [];
    protected videoElement: HTMLVideoElement | null = null;
    protected currentSubtitleIndex = -1;
    protected currentVideoId: string = "";
    protected currentLang: string = "";
    protected observer: MutationObserver | null = null;

    constructor(aiService: AIService) {
        super(aiService);
        this.subtitleEnabled = $subtitleState.getState().enabled;
    }

    /**
     * 初始化字幕处理器
     */
    async initialize(): Promise<void> {
        // 加载设置
        await this.loadSettings();

        // 创建自定义字幕容器
        this.createSubtitleContainer();

        // 隐藏YouTube原生字幕
        this.hideYouTubeSubtitles();
        
        // 渲染React组件
        this.renderReactComponent();

        // 尝试预加载字幕
        this.tryPreloadSubtitles();

        this.videoElement = document.querySelector('video') as HTMLVideoElement;
        if (!this.videoElement) {
            console.error('No video element found');
            return;
        }

        // Listen for time updates to display the correct subtitle
        this.videoElement.addEventListener('timeupdate', this.handleTimeUpdate);
    }

    /**
     * 创建字幕容器
     */
    private createSubtitleContainer() {
        // 检查是否已存在字幕容器
        const existingContainer = document.getElementById('acquire-language-subtitle');
        if (existingContainer) {
            this.container = existingContainer;
            return;
        }

        // 创建新的字幕容器
        this.container = document.createElement('div');
        this.container.id = 'acquire-language-subtitle';
        
        // 设置基础样式
        Object.assign(this.container.style, {
            position: 'fixed',
            width: '80%',
            left: '10%',
            bottom: '80px',
            zIndex: '9999',
            pointerEvents: 'none',
        });

        // 添加到页面
        document.body.appendChild(this.container);
    }

    /**
     * 渲染React组件
     */
    private renderReactComponent() {
        if (!this.container) return;
        
        try {
            this.reactRoot = createRoot(this.container);
            this.reactRoot.render(
                React.createElement(SubtitleDisplay, {
                    onWordClick: (word: string, context: string) => {
                        // 处理单词点击事件
                        this.handleWordClick(word, context);
                    }
                })
            );
        } catch (error) {
            console.error('Error rendering React component:', error);
        }
    }

    /**
     * 隐藏YouTube原生字幕
     */
    private hideYouTubeSubtitles() {
        // 处理已存在的字幕元素
        const subtitles = document.querySelectorAll('.ytp-caption-segment');
        subtitles.forEach(sub => {
            if (sub instanceof HTMLElement) {
                sub.style.display = 'none';
            }
        });

        // 设置观察器持续隐藏新添加的字幕
        this.containerObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node instanceof HTMLElement) {
                            if (node.classList.contains('ytp-caption-segment')) {
                                node.style.display = 'none';
                            }
                            
                            // 也检查子元素
                            const segments = node.querySelectorAll('.ytp-caption-segment');
                            segments.forEach(segment => {
                                if (segment instanceof HTMLElement) {
                                    segment.style.display = 'none';
                                }
                            });
                        }
                    });
                }
            });
        });

        // 观察字幕容器
        const ytpCaptionWindow = document.querySelector('.ytp-caption-window-container');
        if (ytpCaptionWindow) {
            this.containerObserver.observe(ytpCaptionWindow, { childList: true, subtree: true });
        }
    }

    /**
     * 尝试预加载字幕
     */
    private tryPreloadSubtitles() {
        try {
            // 这里可以实现预加载字幕的逻辑
        } catch (error) {
            console.error('Error preloading subtitles:', error);
        }
    }
    
    /**
     * 更新字幕设置
     */
    public updateSubtitleSettings(settings: any): void {
        // 更新全局状态
        subtitleSettingsChanged(settings);
    }

    /**
     * 更新字幕 (实现抽象方法)
     */
    public updateSubtitle(): void {
        // 该方法在YouTube中由时间触发器处理
    }

    /**
     * 处理字幕文本 (实现抽象方法)
     */
    public processSubtitle(text: string): string {
        // 简单地返回原始文本，实际处理由WordProcessor处理
        return text;
    }

    /**
     * 添加单词点击事件 (实现抽象方法)
     */
    public addWordClickEvents(): void {
        // 在React组件中已处理
    }

    /**
     * 清理资源
     */
    public destroy(): void {
        // 卸载React组件
        if (this.reactRoot) {
            try {
                this.reactRoot.unmount();
                this.reactRoot = null;
            } catch (error) {
                console.error('Error unmounting React component:', error);
                
                // 如果卸载失败，手动清空容器
                if (this.container) {
                    this.container.innerHTML = '';
                }
            }
        }
        
        // 停止监听视频播放器大小变化
        if (this.containerObserver) {
            this.containerObserver.disconnect();
            this.containerObserver = null;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.videoElement) {
            this.videoElement.removeEventListener('timeupdate', this.handleTimeUpdate);
        }

        // 调用基类销毁方法
        super.destroy();
    }

    private handleTimeUpdate = (): void => {
        if (!this.videoElement || this.subtitleData.length === 0) return;

        const currentTime = this.videoElement.currentTime;
        const currentSubtitle = this.findSubtitleAtTime(currentTime);

        if (currentSubtitle) {
            setCurrent(currentSubtitle);
        } else if (getSubtitleState().current !== null) {
            setCurrent(null);
        }
    };

    private findSubtitleAtTime(time: number): any | null {
        // Start search from current index for efficiency
        let startIndex = Math.max(0, this.currentSubtitleIndex);

        // Check if we need to look backwards
        if (startIndex > 0 && this.subtitleData[startIndex].startTime > time) {
            startIndex = 0;
        }

        for (let i = startIndex; i < this.subtitleData.length; i++) {
            const subtitle = this.subtitleData[i];
            if (time >= subtitle.startTime && time <= subtitle.endTime) {
                this.currentSubtitleIndex = i;
                return subtitle;
            }
            // If we've passed the current time, no need to continue
            if (subtitle.startTime > time) {
                break;
            }
        }

        return null;
    }

    /**
     * 解析字幕数据
     */
    private parseSubtitlesData(subtitleText: string): any[] {
        try {
            // 简化版字幕解析，仅提取时间和文本
            const lines = subtitleText.split('\n');
            const subtitles = [];
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(' --> ')) {
                    const timeMatch = lines[i].match(/(\d+:\d+:\d+\.\d+) --> (\d+:\d+:\d+\.\d+)/);
                    if (timeMatch && i+1 < lines.length) {
                        const startTimeStr = timeMatch[1];
                        const endTimeStr = timeMatch[2];
                        const text = lines[i+1];
                        
                        const startTime = this.parseTimeString(startTimeStr);
                        const endTime = this.parseTimeString(endTimeStr);
                        
                        subtitles.push({
                            startTime,
                            endTime,
                            text
                        });
                    }
                }
            }
            
            return subtitles;
        } catch (error) {
            console.error('Error parsing subtitles:', error);
            return [];
        }
    }
    
    /**
     * 解析时间字符串为秒数
     */
    private parseTimeString(timeStr: string): number {
        const parts = timeStr.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            const seconds = parseFloat(parts[2]);
            return hours * 3600 + minutes * 60 + seconds;
        }
        return 0;
    }

    public setSubtitleText(text: string): void {
        this.subtitleText = text;
        setSubtitle(text);
        
        // 解析字幕数据
        if (text) {
            this.subtitleData = this.parseSubtitlesData(text);
            this.currentSubtitleIndex = -1;
        } else {
            this.subtitleData = [];
            setCurrent(null);
        }
    }
}
