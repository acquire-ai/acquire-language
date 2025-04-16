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
    scaleFactor?: number;
}

export const SubtitleContainer: React.FC<SubtitleContainerProps> = ({
    position,
    fontSize,
    textColor,
    backgroundColor,
    opacity,
    videoRect,
    children,
    visible = true,
    scaleFactor = 1
}) => {
    if (!videoRect || !visible) {
        return null;
    }

    const containerStyle: CSSProperties = {
        position: 'absolute',
        zIndex: 9999,
        left: `${videoRect.left}px`,
        width: `${videoRect.width}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
    };

    const verticalMargin = Math.round(10 * scaleFactor);
    const bottomOffset = Math.round(60 * scaleFactor);

    if (position === 'top') {
        containerStyle.top = `${videoRect.top + verticalMargin}px`;
    } else {
        containerStyle.bottom = `${window.innerHeight - videoRect.bottom + bottomOffset}px`;
    }

    const paddingVertical = Math.max(Math.round(8 * scaleFactor), 8);
    const paddingHorizontal = Math.max(Math.round(15 * scaleFactor), 12);

    const subtitleStyle: CSSProperties = {
        display: 'inline-block',
        padding: `${paddingVertical}px ${paddingHorizontal}px`,
        fontFamily: 'Arial, sans-serif',
        fontSize: `${fontSize}px`,
        fontWeight: 'bold',
        color: textColor,
        backgroundColor: backgroundColor,
        opacity: opacity,
        borderRadius: `${Math.max(4 * scaleFactor, 4)}px`,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'auto',
        userSelect: 'none',
        textAlign: 'center',
        maxWidth: '90%',
        boxShadow: scaleFactor > 1.2 ? `0 ${Math.round(4 * scaleFactor)}px ${Math.round(8 * scaleFactor)}px rgba(0, 0, 0, 0.3)` : 'none',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
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