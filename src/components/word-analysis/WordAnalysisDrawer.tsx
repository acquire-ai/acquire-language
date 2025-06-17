import React, { useState, useEffect } from 'react';
import { createAIService } from '@/services/ai';
import { getSettings } from '@/core/config/settings';
import { AIService } from '@/core/types/ai';
import { dictionaryService } from '@/services/dictionary';
import type { TraditionalDefinitionEntry } from '@/core/types/dictionary';
import WordDefinitionDrawer from './WordDefinitionDrawer';

interface WordAnalysis {
    word: string;
    definition: string;
    context?: string;
    timestamp?: number;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface WordAnalysisDrawerProps {
    onClose?: () => void;
}

export const WordAnalysisDrawer: React.FC<WordAnalysisDrawerProps> = ({
    onClose: onCloseCallback,
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [currentAnalysis, setCurrentAnalysis] = useState<WordAnalysis | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isLoadingTraditional, setIsLoadingTraditional] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiService, setAiService] = useState<AIService | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

    // Dictionary data
    const [traditionalDefinitions, setTraditionalDefinitions] = useState<
        TraditionalDefinitionEntry[] | null
    >(null);
    const [ukPhonetic, setUkPhonetic] = useState<string | null>(null);
    const [usPhonetic, setUsPhonetic] = useState<string | null>(null);

    // Reset isOpen when component mounts
    useEffect(() => {
        setIsOpen(true);
    }, []);

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
    }, [aiService]);

    // Listen for messages from content script
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

        setIsLoadingAI(true);
        setIsLoadingTraditional(true);
        setError(null);

        // Reset previous data
        setTraditionalDefinitions(null);
        setUkPhonetic(null);
        setUsPhonetic(null);

        // Fetch dictionary definition in parallel
        const fetchDictionaryDefinition = async () => {
            try {
                const dictResponse = await dictionaryService.getDefinition(word);
                if (dictResponse) {
                    setTraditionalDefinitions(dictResponse.definitions);
                    setUkPhonetic(dictResponse.phonetics.uk || null);
                    setUsPhonetic(dictResponse.phonetics.us || null);
                }
            } catch (err) {
                console.error('Failed to fetch dictionary definition:', err);
            } finally {
                setIsLoadingTraditional(false);
            }
        };

        // Fetch AI definition
        const fetchAIDefinition = async () => {
            try {
                const settings = await getSettings();
                const targetLanguage = settings.general?.nativeLanguage || 'zh-CN';

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
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to analyze word');
            } finally {
                setIsLoadingAI(false);
            }
        };

        // Run both in parallel
        await Promise.all([fetchDictionaryDefinition(), fetchAIDefinition()]);
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
        setIsOpen(false);
        // Don't call window.close() here
        // The parent component should handle the actual unmounting
        if (onCloseCallback) {
            // Give time for the closing animation to complete
            setTimeout(() => {
                onCloseCallback();
            }, 300);
        }
    };

    // Handle AI chat functionality
    const handleAIChatResponse = async (
        message: string,
        word: string,
        context: string,
        history: ChatMessage[],
    ): Promise<string> => {
        if (!aiService || !aiService.getChatResponse) {
            throw new Error('Chat functionality not available');
        }

        const settings = await getSettings();
        const targetLanguage = settings.general?.nativeLanguage || 'zh-CN';

        const chatHistory = history.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));

        return await aiService.getChatResponse(message, word, context, chatHistory, targetLanguage);
    };

    const getPortalContainer = () => {
        const shadowHost = document.getElementById('acquire-language-overlay-root');
        const portalContainer =
            shadowHost?.shadowRoot?.getElementById('react-root') || document.body;
        console.log('Portal container:', portalContainer, 'Shadow host:', shadowHost);
        return portalContainer;
    };

    return (
        <WordDefinitionDrawer
            isOpen={isOpen}
            onClose={handleClose}
            word={currentAnalysis?.word || null}
            contextSentence={currentAnalysis?.context || null}
            traditionalDefinitionEntries={traditionalDefinitions}
            ukPhonetic={ukPhonetic}
            usPhonetic={usPhonetic}
            aiContextualDefinition={currentAnalysis?.definition || null}
            isLoadingTraditional={isLoadingTraditional}
            isLoadingAI={isLoadingAI}
            onChatMessage={handleAIChatResponse}
            onSaveWord={handleSaveWord}
            isSaved={currentAnalysis ? savedWords.has(currentAnalysis.word) : false}
            portalContainer={getPortalContainer()}
        />
    );
};
