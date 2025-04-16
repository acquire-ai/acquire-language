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

        // 去除多余空格，并按空格分词
        const words = text.trim().split(/\s+/);

        return words.map((word, wordIndex) => (
            <React.Fragment key={wordIndex}>
                <span
                    className="acquire-language-word"
                    onClick={(e) => handleWordClick(word, e)}
                    style={{
                        cursor: 'pointer',
                        display: 'inline-block',
                    }}
                >
                    {word}
                </span>
                {wordIndex < words.length - 1 && ' '}
            </React.Fragment>
        ));
    };

    return (
        <div
            className="subtitle-line"
            style={{
                margin: '2px 0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}
        >
            {renderWords()}
        </div>
    );
}; 