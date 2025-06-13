import type {
    DictionaryService,
    DictionaryResponse,
    TraditionalDefinitionEntry,
} from '@/core/types/dictionary';

/**
 * Free Dictionary API service implementation
 */
export class FreeDictionaryService implements DictionaryService {
    private readonly API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

    async getDefinition(word: string): Promise<DictionaryResponse | null> {
        try {
            const response = await fetch(`${this.API_URL}/${encodeURIComponent(word)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // Word not found
                }
                throw new Error(`Dictionary API error: ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                return null;
            }

            const entry = data[0];

            // Extract phonetics
            const phonetics: { uk?: string; us?: string } = {};
            if (entry.phonetics && Array.isArray(entry.phonetics)) {
                for (const phonetic of entry.phonetics) {
                    if (phonetic.text) {
                        if (
                            phonetic.audio?.includes('-uk.') ||
                            phonetic.audio?.includes('uk.mp3')
                        ) {
                            phonetics.uk = phonetic.text;
                        } else if (
                            phonetic.audio?.includes('-us.') ||
                            phonetic.audio?.includes('us.mp3')
                        ) {
                            phonetics.us = phonetic.text;
                        } else if (!phonetics.uk && !phonetics.us) {
                            // Default to US if no specific region is identified
                            phonetics.us = phonetic.text;
                        }
                    }
                }
            }

            // Extract definitions
            const definitions: TraditionalDefinitionEntry[] = [];
            if (entry.meanings && Array.isArray(entry.meanings)) {
                for (const meaning of entry.meanings) {
                    const partOfSpeech = meaning.partOfSpeech || 'unknown';
                    if (meaning.definitions && Array.isArray(meaning.definitions)) {
                        for (const def of meaning.definitions) {
                            if (def.definition) {
                                definitions.push({
                                    type: partOfSpeech,
                                    text: def.definition,
                                });
                            }
                        }
                    }
                }
            }

            return {
                word: entry.word || word,
                phonetics,
                definitions,
            };
        } catch (error) {
            console.error('Failed to fetch dictionary definition:', error);
            return null;
        }
    }
}

// Export singleton instance
export const dictionaryService = new FreeDictionaryService();
