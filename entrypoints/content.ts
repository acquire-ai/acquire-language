/**
 * 习得语言 (Acquire Language) 内容脚本
 * 
 * 这个脚本在 YouTube 页面上运行，负责初始化字幕处理器。
 * 它检测 YouTube 视频页面，并在视频播放器加载后启动字幕增强功能。
 */
import { defineContentScript } from 'wxt/sandbox';
import { YouTubeSubtitleHandler } from './content/youtube';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  
  main() {

    if (window.location.pathname.includes('/watch')) {

      if (document.readyState === 'complete') {
        initializeHandler();
      } else {
        window.addEventListener('load', () => {
          initializeHandler();
        });
      }
      
      // 监听 URL 变化（YouTube 是单页应用）
      monitorUrlChanges();
    } else {
      console.log('当前不是 YouTube 视频页面，不初始化字幕处理器');
    }
    
    /**
     * 监听 URL 变化
     */
    function monitorUrlChanges() {
      let lastUrl = window.location.href;
      
      // 使用 MutationObserver 监听 DOM 变化，可能表示 URL 变化
      new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
          lastUrl = window.location.href;

          if (window.location.pathname.includes('/watch')) {
            console.log('检测到新的 YouTube 视频页面，重新初始化字幕处理器');
            initializeHandler();
          }
        }
      }).observe(document, { subtree: true, childList: true });
    }
    
    /**
     * 初始化字幕处理器
     */
    function initializeHandler() {

      // 等待视频播放器加载
      waitForVideoPlayer();
    }
    
    /**
     * 等待视频播放器加载
     */
    function waitForVideoPlayer() {
      const checkForVideoPlayer = setInterval(() => {
        const videoPlayer = document.querySelector('video');
        if (videoPlayer) {
          clearInterval(checkForVideoPlayer);
          
          // 初始化 YouTube 字幕处理器
          new YouTubeSubtitleHandler();
        }
      }, 1000);
      
      // 设置超时，避免无限等待
      setTimeout(() => {
        clearInterval(checkForVideoPlayer);
        new YouTubeSubtitleHandler();
      }, 10000);
    }
  },
});
