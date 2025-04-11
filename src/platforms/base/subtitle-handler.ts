/**
 * Subtitle handler base class
 */
import {AIService} from "@/core/types/ai.ts";
import {SubtitleHandler} from "@/core/types/platform.ts";
import {WordPopup} from "@/components/word-popup";

export abstract class BaseSubtitleHandler implements SubtitleHandler {
    protected container: HTMLElement | null = null;

    protected _currentSubtitle: string = "";

    get currentSubtitle(): string {
        return this._currentSubtitle;
    }

    protected aiService: AIService;

    protected wordPopup: WordPopup;

    protected settings: any = null;

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.wordPopup = new WordPopup();
    }

    abstract initialize(): Promise<void>;

    abstract updateSubtitle(): void;

    getCurrentSubtitle(): string {
        return this._currentSubtitle;
    }

    abstract processSubtitle(text: string): string;

    abstract addWordClickEvents(): void;

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
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    destroy(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        this.wordPopup.destroy();
    }
}
