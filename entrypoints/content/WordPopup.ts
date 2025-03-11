/**
 * 单词释义弹出组件
 * 
 * 用于在用户点击单词时显示单词的详细释义。
 */

export class WordPopup {
  private popupElement: HTMLElement | null = null;
  private closeTimeout: number | null = null;
  
  constructor() {
    // 创建弹出元素
    this.createPopupElement();
    
    // 监听点击事件，点击弹出框外部时关闭
    document.addEventListener('click', (event) => {
      if (this.popupElement && 
          event.target instanceof Node && 
          !this.popupElement.contains(event.target) &&
          !(event.target as HTMLElement).classList.contains('acquire-language-word')) {
        this.hide();
      }
    });
  }
  
  /**
   * 创建弹出元素
   */
  private createPopupElement() {
    console.log('WordPopup: 创建弹出元素');
    
    // 检查是否已存在
    const existingPopup = document.getElementById('acquire-language-word-popup');
    if (existingPopup) {
      console.log('WordPopup: 弹出元素已存在，使用现有元素');
      this.popupElement = existingPopup;
      return;
    }
    
    // 创建弹出元素
    this.popupElement = document.createElement('div');
    this.popupElement.id = 'acquire-language-word-popup';
    
    // 确保初始状态为隐藏
    this.popupElement.style.display = 'none';
    
    // 添加到文档
    document.body.appendChild(this.popupElement);
    console.log('WordPopup: 弹出元素已创建并添加到文档');
    
    // 添加样式
    this.injectStyles();
  }
  
  /**
   * 注入样式
   */
  private injectStyles() {
    const styleId = 'acquire-language-popup-styles';
    
    // 检查样式表是否已存在
    if (document.getElementById(styleId)) {
      return;
    }
    
    // 创建样式元素
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #acquire-language-word-popup {
        position: absolute;
        z-index: 2147483647;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 0;
        max-width: 350px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        color: #333;
        display: none;
        overflow: hidden;
        transition: opacity 0.2s ease;
      }
      
