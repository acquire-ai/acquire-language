export function translatePrompt(word: string, context: string, nativeLanguage: string) {
    const prompt = `Please explain the meaning of the word "${word}" based on the following context.
        Context: "${context}"
Please answer in ${nativeLanguage}, explaining the word's meaning in the current context concisely.
Please provide the following information using Markdown format but DO NOT use code blocks:

        1. ** Basic meaning **
            Brief explanation of the word's general meaning

    2. ** Meaning in current context **
        The specific meaning in this context

    3. ** Part of speech **
        Noun, verb, adjective, etc.

4. ** Example sentences **
        - One example(with translation)
    - Another example(with translation)
`
    return prompt;
}
