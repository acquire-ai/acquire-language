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
├── src/                           # 源代码目录
│   ├── core/                      # 核心模块
│   │   ├── types/                 # 类型定义
│   │   │   ├── ai.ts              # AI服务相关类型
│   │   │   ├── platform.ts        # 平台和字幕处理器接口
│   │   │   └── storage.ts         # 存储相关类型
│   │   ├── storage/               # 存储相关
│   │   │   └── index.ts           # 存储管理器
│   │   └── utils/                 # 工具函数
│   │       └── index.ts           # 通用工具函数
│   ├── services/                  # 服务模块
│   │   ├── ai/                    # AI服务
│   │   │   ├── index.ts           # 服务入口
│   │   │   ├── factory.ts         # 工厂方法
│   │   │   ├── deepseek.ts        # DeepSeek实现
│   │   │   └── gpt.ts             # GPT4o-mini实现
│   ├── platforms/                 # 视频平台处理模块
│   │   ├── base/                  # 基础类和接口
│   │   │   ├── platform-handler.tsx # 平台处理器基类
│   │   │   └── subtitle-handler.ts # 字幕处理基类
│   │   ├── youtube/               # YouTube平台实现
│   │   │   ├── index.ts           # YouTube平台处理器
│   │   │   └── subtitle-handler.ts # YouTube字幕处理器
│   │   ├── factory.ts             # 平台工厂
│   │   └── index.ts               # 平台模块入口
│   ├── components/                # UI组件
│   │   └── word-popup/            # 单词弹出组件
│   │       └── index.ts           # 单词弹出组件实现
│   ├── assets/                    # 静态资源
│   │   └── icons/                 # 图标资源
│   └── entrypoints/              # 扩展入口点
│       ├── background.ts          # 后台脚本
│       ├── content.ts             # 内容脚本
│       ├── popup/                 # 弹出窗口
│       ├── options/               # 选项页面
│       └── vocabulary/            # 生词本页面
├── public/                        # 公共资源
├── .wxt/                          # WXT配置和缓存
├── node_modules/                  # 依赖包
├── package.json                   # 项目配置和依赖
├── tsconfig.json                  # TypeScript配置
├── tailwind.config.js             # Tailwind CSS配置
└── wxt.config.ts                  # WXT配置
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
- 注入和管理样式
- **单词点击交互**：使字幕中的单词可点击，点击后显示单词释义
- **集成 AI 服务**：调用 AI 模型获取单词的上下文相关释义
- **鼠标悬停暂停**：当鼠标悬停在字幕上时自动暂停视频，离开时恢复播放

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
  
  // 添加到文档
  document.body.appendChild(this.subtitleContainer);
}
```

```typescript
// 示例：添加单词点击事件
private addWordClickEvents() {
  if (!this.subtitleContainer) return;
  
  const wordElements = this.subtitleContainer.querySelectorAll('.acquire-language-word');
  
  wordElements.forEach(element => {
    element.addEventListener('click', async (event) => {
      // 阻止事件冒泡
      event.stopPropagation();
      
      // 获取单词和位置
      const word = element.getAttribute('data-word') || '';
      const rect = element.getBoundingClientRect();
      const position = {
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 10
      };
      
      // 显示加载状态
      this.wordPopup.showLoading(word, position);
      
      // 获取单词释义
      try {
        // 调用 AI 服务获取释义
        const definition = await this.aiService.getWordDefinition(
          word, 
          this.currentSubtitle,
          this.settings.targetLanguage
        );
        
        // 显示单词释义
        this.wordPopup.show(word, definition, position);
      } catch (error) {
        console.error('获取单词释义失败:', error);
        this.wordPopup.show(word, `获取释义失败: ${error.message}`, position);
      }
    });
  });
}
```

```typescript
// 示例：添加字幕悬停事件 - 暂停视频
private addSubtitleHoverEvents() {
  if (!this.subtitleContainer) return;

  // 记录视频播放状态
  let wasPlaying = false;

  // 鼠标进入字幕区域时暂停视频
  this.subtitleContainer.addEventListener('mouseenter', () => {
    const video = document.querySelector('video');
    if (video) {
      wasPlaying = !video.paused;
      if (wasPlaying) {
        video.pause();
      }
    }
  });

  // 鼠标离开字幕区域时恢复视频播放
  this.subtitleContainer.addEventListener('mouseleave', () => {
    const video = document.querySelector('video');
    if (video && wasPlaying) {
      video.play();
      wasPlaying = false;
    }
  });
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

### 7. AI 服务 (ai.ts)

AI 服务模块负责与 AI 模型（如 OpenAI GPT-4o-mini 或 DeepSeek）交互，提供以下功能：

- **单词释义**：根据上下文获取单词的详细释义，使用用户的母语解释目标语言中的单词
- **文本翻译**：将字幕文本翻译成用户的母语

```typescript
// AI 服务接口
export interface AIService {
  getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string>;
  translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;
}

// 创建 AI 服务
export function createAIService(model: string, apiKey: string): AIService {
  switch (model) {
    case 'deepseek':
      return new DeepSeekAIService(apiKey);
    case 'gpt-4o-mini':
      return new GPT4oMiniAIService(apiKey);
    default:
      return new DeepSeekAIService(apiKey);
  }
}

// 示例：获取单词释义
async getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string> {
  try {
    // 从存储中获取设置，获取用户的母语
    const result = await browser.storage.local.get('settings');
    const settings = result.settings || { nativeLanguage: 'zh-CN' };
    const nativeLanguage = settings.nativeLanguage;
    
    // 构建提示
    const prompt = `
请根据以下上下文，解释单词 "${word}" 的含义。
上下文: "${context}"
请用${this.getLanguageName(nativeLanguage)}回答，简洁明了地解释这个单词在当前上下文中的含义。
请提供以下信息：
1. 单词的基本含义
2. 在当前上下文中的具体含义
3. 词性 (名词、动词、形容词等)
4. 一到两个例句
`;
    
    // 调用 AI API
    const response = await this.callAPI(prompt);
    return response;
  } catch (error) {
    console.error('获取单词释义失败:', error);
    return `获取 "${word}" 的释义失败`;
  }
}
```

### 8. 单词弹出组件 (WordPopup.ts)

单词弹出组件负责显示单词的详细释义，提供以下功能：

- **显示加载状态**：在获取释义时显示加载动画
- **显示单词释义**：以美观的方式展示单词的释义、例句和翻译
- **添加到生词本**：允许用户将单词添加到生词本
- **智能定位**：根据字幕位置自动调整弹出框位置，避免遮挡字幕

```typescript
// 示例：智能定位弹出框
private setPosition(position: { x: number, y: number }) {
  // ... 其他代码 ...
  
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
  }
  // ... 其他代码 ...
}
```

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

4. **单词释义流程**：
   - 用户点击字幕中的单词
   - 字幕处理器捕获点击事件，获取单词和上下文
   - 调用 AI 服务获取单词释义
   - AI 服务从存储中获取用户的母语设置
   - AI 服务使用用户的母语解释目标语言中的单词
   - 显示单词释义弹出框
   - 用户可以将单词添加到生词本

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

4. **支持新的 AI 模型**：
   - 在 `ai.ts` 中创建新的 AI 服务类，实现 `AIService` 接口
   - 在 `createAIService` 函数中添加新模型的支持
   - 在选项页面中添加新模型选项

5. **增强单词释义功能**：
   - 修改 AI 提示以获取更详细的单词信息
   - 更新 `WordPopup` 组件以显示更丰富的内容
   - 添加发音、图片等多媒体内容

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

## 用户体验功能

扩展提供了多种增强用户体验的功能：

1. **字幕增强**：
   - 美观的字幕显示
   - 单词可点击，获取释义
   - 鼠标悬停效果，突出显示单词

2. **学习辅助**：
   - 鼠标悬停在字幕上时自动暂停视频，方便用户专注学习
   - 离开字幕区域时自动恢复播放
   - 单词释义弹出框智能定位，避免遮挡字幕

3. **生词本管理**：
   - 一键添加单词到生词本
   - 保存单词的上下文
   - 方便后续复习 