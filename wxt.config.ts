/**
 * 习得语言 (Acquire Language) WXT 配置文件
 */
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  // 使用 Chrome 扩展 API
  extensionApi: 'chrome',
  
  // 使用 React 模块
  modules: ['@wxt-dev/module-react'],
  
  // Vite 配置
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
  
  // 扩展清单配置
  manifest: {
    // 扩展名称
    name: '习得语言 (Acquire Language)',
    
    // 扩展描述
    description: '通过观看视频学习语言的 Chrome 扩展 - 增强字幕显示',
    
    // 版本号
    version: '0.0.1',
    permissions: ['storage', 'tabs'],
    host_permissions: ['*://*.youtube.com/*'],
  },
});
