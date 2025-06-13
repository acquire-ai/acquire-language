import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { WordAnalysisDrawer } from '@/components/word-analysis/WordAnalysisDrawer';
import '@/assets/globals.css';

interface OverlayPanelProps {
    onClose: () => void;
}

const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose }) => {
    useEffect(() => {
        // Add class to html element to ensure dark mode works
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const root = document.getElementById('acquire-language-overlay-root');
        if (root) {
            if (isDarkMode) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, []);

    // Since WordDefinitionDrawer already has its own Sheet component with close button,
    // we don't need the backdrop and panel wrapper
    return <WordAnalysisDrawer />;
};

let root: ReactDOM.Root | null = null;
let container: HTMLDivElement | null = null;
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

export function initializeOverlayPanel() {
    // Prevent multiple initializations
    if (isInitialized) {
        return;
    }

    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'acquire-language-overlay-root';
        container.className = 'acquire-language-extension';

        // Apply Tailwind base styles to our container
        container.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 2147483647 !important;
            pointer-events: none !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important;
            font-feature-settings: normal !important;
            font-variation-settings: normal !important;
            line-height: 1.5 !important;
            -webkit-text-size-adjust: 100% !important;
            -moz-tab-size: 4 !important;
            tab-size: 4 !important;
        `;

        document.body.appendChild(container);
        root = ReactDOM.createRoot(container);
    }

    isInitialized = true;
}

export function openPanel(wordData: any) {
    if (!root || !container) {
        return;
    }

    // Store word data in storage for the panel to access
    chrome.storage.local.set({ pendingWordAnalysis: wordData });

    // Ensure container allows pointer events for its children
    if (container) {
        // Add a wrapper div that allows pointer events
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'pointer-events: auto !important; width: 100%; height: 100%;';

        root.render(
            <div style={{ pointerEvents: 'auto' }}>
                <OverlayPanel
                    onClose={() => {
                        if (root && container) {
                            root.unmount();
                            // Re-create root for next use
                            root = ReactDOM.createRoot(container);
                        }
                    }}
                />
            </div>,
        );
    }
}

export function closePanel() {
    if (root && container) {
        root.unmount();
        // Re-create root for next use
        root = ReactDOM.createRoot(container);
    }
}
