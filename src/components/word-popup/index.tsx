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
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      padding: 20px;
      max-width: 400px;
      max-height: 350px;
      overflow-y: auto;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      border: 1px solid #eaeaea;
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
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #eaeaea; padding-bottom: 12px;">
        <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #2563eb;">${word}</h3>
        <button id="acquire-language-close-popup" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s; padding: 0;">×</button>
      </div>
      <div style="display: flex; justify-content: center; align-items: center; padding: 32px 0;">
        <div class="acquire-language-loading" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 28px; height: 28px; animation: acquire-language-spin 1s linear infinite;"></div>
        <div style="margin-left: 12px; color: #666; font-size: 14px;">Looking up definition...</div>
      </div>
      <style>
        @keyframes acquire-language-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        #acquire-language-close-popup:hover {
          background-color: #f3f4f6;
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
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #eaeaea; padding-bottom: 12px;">
        <h3 style="margin: 0; font-size: 20px; font-weight: 600; color: #2563eb;">${word}</h3>
        <div style="display: flex; align-items: center;">
          <button id="acquire-language-save-word" style="background: none; border: none; cursor: pointer; font-size: 14px; color: #3498db; padding: 4px 8px; border-radius: 4px; transition: background-color 0.2s; margin-right: 16px;">Save</button>
          <button id="acquire-language-close-popup" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s; padding: 0;">×</button>
        </div>
      </div>
      <div class="acquire-language-definition" style="margin-top: 12px;">
        <style>
          .acquire-language-definition h1, 
          .acquire-language-definition h2, 
          .acquire-language-definition h3, 
          .acquire-language-definition h4 {
            margin-top: 16px;
            margin-bottom: 8px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .acquire-language-definition ol {
            padding-left: 24px;
            margin: 12px 0;
          }
          
          .acquire-language-definition ol li {
            margin-bottom: 8px;
          }
          
          .acquire-language-definition p {
            margin-bottom: 12px;
            line-height: 1.6;
          }
          
          .acquire-language-definition strong {
            color: #4b5563;
            font-weight: 600;
          }
          
          .acquire-language-definition ul {
            padding-left: 24px;
            margin: 12px 0;
            list-style-type: disc;
          }
          
          .acquire-language-definition ul li {
            margin-bottom: 8px;
          }
          
          #acquire-language-close-popup:hover {
            background-color: #f3f4f6;
          }
          
          #acquire-language-save-word:hover {
            background-color: #ebf8ff;
          }
        </style>
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