import { defineContentScript } from 'wxt/sandbox';
import { YouTubeSubtitleHandler } from './content/youtube';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main() {
    console.log('习得语言 (Acquire Language) 内容脚本已加载');
    console.log('当前页面 URL:', window.location.href);
    
    // 检查是否在 YouTube 视频页面
    if (window.location.pathname.includes('/watch')) {
      console.log('检测到 YouTube 视频页面，准备初始化字幕处理器');
      
      // 等待页面完全加载
      if (document.readyState === 'complete') {
        initializeHandler();
      } else {
        window.addEventListener('load', () => {
          console.log('页面加载完成，初始化字幕处理器');
          initializeHandler();
        });
      }
      
      // 监听 URL 变化（YouTube 是单页应用）
      let lastUrl = window.location.href;
      new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
          lastUrl = window.location.href;
          console.log('URL 变化，重新检查是否为视频页面:', lastUrl);
          
          if (window.location.pathname.includes('/watch')) {
            console.log('检测到新的 YouTube 视频页面，重新初始化字幕处理器');
            initializeHandler();
          }
        }
      }).observe(document, { subtree: true, childList: true });
    } else {
      console.log('当前不是 YouTube 视频页面，不初始化字幕处理器');
    }
    
    // 初始化字幕处理器
    function initializeHandler() {
      console.log('开始初始化 YouTube 字幕处理器');
      
      // 等待视频播放器加载
      const checkForVideoPlayer = setInterval(() => {
        const videoPlayer = document.querySelector('video');
        if (videoPlayer) {
          console.log('找到视频播放器，初始化字幕处理器');
          clearInterval(checkForVideoPlayer);
          
          // 初始化 YouTube 字幕处理器
          const subtitleHandler = new YouTubeSubtitleHandler();
        }
      }, 1000);
      
      // 设置超时，避免无限等待
      setTimeout(() => {
        clearInterval(checkForVideoPlayer);
        console.log('等待视频播放器超时，尝试直接初始化字幕处理器');
        const subtitleHandler = new YouTubeSubtitleHandler();
      }, 10000);
    }
  },
});
