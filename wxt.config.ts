/**
 * Acquire Language WXT Configuration File
 */
import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import { config } from 'dotenv';

const env = config().parsed || {};

const acquireEnv = Object.fromEntries(
  Object.entries(env).filter(([key]) => key.startsWith('ACQUIRE_'))
);

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  // Use Chrome extension API
  extensionApi: "chrome",

  // Use React module
  modules: ["@wxt-dev/module-react"],

  // Vite configuration
  vite: () => ({
    plugins: [tailwindcss()],
    define: {
      'window.__ENV__': acquireEnv
    }
  }),

  // Add static resource configuration to ensure files in public directory are copied to build output
  publicDir: "public",

  // Extension manifest configuration
  manifest: {
    // Extension name
    name: "习得语言 (Acquire Language)",

    // Extension description
    description: "通过观看视频学习语言的 Chrome 扩展 - 增强字幕显示",

    // Version number
    version: "0.0.1",
    permissions: ["storage", "tabs", "scripting", "webRequest"],
    host_permissions: ["*://*.youtube.com/*"],
  },
});
