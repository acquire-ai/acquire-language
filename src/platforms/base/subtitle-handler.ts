/**
 * Subtitle handler base class
 */
import {AIService} from "@/core/types/ai.ts";
import {SubtitleHandler} from "@/core/types/platform.ts";
import {WordPopup} from "@/components/word-popup";
import { createRoot } from 'react-dom/client';
import { Subtitle } from '@/components/subtitles';
import React from 'react';

export abstract class BaseSubtitleHandler implements SubtitleHandler {
    protected container: HTMLElement | null = null;
    protected root: ReturnType<typeof createRoot> | null = null;

    protected _currSubtitles: string[] = [];

    get currSubtitles(): string {
        return this._currSubtitles.join("\n");
    }

    protected aiService: AIService;

    protected wordPopup: WordPopup;

    protected settings: any = null;

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.wordPopup = new WordPopup();
    }

    abstract initialize(): Promise<void>;

    protected createSubtitleContainer() {
        this.container = document.createElement('div');
        this.container.id = 'acquire-language-root';
        document.body.appendChild(this.container);
        // init react root
        this.root = createRoot(this.container);
    }

    updateSubtitle(texts: string[] = []): void {
        this._currSubtitles = texts;
        
        if (this.root && this.settings) {
            const subtitleElement = React.createElement(Subtitle, {
                texts: texts,
                settings: this.settings.subtitleSettings,
                onWordClick: (word: string, position: { x: number, y: number }) => {
                    this.wordPopup.showLoading(word, position);
                    this.handleWordClick(word, position);
                }
            });
            
            this.root.render(subtitleElement);
        }
    }

    protected async handleWordClick(word: string, position: { x: number, y: number }) {
        const definition = await this.aiService.getWordDefinition(
            word, 
            this.currSubtitles,
            this.settings.nativeLanguage
        );
        
        this.wordPopup.show(word, definition, position);
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
                    fontSize: 22,
                    position: "bottom",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    textColor: "#ffffff",
                    opacity: 0.8,
                },
            };

            console.log("Settings loaded:", this.settings);
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
