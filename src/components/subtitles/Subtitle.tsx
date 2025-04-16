import React, { useEffect, useState } from 'react';
import { SubtitleContainer } from './SubtitleContainer';
import { SubtitleText } from './SubtitleText';

interface SubtitleProps {
    texts: string[];
    settings: {
        fontSize: number;
        position: 'top' | 'bottom';
        backgroundColor: string;
        textColor: string;
        opacity: number;
    };
    onWordClick?: (word: string, position: { x: number, y: number }) => void;
    visible?: boolean;
}

export const Subtitle: React.FC<SubtitleProps> = ({ texts, settings, onWordClick, visible = true }) => {
    const [videoRect, setVideoRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const updateVideoRect = () => {
            const videoPlayer = document.querySelector('video');
            if (videoPlayer) {
                setVideoRect(videoPlayer.getBoundingClientRect());
            }
        };

        updateVideoRect();

        window.addEventListener('resize', updateVideoRect);

        const observer = new ResizeObserver(updateVideoRect);
        const videoPlayer = document.querySelector('video');
        if (videoPlayer) {
            observer.observe(videoPlayer);
        }

        return () => {
            window.removeEventListener('resize', updateVideoRect);
            observer.disconnect();
        };
    }, []);

    const handleWordClick = (word: string, event: React.MouseEvent) => {
        if (onWordClick) {
            onWordClick(word, { x: event.clientX, y: event.clientY });
        }
    };

    const renderSubtitleTexts = () => {
        if (!texts || texts.length === 0) return null;
        return texts.map((text, index) => (
            <SubtitleText
                key={`subtitle-line-${index}`}
                text={text}
                onWordClick={handleWordClick}
            />
        ));
    };

    return (
        <SubtitleContainer
            position={settings.position}
            fontSize={settings.fontSize}
            textColor={settings.textColor}
            backgroundColor={settings.backgroundColor}
            opacity={settings.opacity}
            videoRect={videoRect || undefined}
            visible={visible}
        >
            {renderSubtitleTexts()}
        </SubtitleContainer>
    );
}; 