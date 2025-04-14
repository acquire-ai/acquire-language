/**
 * Subtitle handler base class
 */
import { AIService } from "@/core/types/ai.ts";
import { SubtitleHandler } from "@/core/types/platform.ts";
import { WordPopup } from "@/components/word-popup";
import { createRoot } from 'react-dom/client';
import { Subtitle } from '@/components/subtitles';
import React, { useState, useEffect } from 'react';

const SubtitleContainer: React.FC<{
    handler: BaseSubtitleHandler;
    settings: any;
}> = ({ handler, settings }) => {
    // using state to manage subtitles
    const [subtitles, setSubtitles] = useState<string[]>([]);

    useEffect(() => {
        const updateSubtitles = (newSubtitles: string[]) => {
            setSubtitles([...newSubtitles]);
        };

        handler.setSubtitleUpdater(updateSubtitles);

        // 初始更新 - 使用 handler 的内部方法获取字幕数组
        updateSubtitles(handler.getSubtitles());

        return () => {
            handler.setSubtitleUpdater(null);
        };
    }, [handler]);

    const handleWordClick = async (word: string, position: { x: number, y: number }) => {
        handler.showWordLoading(word, position);

        const definition = await handler.getWordDefinition(
            word,
            subtitles.join("\n")
        );

        handler.showWordDefinition(word, definition, position);
    };

    return (
        <Subtitle
            texts={subtitles}
            settings={settings.subtitleSettings}
            onWordClick={handleWordClick}
        />
    );
};

export abstract class BaseSubtitleHandler implements SubtitleHandler {
    protected container: HTMLElement | null = null;
    protected root: ReturnType<typeof createRoot> | null = null;

    // 字幕数据存储为数组
    protected _subtitles: string[] = [];

    // 更新函数，用于通知 React 组件更新
    private subtitleUpdater: ((texts: string[]) => void) | null = null;

    // 设置更新函数的方法，供 React 组件调用
    setSubtitleUpdater(updater: ((texts: string[]) => void) | null) {
        this.subtitleUpdater = updater;
    }

    // 获取字幕数组 (仅内部使用)
    getSubtitles(): string[] {
        return this._subtitles;
    }


    // 设置字幕数据
    setSubtitles(texts: string[]): void {
        this._subtitles = texts;

        // 如果存在更新函数，通知 UI 更新
        if (this.subtitleUpdater) {
            this.subtitleUpdater(texts);
        }
    }

    protected aiService: AIService;
    protected wordPopup: WordPopup;
    protected settings: any = null;

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.wordPopup = new WordPopup();
    }

    showWordLoading(word: string, position: { x: number, y: number }): void {
        this.wordPopup.showLoading(word, position);
    }

    async getWordDefinition(word: string, context: string): Promise<string> {
        return await this.aiService.getWordDefinition(
            word,
            context,
            this.settings.nativeLanguage
        );
    }

    showWordDefinition(word: string, definition: string, position: { x: number, y: number }): void {
        this.wordPopup.show(word, definition, position);
    }

    abstract initialize(): Promise<void>;

    protected createSubtitleContainer() {
        this.container = document.createElement('div');
        this.container.id = 'acquire-language-root';
        document.body.appendChild(this.container);

        // 初始化 React root
        this.root = createRoot(this.container);

        // 渲染 SubtitleContainer 组件
        this.renderSubtitleContainer();
    }

    private renderSubtitleContainer() {
        if (!this.root || !this.settings) return;

        this.root.render(
            <SubtitleContainer
                handler={this}
                settings={this.settings}
            />
        );
    }

    // 实现接口要求的方法
    updateSubtitle(texts: string[] = []): void {
        this.setSubtitles(texts);
    }

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

            console.log("Settings loaded:", this.settings);

            // 加载设置后重新渲染组件
            this.renderSubtitleContainer();
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    destroy(): void {
        if (this.container) {
            if (this.root) {
                this.root.unmount();
            }
            this.container.remove();
            this.container = null;
            this.root = null;
        }

        this.wordPopup.destroy();
    }
} 