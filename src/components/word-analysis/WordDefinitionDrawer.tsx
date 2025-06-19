'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    BookOpen,
    Star,
    Volume2,
    Loader2,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Send,
    XIcon,
    PanelLeftOpen,
    PanelRightClose,
} from 'lucide-react';
import { ShadowThemeToggle } from '@/components/settings/theme-toggle';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Separator } from '@/components/ui/separator';
import type { TraditionalDefinitionEntry } from '@/core/types/dictionary';
// Import Card components
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/core/utils';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface WordDefinitionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    word: string | null;
    contextSentence: string | null;
    traditionalDefinitionEntries: TraditionalDefinitionEntry[] | null;
    ukPhonetic: string | null;
    usPhonetic: string | null;
    aiContextualDefinition: string | null;
    isLoadingTraditional: boolean;
    isLoadingAI: boolean;
    onChatMessage?: (
        message: string,
        word: string,
        context: string,
        history: ChatMessage[],
    ) => Promise<string>;
    onSaveWord?: () => void;
    isSaved?: boolean;
    portalContainer?: HTMLElement | null;
}

function getElementChain(element: HTMLElement): string[] {
    const chain: string[] = [];
    let current: HTMLElement | null = element;
    while (current) {
        chain.push(
            `${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}${current.className ? `.${current.className.split(' ').join('.')}` : ''}`,
        );
        current = current.parentElement;
    }
    return chain;
}

