import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { WordAnalysisDrawer } from '@/components/word-analysis/WordAnalysisDrawer';
import { loadStylesForShadowDOM } from '@/core/utils';

interface OverlayPanelProps {
    onClose: () => void;
}

const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check dark mode preference
        const checkDarkMode = () => {
            const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(darkMode);
        };

        checkDarkMode();

        // Listen for dark mode changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkDarkMode);

        return () => {
            mediaQuery.removeEventListener('change', checkDarkMode);
        };
    }, []);

    // Create a wrapper for onClose to handle the drawer closing
    const handleDrawerClose = () => {
        console.log('Drawer closed, unmounting component');
        onClose();
    };

    return (
        <div className={`acquire-language-extension ${isDarkMode ? 'dark' : ''}`}>
            <WordAnalysisDrawer onClose={handleDrawerClose} />
        </div>
    );
};

let root: ReactDOM.Root | null = null;
let container: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let isInitialized = false;

// Listen for messages to open the panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OPEN_OVERLAY_PANEL' && message.word) {
        openPanel(message.word).then(() => {
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for async response
    }
    return false;
});

// Listen for custom events from subtitle handler
window.addEventListener('acquire-language-open-panel', (event: any) => {
    openPanel(event.detail);
});

// Pre-initialize Shadow DOM when content script loads
// This ensures CSS is loaded before the first interaction
(async () => {
    console.log('Pre-initializing Shadow DOM...');
    await initializeOverlayPanel();
})();

export async function initializeOverlayPanel() {
    // Prevent multiple initializations
    if (isInitialized) {
        return;
    }

    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'acquire-language-overlay-root';
        container.className = 'acquire-language-extension';

        shadowRoot = container.attachShadow({ mode: 'open' });

        // Load and apply styles
        const cssText = await loadStylesForShadowDOM();
        if (cssText && shadowRoot) {
            const styleElement = document.createElement('style');
            styleElement.textContent = cssText;

            // Add some base styles to ensure visibility
            const baseStyles = document.createElement('style');
            baseStyles.textContent = `
                #react-root {
                    position: fixed;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    z-index: 2147483647;
                    pointer-events: none;
                }
                
                #react-root > * {
                    pointer-events: auto;
                }
                
                .acquire-language-extension {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.5;
                    color: #333;
                }
                
                .acquire-language-extension * {
                    box-sizing: border-box;
                }
            `;

            shadowRoot.appendChild(styleElement);
            shadowRoot.appendChild(baseStyles);
            console.log('Loading styles for shadow DOM');
        } else {
            console.error('Failed to load styles for shadow DOM', cssText, shadowRoot);
        }

        const reactContainer = document.createElement('div');
        reactContainer.id = 'react-root';
        shadowRoot.appendChild(reactContainer);

        document.body.appendChild(container);

        // Note, the root is created in the shadow DOM, not the container
        root = ReactDOM.createRoot(reactContainer);
        console.log('Shadow DOM initialized successfully');
    } else {
        console.error('Shadow DOM already initialized');
    }

    isInitialized = true;
}

export async function openPanel(wordData: any) {
    // Ensure Shadow DOM is initialized
    if (!isInitialized) {
        await initializeOverlayPanel();
    }

    if (!root || !container || !shadowRoot) {
        console.error('Failed to open panel: Shadow DOM not properly initialized');
        return;
    }

    // Store word data in storage for the panel to access
    chrome.storage.local.set({ pendingWordAnalysis: wordData });

    root.render(
        <OverlayPanel
            onClose={() => {
                if (root && shadowRoot) {
                    root.unmount();
                    // Re-create root for next use
                    const reactContainer = shadowRoot.getElementById('react-root');
                    if (reactContainer) {
                        root = ReactDOM.createRoot(reactContainer);
                    }
                }
            }}
        />,
    );
}

export function closePanel() {
    if (root && shadowRoot) {
        root.unmount();
        // Re-create root for next use
        const reactContainer = shadowRoot.getElementById('react-root');
        if (reactContainer) {
            root = ReactDOM.createRoot(reactContainer);
        } else {
            console.error('Failed to find react-root element in shadow DOM');
        }
    }
}
