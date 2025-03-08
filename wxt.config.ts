import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
  manifest: {
    name: '习得语言 (Acquire Language)',
    description: '通过观看视频学习语言的 Chrome 扩展',
    version: '0.0.1',
    permissions: ['storage', 'tabs'],
    host_permissions: ['*://*.youtube.com/*'],
  },
});
