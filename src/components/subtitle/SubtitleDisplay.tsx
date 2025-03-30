import React, { useEffect, useRef, useState } from 'react';
import { useUnit } from 'effector-react';
import { $subtitleState, $processedSubtitleText, subtitleProcessed } from '@/models/subtitle';
import { WordProcessor } from './WordProcessor';

interface SubtitleDisplayProps {
    onWordClick?: (word: string, context: string) => void;
}

export const SubtitleDisplay: React.FC<SubtitleDisplayProps> = ({ onWordClick }) => {
    const { current, enabled, settings, processedText } = useUnit($subtitleState);
    const containerRef = useRef<HTMLDivElement>(null);
    const wordProcessorRef = useRef<WordProcessor | null>(null);
    const [localProcessedText, setLocalProcessedText] = useState<string>('');

    // 初始化单词处理器
    useEffect(() => {
        wordProcessorRef.current = new WordProcessor();
        return () => {
            wordProcessorRef.current = null;
        };
    }, []);

    // 当全局状态的处理文本变化时同步到本地
    useEffect(() => {
        if (processedText) {
            setLocalProcessedText(processedText);
        }
    }, [processedText]);

    // 当当前字幕变化时处理字幕文本
    useEffect(() => {
        if (current && enabled && wordProcessorRef.current) {
            try {
                const processed = wordProcessorRef.current.processText(current.text);
                setLocalProcessedText(processed);
                subtitleProcessed(processed);
            } catch (error) {
                console.error("处理字幕文本失败:", error);
            }
        } else if (!current && ($processedSubtitleText.getState() !== '' || localProcessedText !== '')) {
            setLocalProcessedText('');
            subtitleProcessed('');
        }
    }, [current, enabled]);

    // 计算样式
    const getContainerStyle = (): React.CSSProperties => {
        // 基础样式
        const style: React.CSSProperties = {
            position: 'absolute',
            zIndex: 9999,
            textAlign: 'center',
            padding: '0',
            fontFamily: 'Arial, sans-serif',
            fontSize: `${settings.fontSize}px`,
            backgroundColor: 'transparent',
            pointerEvents: 'auto',
            userSelect: 'none',
            width: '100%',
            display: enabled ? 'block' : 'none',
        };

        // 根据设置调整位置
        if (settings.position === 'top') {
            style.top = '10px';
        } else {
            style.bottom = '60px';
        }

        return style;
    };

    // 处理单词点击
    const handleWordClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!onWordClick || !current) return;

        const target = e.target as HTMLElement;
        if (target.classList.contains('acquire-language-word')) {
            const word = target.getAttribute('data-word') || '';
            if (word) {
                onWordClick(word, current.text);
            }
        }
    };

    // 创建字幕内容（使用本地状态和全局状态的组合）
    const effectiveText = localProcessedText || processedText;
    const displayHTML = effectiveText ||
        (current && current.text ?
            `<div style="font-size: ${settings.fontSize}px; line-height: 1.5;">${current.text}</div>` :
            ''
        );

    return (
        <div
            ref={containerRef}
            id="subtitle-display-container"
            className="acquire-language-subtitle"
            style={getContainerStyle()}
            onClick={handleWordClick}
            dangerouslySetInnerHTML={{ __html: displayHTML }}
        />
    );
}; 