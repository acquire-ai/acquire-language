import React from 'react';
import { createRoot } from 'react-dom/client';
import { WordPopup } from './WordPopup';

/**
 * WordPopupManager - Creates and manages the WordPopup React component
 *
 * This class bridges the gap between the imperative API used by the rest of the codebase
 * and the React component-based implementation.
 *
 * Implemented as a singleton to ensure only one popup exists at a time.
 */
export class WordPopupManager {
    private containerElement: HTMLElement | null = null;
    private root: ReturnType<typeof createRoot> | null = null;
    private word: string = '';
    private definition: string = '';
    private position: { x: number; y: number } = { x: 0, y: 0 };
    private isLoading: boolean = false;
    private savedWords: Set<string> = new Set();

    // 单例实例
    private static instance: WordPopupManager | null = null;

    /**
     * 获取WordPopupManager的单例实例
     */
    public static getInstance(): WordPopupManager {
        if (!WordPopupManager.instance) {
            WordPopupManager.instance = new WordPopupManager();
        }
        return WordPopupManager.instance;
    }

    /**
     * 私有构造函数，防止外部直接创建实例
     */
    private constructor() {
        this.cleanupExistingPopups();
        this.createContainer();
    }

    /**
     * 清理页面中所有已存在的弹窗元素
     */
    private cleanupExistingPopups() {
        const existingContainer = document.getElementById('acquire-language-word-popup-container');
        if (existingContainer) {
            existingContainer.remove();
        }
    }

    /**
     * Create container element for the popup
     */
    private createContainer() {
        // Remove existing container if it exists
        if (this.containerElement) {
            this.containerElement.remove();
            this.root = null;
        }

        // Create new container
        this.containerElement = document.createElement('div');
        this.containerElement.id = 'acquire-language-word-popup-container';
        this.containerElement.style.display = 'none';

        // Container doesn't need position: absolute because the React component handles its own positioning
        document.body.appendChild(this.containerElement);

        // Create React root
        this.root = createRoot(this.containerElement);

        // Initial render (hidden)
        this.render();
    }

    /**
     * Render or update the React component
     */
    private render() {

        if (!this.root) {
            console.error('WordPopupManager: No React root available');
            return;
        }

        try {
            this.root.render(
                <WordPopup
                    word={this.word}
                    definition={this.definition}
                    position={this.position}
                    isLoading={this.isLoading}
                    isSaved={this.savedWords.has(this.word)}
                    onClose={() => this.hide()}
                    onSave={(word) => this.saveWord(word)}
                />,
            );
        } catch (error) {
            console.error('WordPopupManager: Error rendering React component', error);
        }
    }

    /**
     * Show loading state
     */
    showLoading(word: string, position: { x: number; y: number }) {

        // 确保有有效的位置
        const adjustedPosition = this.validatePosition(position);

        this.word = word;
        this.position = adjustedPosition;
        this.isLoading = true;

        // 确保容器存在并可见
        if (!this.containerElement) {
            console.error('WordPopupManager: containerElement is null');
            this.createContainer();
        }

        if (this.containerElement) {
            this.containerElement.style.display = 'block';
        }

        this.render();
    }

    /**
     * Show word definition
     */
    show(word: string, definition: string, position: { x: number; y: number }) {

        // 确保有有效的位置
        const adjustedPosition = this.validatePosition(position);

        this.word = word;
        this.definition = definition;
        this.position = adjustedPosition;
        this.isLoading = false;

        if (!this.containerElement) {
            console.error('WordPopupManager: containerElement is null');
            this.createContainer();
        }

        if (this.containerElement) {
            this.containerElement.style.display = 'block';
        }

        this.render();
    }

    private validatePosition(position: { x: number; y: number }): { x: number; y: number } {
        // 确保位置是有效的数字
        let x = typeof position.x === 'number' ? position.x : 0;
        let y = typeof position.y === 'number' ? position.y : 0;

        // 在视口范围内
        x = Math.max(0, Math.min(x, window.innerWidth));
        y = Math.max(0, Math.min(y, window.innerHeight));

        return { x, y };
    }

    /**
     * Hide popup
     */
    hide() {
        if (this.containerElement) {
            this.containerElement.style.display = 'none';
            console.log('WordPopupManager: container hidden');
        }
    }

    /**
     * Save word to vocabulary
     */
    private saveWord(word: string) {
        // Add to saved words
        this.savedWords.add(word);

        // Get current subtitle as context
        const subtitleContainer = document.getElementById('acquire-language-subtitle');
        let context = '';

        if (subtitleContainer) {
            context = subtitleContainer.textContent || '';
        }

        // Send message to background script
        browser.runtime
            .sendMessage({
                type: 'SAVE_WORD',
                word,
                context,
            })
            .then((response) => {
                console.log('保存单词响应:', response);
            })
            .catch((error) => {
                console.error('保存单词失败:', error);
            });

        // Update component to show saved state
        this.render();
    }

    /**
     * Check if word is saved
     */
    isSaved(word: string): boolean {
        return this.savedWords.has(word);
    }

    /**
     * Clean up resources
     */
    destroy() {
        console.log('WordPopupManager: destroy called');

        try {
            if (this.root) {
                this.root.unmount();
                this.root = null;
            }

            if (this.containerElement) {
                this.containerElement.remove();
                this.containerElement = null;
            }

            // 移除单例实例
            if (WordPopupManager.instance === this) {
                WordPopupManager.instance = null;
            }
        } catch (error) {
            console.error('WordPopupManager: Error during cleanup', error);
        }
    }
}
