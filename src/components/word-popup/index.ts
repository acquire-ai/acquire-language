/**
 * 单词释义弹出组件
 * 
 * 用于在用户点击单词时显示单词的详细释义。
 */

// 引入 marked 库进行 Markdown 渲染
import {marked} from 'marked';

export class WordPopup {
  private popupElement: HTMLElement | null = null;
  private closeTimeout: number | null = null;
  
  constructor() {
    // 创建弹出元素
    this.createPopupElement();
    
    // 初始化 marked 配置
    this.initMarked();
    
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
    // 如果已经存在，则先移除
    if (this.popupElement) {
      this.popupElement.remove();
    }
    
    // 创建弹出元素
    this.popupElement = document.createElement('div');
    this.popupElement.id = 'acquire-language-word-popup';
    this.popupElement.style.cssText = `
      position: absolute;
      z-index: 10000;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      max-width: 400px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
    `;
    
    // 添加到文档
    document.body.appendChild(this.popupElement);
  }
  
  /**
   * 初始化 marked 配置
   */
  private initMarked() {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }
  
  /**
   * 显示加载状态
   * @param word 单词
   * @param position 位置
   */
  showLoading(word: string, position: { x: number, y: number }) {
    if (!this.popupElement) return;
    
    // 设置内容
    this.popupElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${word}</h3>
        <button id="acquire-language-close-popup" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">×</button>
      </div>
      <div style="display: flex; justify-content: center; padding: 20px 0;">
        <div class="acquire-language-loading" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: acquire-language-spin 1s linear infinite;"></div>
      </div>
      <style>
        @keyframes acquire-language-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    // 设置位置
    this.setPosition(position);
    
    // 显示弹出框
    this.popupElement.style.display = 'block';
    
    // 添加关闭按钮事件
    const closeButton = document.getElementById('acquire-language-close-popup');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
  }
  
  /**
   * 显示单词释义
   * @param word 单词
   * @param definition 释义
   * @param position 位置
   */
  show(word: string, definition: string, position: { x: number, y: number }) {
    if (!this.popupElement) return;
    
    // 渲染 Markdown
    const renderedDefinition = marked.parse(definition);
    
    // 设置内容
    this.popupElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${word}</h3>
        <div>
          <button id="acquire-language-save-word" style="background: none; border: none; cursor: pointer; font-size: 14px; color: #3498db; margin-right: 8px;">保存</button>
          <button id="acquire-language-close-popup" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">×</button>
        </div>
      </div>
      <div class="acquire-language-definition" style="margin-top: 8px;">
        ${renderedDefinition}
      </div>
    `;
    
    // 设置位置
    this.setPosition(position);
    
    // 显示弹出框
    this.popupElement.style.display = 'block';
    
    // 添加关闭按钮事件
    const closeButton = document.getElementById('acquire-language-close-popup');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
    
    // 添加保存按钮事件
    const saveButton = document.getElementById('acquire-language-save-word');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.saveWord(word);
        saveButton.textContent = '已保存';
        saveButton.style.color = '#27ae60';
        (saveButton as HTMLButtonElement).disabled = true;
      });
    }
    
    // 清除自动关闭定时器
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }
  
  /**
   * 隐藏弹出框
   */
  hide() {
    if (this.popupElement) {
      this.popupElement.style.display = 'none';
    }
  }
  
  /**
   * 设置弹出框位置
   * @param position 位置
   */
  private setPosition(position: { x: number, y: number }) {
    if (!this.popupElement) return;
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 获取弹出框尺寸
    const popupRect = this.popupElement.getBoundingClientRect();
    const popupWidth = popupRect.width;
    const popupHeight = popupRect.height;
    
    // 计算左侧位置，确保不超出视口
    let left = position.x;
    if (left + popupWidth > viewportWidth) {
      left = viewportWidth - popupWidth - 10;
    }
    if (left < 10) left = 10;
    
    // 计算顶部位置，确保不超出视口
    let top = position.y;
    if (top + popupHeight > viewportHeight) {
      top = position.y - popupHeight - 10;
    }
    if (top < 10) top = 10;
    
    // 查找字幕容器
    const subtitleContainer = document.getElementById('acquire-language-subtitle');
    
    // 如果找到字幕容器，将弹出框放在字幕上方
    if (subtitleContainer) {
      const subtitleRect = subtitleContainer.getBoundingClientRect();
      
      // 计算弹出框应该放置的垂直位置 - 字幕容器上方留出一定间距
      const topPosition = subtitleRect.top + window.scrollY - popupRect.height - 20;
      
      // 如果计算出的位置是负数（超出屏幕顶部），则放在字幕下方
      if (topPosition < 0) {
        this.popupElement.style.top = `${subtitleRect.bottom + window.scrollY + 20}px`;
      } else {
        this.popupElement.style.top = `${topPosition}px`;
      }
      
      // 水平居中
      const centerPosition = subtitleRect.left + (subtitleRect.width / 2) - (popupWidth / 2);
      this.popupElement.style.left = `${Math.max(10, centerPosition)}px`;
    } else {
      // 如果没有找到字幕容器，使用计算的位置
      this.popupElement.style.left = `${left}px`;
      this.popupElement.style.top = `${top}px`;
    }
  }
  
  /**
   * 保存单词到生词本
   * @param word 单词
   */
  private saveWord(word: string) {
    // 获取当前字幕作为上下文
    const subtitleContainer = document.getElementById('acquire-language-subtitle');
    let context = '';
    
    if (subtitleContainer) {
      context = subtitleContainer.textContent || '';
    }
    
    // 发送消息到后台脚本
    browser.runtime.sendMessage({
      type: 'SAVE_WORD',
      word,
      context,
    }).then(response => {
      console.log('保存单词响应:', response);
    }).catch(error => {
      console.error('保存单词失败:', error);
    });
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    if (this.popupElement) {
      this.popupElement.remove();
      this.popupElement = null;
    }
    
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }
} 