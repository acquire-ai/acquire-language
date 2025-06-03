import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { X, Save, Check } from 'lucide-react';
import { cn } from '@/core/utils';

interface WordPopupProps {
    word: string;
    definition: string;
    position: { x: number; y: number };
    onClose: () => void;
    onSave: (word: string) => void;
    isLoading?: boolean;
    isSaved?: boolean;
}

type SaveState = 'unsaved' | 'saving' | 'saved';

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
    const [popupPosition, setPopupPosition] = useState({ left: position.x, top: position.y });
    const [saveState, setSaveState] = useState<SaveState>(isSaved ? 'saved' : 'unsaved');

    const getFormattedDefinition = () => {
        if (!definition) {
            return { __html: '<p>No definition available.</p>' };
        }

        let formattedDefinition = definition;

        // Convert **text** to <strong>text</strong>
        formattedDefinition = formattedDefinition.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert numbered lists (1. 2. 3.) to proper <ol><li> structure
        const lines = formattedDefinition.split('\n');
        let inOrderedList = false;
        let result = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);

            if (numberedMatch) {
                if (!inOrderedList) {
                    result += '<ol>';
                    inOrderedList = true;
                }
                result += `<li>${numberedMatch[2]}</li>`;
            } else {
                if (inOrderedList) {
                    result += '</ol>';
                    inOrderedList = false;
                }
                if (line) {
                    result += `<p>${line}</p>`;
                }
            }
        }

        if (inOrderedList) {
            result += '</ol>';
        }

        return { __html: result };
    };

    useEffect(() => {
        const calculatePosition = () => {
            if (!popupRef.current) return;

            const popup = popupRef.current;
            const rect = popup.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let left = position.x;
            let top = position.y;

            // Adjust horizontal position
            if (left + rect.width > viewportWidth) {
                left = viewportWidth - rect.width - 10;
            }
            if (left < 10) {
                left = 10;
            }

            // Adjust vertical position
            if (top + rect.height > viewportHeight) {
                top = position.y - rect.height - 10;
            }
            if (top < 10) {
                top = 10;
            }

            setPopupPosition({ left, top });
        };

        calculatePosition();
        window.addEventListener('resize', calculatePosition);
        return () => window.removeEventListener('resize', calculatePosition);
    }, [position, popupRef.current]);

    const handleSave = () => {
        setSaveState('saving');
        onSave(word);
        setSaveState('saved');
    };

    return (
        <Card
            ref={popupRef}
            className={cn(
                'fixed z-[10000] w-[400px] max-h-[350px] overflow-auto',
                'card-glow gradient-border hover-lift',
                'bg-background border-border shadow-lg',
            )}
            style={{
                left: popupPosition.left,
                top: popupPosition.top,
            }}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border">
                <h3 className="text-xl font-semibold text-primary tech-glow">{word}</h3>
                <div className="flex items-center gap-2">
                    {!isLoading && saveState === 'unsaved' && (
                        <Button
                            onClick={handleSave}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary hover:bg-primary/10"
                        >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                    )}
                    {!isLoading && saveState === 'saving' && (
                        <span className="text-sm text-primary flex items-center">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                            Saving...
                        </span>
                    )}
                    {!isLoading && saveState === 'saved' && (
                        <span className="text-sm text-green-500 flex items-center">
                            <Check className="h-4 w-4 mr-1" />
                            Saved
                        </span>
                    )}
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-7 w-7 border-3 border-primary border-t-transparent rounded-full" />
                        <div className="ml-3 text-muted-foreground">Looking up definition...</div>
                    </div>
                ) : (
                    <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={getFormattedDefinition()}
                    />
                )}
            </CardContent>
        </Card>
    );
};
