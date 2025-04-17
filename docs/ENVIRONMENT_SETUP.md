# Environment Variable Setup

[中文](ENVIRONMENT_SETUP-cn.md)

This document explains how to set up environment variables for development.

## Using .env Files

1. Create a `.env` file in the project root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace placeholder values with your actual values:
   ```
   ACQUIRE_API_KEY=your_actual_api_key_here
   ```

3. The application will automatically load these environment variables during startup.

## Available Environment Variables

| Variable                  | Description                                       | Default Value |
|---------------------------|---------------------------------------------------|---------------|
| ACQUIRE_NATIVE_LANGUAGE   | User's native language code                       | zh-CN         |
| ACQUIRE_TARGET_LANGUAGE   | Language being learned                            | en-US         |
| ACQUIRE_LANGUAGE_LEVEL    | User's language proficiency (A1, A2, B1, B2, C1, C2) | B1        |
| ACQUIRE_AI_MODEL          | AI model to use (deepseek, gpt-4o-mini, etc.)     | deepseek      |
| ACQUIRE_API_KEY           | API key for the selected AI service               | (empty)       |

## Priority of Settings

Settings are loaded with the following priority:

1. Environment variables (highest priority)
2. User-configured settings in browser storage
3. Default settings (lowest priority)

This means that any value set in the environment variables will override user settings stored in the browser.

## Development Workflow

For local development, we recommend:

1. Set up your `.env` file with the necessary values
2. Start the development server
3. The extension will use your environment variables

This saves you from having to repeatedly enter API keys and other settings in the browser interface during development.

For production builds, make sure to remove or ignore the `.env` file to prevent including sensitive information in your repository or builds.

## Related Documentation

[Back to Development Guide](DEVELOPMENT.md) 