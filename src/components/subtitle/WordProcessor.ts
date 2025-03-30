/**
 * 字幕单词处理器
 * 负责将字幕文本处理成可交互的单词
 */
export class WordProcessor {
    private readonly wordRegex = /([a-zA-Z]+('[a-zA-Z]+)?)/g;

    /**
     * 处理字幕文本
     * @param text 原始字幕文本
     * @returns 处理后的HTML
     */
    public processText(text: string): string {
        if (!text) return '';

        // 替换换行符为<br>
        text = text.replace(/\n/g, '<br>');

        // 用span包裹每个单词，添加类和data属性
        const enhancedResult = `
            <div style="
                display: inline-block;
                max-width: 80%;
                padding: 5px 10px;
                border-radius: 4px;
                background-color: rgba(0, 0, 0, 0.7);
                font-weight: bold;
                color: white;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            ">
                ${text.replace(this.wordRegex, this.wrapWord.bind(this))}
            </div>
        `;
        
        return enhancedResult;
    }

    /**
     * 给单词加上span包装
     * @param match 匹配到的单词
     * @returns 包装后的HTML
     */
    private wrapWord(match: string): string {
        const normalizedWord = match.toLowerCase();

        return `<span 
            class="acquire-language-word" 
            data-word="${normalizedWord}" 
            style="
                cursor: pointer;
                text-decoration: none;
                padding: 0 1px;
                border-radius: 2px;
                transition: background-color 0.2s, color 0.2s;
            "
            onmouseover="this.style.backgroundColor='rgba(255, 255, 255, 0.2)';"
            onmouseout="this.style.backgroundColor='transparent';"
        >${match}</span>`;
    }
} 