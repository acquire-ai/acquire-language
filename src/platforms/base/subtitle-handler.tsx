/**
 * Subtitle handler base class
 */
import { AIService } from '@/core/types/ai.ts';
import { SubtitleHandler } from '@/core/types/platform.ts';
import { WordPopup } from '@/components/word-popup';
import { createRoot } from 'react-dom/client';
import { Subtitle } from '@/components/subtitles';
import React, { useEffect, useState } from 'react';
import { getSettings, Settings } from '@/core/config/settings';

const SubtitleContainer: React.FC<{
    handler: BaseSubtitleHandler;
    settings: Settings | null;
}> = ({ handler, settings }) => {
    // using state to manage subtitles
    const [subtitles, setSubtitles] = useState<string[]>([]);
    const [subtitleEnabled, setSubtitleEnabled] = useState<boolean>(false);

    useEffect(() => {
        const updateSubtitles = (newSubtitles: string[]) => {
            setSubtitles([...newSubtitles]);
        };

        const updateSubtitleEnabled = (enabled: boolean) => {
            setSubtitleEnabled(enabled);
        };

        handler.setSubtitleUpdater(updateSubtitles);
        handler.setSubtitleEnabledUpdater(updateSubtitleEnabled);

        updateSubtitles(handler.subtitles);
        updateSubtitleEnabled(handler.subtitleEnabled);

        return () => {
            handler.setSubtitleUpdater(null);
            handler.setSubtitleEnabledUpdater(null);
        };
    }, [handler]);

    const handleWordClick = async (word: string, position: { x: number; y: number }) => {
        console.log('Word clicked:', word, 'at position:', position);

        try {
            // Dispatch custom event to open overlay panel
            const wordData = {
                word,
                context: subtitles.join('\n'),
            };
            console.log('Dispatching event to open overlay panel:', wordData);

            window.dispatchEvent(
                new CustomEvent('acquire-language-open-panel', {
                    detail: wordData,
                }),
            );
        } catch (error) {
            console.error('Error opening overlay panel:', error);
        }
    };

    return (
        <Subtitle
            texts={subtitles}
            settings={settings!.subtitle}
            onWordClick={handleWordClick}
            visible={subtitleEnabled}
        />
    );
};

export abstract class BaseSubtitleHandler implements SubtitleHandler {
    protected aiService: AIService;
    protected wordPopup: WordPopup;
    protected settings: Settings = {} as Settings;
    protected containerRoot: ReturnType<typeof createRoot> | null = null;
    protected container: HTMLElement | null = null;

    protected _subtitles: string[] = [];
    protected _subtitleEnabled: boolean = false;

    private subtitleUpdater: ((texts: string[]) => void) | null = null;
    private subtitleEnabledUpdater: ((enabled: boolean) => void) | null = null;

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.wordPopup = WordPopup.getInstance();
    }

    setSubtitleUpdater(updater: ((texts: string[]) => void) | null) {
        this.subtitleUpdater = updater;
    }

    setSubtitleEnabledUpdater(updater: ((enabled: boolean) => void) | null) {
        this.subtitleEnabledUpdater = updater;
    }

    get subtitles(): string[] {
        return this._subtitles;
    }

    set subtitles(texts: string[]) {
        this._subtitles = texts;

        if (this.subtitleUpdater) {
            this.subtitleUpdater(texts);
        }
    }

    get subtitleEnabled(): boolean {
        return this._subtitleEnabled;
    }

    set subtitleEnabled(enabled: boolean) {
        this._subtitleEnabled = enabled;

        if (this.subtitleEnabledUpdater) {
            this.subtitleEnabledUpdater(enabled);
        }
    }

    showWordLoading(word: string, position: { x: number; y: number }): void {
        this.wordPopup.showLoading(word, position);
    }

    async getWordDefinition(word: string, context: string): Promise<string> {
        return await this.aiService.getWordDefinition(
            word,
            context,
            this.settings?.general?.nativeLanguage,
        );
    }

    showWordDefinition(word: string, definition: string, position: { x: number; y: number }): void {
        this.wordPopup.show(word, definition, position);
    }

    abstract initialize(): Promise<void>;

    protected createSubtitleContainer() {
        this.container = document.createElement('div');
        this.container.id = 'acquire-language-root';
        document.body.appendChild(this.container);

        this.containerRoot = createRoot(this.container);

        this.renderSubtitleContainer();
    }

    private renderSubtitleContainer() {
        if (!this.containerRoot || !this.settings) return;

        this.containerRoot.render(<SubtitleContainer handler={this} settings={this.settings} />);
    }

    protected async loadSettings() {
        this.settings = await getSettings();
        this.renderSubtitleContainer();
    }

    public updateSettings(newSettings: Settings): void {
        this.settings = newSettings;
        this.renderSubtitleContainer();
    }

    public updateAIService(newAIService: AIService): void {
        this.aiService = newAIService;
    }

    destroy(): void {
        if (this.container) {
            if (this.containerRoot) {
                this.containerRoot.unmount();
            }
            this.container.remove();
            this.container = null;
            this.containerRoot = null;
        }

        this.wordPopup.destroy();
    }
}
