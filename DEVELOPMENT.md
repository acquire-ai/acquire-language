# Acquire Language Development Documentation

## Project Overview

Acquire Language is a Chrome extension designed to help users learn languages through video content (currently supporting YouTube). The extension creates an immersive learning environment by enhancing video subtitles, providing word definitions, and offering a vocabulary notebook.

## Tech Stack

- **Frontend Framework**: React 19
- **Development Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: WXT (Web Extension Tools)
- **Bundler**: Vite

## Project Structure

```
acquire-language/
├── src/                           # Source code directory
│   ├── core/                      # Core modules
│   │   ├── types/                 # Type definitions
│   │   │   ├── ai.ts              # AI service types
│   │   │   ├── platform.ts        # Platform and subtitle handler interfaces
│   │   │   └── storage.ts         # Storage types
│   │   ├── storage/               # Storage related
│   │   │   └── index.ts           # Storage manager
│   │   └── utils/                 # Utility functions
│   │       └── index.ts           # Common utilities
│   ├── services/                  # Service modules
│   │   ├── ai/                    # AI services
│   │   │   ├── index.ts           # Service entry
│   │   │   ├── factory.ts         # Factory methods
│   │   │   ├── deepseek.ts        # DeepSeek implementation
│   │   │   └── gpt.ts             # GPT4o-mini implementation
│   │   ├── platforms/             # Video platform handlers
│   │   │   ├── base/              # Base classes and interfaces
│   │   │   │   ├── platform-handler.ts # Platform handler base class
│   │   │   │   └── subtitle-handler.ts # Subtitle handler base class
│   │   │   ├── youtube/           # YouTube platform implementation
│   │   │   │   ├── index.ts       # YouTube platform handler
│   │   │   │   └── subtitle-handler.ts # YouTube subtitle handler
│   │   │   ├── factory.ts         # Platform factory
│   │   │   └── index.ts           # Platform module entry
│   │   ├── components/            # UI components
│   │   │   └── word-popup/        # Word popup component
│   │   │       └── index.ts       # Word popup implementation
│   │   ├── assets/                # Static assets
│   │   │   └── icons/             # Icon resources
│   │   └── entrypoints/           # Extension entry points
│   │       ├── background.ts      # Background script
│   │       ├── content.ts         # Content script
│   │       ├── popup/             # Popup window
│   │       ├── options/           # Options page
│   │       └── vocabulary/        # Vocabulary notebook page
│   ├── public/                    # Public resources
│   ├── .wxt/                      # WXT config and cache
│   ├── node_modules/              # Dependencies
│   ├── package.json               # Project config and dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── tailwind.config.js         # Tailwind CSS config
│   └── wxt.config.ts              # WXT config
```

## Core Modules

### 1. Background Script (background.ts)

The background script runs throughout the extension's lifecycle, responsible for:

- Handling messages from content scripts
- Managing vocabulary data (save, retrieve)
- Providing global state management

```typescript
// Example: Save word to vocabulary
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

### 2. Content Script (content.ts)

The content script is injected into matching web pages (currently YouTube video pages), responsible for:

- Detecting YouTube video pages
- Initializing subtitle handlers
- Monitoring URL changes (YouTube is a SPA)

```typescript
// Example: Initialize subtitle handler
function initializeHandler() {
  // Wait for video player to load
  waitForVideoPlayer();
}
```

### 3. YouTube Subtitle Handler (youtube.ts)

The YouTube subtitle handler is the core functional module, responsible for:

- Finding and processing YouTube's original subtitles
- Creating custom subtitle containers
- Monitoring subtitle changes
- Providing subtitle enhancement features (word lookup, translation)
- Injecting and managing styles
- **Word Click Interaction**: Making words in subtitles clickable, showing definitions on click
- **AI Service Integration**: Calling AI models for context-aware word definitions
- **Hover Pause**: Automatically pausing video when hovering over subtitles, resuming on mouse leave

```typescript
// Example: Create custom subtitle container
private createSubtitleContainer() {
  // Find original subtitle container
  this.findOriginalSubtitleContainer();
  // Hide YouTube's original subtitles
  this.hideYouTubeSubtitles();

  // Create custom subtitle container
  this.subtitleContainer = document.createElement('div');
  this.subtitleContainer.id = 'acquire-language-subtitle';
  
  // Add to document
  document.body.appendChild(this.subtitleContainer);
}
```

### 4. Options Page (options/)

The options page allows users to customize extension behavior, including:

- Setting native and target languages
- Setting language proficiency level (A1-C2)
- Configuring AI model and API key
- Customizing subtitle styles (size, position, color, opacity)

```typescript
// Settings interface
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

