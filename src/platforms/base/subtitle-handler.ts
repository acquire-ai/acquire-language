/**
 * Subtitle handler base class
 */
import {AIService} from "@/core/types/ai.ts";
import {SubtitleHandler} from "@/core/types/platform.ts";
import {WordPopup} from "@/components/word-popup";

/**
 * Abstract subtitle handler base class
 */
export abstract class BaseSubtitleHandler implements SubtitleHandler {
    /**
     * Subtitle container element
     */
    protected container: HTMLElement | null = null;

    /**
     * Current subtitle text (private implementation)
     */
    protected _currentSubtitle: string = "";

    /**
     * Current subtitle text (read-only property)
     */
    get currentSubtitle(): string {
        return this._currentSubtitle;
    }

    /**
     * AI service
     */
    protected aiService: AIService;

    /**
     * Word popup component
     */
    protected wordPopup: WordPopup;

    /**
     * Settings
     */
    protected settings: any = null;

    /**
     * Constructor
     * @param aiService AI service
     */
    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.wordPopup = new WordPopup();
    }

    /**
     * Initialize subtitle handler
     */
    abstract initialize(): Promise<void>;

    /**
     * Update subtitle
     * Get latest subtitle from video platform and update display
     */
    abstract updateSubtitle(): void;

    /**
     * Get current subtitle text
     * @returns Current subtitle text
     */
    getCurrentSubtitle(): string {
        return this._currentSubtitle;
    }

    /**
     * Process subtitle text
     * @param text Original subtitle text
     * @returns Processed subtitle text
     */
    abstract processSubtitle(text: string): string;

    /**
     * Add word click events
     */
    abstract addWordClickEvents(): void;

    /**
     * Load settings
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

            console.log("Settings loaded:", this.settings);
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    /**
     * Destroy subtitle handler
     */
    destroy(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        // Destroy word popup component
        this.wordPopup.destroy();
    }
}
