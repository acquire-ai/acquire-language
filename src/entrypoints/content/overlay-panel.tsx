import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { WordAnalysisDrawer } from '@/components/word-analysis/WordAnalysisDrawer';

interface OverlayPanelProps {
    onClose: () => void;
}

export const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose }) => {
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


export async function openPanel(wordData: any) {
    // Ensure Shadow DOM is initialized

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