const WordDefinitionDrawer: React.FC<WordDefinitionDrawerProps> = ({
    isOpen,
    onClose,
    word,
    contextSentence,
    traditionalDefinitionEntries,
    ukPhonetic,
    usPhonetic,
    aiContextualDefinition,
    isLoadingTraditional,
    isLoadingAI,
    onChatMessage,
    onSaveWord,
    isSaved = false,
    portalContainer,
}) => {
    const [streamedAIDefinition, setStreamedAIDefinition] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);
    const [pronouncingAccent, setPronouncingAccent] = useState<'UK' | 'US' | null>(null);
    const [isContextExpanded, setIsContextExpanded] = useState(false);

    // Mini Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentUserInput, setCurrentUserInput] = useState('');
    const [isAIChatting, setIsAIChatting] = useState(false);
    const [isDrawerMaximized, setIsDrawerMaximized] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoadingAI || !aiContextualDefinition) {
            setStreamedAIDefinition('');
            return;
        }
        let index = 0;
        setStreamedAIDefinition('');
        const intervalId = setInterval(() => {
            if (index < aiContextualDefinition.length) {
                const chunkSize = 3;
                setStreamedAIDefinition(aiContextualDefinition.substring(0, index + chunkSize));
                index += chunkSize;
            } else {
                clearInterval(intervalId);
            }
        }, 30);
        return () => clearInterval(intervalId);
    }, [aiContextualDefinition, isLoadingAI]);

    useEffect(() => {
        if (isOpen) {
            setIsFavorited(isSaved);
            setIsContextExpanded(false);
            setChatMessages([]);
            setCurrentUserInput('');
        }
    }, [word, isOpen, isSaved]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleFavoriteToggle = () => {
        if (onSaveWord && !isSaved) {
            onSaveWord();
        }
        setIsFavorited(!isFavorited);
    };

    const handlePlayPronunciation = (accent: 'UK' | 'US') => {
        if (!word || typeof window === 'undefined' || !window.speechSynthesis) return;
        setPronouncingAccent(accent);
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = accent === 'UK' ? 'en-GB' : 'en-US';
        utterance.onend = () => setPronouncingAccent(null);
        utterance.onerror = () => setPronouncingAccent(null);
        window.speechSynthesis.speak(utterance);
    };

    const handleSendChatMessage = async () => {
        const trimmedInput = currentUserInput.trim();
        if (!trimmedInput || isAIChatting) return;

        const newUserMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmedInput,
        };
        setChatMessages((prev) => [...prev, newUserMessage]);
        setCurrentUserInput('');
        setIsAIChatting(true);

        try {
            let aiResponseContent: string;

            if (onChatMessage) {
                aiResponseContent = await onChatMessage(
                    trimmedInput,
                    word || '',
                    contextSentence || '',
                    [...chatMessages, newUserMessage],
                );
            } else {
                aiResponseContent =
                    'Chat functionality is not available. Please configure an AI service.';
            }

            const newAIMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: aiResponseContent,
            };
            setChatMessages((prev) => [...prev, newAIMessage]);
        } catch (error) {
            console.error('Error fetching AI chat response:', error);
            const errorAIMessage: ChatMessage = {
                id: `assistant-error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
            };
            setChatMessages((prev) => [...prev, errorAIMessage]);
        } finally {
            setIsAIChatting(false);
        }
    };

    const renderLoadingSpinner = (text: string) => (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {text}
        </div>
    );

    // Add a test div to see if component is rendering
    if (!isOpen) {
        return null;
    }

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            modal={false}
        >
            <SheetContent
                className={cn(
                    'bg-card text-card-foreground border-l-primary/20 flex flex-col p-0',
                    'transition-[width] duration-500 ease-in-out',
                    isDrawerMaximized
                        ? '!w-1/3 !min-w-[600px] !max-w-[750px]'
                        : 'w-[380px] sm:w-[480px] md:w-[580px]',
                )}
                style={{
                    zIndex: 2147483647,
                }}
                portalContainer={portalContainer || undefined}
                onInteractOutside={(e) => {
                    // Prevent closing when clicking on elements that might be rendered outside by React Portals (e.g. some popovers)
                    const target = e.target as HTMLElement;
                    if (target.closest('[data-radix-popper-content-wrapper]')) {
                        e.preventDefault();
                    }
                }}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <SheetHeader className="p-3 sm:p-4 border-b sticky top-0 bg-card z-10 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <SheetTitle className="text-xl sm:text-2xl font-bold gradient-text tech-glow flex items-center">
                                <BookOpen className="mr-2 sm:mr-3 h-5 sm:h-6 w-5 sm:h-6 text-primary flex-shrink-0" />
                                {word || 'Definition'}
                            </SheetTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleFavoriteToggle}
                                disabled={!word}
                                className={`h-8 w-8 flex-shrink-0 ${
                                    isFavorited
                                        ? 'text-primary hover:text-primary/80'
                                        : 'text-muted-foreground hover:text-primary'
                                }`}
                                aria-label={
                                    isFavorited ? 'Remove from favorites' : 'Add to favorites'
                                }
                            >
                                <Star
                                    className={`h-5 w-5 transition-colors ${isFavorited ? 'fill-primary text-primary' : 'fill-transparent'}`}
                                />
                            </Button>
                        </div>
                        <div className="flex items-center gap-x-1 sm:gap-x-0">
                            <ShadowThemeToggle />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsDrawerMaximized(!isDrawerMaximized)}
                                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-primary"
                                aria-label={
                                    isDrawerMaximized
                                        ? 'Shrink drawer width'
                                        : 'Expand drawer width'
                                }
                            >
                                {isDrawerMaximized ? (
                                    <PanelRightClose className="h-5 w-5" />
                                ) : (
                                    <PanelLeftOpen className="h-5 w-5" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Close"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                                <XIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <div
                    ref={scrollAreaRef}
                    className="flex-grow overflow-y-auto px-3 sm:px-4 pt-1 sm:pt-2 pb-3 sm:pb-4 space-y-2.5"
                >
                    {/* Traditional Definition Section */}
                    <Card className="card-glow gradient-border">
                        <CardContent className="p-3 sm:p-4">
                            {(ukPhonetic || usPhonetic) && (
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {ukPhonetic && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePlayPronunciation('UK')}
                                            disabled={
                                                pronouncingAccent === 'UK' ||
                                                !word ||
                                                isLoadingTraditional
                                            }
                                            className="text-xs h-auto focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 flex-shrink-0 flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5"
                                        >
                                            {pronouncingAccent === 'UK' ? (
                                                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin flex-shrink-0" />
                                            ) : (
                                                <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                            )}
                                            <span className="flex-shrink-0">UK</span>
                                            <span className="text-[10px] text-muted-foreground font-mono select-all break-words min-w-0">
                                                {ukPhonetic}
                                            </span>
                                        </Button>
                                    )}
                                    {usPhonetic && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePlayPronunciation('US')}
                                            disabled={
                                                pronouncingAccent === 'US' ||
                                                !word ||
                                                isLoadingTraditional
                                            }
                                            className="text-xs h-auto focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 flex-shrink-0 flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5"
                                        >
                                            {pronouncingAccent === 'US' ? (
                                                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin flex-shrink-0" />
                                            ) : (
                                                <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                            )}
                                            <span className="flex-shrink-0">US</span>
                                            <span className="text-[10px] text-muted-foreground font-mono select-all break-words min-w-0">
                                                {usPhonetic}
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            )}
                            {isLoadingTraditional &&
                                (!traditionalDefinitionEntries ||
                                    traditionalDefinitionEntries.length === 0) &&
                                renderLoadingSpinner('Loading dictionary entry...')}
                            {!isLoadingTraditional &&
                                traditionalDefinitionEntries &&
                                traditionalDefinitionEntries.length > 0 && (
                                    <ul className="space-y-1.5 text-sm sm:text-base list-none p-0">
                                        {traditionalDefinitionEntries.map((entry, index) => (
                                            <li key={index} className="flex items-baseline">
                                                <span className="w-14 sm:w-16 font-medium text-muted-foreground flex-shrink-0 select-none">
                                                    {entry.type}
                                                </span>
                                                <span className="flex-grow break-words leading-relaxed">
                                                    {entry.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                        </CardContent>
                    </Card>

                    {/* AI Contextual Meaning Section - No Card Wrapper */}
                    <div className="ai-contextual-section">
                        {/* Header-like part (mimicking CardHeader) */}
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-accent">
                                <Sparkles className="h-4 w-4 text-accent/80" />
                                AI Contextual Explanation
                            </h3>
                            {contextSentence && (
                                <div className="pt-1 text-xs">
                                    <button
                                        onClick={() => setIsContextExpanded(!isContextExpanded)}
                                        className="flex items-center text-muted-foreground hover:text-accent transition-colors"
                                        aria-expanded={isContextExpanded}
                                        aria-controls="contextual-sentence-content"
                                    >
                                        {isContextExpanded ? (
                                            <ChevronUp className="h-3 w-3 mr-1 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="h-3 w-3 mr-1 flex-shrink-0" />
                                        )}
                                        <span>
                                            {isContextExpanded
                                                ? 'Hide Original Context'
                                                : 'Show Original Context'}
                                        </span>
                                    </button>
                                    {isContextExpanded && (
                                        <div
                                            id="contextual-sentence-content"
                                            className="mt-1.5 p-2 bg-muted/40 dark:bg-muted/25 rounded text-foreground/80 italic text-xs leading-relaxed"
                                        >
                                            "{contextSentence}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content part (mimicking CardContent) */}
                        <div className="">
                            {isLoadingAI && renderLoadingSpinner('AI is analyzing context...')}
                            {!isLoadingAI && streamedAIDefinition && (
                                <div className="prose prose-sm dark:prose-invert text-sm sm:text-base max-w-xl">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {streamedAIDefinition}
                                    </ReactMarkdown>
                                </div>
                            )}
                            {!isLoadingAI && !aiContextualDefinition && word && (
                                <p className="text-muted-foreground text-sm">
                                    AI could not determine contextual meaning for "{word}".
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Mini Chat Messages Area */}
                    {chatMessages.length > 0 && <Separator className="my-3" />}
                    <div className="space-y-2.5 text-sm">
                        {chatMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    'p-2 rounded-lg max-w-[85%] break-words shadow-sm',
                                    msg.role === 'user'
                                        ? 'bg-primary/10 text-primary-foreground self-end ml-auto' // text-primary-foreground might need adjustment depending on theme
                                        : 'bg-muted text-muted-foreground self-start mr-auto',
                                )}
                            >
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => <span {...props} />, // Ensure paragraphs in chat don't add extra margins
                                    }}
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        ))}
                        {isAIChatting && (
                            <div className="flex items-center self-start mr-auto pt-1">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                                <span className="text-xs text-muted-foreground">
                                    AI is typing...
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 border-t bg-card p-3 sm:p-4 sticky bottom-0 z-10">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendChatMessage();
                        }}
                        className="flex items-end gap-2"
                    >
                        <Textarea
                            placeholder={`Ask AI about "${word || 'this word'}"...`}
                            value={currentUserInput}
                            onChange={(e) => {
                                setCurrentUserInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendChatMessage();
                                }
                            }}
                            rows={1}
                            className="flex-grow resize-none overflow-y-auto py-2 px-3 text-sm min-h-[38px] max-h-[120px] leading-tight"
                            disabled={isAIChatting}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!currentUserInput.trim() || isAIChatting}
                            className="enhanced-button h-9 w-9 flex-shrink-0"
                            aria-label="Send message"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default WordDefinitionDrawer;
