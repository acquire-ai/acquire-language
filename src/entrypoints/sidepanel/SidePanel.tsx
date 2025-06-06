import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X, Volume2 } from 'lucide-react';
import { createAIService } from '@/services/ai';
import { getSettings } from '@/core/config/settings';
import type { AIService } from '@/core/types/ai';

interface WordAnalysis {
    word: string;
    definition: string;
    context?: string;
    timestamp?: number;
}

export const SidePanel: React.FC = () => {
    const [currentAnalysis, setCurrentAnalysis] = useState<WordAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiService, setAiService] = useState<AIService | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

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

    // Check for pending word analysis from storage (fallback window mode)
    useEffect(() => {
        const checkPendingAnalysis = async () => {
            const result = await browser.storage.local.get('pendingWordAnalysis');
            if (result.pendingWordAnalysis) {
                const { word, context } = result.pendingWordAnalysis;
                // Clear the pending analysis
                await browser.storage.local.remove('pendingWordAnalysis');
                // Analyze the word
                analyzeWord(word, context);
            }
        };

        checkPendingAnalysis();
    }, [aiService]);

    // Listen for messages from content script
    useEffect(() => {
        const handleMessage = async (message: any) => {
            if (message.type === 'ANALYZE_WORD') {
                const { word, context } = message.data;
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

        // Generate unique analysis ID to handle concurrent requests
        const analysisId = `${word}-${Date.now()}`;
        setCurrentAnalysisId(analysisId);

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
                        // Check if this is still the current analysis
                        if (currentAnalysisId === analysisId) {
                            streamedDefinition += chunk;
                            setCurrentAnalysis((prev) => ({
                                ...prev!,
                                definition: streamedDefinition,
                            }));
                        }
                    },
                );

                // Only update state if this is still the current analysis
                if (currentAnalysisId === analysisId) {
                    setIsStreaming(false); // Streaming completed
                }
            } else {
                // Fallback to non-streaming
                const definition = await aiService.getWordDefinition(
                    word,
                    context || '',
                    targetLanguage,
                );

                // Only update if this is still the current analysis
                if (currentAnalysisId === analysisId) {
                    setCurrentAnalysis({
                        word,
                        definition,
                        context,
                        timestamp: Date.now(),
                    });
                }
            }
        } catch (err) {
            // Only show error if this is still the current analysis
            if (currentAnalysisId === analysisId) {
                setError(err instanceof Error ? err.message : 'Failed to analyze word');
                setIsStreaming(false);
            }
        } finally {
            if (currentAnalysisId === analysisId) {
                setIsLoading(false);
            }
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

    const handleClose = () => {
        // Send message to close sidepanel
        browser.runtime.sendMessage({ type: 'CLOSE_SIDEPANEL' });
        // If in popup window mode, close the window
        if (window.opener === null) {
            window.close();
        }
    };

    const handlePronounce = () => {
        if (!currentAnalysis) return;

        const utterance = new SpeechSynthesisUtterance(currentAnalysis.word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold gradient-text">Word Analysis</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="hover-lift"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {isLoading && (
                    <Card className="card-glow gradient-border">
                        <CardContent className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="ml-3 text-lg">Analyzing word...</span>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Card className="border-destructive">
                        <CardContent className="py-6">
                            <p className="text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {currentAnalysis && !isLoading && (
                    <Card className="card-glow gradient-border">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-3xl font-bold gradient-text">
                                    {currentAnalysis.word}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handlePronounce}
                                        className="hover-lift btn-bounce"
                                        title="Pronounce"
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={
                                            savedWords.has(currentAnalysis.word)
                                                ? 'secondary'
                                                : 'default'
                                        }
                                        size="icon"
                                        onClick={handleSaveWord}
                                        disabled={savedWords.has(currentAnalysis.word)}
                                        className="hover-lift btn-bounce enhanced-button"
                                        title={
                                            savedWords.has(currentAnalysis.word)
                                                ? 'Saved'
                                                : 'Save word'
                                        }
                                    >
                                        <Save className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {currentAnalysis.context && (
                                <div className="p-4 bg-muted rounded-lg">
                                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                                        Context:
                                    </h3>
                                    <p className="text-sm italic">{currentAnalysis.context}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold mb-2 text-primary">
                                    Definition & Explanation:
                                </h3>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">
                                        {currentAnalysis.definition}
                                        {/* Show blinking cursor when streaming */}
                                        {isStreaming && (
                                            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5" />
                                        )}
                                    </p>
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
    );
};
