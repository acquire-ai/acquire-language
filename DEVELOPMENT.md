# 习得语言 (Acquire Language) 开发文档

## 项目概述

习得语言（Acquire Language）是一个 Chrome 扩展，旨在帮助用户通过观看视频（目前支持 YouTube）学习语言。扩展通过增强视频字幕、提供单词释义、生词本等功能，为语言学习者创造沉浸式学习环境。

## 技术栈

- **前端框架**：React 19
- **开发语言**：TypeScript
- **样式**：Tailwind CSS
- **构建工具**：WXT (Web Extension Tools)
- **打包工具**：Vite

## 项目结构

```
acquire-language/
├── assets/              # 静态资源文件
├── entrypoints/         # 扩展的各个入口点
│   ├── background.ts    # 后台脚本
│   ├── content.ts       # 内容脚本（注入到网页中）
│   ├── content/         # 内容脚本相关模块
│   │   └── youtube.ts   # YouTube 字幕处理器
│   ├── options/         # 选项页面
│   ├── popup/           # 弹出窗口
│   ├── services/        # 服务模块
│   └── vocabulary/      # 生词本页面
├── public/              # 公共资源
├── .wxt/                # WXT 配置和缓存
├── node_modules/        # 依赖包
├── package.json         # 项目配置和依赖
├── tsconfig.json        # TypeScript 配置
├── tailwind.config.js   # Tailwind CSS 配置
└── wxt.config.ts        # WXT 配置
```

## 核心模块说明

### 1. 后台脚本 (background.ts)

后台脚本在扩展的生命周期内持续运行，负责：

- 处理来自内容脚本的消息
- 管理生词本数据（保存、获取）
- 提供全局状态管理

```typescript
// 示例：保存单词到生词本
async function saveWordToVocabulary(word: string, context: string) {
  const vocabulary = await getVocabulary();
  
  if (vocabulary[word]) {
    vocabulary[word].contexts.push(context);
  } else {
    vocabulary[word] = {
      word,
      contexts: [context],
      createdAt: new Date().toISOString(),
    };
  }
  
  await browser.storage.local.set({ vocabulary });
}
```

### 2. 内容脚本 (content.ts)

内容脚本注入到匹配的网页中（目前是 YouTube 视频页面），负责：

- 检测 YouTube 视频页面
- 初始化字幕处理器
- 监听 URL 变化（YouTube 是单页应用）

```typescript
// 示例：初始化字幕处理器
function initializeHandler() {
  // 等待视频播放器加载
  waitForVideoPlayer();
}
```

### 3. YouTube 字幕处理器 (youtube.ts)

YouTube 字幕处理器是扩展的核心功能模块，负责：

- 查找并处理 YouTube 原始字幕
- 创建自定义字幕容器
- 监听字幕变化
- 提供字幕增强功能（单词查询、翻译等）

```typescript
// 示例：创建自定义字幕容器
private createSubtitleContainer() {
  // 查找原始字幕容器
  this.findOriginalSubtitleContainer();
  // 隐藏 YouTube 原始字幕
  this.hideYouTubeSubtitles();

  // 创建自定义字幕容器
  this.subtitleContainer = document.createElement('div');
  this.subtitleContainer.id = 'acquire-language-subtitle';
  
  // 设置样式...
}
```

### 4. 选项页面 (options/)

选项页面允许用户自定义扩展的行为，包括：

- 设置母语和目标语言
- 设置语言水平 (A1-C2)
- 配置 AI 模型和 API 密钥
- 自定义字幕样式（大小、位置、颜色、透明度）

```typescript
// 设置接口
interface Settings {
  nativeLanguage: string;
  targetLanguage: string;
  languageLevel: string;
  aiModel: string;
  apiKey: string;
  subtitleSettings: {
    fontSize: number;
    position: 'top' | 'bottom';
    backgroundColor: string;
    textColor: string;
    opacity: number;
  };
}
```

### 5. 生词本页面 (vocabulary/)

生词本页面显示用户保存的单词，提供以下功能：

- 查看保存的单词列表
- 查看单词的上下文
- 删除单词
- 搜索单词

```typescript
// 单词接口
interface Word {
  word: string;
  contexts: string[];
  createdAt: string;
}

// 生词本接口
interface VocabularyData {
  [key: string]: Word;
}
```

### 6. 弹出窗口 (popup/)

弹出窗口是用户点击扩展图标时显示的界面，提供快速访问：

- 打开 YouTube
- 访问生词本
- 打开设置页面

## 数据流

1. **字幕处理流程**：
   - 内容脚本检测 YouTube 视频页面
   - 初始化 YouTubeSubtitleHandler
   - 处理器查找并隐藏原始字幕
   - 创建自定义字幕容器
   - 监听字幕变化并更新显示

2. **单词保存流程**：
   - 用户在字幕中点击单词
   - 内容脚本发送消息到后台脚本
   - 后台脚本保存单词到 browser.storage.local
   - 生词本页面从 storage 读取数据并显示

3. **设置流程**：
   - 用户在选项页面修改设置
   - 设置保存到 browser.storage.local
   - 内容脚本和后台脚本读取设置并应用

## 开发指南

### 添加新功能

1. **支持新的视频平台**：
   - 在 `entrypoints/content.ts` 中添加新的匹配规则
   - 创建新的字幕处理器（类似 `YouTubeSubtitleHandler`）
   - 实现平台特定的字幕查找和处理逻辑

2. **添加新的语言**：
   - 在 `entrypoints/options/Options.tsx` 的 `LANGUAGES` 数组中添加新语言

3. **扩展生词本功能**：
   - 修改 `Word` 接口添加新属性
   - 更新 `Vocabulary.tsx` 组件显示新属性
   - 在后台脚本中更新保存逻辑

### 调试技巧

1. **查看扩展日志**：
   - 打开 Chrome 扩展管理页面 (`chrome://extensions`)
   - 点击扩展的"查看视图"按钮
   - 选择"背景页"或其他视图查看控制台日志

2. **调试内容脚本**：
   - 在 YouTube 页面打开开发者工具
   - 查看控制台日志
   - 使用断点调试 JavaScript

3. **测试设置变更**：
   - 修改设置后，刷新 YouTube 页面以应用新设置
   - 检查 `browser.storage.local` 中的设置是否正确保存

## 构建和发布

### 开发模式

```bash
npm run dev
```

这将启动 WXT 开发服务器，自动重新加载扩展。

### 构建生产版本

```bash
npm run build
```

这将在 `.output` 目录中生成生产版本的扩展。

### 打包扩展

```bash
npm run zip
```

这将创建一个可以上传到 Chrome Web Store 的 ZIP 文件。

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 常见问题

1. **字幕不显示**：
   - 检查 YouTube 是否启用了字幕
   - 检查控制台是否有错误
   - 尝试刷新页面

2. **设置不生效**：
   - 确保保存设置后刷新 YouTube 页面
   - 检查 `browser.storage.local` 中的设置是否正确保存

3. **扩展加载失败**：
   - 检查 `manifest.json` 是否有语法错误
   - 确保所有依赖都已安装 (`npm install`) 