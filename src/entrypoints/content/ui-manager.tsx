import React from 'react';
import ReactDOM from 'react-dom/client';
import { OverlayPanel } from './overlay-panel';

interface OverlayPanelProps {
    onClose: () => void;
    portalContainer?: HTMLElement | null;
}

class UIManager {
    private root: ReactDOM.Root | null = null;
    private wrapper: HTMLDivElement | null = null;
    private mounted = false;
    private shadowRoot: ShadowRoot | null = null;

    /**
     * Initialize the UI manager with React root and wrapper
     */
    initialize(root: ReactDOM.Root, wrapper: HTMLDivElement) {
        this.root = root;
        this.wrapper = wrapper;

        // Find the shadow root from the wrapper
        let current = wrapper.parentNode;
        while (current && current.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
            current = current.parentNode;
        }
        this.shadowRoot = current as ShadowRoot;

        // Manually inject CSS into Shadow DOM
        if (this.shadowRoot) {
            this.injectCSS();
            (window as any).__acquireLanguageShadowRoot = this.shadowRoot;
        }
    }

    /**
     * Inject CSS styles into Shadow DOM
     */
    private injectCSS() {
        if (!this.shadowRoot) return;

        // Check if CSS is already injected
        if (this.shadowRoot.querySelector('style[data-acquire-language-styles]')) {
            return;
        }

        // Create style element
        const style = document.createElement('style');
        style.setAttribute('data-acquire-language-styles', 'true');

        // Get the CSS content from the main document
        const existingStyles = document.querySelectorAll('link[rel="stylesheet"], style');
        let cssContent = '';

        existingStyles.forEach((styleEl) => {
            if (styleEl instanceof HTMLLinkElement) {
                // For linked stylesheets, we'll try to fetch the content
                // This is a simplified approach - in production you might want to handle this differently
                console.log('Found linked stylesheet:', styleEl.href);
            } else if (styleEl instanceof HTMLStyleElement) {
                cssContent += styleEl.textContent || '';
            }
        });

        // Add our custom CSS for Shadow DOM
        cssContent += `
            /* Shadow DOM specific styles */
            :host {
                all: initial;
                display: block;
            }
            
            /* Import Tailwind and custom styles */
            @import url('chrome-extension://${chrome.runtime.id}/content-scripts/content.css');
        `;

        style.textContent = cssContent;
        this.shadowRoot.appendChild(style);

        console.log('CSS injected into Shadow DOM');
        console.log('Shadow DOM children:', this.shadowRoot.children);
        console.log('CSS content length:', cssContent.length);

        // Also try to inject the CSS file directly
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('content-scripts/content.css');
        this.shadowRoot.appendChild(link);
        console.log('CSS link injected:', link.href);
    }

    /**
     * Open the overlay panel with word data
     */
    async openPanel(wordData: any) {
        if (!this.root) {
            console.error('UIManager not initialized');
            return;
        }

        if (this.mounted) {
            console.log('Panel already mounted, skipping');
            return;
        }

        // Store word data in storage for the panel to access
        await chrome.storage.local.set({ pendingWordAnalysis: wordData });

        // Get the portal container
        const portalContainer = this.getPortalContainer();

        // Render the component
        this.root.render(
            <OverlayPanel onClose={() => this.closePanel()} portalContainer={portalContainer} />,
        );

        this.mounted = true;
        console.log('Panel opened with portalContainer:', portalContainer);
    }

    /**
     * Close the overlay panel
     */
    closePanel() {
        if (this.root && this.mounted) {
            // Render null to unmount the component
            this.root.render(null);
            this.mounted = false;
            console.log('Panel closed');
        }
    }

    /**
     * Check if panel is currently mounted
     */
    isMounted(): boolean {
        return this.mounted;
    }

    /**
     * Get shadow root
     */
    getShadowRoot(): ShadowRoot | null {
        return this.shadowRoot;
    }

    /**
     * Get the portal container element
     */
    getPortalContainer(): HTMLElement | null {
        if (!this.shadowRoot) return null;

        // Create a portal container if it doesn't exist
        let portalContainer = this.shadowRoot.querySelector(
            '#acquire-language-portal-container',
        ) as HTMLElement | null;
        if (!portalContainer) {
            portalContainer = document.createElement('div');
            portalContainer.id = 'acquire-language-portal-container';
            portalContainer.style.position = 'relative';
            portalContainer.style.zIndex = '2147483647';
            this.shadowRoot.appendChild(portalContainer);
        }

        return portalContainer;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.root) {
            this.root.unmount();
        }
        this.root = null;
        this.wrapper = null;
        this.shadowRoot = null;
        this.mounted = false;

        // Clean up global reference
        delete (window as any).__acquireLanguageShadowRoot;

        console.log('UIManager cleaned up');
    }
}

// Export a singleton instance
export const uiManager = new UIManager();
