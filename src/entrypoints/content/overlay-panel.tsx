import React, { useState, useEffect } from 'react';
import WordDefinitionDrawer from '@/components/word-analysis/WordDefinitionDrawer';
import { useWordAnalysis } from '@/hooks/useWordAnalysis';

interface OverlayPanelProps {
    onClose: () => void;
    portalContainer?: HTMLElement | null;
}

export const OverlayPanel: React.FC<OverlayPanelProps> = ({ onClose, portalContainer }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Use the custom hook for all word analysis logic
    const {
        isOpen,
        currentAnalysis,
        isLoadingAI,
        isLoadingTraditional,
        traditionalDefinitions,
        ukPhonetic,
        usPhonetic,
        savedWords,
        handleSaveWord,
        handleClose,
        handleAIChatResponse,
    } = useWordAnalysis();

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

    // Handle drawer close with delay for animation
    const handleDrawerClose = () => {
        handleClose();
        setTimeout(() => {
            onClose();
        }, 300);
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
                <WordDefinitionDrawer
                    isOpen={isOpen}
                    onClose={handleDrawerClose}
                    word={currentAnalysis?.word || null}
                    contextSentence={currentAnalysis?.context || null}
                    traditionalDefinitionEntries={traditionalDefinitions}
                    ukPhonetic={ukPhonetic}
                    usPhonetic={usPhonetic}
                    aiContextualDefinition={currentAnalysis?.definition || null}
                    isLoadingTraditional={isLoadingTraditional}
                    isLoadingAI={isLoadingAI}
                    onChatMessage={handleAIChatResponse}
                    onSaveWord={handleSaveWord}
                    isSaved={currentAnalysis ? savedWords.has(currentAnalysis.word) : false}
                    portalContainer={portalContainer}
                />
            </div>
        </div>
    );
};
