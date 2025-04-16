import React, { CSSProperties } from 'react';

interface SubtitleContainerProps {
    position: 'top' | 'bottom';
    fontSize: number;
    textColor: string;
    backgroundColor: string;
    opacity: number;
    videoRect?: DOMRect;
    children?: React.ReactNode;
    visible?: boolean;
}

export const SubtitleContainer: React.FC<SubtitleContainerProps> = ({
    position,
    fontSize,
    textColor,
    backgroundColor,
    opacity,
    videoRect,
    children,
    visible = true
}) => {
    if (!videoRect || !visible) {
        return null;
    }

    const containerStyle: CSSProperties = {
        position: 'absolute',
        zIndex: 1000,
        left: `${videoRect.left}px`,
        width: `${videoRect.width}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
    };

    if (position === 'top') {
        containerStyle.top = `${videoRect.top + 10}px`;
    } else {
        containerStyle.bottom = `${window.innerHeight - videoRect.bottom + 60}px`;
    }

    const subtitleStyle: CSSProperties = {
        display: 'inline-block',
        padding: '8px 15px',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${fontSize}px`,
        color: textColor,
        backgroundColor: backgroundColor,
        opacity: opacity,
        borderRadius: '4px',
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
        userSelect: 'none',
        textAlign: 'center',
        maxWidth: '90%',
    };

    return (
        <div
            id="acquire-language-subtitle-wrapper"
            style={containerStyle}
        >
            <div
                id="acquire-language-subtitle"
                style={subtitleStyle}
            >
                {children}
            </div>
        </div>
    );
}; 