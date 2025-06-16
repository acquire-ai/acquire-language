import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { WordAnalysisDrawer } from '@/components/word-analysis/WordAnalysisDrawer';
import { loadStylesForShadowDOM } from '@/core/utils';

interface OverlayPanelProps {
    onClose: () => void;
}

const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose }) => {
    useEffect(() => {
        // Add class to html element to ensure dark mode works
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shadowHost = document.getElementById('acquire-language-overlay-root');
        if (shadowHost) {
            if (isDarkMode) {
                shadowHost.classList.add('dark');
            } else {
                shadowHost.classList.remove('dark');
            }
        }
    }, []);

    return <WordAnalysisDrawer />;
};

let root: ReactDOM.Root | null = null;
let container: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null; 
let isInitialized = false;

// Listen for messages to open the panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OPEN_OVERLAY_PANEL' && message.word) {
        openPanel(message.word);
        sendResponse({ success: true });
    }
    return false;
});

// Listen for custom events from subtitle handler
window.addEventListener('acquire-language-open-panel', (event: any) => {
    openPanel(event.detail);
});

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
        const cssText = await loadStylesForShadowDOM();
        const style = document.createElement('style');
        style.textContent = cssText;
        shadowRoot.appendChild(style);

        const reactContainer = document.createElement('div');
        reactContainer.id = 'react-root';
        shadowRoot.appendChild(reactContainer);

        document.body.appendChild(container);

        // Note, the root is created in the shadow DOM, not the container
        root = ReactDOM.createRoot(reactContainer);
        console.log('Shadow DOM initialized successfully');
    }

    isInitialized = true;
}

export function openPanel(wordData: any) {
    if (!root || !container || !shadowRoot) {
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
    if (root && container) {
        root.unmount();
        // Re-create root for next use
        root = ReactDOM.createRoot(container);
    }
}
