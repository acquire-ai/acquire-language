import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';

interface WordPopupProps {
    word: string;
    definition: string;
    position: { x: number; y: number };
    onClose: () => void;
    onSave: (word: string) => void;
    isLoading?: boolean;
    isSaved?: boolean;
}

/**
 * WordPopup Component - Displays word definitions in a popup
 */
export const WordPopup: React.FC<WordPopupProps> = ({
    word,
    definition,
    position,
    onClose,
    onSave,
    isLoading = false,
    isSaved = false,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const [popupPosition, setPopupPosition] = useState({ left: '0px', top: '0px' });
    const [saveState, setSaveState] = useState<'unsaved' | 'saving' | 'saved'>(
        isSaved ? 'saved' : 'unsaved',
    );

    // Process Markdown content
    const getFormattedDefinition = () => {
        // Handle code block wrapping if present
        let cleanDefinition = definition.trim();
        if (cleanDefinition.startsWith('```') && cleanDefinition.endsWith('```')) {
            cleanDefinition = cleanDefinition
                .replace(/^```(markdown|md)?/m, '')
                .replace(/```$/m, '')
                .trim();
        }

        try {
            return {
                __html: marked.parse(cleanDefinition, {
                    async: false,
                    breaks: true,
                    gfm: true,
                }) as string,
            };
        } catch (error) {
            console.error('Failed to parse markdown', error);
            return { __html: `<p>${cleanDefinition.replace(/\n/g, '<br>')}</p>` };
        }
    };

    // Update save state when isSaved prop changes
    useEffect(() => {
        setSaveState(isSaved ? 'saved' : 'unsaved');
    }, [isSaved]);

    // Calculate position based on viewport and subtitle container
    useEffect(() => {
        if (!popupRef.current) return;

        const calculatePosition = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const popupRect = popupRef.current!.getBoundingClientRect();
            const popupWidth = popupRect.width || 400; // Default width if not available
            const popupHeight = popupRect.height || 300; // Default height if not available

            // 默认将弹窗放在点击位置上方，与点击位置左侧对齐
            let left = position.x - 20; // 左侧偏移一点，更好地对齐
            let top = position.y - popupHeight - 15; // 放在点击位置上方，留出一点间距

            // 确保弹窗不会超出视口右侧
            if (left + popupWidth > viewportWidth) {
                left = viewportWidth - popupWidth - 20;
            }

            // 确保弹窗不会超出视口左侧
            if (left < 20) {
                left = 20;
            }

            // 如果弹窗放在上方会超出视口顶部，则放在点击位置下方
            if (top < 20) {
                top = position.y + 15; // 放在点击位置下方，留出一点间距
            }

            // 检查是否有字幕容器
            const subtitleContainer = document.getElementById('acquire-language-subtitle');

            if (subtitleContainer) {
                const subtitleRect = subtitleContainer.getBoundingClientRect();

                // 调整垂直位置，避免遮挡字幕
                if (top + popupHeight > subtitleRect.top - 20) {
                    // 如果弹窗会与字幕重叠，则放在字幕上方
                    top = subtitleRect.top - popupHeight - 20;
                }

                // 如果上方放不下，且下方位置合适，则放在字幕下方
                if (top < 20 && position.y > subtitleRect.bottom + popupHeight + 20) {
                    top = subtitleRect.bottom + 20;
                }

                // 水平居中处理（可选）
                // 只有当点击位置接近字幕中心时才居中显示
                const clickDistance = Math.abs(
                    position.x - (subtitleRect.left + subtitleRect.width / 2),
                );
                if (clickDistance < 100) {
                    // 如果点击位置接近字幕中心
                    const centerPosition =
                        subtitleRect.left + subtitleRect.width / 2 - popupWidth / 2;
                    left = Math.max(20, centerPosition);
                }
            }

            setPopupPosition({
                left: `${Math.round(left)}px`,
                top: `${Math.round(top)}px`,
            });
        };

        calculatePosition();

        // Recalculate position if window is resized
        window.addEventListener('resize', calculatePosition);
        return () => window.removeEventListener('resize', calculatePosition);
    }, [position, popupRef.current]);

    const handleSave = () => {
        setSaveState('saving');
        onSave(word);
        setSaveState('saved');
    };

    return (
        <div
            ref={popupRef}
            style={{
                position: 'absolute',
                left: popupPosition.left,
                top: popupPosition.top,
                width: '400px',
                maxHeight: '350px',
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                border: '1px solid #eaeaea',
                overflow: 'auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '16px',
                lineHeight: '1.6',
                padding: '0',
                zIndex: 10000,
            }}
        >
            {/* Header with word and actions */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #eaeaea',
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: 600,
                        color: '#2563eb',
                    }}
                >
                    {word}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {!isLoading && saveState === 'unsaved' && (
                        <button
                            onClick={handleSave}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '15px',
                                color: '#3498db',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                marginRight: '16px',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ebf8ff')}
                            onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = 'transparent')
                            }
                        >
                            Save
                        </button>
                    )}
                    {!isLoading && saveState === 'saving' && (
                        <span style={{ color: '#3498db', fontSize: '15px', marginRight: '16px' }}>
                            Saving...
                        </span>
                    )}
                    {!isLoading && saveState === 'saved' && (
                        <span style={{ color: '#27ae60', fontSize: '15px', marginRight: '16px' }}>
                            Saved
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            color: '#999',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Content area */}
            <div style={{ padding: '16px' }}>
                {isLoading ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 0',
                        }}
                    >
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                border: '3px solid #f3f3f3',
                                borderTop: '3px solid #3498db',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <div style={{ marginLeft: '12px', color: '#666', fontSize: '15px' }}>
                            Looking up definition...
                        </div>
                    </div>
                ) : (
                    <div
                        className="word-definition-content"
                        dangerouslySetInnerHTML={getFormattedDefinition()}
                    />
                )}
            </div>

            {/* Global styles for definition content and animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .word-definition-content h1, 
                .word-definition-content h2, 
                .word-definition-content h3, 
                .word-definition-content h4 {
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 1.2em;
                }
                
                .word-definition-content ol {
                    padding-left: 1.5rem;
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                    font-size: 16px;
                }
                
                .word-definition-content ol li {
                    margin-bottom: 0.75rem;
                    font-size: 16px;
                }
                
                .word-definition-content p {
                    margin-bottom: 0.75rem;
                    line-height: 1.6;
                    font-size: 16px;
                }
                
                .word-definition-content strong {
                    color: #4b5563;
                    font-weight: 600;
                }
                
                .word-definition-content ul {
                    padding-left: 1.5rem;
                    margin-top: 0.75rem;
                    margin-bottom: 0.75rem;
                    list-style-type: disc;
                    font-size: 16px;
                }
                
                .word-definition-content ul li {
                    margin-bottom: 0.75rem;
                    font-size: 16px;
                }
            `}</style>
        </div>
    );
};
