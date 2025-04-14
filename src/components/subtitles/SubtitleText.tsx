import React from 'react';

interface SubtitleTextProps {
    text: string;
    onWordClick?: (word: string, event: React.MouseEvent) => void;
}

export const SubtitleText: React.FC<SubtitleTextProps> = ({ text, onWordClick }) => {
    const handleWordClick = (word: string, event: React.MouseEvent) => {
        if (onWordClick) {
            onWordClick(word, event);
        }
    };

    const renderWords = () => {
        if (!text) return null;

        return text.split(/\s+/).map((word, index) => (
            <span
                key={index}
                className="acquire-language-word"
                onClick={(e) => handleWordClick(word, e)}
                style={{
                    cursor: 'pointer',
                    margin: '0 2px',
                }}
            >
                {word}
            </span>
        ));
    };

    return <>{renderWords()}</>;
}; 