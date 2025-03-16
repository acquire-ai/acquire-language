/**
 * 习得语言 (Acquire Language) WXT 配置文件
 */
import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  // 使用 Chrome 扩展 API
  extensionApi: "chrome",

  // 使用 React 模块
  modules: ["@wxt-dev/module-react"],

  // Vite 配置
  vite: () => ({
    plugins: [tailwindcss()],
  }),

  // 添加静态资源配置，确保 public 目录中的文件被复制到构建输出
  publicDir: "public",

  // 扩展清单配置
  manifest: {
    // 扩展名称
    name: "习得语言 (Acquire Language)",

    // 扩展描述
    description: "通过观看视频学习语言的 Chrome 扩展 - 增强字幕显示",

    // 版本号
    version: "0.0.1",
    permissions: ["storage", "tabs", "scripting", "webRequest"],
    host_permissions: ["*://*.youtube.com/*"],
  },
});