### 5. Vocabulary Notebook Page (vocabulary/)

The vocabulary notebook page displays saved words, providing:

- View saved word list
- View word contexts
- Delete words
- Search words

```typescript
// Word interface
interface Word {
  word: string;
  contexts: string[];
  createdAt: string;
}

// Vocabulary interface
interface VocabularyData {
  [key: string]: Word;
}
```

### 6. Popup Window (popup/)

The popup window appears when clicking the extension icon, providing quick access to:

- Open YouTube
- Access vocabulary notebook
- Open settings page

### 7. AI Service (ai.ts)

The AI service module handles interactions with AI models (like OpenAI GPT-4o-mini or DeepSeek), providing:

- **Word Definitions**: Get detailed word definitions based on context, explaining target language words in the user's native language
- **Text Translation**: Translate subtitle text to the user's native language

```typescript
// AI service interface
export interface AIService {
  getWordDefinition(word: string, context: string, targetLanguage: string): Promise<string>;
  translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string>;
}

// Create AI service
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
```

## Data Flow

1. **Subtitle Processing Flow**:
   - Content script detects YouTube video page
   - Initializes YouTubeSubtitleHandler
   - Handler finds and hides original subtitles
   - Creates custom subtitle container
   - Monitors subtitle changes and updates display

2. **Word Saving Flow**:
   - User clicks word in subtitles
   - Content script sends message to background script
   - Background script saves word to browser.storage.local
   - Vocabulary page reads and displays data from storage

3. **Settings Flow**:
   - User modifies settings in options page
   - Settings saved to browser.storage.local
   - Content and background scripts read and apply settings

4. **Word Definition Flow**:
   - User clicks word in subtitles
   - Subtitle handler captures click event, gets word and context
   - Calls AI service for word definition
   - AI service gets user's native language from storage
   - AI service explains target language word in user's native language
   - Shows word definition popup
   - User can add word to vocabulary notebook

## Development Guide

### Adding New Features

1. **Support New Video Platform**:
   - Add new matching rules in `entrypoints/content.ts`
   - Create new subtitle handler (similar to `YouTubeSubtitleHandler`)
   - Implement platform-specific subtitle finding and processing logic

2. **Add New Language**:
   - Add new language to `LANGUAGES` array in `entrypoints/options/Options.tsx`

3. **Extend Vocabulary Features**:
   - Modify `Word` interface to add new properties
   - Update `Vocabulary.tsx` component to display new properties
   - Update saving logic in background script

4. **Support New AI Model**:
   - Create new AI service class in `ai.ts`, implementing `AIService` interface
   - Add new model support in `createAIService` function
   - Add new model option in options page

5. **Enhance Word Definition Features**:
   - Modify AI prompts for more detailed word information
   - Update `WordPopup` component to display richer content
   - Add pronunciation, images, and other multimedia content

### Debugging Tips

1. **View Extension Logs**:
   - Open Chrome extension management page (`chrome://extensions`)
   - Click "View" button for the extension
   - Select "Background page" or other views to check console logs

2. **Debug Content Scripts**:
   - Open Developer Tools on YouTube page
   - Check console logs
   - Use breakpoints to debug JavaScript

3. **Test Setting Changes**:
   - Refresh YouTube page after modifying settings to apply changes
   - Check if settings are correctly saved in `browser.storage.local`

## Build and Release

### Development Mode

```bash
npm run dev
```

This starts the WXT development server with automatic extension reloading.

### Production Build

```bash
npm run build
```

This generates a production version of the extension in the `.output` directory.

### Package Extension

```bash
npm run zip
```

This creates a ZIP file ready for upload to Chrome Web Store.

## Contributing Guide

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## FAQ

1. **Subtitles Not Displaying**:
   - Check if YouTube subtitles are enabled
   - Check console for errors
   - Try refreshing the page

2. **Settings Not Taking Effect**:
   - Ensure to refresh YouTube page after saving settings
   - Check if settings are correctly saved in `browser.storage.local`

3. **Extension Fails to Load**:
   - Check `manifest.json` for syntax errors
   - Ensure all dependencies are installed (`npm install`)

## User Experience Features

The extension provides various features to enhance user experience:

1. **Subtitle Enhancement**:
   - Beautiful subtitle display
   - Clickable words with definitions
   - Word highlighting on hover

2. **Learning Assistance**:
   - Automatic video pause on subtitle hover for focused learning
   - Automatic play resume on mouse leave
   - Smart word definition popup positioning to avoid subtitle overlap

3. **Vocabulary Management**:
   - One-click word addition to vocabulary
   - Context preservation
   - Easy review access 