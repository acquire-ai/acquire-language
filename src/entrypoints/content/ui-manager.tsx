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

        // Inject high z-index styles to ensure our components appear above YouTube elements
        this.injectZIndexStyles();
    }

    /**
     * Inject high z-index styles into shadow DOM to ensure components appear above YouTube elements
     */
    private injectZIndexStyles() {
        if (this.shadowRoot) {
            const styleId = 'acquire-language-z-index-fix';
            let existingStyle = this.shadowRoot.getElementById(styleId);

            if (!existingStyle) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `
                    /* Override Sheet component z-index to ensure it's above YouTube elements */
                    [role="dialog"] {
                        z-index: 2147483647 !important;
                    }
                    [data-radix-dialog-overlay] {
                        z-index: 2147483646 !important;
                    }
                    [data-radix-dialog-content] {
                        z-index: 2147483647 !important;
                    }
                    /* Additional overrides for radix components */
                    [data-state="open"][role="dialog"] {
                        z-index: 2147483647 !important;
                    }
                    /* Override any Tailwind z-index classes */
                    .z-50 {
                        z-index: 2147483647 !important;
                    }
                    /* Ensure all fixed positioned elements in our extension have high z-index */
                    [style*="position: fixed"] {
                        z-index: 2147483647 !important;
                    }
                    /* Target specific sheet overlay and content */
                    [data-radix-popper-content-wrapper] {
                        z-index: 2147483647 !important;
                    }
                `;
                this.shadowRoot.appendChild(style);
            }
        }
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
