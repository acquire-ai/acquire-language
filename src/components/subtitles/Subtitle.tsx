import React, { useEffect, useState, useRef } from 'react';
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
    onWordClick?: (word: string, position: { x: number; y: number }) => void;
    visible?: boolean;
}

export const Subtitle: React.FC<SubtitleProps> = ({
    texts,
    settings,
    onWordClick,
    visible = true,
}) => {
    const [videoRect, setVideoRect] = useState<DOMRect | null>(null);
    const [scaleFactor, setScaleFactor] = useState<number>(1);
    const initialVideoSizeRef = useRef<{ width: number; height: number } | null>(null);

    useEffect(() => {
        const updateVideoRect = () => {
            const videoPlayer = document.querySelector('video');
            if (!videoPlayer) return;

            const rect = videoPlayer.getBoundingClientRect();
            setVideoRect(rect);

            if (!initialVideoSizeRef.current && rect.width > 0 && rect.height > 0) {
                initialVideoSizeRef.current = {
                    width: rect.width,
                    height: rect.height,
                };
            }

            if (initialVideoSizeRef.current) {
                const widthRatio = rect.width / initialVideoSizeRef.current.width;
                const heightRatio = rect.height / initialVideoSizeRef.current.height;
                const newScaleFactor = Math.max(widthRatio, heightRatio);

                setScaleFactor(Math.max(newScaleFactor, 0.8));
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

    const adjustedSettings = {
        ...settings,
        fontSize: Math.round(settings.fontSize * scaleFactor),
    };

    return (
        <SubtitleContainer
            position={settings.position}
            fontSize={adjustedSettings.fontSize}
            textColor={settings.textColor}
            backgroundColor={settings.backgroundColor}
            opacity={settings.opacity}
            videoRect={videoRect || undefined}
            visible={visible}
            scaleFactor={scaleFactor}
        >
            {renderSubtitleTexts()}
        </SubtitleContainer>
    );
};
