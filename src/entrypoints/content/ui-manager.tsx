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
    }

    /**
     * Close the overlay panel
     */
    closePanel() {
        if (this.root && this.mounted) {
            // Render null to unmount the component
            this.root.render(null);
            this.mounted = false;
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


        console.log('UIManager cleaned up');
    }
}

// Export a singleton instance
export const uiManager = new UIManager();
