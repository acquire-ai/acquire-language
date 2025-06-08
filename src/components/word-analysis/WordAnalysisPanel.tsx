import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Volume2 } from 'lucide-react';
import { createAIService } from '@/services/ai';
import { getSettings } from '@/core/config/settings';
import { AIService } from '@/core/types/ai';
import { marked } from 'marked';

// Configure marked options
marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // Enable GitHub Flavored Markdown
});

interface WordAnalysis {
    word: string;
    definition: string;
    context?: string;
    timestamp?: number;
}

export const WordAnalysisPanel: React.FC = () => {
    const [currentAnalysis, setCurrentAnalysis] = useState<WordAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiService, setAiService] = useState<AIService | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

    // Initialize AI service
    useEffect(() => {
        const initAIService = async () => {
            const settings = await getSettings();
            const defaultServer =
                settings.aiServers.find((server) => server.isDefault) || settings.aiServers[0];

            if (defaultServer) {
                const service = createAIService(defaultServer);
                setAiService(service);
            }
        };

        initAIService();
    }, []);

    // Check for pending word analysis from storage on initialization
    useEffect(() => {
        const checkPendingAnalysis = async () => {
            if (!aiService) return;

            const result = await browser.storage.local.get('pendingWordAnalysis');
            if (result.pendingWordAnalysis) {
                const { word, context } = result.pendingWordAnalysis;
                console.log('Found pending word analysis:', word);

                // Clear the pending analysis
                await browser.storage.local.remove('pendingWordAnalysis');

                // Analyze the word
                analyzeWord(word, context);
            }
        };

        checkPendingAnalysis();
    }, [aiService]); // Depend on aiService so it runs after AI service is initialized

    // Listen for messages from content script (for subsequent word clicks when sidepanel is already open)
    useEffect(() => {
        const handleMessage = async (message: any) => {
            if (message.type === 'ANALYZE_WORD') {
                const { word, context } = message.data;
                console.log('Received ANALYZE_WORD message:', word);
                analyzeWord(word, context);
            }
        };

        browser.runtime.onMessage.addListener(handleMessage);

        return () => {
            browser.runtime.onMessage.removeListener(handleMessage);
        };
    }, [aiService]);

    const analyzeWord = async (word: string, context?: string) => {
        if (!aiService) {
            setError('AI service not initialized');
            return;
        }

        setIsLoading(true);
        setIsStreaming(false);
        setError(null);

        try {
            const settings = await getSettings();
            const targetLanguage = settings.general?.nativeLanguage || 'zh-CN';

            // Check if streaming is supported
            if (aiService.getWordDefinitionStream) {
                // Use streaming
                let streamedDefinition = '';

                // Set initial analysis with empty definition
                setCurrentAnalysis({
                    word,
                    definition: '',
                    context,
                    timestamp: Date.now(),
                });

                setIsLoading(false); // Stop loading spinner since we're streaming
                setIsStreaming(true); // Start streaming

                await aiService.getWordDefinitionStream(
                    word,
                    context || '',
                    targetLanguage,
                    (chunk: string) => {
                        streamedDefinition += chunk;
                        setCurrentAnalysis((prev) => ({
                            ...prev!,
                            definition: streamedDefinition,
                        }));
                    },
                );

                setIsStreaming(false); // Streaming completed
            } else {
                // Fallback to non-streaming
                const definition = await aiService.getWordDefinition(
                    word,
                    context || '',
                    targetLanguage,
                );

                setCurrentAnalysis({
                    word,
                    definition,
                    context,
                    timestamp: Date.now(),
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze word');
            setIsStreaming(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveWord = async () => {
        if (!currentAnalysis) return;

        try {
            await browser.runtime.sendMessage({
                type: 'SAVE_WORD',
                word: currentAnalysis.word,
                context: currentAnalysis.context || '',
                definition: currentAnalysis.definition,
            });

            setSavedWords(new Set([...savedWords, currentAnalysis.word]));
        } catch (err) {
            console.error('Failed to save word:', err);
        }
    };

    const handlePronounce = () => {
        if (!currentAnalysis) return;

        const utterance = new SpeechSynthesisUtterance(currentAnalysis.word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    };

    return (
        <div className="min-h-screen bg-background p-3">
            <div className="max-w-2xl mx-auto h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-lg font-bold gradient-text">Word Analysis</h1>
                </div>

                <div className="flex-1 overflow-auto">
                    {isLoading && (
                        <Card className="card-glow gradient-border">
                            <CardContent className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="ml-3">Analyzing word...</span>
                            </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Card className="border-destructive">
                            <CardContent className="py-4">
                                <p className="text-destructive text-sm">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {currentAnalysis && !isLoading && (
                        <Card className="card-glow gradient-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between">
                                    <span className="text-xl font-bold gradient-text">
                                        {currentAnalysis.word}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePronounce}
                                            className="hover-lift btn-bounce"
                                            title="Pronounce"
                                        >
                                            <Volume2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant={
                                                savedWords.has(currentAnalysis.word)
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                            size="sm"
                                            onClick={handleSaveWord}
                                            disabled={savedWords.has(currentAnalysis.word)}
                                            className="hover-lift btn-bounce enhanced-button"
                                            title={
                                                savedWords.has(currentAnalysis.word)
                                                    ? 'Saved'
                                                    : 'Save word'
                                            }
                                        >
                                            <Save className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                {currentAnalysis.context && (
                                    <details className="group">
                                        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                            <span className="transition-transform group-open:rotate-90">
                                                ▶
                                            </span>
                                            Context
                                        </summary>
                                        <div className="mt-2 pl-4 border-l-2 border-muted">
                                            <p className="text-sm text-muted-foreground italic">
                                                {currentAnalysis.context}
                                            </p>
                                        </div>
                                    </details>
                                )}

                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold mb-3 text-primary flex items-center gap-2">
                                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                                        Definition & Explanation
                                    </h3>
                                    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                                        <div
                                            className="text-sm"
                                            dangerouslySetInnerHTML={{
                                                __html: marked(currentAnalysis.definition || ''),
                                            }}
                                        />
                                        {/* Show blinking cursor when streaming */}
                                        {isStreaming && (
                                            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!currentAnalysis && !isLoading && !error && (
                        <Card className="card-glow gradient-border">
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">
                                    Click on any word in the subtitles to see its definition and
                                    explanation.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