      .acquire-language-popup-header {
        background-color: #f8f9fa;
        padding: 10px 15px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .acquire-language-popup-word {
        font-weight: bold;
        font-size: 16px;
      }
      
      .acquire-language-popup-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 0;
        margin: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .acquire-language-popup-close:hover {
        background-color: #eee;
        color: #666;
      }
      
      .acquire-language-popup-content {
        padding: 15px;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .acquire-language-popup-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .acquire-language-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .acquire-language-popup-phonetic {
        color: #666;
        font-style: italic;
        margin-bottom: 10px;
      }
      
      .acquire-language-popup-part-of-speech {
        font-weight: 500;
        color: #2c3e50;
        margin-bottom: 5px;
      }
      
      .acquire-language-popup-definitions {
        margin: 0 0 15px 0;
        padding-left: 20px;
      }
      
      .acquire-language-popup-definitions li {
        margin-bottom: 5px;
      }
      
      .acquire-language-popup-examples-title,
      .acquire-language-popup-translations-title,
      .acquire-language-popup-related-title {
        font-weight: 500;
        margin-top: 10px;
        margin-bottom: 5px;
        color: #2c3e50;
      }
      
      .acquire-language-popup-examples,
      .acquire-language-popup-translations {
        margin: 0 0 15px 0;
        padding-left: 20px;
        color: #555;
      }
      
      .acquire-language-popup-examples li,
      .acquire-language-popup-translations li {
        margin-bottom: 5px;
        font-style: italic;
      }
      
      .acquire-language-popup-related-words {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 15px;
      }
      
      .acquire-language-popup-related-word {
        background-color: #f1f8ff;
        border: 1px solid #c8e1ff;
        border-radius: 12px;
        padding: 3px 8px;
        font-size: 12px;
        cursor: pointer;
      }
      
      .acquire-language-popup-related-word:hover {
        background-color: #dbedff;
      }
      
      .acquire-language-popup-footer {
        padding: 10px 15px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
      }
      
      .acquire-language-popup-save {
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .acquire-language-popup-save:hover {
        background-color: #45a049;
      }
      
      .acquire-language-popup-save:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      
      /* 新增样式 - 格式化单词释义 */
      .acquire-language-popup-section-title {
        font-weight: 600;
        color: #2c3e50;
        margin: 12px 0 8px 0;
        padding-bottom: 4px;
        border-bottom: 1px solid #eee;
        font-size: 15px;
      }
      
      .acquire-language-popup-section-title:first-child {
        margin-top: 0;
      }
      
      .acquire-language-popup-item {
        margin: 8px 0;
        padding-left: 15px;
        position: relative;
      }
      
      .acquire-language-popup-item:before {
        content: "•";
        position: absolute;
        left: 0;
        color: #4CAF50;
      }
      
      .acquire-language-popup-paragraph {
        margin: 8px 0;
        line-height: 1.5;
      }
      
      .acquire-language-popup-error {
        color: #e74c3c;
        padding: 10px;
        text-align: center;
      }
      
      /* 例句样式 */
      .acquire-language-popup-section-title + .acquire-language-popup-paragraph,
      .acquire-language-popup-section-title + .acquire-language-popup-item {
        font-style: italic;
        color: #555;
      }
      
      /* 词性样式 */
      .acquire-language-popup-section-title:nth-of-type(3) + .acquire-language-popup-paragraph,
      .acquire-language-popup-section-title:nth-of-type(3) + .acquire-language-popup-item {
        font-weight: 500;
        color: #3498db;
      }
      
      /* 例句样式 */
      .acquire-language-popup-example {
        margin: 10px 0;
        padding-left: 15px;
        position: relative;
      }
      
      .acquire-language-popup-example:before {
        content: "•";
        position: absolute;
        left: 0;
        color: #4CAF50;
      }
      
      .acquire-language-popup-example-english {
        font-style: italic;
        margin-bottom: 4px;
      }
      
      .acquire-language-popup-example-chinese {
        color: #666;
        font-size: 13px;
      }
    `;
    
    // 添加到文档头部
    document.head.appendChild(style);
  }
  
  /**
   * 显示加载状态
   * @param word 查询的单词
   * @param position 显示位置
   */
  public showLoading(word: string, position: { x: number, y: number }) {
    if (!this.popupElement) {
      console.error('无法显示加载状态: popupElement 不存在');
      return;
    }
    
    console.log(`WordPopup: 显示 "${word}" 的加载状态`);
    
    // 设置内容
    this.popupElement.innerHTML = `
      <div class="acquire-language-popup-header">
        <span class="acquire-language-popup-word">${word}</span>
        <button class="acquire-language-popup-close">×</button>
      </div>
      <div class="acquire-language-popup-content">
        <div class="acquire-language-popup-loading">
          <div class="acquire-language-spinner"></div>
          <span>正在获取释义...</span>
        </div>
      </div>
    `;
    
    // 设置位置
    this.setPosition(position);
    
    // 显示弹出框
    this.popupElement.style.display = 'block';
    
    // 添加关闭按钮事件
    const closeButton = this.popupElement.querySelector('.acquire-language-popup-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
  }
  
  /**
   * 显示单词释义
   * @param word 单词
   * @param definition 单词释义
   * @param position 显示位置
   */
  public show(word: string, definition: string, position: { x: number, y: number }) {
    if (!this.popupElement) {
      console.error('无法显示单词释义: popupElement 不存在');
      return;
    }
    
    console.log(`WordPopup: 显示 "${word}" 的释义`);
    
    // 清除自动关闭定时器
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    
    // 格式化释义内容
    const formattedDefinition = this.formatDefinition(definition);
    
    // 设置内容
    this.popupElement.innerHTML = `
      <div class="acquire-language-popup-header">
        <span class="acquire-language-popup-word">${word}</span>
        <button class="acquire-language-popup-close">×</button>
      </div>
      <div class="acquire-language-popup-content">
        ${formattedDefinition}
      </div>
      <div class="acquire-language-popup-footer">
        <button class="acquire-language-popup-save">添加到生词本</button>
      </div>
    `;
    
    // 设置位置
    this.setPosition(position);
    
    // 显示弹出框
    this.popupElement.style.display = 'block';
    console.log('WordPopup: 弹出框已显示');
    
    // 添加事件监听
    this.addEventListeners(word, definition);
  }
  
  /**
   * 格式化单词释义
   * @param definition AI 返回的单词释义
   * @returns 格式化后的 HTML
   */
  private formatDefinition(definition: string): string {
    // 如果定义为空或出错，直接返回
    if (!definition || definition.includes('获取') && definition.includes('失败')) {
      return `<div class="acquire-language-popup-error">${definition}</div>`;
    }

    try {
      console.log('格式化单词释义:', definition);
      
      // 分割成段落
      let paragraphs = definition.split(/\n+/);
      paragraphs = paragraphs.map(p => p.trim()).filter(p => p);
      
      // 识别结构
      let sections = {
        basicMeaning: [],
        contextMeaning: [],
        partOfSpeech: [],
        examples: []
      };
      
      let currentSection = null;
      
      // 第一遍：识别各个部分
      for (let paragraph of paragraphs) {
        // 识别部分标题
        if (paragraph.includes('单词的基本含义') || paragraph.includes('基本含义') || /^1\./.test(paragraph)) {
          currentSection = 'basicMeaning';
          continue;
        } else if (paragraph.includes('在当前上下文中的具体含义') || paragraph.includes('上下文含义') || /^2\./.test(paragraph)) {
          currentSection = 'contextMeaning';
          continue;
        } else if (paragraph.includes('词性') || /^3\./.test(paragraph)) {
          currentSection = 'partOfSpeech';
          continue;
        } else if (paragraph.includes('例句') || /^4\./.test(paragraph)) {
          currentSection = 'examples';
          continue;
        }
        
        // 如果已经识别了部分，添加内容
        if (currentSection && paragraph) {
          sections[currentSection].push(paragraph);
        }
      }
      
      // 如果没有识别出结构，使用简单的分段显示
      if (!currentSection) {
        return paragraphs.map(p => `<p class="acquire-language-popup-paragraph">${p}</p>`).join('');
      }
      
      // 构建格式化的 HTML
      let html = '';
      
      // 基本含义部分
      if (sections.basicMeaning.length > 0) {
        html += `<h3 class="acquire-language-popup-section-title">基本含义</h3>`;
        html += sections.basicMeaning.map(p => {
          // 移除可能的编号
          p = p.replace(/^\d+[\.\)]\s*/, '');
          return `<div class="acquire-language-popup-item">${p}</div>`;
        }).join('');
      }
      
      // 上下文含义部分
      if (sections.contextMeaning.length > 0) {
        html += `<h3 class="acquire-language-popup-section-title">上下文含义</h3>`;
        html += sections.contextMeaning.map(p => {
          p = p.replace(/^\d+[\.\)]\s*/, '');
          return `<div class="acquire-language-popup-item">${p}</div>`;
        }).join('');
      }
      
      // 词性部分
      if (sections.partOfSpeech.length > 0) {
        html += `<h3 class="acquire-language-popup-section-title">词性</h3>`;
        html += sections.partOfSpeech.map(p => {
          p = p.replace(/^\d+[\.\)]\s*/, '');
          return `<div class="acquire-language-popup-item">${p}</div>`;
        }).join('');
      }
      
      // 例句部分
      if (sections.examples.length > 0) {
        html += `<h3 class="acquire-language-popup-section-title">例句</h3>`;
        html += sections.examples.map(p => {
          // 处理例句，分离英文和中文翻译
          p = p.replace(/^\d+[\.\)]\s*/, '');
          
          // 尝试分离英文例句和中文翻译
          const parts = p.split(/[（(]|[)）]/);
          if (parts.length >= 2) {
            const english = parts[0].trim();
            const chinese = parts[1].trim();
            return `
              <div class="acquire-language-popup-example">
                <div class="acquire-language-popup-example-english">${english}</div>
                <div class="acquire-language-popup-example-chinese">${chinese}</div>
              </div>
            `;
          }
          
          return `<div class="acquire-language-popup-item">${p}</div>`;
        }).join('');
      }
      
      // 如果没有生成任何内容，返回原始文本
      if (!html) {
        return paragraphs.map(p => `<p class="acquire-language-popup-paragraph">${p}</p>`).join('');
      }
      
      return html;
    } catch (error) {
      console.error('格式化单词释义失败:', error);
      // 出错时返回原始内容，但使用段落格式
      return definition.split(/\n+/).map(p => {
        p = p.trim();
        return p ? `<p class="acquire-language-popup-paragraph">${p}</p>` : '';
      }).join('');
    }
  }
  
  /**
   * 隐藏弹出框
   */
  public hide() {
    if (this.popupElement) {
      console.log('WordPopup: 隐藏弹出框');
      this.popupElement.style.display = 'none';
    }
    
    // 清除自动关闭定时器
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }
  
  /**
   * 设置弹出框位置
   * @param position 位置坐标
   */
  private setPosition(position: { x: number, y: number }) {
    if (!this.popupElement) return;
    
    console.log(`WordPopup: 设置位置 x=${position.x}, y=${position.y}`);
    
    // 获取窗口尺寸
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 获取字幕容器
    const subtitleContainer = document.getElementById('acquire-language-subtitle');
    
    // 设置初始位置 - 水平位置与点击位置相同，垂直位置默认在字幕上方
    this.popupElement.style.left = `${position.x}px`;
    
    // 等待下一帧，确保弹出框已渲染
    requestAnimationFrame(() => {
      if (!this.popupElement) return;
      
      // 获取弹出框尺寸
      const popupRect = this.popupElement.getBoundingClientRect();
      console.log(`WordPopup: 弹出框尺寸 width=${popupRect.width}, height=${popupRect.height}`);
      
      // 调整水平位置，确保不超出窗口
      if (position.x + popupRect.width > windowWidth) {
        console.log(`WordPopup: 调整水平位置，避免超出窗口右侧`);
        this.popupElement.style.left = `${windowWidth - popupRect.width - 10}px`;
      }
      
      // 如果找到字幕容器，将弹出框放在字幕上方
      if (subtitleContainer) {
        const subtitleRect = subtitleContainer.getBoundingClientRect();
        console.log(`WordPopup: 字幕容器位置 top=${subtitleRect.top}, height=${subtitleRect.height}`);
        
        // 计算弹出框应该放置的垂直位置 - 字幕容器上方留出一定间距
        const topPosition = subtitleRect.top + window.scrollY - popupRect.height - 20;
        
        // 如果计算出的位置是负数（超出屏幕顶部），则放在字幕下方
        if (topPosition < 0) {
          console.log(`WordPopup: 弹出框放置在字幕下方`);
          this.popupElement.style.top = `${subtitleRect.bottom + window.scrollY + 20}px`;
        } else {
          console.log(`WordPopup: 弹出框放置在字幕上方`);
          this.popupElement.style.top = `${topPosition}px`;
        }
      } else {
        // 如果找不到字幕容器，使用原来的逻辑
        this.popupElement.style.top = `${position.y}px`;
        
        // 调整垂直位置，确保不超出窗口
        if (position.y + popupRect.height > windowHeight) {
          console.log(`WordPopup: 调整垂直位置，避免超出窗口底部`);
          this.popupElement.style.top = `${position.y - popupRect.height - 10}px`;
        }
      }
    });
  }
  
  /**
   * 添加事件监听
   * @param word 单词
   * @param definition 释义
   */
  private addEventListeners(word: string, definition: string) {
    if (!this.popupElement) return;
    
    // 关闭按钮
    const closeButton = this.popupElement.querySelector('.acquire-language-popup-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
    
    // 保存到生词本按钮
    const saveButton = this.popupElement.querySelector('.acquire-language-popup-save');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        // 发送消息到后台脚本，保存单词到生词本
        browser.runtime.sendMessage({
          type: 'SAVE_WORD',
          word: word,
          context: definition
        }).then(() => {
          // 显示保存成功提示
          if (saveButton instanceof HTMLElement) {
            saveButton.textContent = '已添加';
            saveButton.disabled = true;
            
            // 2秒后自动关闭
            this.closeTimeout = window.setTimeout(() => {
              this.hide();
            }, 2000);
          }
        });
      });
    }
  }
} 