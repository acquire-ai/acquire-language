import React, { useState, useEffect } from 'react';
import { WordAnalysisDrawer } from '@/components/word-analysis/WordAnalysisDrawer';

interface OverlayPanelProps {
    onClose: () => void;
    portalContainer?: HTMLElement | null;
}

export const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose, portalContainer }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        console.log('OverlayPanel mounted');

        // Debug: Check if styles are applied
        setTimeout(() => {
            const shadowRoot = (window as any).__acquireLanguageShadowRoot;
            if (shadowRoot) {
                console.log(
                    'Shadow DOM styles:',
                    shadowRoot.querySelectorAll('style, link').length,
                );
                const testEl = shadowRoot.querySelector('.bg-card');
                if (testEl) {
                    const computedStyle = window.getComputedStyle(testEl);
                    console.log('bg-card computed background:', computedStyle.backgroundColor);
                    console.log('bg-card computed color:', computedStyle.color);
                } else {
                    console.log('No .bg-card element found in Shadow DOM');
                }
            }
        }, 1000);

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
            console.log('OverlayPanel unmounting');
            mediaQuery.removeEventListener('change', checkDarkMode);
        };
    }, []);

    // Create a wrapper for onClose to handle the drawer closing
    const handleDrawerClose = () => {
        console.log('Drawer closed, unmounting component');
        onClose();
    };

    return (
        <div
            className={`acquire-language-extension ${isDarkMode ? 'dark' : ''}`}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 2147483647,
                pointerEvents: 'none',
            }}
        >
            <div style={{ pointerEvents: 'auto' }}>
                <WordAnalysisDrawer onClose={handleDrawerClose} portalContainer={portalContainer} />
            </div>
        </div>
    );
};
