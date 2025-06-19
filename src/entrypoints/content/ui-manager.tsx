import ReactDOM from 'react-dom/client';
import { OverlayPanel } from './overlay-panel';

class UIManager {
    private uiContainer: HTMLElement | null = null;
    private reactRoot: ReactDOM.Root | null = null;
    private shadowRoot: ShadowRoot | null = null;
    private mounted = false;

    initialize(reactRoot: ReactDOM.Root, uiContainer: HTMLElement, shadowRoot?: ShadowRoot) {
        this.uiContainer = uiContainer;
        this.reactRoot = reactRoot;
        this.shadowRoot = shadowRoot || null;
    }

    /**
     * Open the overlay panel with word data
     */
    async openPanel(wordData: any) {
        if (!this.reactRoot) {
            console.error('UIManager not initialized');
            return;
        }

        if (this.mounted) {
            return;
        }

        // Store word data in storage for the panel to access
        await chrome.storage.local.set({ pendingWordAnalysis: wordData });

        // Render the component
        this.reactRoot.render(
            <OverlayPanel
                onClose={() => this.closePanel()}
                portalContainer={this.uiContainer}
                shadowRoot={this.shadowRoot}
            />,
        );

        this.mounted = true;
    }

    closePanel() {
        if (this.reactRoot && this.mounted) {
            // Render null to unmount the component
            this.reactRoot.render(null);
            this.mounted = false;
        }
    }

    isMounted(): boolean {
        return this.mounted;
    }

    cleanup() {
        if (this.reactRoot) {
            this.reactRoot.unmount();
        }
        this.reactRoot = null;
        this.shadowRoot = null;
        this.mounted = false;

        console.log('UIManager cleaned up');
    }
}

// Export a singleton instance
export const uiManager = new UIManager();
