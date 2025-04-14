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

        return text.split(/\s+/).map((word, wordIndex) => (
            <span
                key={wordIndex}
                className="acquire-language-word"
                onClick={(e) => handleWordClick(word, e)}
                style={{
                    cursor: 'pointer',
                    margin: '0 4px',
                }}
            >
                {word}
            </span>
        ));
    };

    return <div className="subtitle-line">{renderWords()}</div>;
}; 