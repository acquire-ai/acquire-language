import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { X } from 'lucide-react';
import { WordAnalysisPanel } from '@/components/word-analysis/WordAnalysisPanel';
import '@/assets/globals.css';

interface OverlayPanelProps {
    onClose: () => void;
}

const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Trigger animation after mount
        setTimeout(() => setIsOpen(true), 10);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(onClose, 300); // Wait for animation to complete
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`acquire-language-backdrop ${isOpen ? 'acquire-language-backdrop-open' : ''}`}
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    transition: 'opacity 300ms',
                    opacity: isOpen ? 1 : 0,
                    zIndex: 999998,
                }}
            />

            {/* Panel */}
            <div
                className={`acquire-language-panel ${isOpen ? 'acquire-language-panel-open' : ''}`}
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    height: '100%',
                    width: '400px',
                    backgroundColor: 'var(--background, white)',
                    boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 300ms',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    zIndex: 999999,
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 10,
                    }}
                >
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 200ms',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div style={{ height: '100%', overflow: 'auto' }}>
                    <WordAnalysisPanel />
                </div>
            </div>
        </>
    );
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
        document.body.appendChild(container);

        // Add scoped styles to prevent conflicts
        const style = document.createElement('style');
        style.textContent = `
            /* Scope all extension styles to our container */
            #acquire-language-overlay-root {
                /* Reset inherited styles */
                all: initial;
                /* Set base font */
                font-family: system-ui, -apple-system, sans-serif;
                /* Ensure proper stacking */
                position: fixed;
                top: 0;
                left: 0;
                width: 0;
                height: 0;
                z-index: 999999;
                /* Ensure Tailwind styles are applied */
                color-scheme: light dark;
            }
            
            /* Ensure our styles don't affect the page */
            #acquire-language-overlay-root * {
                box-sizing: border-box;
            }

            /* Force Tailwind classes to have higher specificity */
            #acquire-language-overlay-root .acquire-language-panel {
                background-color: var(--background, white) !important;
                color: var(--foreground, black) !important;
            }
        `;
        document.head.appendChild(style);

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

    root.render(
        <OverlayPanel
            onClose={() => {
                if (root && container) {
                    root.unmount();
                    // Re-create root for next use
                    root = ReactDOM.createRoot(container);
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
