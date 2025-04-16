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
    const getStyles = (): CSSProperties => {
        if (!videoRect || !visible) {
            return {
                display: 'none'
            };
        }

        const styles: CSSProperties = {
            position: 'absolute',
            zIndex: 1000,
            left: `${videoRect.left}px`,
            width: `${videoRect.width}px`,
            textAlign: 'center',
            padding: '10px',
            fontFamily: 'Arial, sans-serif',
            fontSize: `${fontSize}px`,
            color: textColor,
            backgroundColor: backgroundColor,
            opacity: opacity,
            borderRadius: '4px',
            transition: 'opacity 0.3s ease',
            pointerEvents: 'auto',
            userSelect: 'none',
        };

        // 根据位置设置 top 或 bottom
        if (position === 'top') {
            styles.top = `${videoRect.top + 10}px`;
        } else {
            styles.bottom = `${window.innerHeight - videoRect.bottom + 60}px`;
        }

        return styles;
    };

    return (
        <div
            id="acquire-language-subtitle"
            style={getStyles()}
        >
            {children}
        </div>
    );
}; 