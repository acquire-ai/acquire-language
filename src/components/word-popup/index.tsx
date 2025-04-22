/**
 * Word Definition Popup Component
 *
 * Used to display detailed word definitions when users click on words.
 */

// Import marked library for Markdown rendering
import { marked } from 'marked';

export class WordPopup {
    private popupElement: HTMLElement | null = null;
    private closeTimeout: number | null = null;

    constructor() {
        // Create popup element
        this.createPopupElement();

        // Initialize marked configuration
        this.initMarked();

        // Listen for click events to close popup when clicking outside
        document.addEventListener('click', (event) => {
            if (this.popupElement &&
                event.target instanceof Node &&
                !this.popupElement.contains(event.target) &&
                !(event.target as HTMLElement).classList.contains('acquire-language-word')) {
                this.hide();
            }
        });
    }

    /**
     * Create popup element
     */
    private createPopupElement() {
        // Remove existing popup if it exists
        if (this.popupElement) {
            this.popupElement.remove();
        }

        // Create popup element
        this.popupElement = document.createElement('div');
        this.popupElement.id = 'acquire-language-word-popup';
        this.popupElement.style.cssText = `
      position: absolute;
      z-index: 10000;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      max-width: 400px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
    `;

        // Add to document
        document.body.appendChild(this.popupElement);
    }

    /**
     * Initialize marked configuration
     */
    private initMarked() {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
    }

    showLoading(word: string, position: { x: number, y: number }) {
        if (!this.popupElement) return;

        // Set content
        this.popupElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${word}</h3>
        <button id="acquire-language-close-popup" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">×</button>
      </div>
      <div style="display: flex; justify-content: center; padding: 20px 0;">
        <div class="acquire-language-loading" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: acquire-language-spin 1s linear infinite;"></div>
      </div>
      <style>
        @keyframes acquire-language-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

        // Set position
        this.setPosition(position);

        // Show popup
        this.popupElement.style.display = 'block';

        // Add close button event
        const closeButton = document.getElementById('acquire-language-close-popup');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }
    }

    show(word: string, definition: string, position: { x: number, y: number }) {
        if (!this.popupElement) return;

        // Render Markdown
        const renderedDefinition = marked.parse(definition);

        // Set content
        this.popupElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${word}</h3>
        <div>
          <button id="acquire-language-save-word" style="background: none; border: none; cursor: pointer; font-size: 14px; color: #3498db; margin-right: 8px;">Save</button>
          <button id="acquire-language-close-popup" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">×</button>
        </div>
      </div>
      <div class="acquire-language-definition" style="margin-top: 8px;">
        ${renderedDefinition}
      </div>
    `;

        // Set position
        this.setPosition(position);

        // Show popup
        this.popupElement.style.display = 'block';

        // Add close button event
        const closeButton = document.getElementById('acquire-language-close-popup');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }

        // Add save button event
        const saveButton = document.getElementById('acquire-language-save-word');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveWord(word);
                saveButton.textContent = 'Saved';
                saveButton.style.color = '#27ae60';
                (saveButton as HTMLButtonElement).disabled = true;
            });
        }

        // Clear auto-close timer
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
    }

    /**
     * Hide popup
     */
    hide() {
        if (this.popupElement) {
            this.popupElement.style.display = 'none';
        }
    }

    private setPosition(position: { x: number, y: number }) {
        if (!this.popupElement) return;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Get popup dimensions
        const popupRect = this.popupElement.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;

        // Calculate left position to ensure it stays within viewport
        let left = position.x;
        if (left + popupWidth > viewportWidth) {
            left = viewportWidth - popupWidth - 10;
        }
        if (left < 10) left = 10;

        // Calculate top position to ensure it stays within viewport
        let top = position.y;
        if (top + popupHeight > viewportHeight) {
            top = position.y - popupHeight - 10;
        }
        if (top < 10) top = 10;

        // Find subtitle container
        const subtitleContainer = document.getElementById('acquire-language-subtitle');

        // If subtitle container is found, position popup above it
        if (subtitleContainer) {
            const subtitleRect = subtitleContainer.getBoundingClientRect();

            // Calculate vertical position - leave some space above subtitle
            const topPosition = subtitleRect.top + window.scrollY - popupRect.height - 20;

            // If position is negative (above screen top), place below subtitle
            if (topPosition < 0) {
                this.popupElement.style.top = `${subtitleRect.bottom + window.scrollY + 20}px`;
            } else {
                this.popupElement.style.top = `${topPosition}px`;
            }

            // Center horizontally
            const centerPosition = subtitleRect.left + (subtitleRect.width / 2) - (popupWidth / 2);
            this.popupElement.style.left = `${Math.max(10, centerPosition)}px`;
        } else {
            // If no subtitle container found, use calculated position
            this.popupElement.style.left = `${left}px`;
            this.popupElement.style.top = `${top}px`;
        }
    }

    private saveWord(word: string) {
        // Get current subtitle as context
        const subtitleContainer = document.getElementById('acquire-language-subtitle');
        let context = '';

        if (subtitleContainer) {
            context = subtitleContainer.textContent || '';
        }

        // Send message to background script
        browser.runtime.sendMessage({
            type: 'SAVE_WORD',
            word,
            context,
        }).then(response => {
            console.log('保存单词响应:', response);
        }).catch(error => {
            console.error('保存单词失败:', error);
        });
    }

    destroy() {
        if (this.popupElement) {
            this.popupElement.remove();
            this.popupElement = null;
        }

        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
            this.closeTimeout = null;
        }
    }
} 