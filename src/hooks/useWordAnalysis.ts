import { useReducer, useState, useEffect, useCallback } from 'react';
import { createAIService } from '@/services/ai';
import { getSettings } from '@/core/config/settings';
import { AIService } from '@/core/types/ai';
import { dictionaryService } from '@/services/dictionary';
import type { TraditionalDefinitionEntry } from '@/core/types/dictionary';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface WordAnalysis {
    word: string;
    definition: string;
    context?: string;
    timestamp?: number;
}

interface WordAnalysisState {
    isOpen: boolean;
    currentAnalysis: WordAnalysis | null;
    isLoadingAI: boolean;
    isLoadingTraditional: boolean;
    error: string | null;
    traditionalDefinitions: TraditionalDefinitionEntry[] | null;
    ukPhonetic: string | null;
    usPhonetic: string | null;
    savedWords: Set<string>;
}

type WordAnalysisAction =
    | { type: 'SET_OPEN'; payload: boolean }
    | { type: 'SET_CURRENT_ANALYSIS'; payload: WordAnalysis | null }
    | { type: 'SET_LOADING_AI'; payload: boolean }
    | { type: 'SET_LOADING_TRADITIONAL'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_TRADITIONAL_DEFINITIONS'; payload: TraditionalDefinitionEntry[] | null }
    | { type: 'SET_PHONETICS'; payload: { uk: string | null; us: string | null } }
    | { type: 'ADD_SAVED_WORD'; payload: string }
    | { type: 'RESET_ANALYSIS' }
    | { type: 'START_ANALYSIS'; payload: { word: string; context?: string } };

const initialState: WordAnalysisState = {
    isOpen: true,
    currentAnalysis: null,
    isLoadingAI: false,
    isLoadingTraditional: false,
    error: null,
    traditionalDefinitions: null,
    ukPhonetic: null,
    usPhonetic: null,
    savedWords: new Set(),
};

function wordAnalysisReducer(
    state: WordAnalysisState,
    action: WordAnalysisAction,
): WordAnalysisState {
    switch (action.type) {
        case 'SET_OPEN':
            return { ...state, isOpen: action.payload };
        case 'SET_CURRENT_ANALYSIS':
            return { ...state, currentAnalysis: action.payload };
        case 'SET_LOADING_AI':
            return { ...state, isLoadingAI: action.payload };
        case 'SET_LOADING_TRADITIONAL':
            return { ...state, isLoadingTraditional: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_TRADITIONAL_DEFINITIONS':
            return { ...state, traditionalDefinitions: action.payload };
        case 'SET_PHONETICS':
            return {
                ...state,
                ukPhonetic: action.payload.uk,
                usPhonetic: action.payload.us,
            };
        case 'ADD_SAVED_WORD':
            return {
                ...state,
                savedWords: new Set([...state.savedWords, action.payload]),
            };
        case 'RESET_ANALYSIS':
            return {
                ...state,
                currentAnalysis: null,
                isLoadingAI: false,
                isLoadingTraditional: false,
                error: null,
                traditionalDefinitions: null,
                ukPhonetic: null,
                usPhonetic: null,
            };
        case 'START_ANALYSIS':
            return {
                ...state,
                currentAnalysis: {
                    word: action.payload.word,
                    definition: '',
                    context: action.payload.context,
                    timestamp: Date.now(),
                },
                isLoadingAI: true,
                isLoadingTraditional: true,
                error: null,
                traditionalDefinitions: null,
                ukPhonetic: null,
                usPhonetic: null,
            };
        default:
            return state;
    }
}

export const useWordAnalysis = () => {
    const [state, dispatch] = useReducer(wordAnalysisReducer, initialState);
    const [aiService, setAiService] = useState<AIService | null>(null);

    // Initialize AI service
    useEffect(() => {
        const initAIService = async () => {
            try {
                const settings = await getSettings();
                const defaultServer =
                    settings.aiServers.find((server) => server.isDefault) || settings.aiServers[0];

                if (defaultServer) {
                    const service = createAIService(defaultServer);
                    setAiService(service);
                }
            } catch (error) {
                console.error('Failed to initialize AI service:', error);
            }
        };

        initAIService();
    }, []);

    // Check for pending word analysis from storage on initialization
    useEffect(() => {
        const checkPendingAnalysis = async () => {
            if (!aiService) return;

            try {
                const result = await browser.storage.local.get('pendingWordAnalysis');
                if (result.pendingWordAnalysis) {
                    const { word, context } = result.pendingWordAnalysis;

                    // Clear the pending analysis
                    await browser.storage.local.remove('pendingWordAnalysis');

                    // Analyze the word
                    analyzeWord(word, context);
                }
            } catch (error) {
                console.error('Failed to check pending analysis:', error);
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

    const analyzeWord = useCallback(
        async (word: string, context?: string) => {
            // Start analysis
            dispatch({ type: 'START_ANALYSIS', payload: { word, context } });

            if (!aiService) {
                dispatch({ type: 'SET_ERROR', payload: 'AI service not initialized' });
                dispatch({ type: 'SET_LOADING_AI', payload: false });
                dispatch({ type: 'SET_LOADING_TRADITIONAL', payload: false });
                return;
            }

            // Fetch dictionary definition in parallel
            const fetchDictionaryDefinition = async () => {
                try {
                    const dictResponse = await dictionaryService.getDefinition(word);
                    if (dictResponse) {
                        dispatch({
                            type: 'SET_TRADITIONAL_DEFINITIONS',
                            payload: dictResponse.definitions,
                        });
                        dispatch({
                            type: 'SET_PHONETICS',
                            payload: {
                                uk: dictResponse.phonetics.uk || null,
                                us: dictResponse.phonetics.us || null,
                            },
                        });
                    }
                } catch (err) {
                    console.error('Failed to fetch dictionary definition:', err);
                } finally {
                    dispatch({ type: 'SET_LOADING_TRADITIONAL', payload: false });
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

                    dispatch({
                        type: 'SET_CURRENT_ANALYSIS',
                        payload: {
                            word,
                            definition,
                            context,
                            timestamp: Date.now(),
                        },
                    });
                } catch (err) {
                    const errorMessage =
                        err instanceof Error ? err.message : 'Failed to analyze word';
                    dispatch({ type: 'SET_ERROR', payload: errorMessage });
                } finally {
                    dispatch({ type: 'SET_LOADING_AI', payload: false });
                }
            };

            // Run both in parallel
            await Promise.all([fetchDictionaryDefinition(), fetchAIDefinition()]);
        },
        [aiService],
    );

    const handleSaveWord = useCallback(async () => {
        if (!state.currentAnalysis) return;

        try {
            await browser.runtime.sendMessage({
                type: 'SAVE_WORD',
                word: state.currentAnalysis.word,
                context: state.currentAnalysis.context || '',
                definition: state.currentAnalysis.definition,
            });

            dispatch({ type: 'ADD_SAVED_WORD', payload: state.currentAnalysis.word });
        } catch (err) {
            console.error('Failed to save word:', err);
        }
    }, [state.currentAnalysis]);

    const handleClose = useCallback(() => {
        dispatch({ type: 'SET_OPEN', payload: false });
    }, []);

    const handleAIChatResponse = useCallback(
        async (
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

            return await aiService.getChatResponse(
                message,
                word,
                context,
                chatHistory,
                targetLanguage,
            );
        },
        [aiService],
    );

    return {
        // State
        isOpen: state.isOpen,
        currentAnalysis: state.currentAnalysis,
        isLoadingAI: state.isLoadingAI,
        isLoadingTraditional: state.isLoadingTraditional,
        error: state.error,
        traditionalDefinitions: state.traditionalDefinitions,
        ukPhonetic: state.ukPhonetic,
        usPhonetic: state.usPhonetic,
        savedWords: state.savedWords,

        // Actions
        analyzeWord,
        handleSaveWord,
        handleClose,
        handleAIChatResponse,
    };
};
