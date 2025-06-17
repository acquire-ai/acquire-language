import React, { useState, useEffect } from 'react';
import { WordAnalysisDrawer } from '@/components/word-analysis/WordAnalysisDrawer';

interface OverlayPanelProps {
    onClose: () => void;
    portalContainer?: HTMLElement | null;
}

export const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose, portalContainer }) => {
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
