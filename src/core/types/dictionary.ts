/**
 * Dictionary related types
 */

export interface TraditionalDefinitionEntry {
    type: string; // e.g., "noun", "verb", "adjective"
    text: string; // The definition text
}

export interface DictionaryResponse {
    word: string;
    phonetics: {
        uk?: string;
        us?: string;
    };
    definitions: TraditionalDefinitionEntry[];
}

export interface DictionaryService {
    getDefinition(word: string): Promise<DictionaryResponse | null>;
}
