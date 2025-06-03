export interface ProviderConfigField {
  name: string
  type: string
  required: boolean
  description: string
  default?: any
  options?: string[]
  properties?: Record<string, ProviderConfigField>
  itemType?: string
}

export type ProviderConfig = Record<string, ProviderConfigField>

export function getAIProviderSettings(provider: string): ProviderConfig {
  switch (provider) {
    case "openai":
      return {
        apiKey: {
          name: "API Key",
          type: "string",
          required: true,
          description: "Your OpenAI API key",
        },
        organization: {
          name: "Organization ID",
          type: "string",
          required: false,
          description: "Your OpenAI organization ID (optional)",
        },
        baseURL: {
          name: "Base URL",
          type: "string",
          required: false,
          description: "Custom base URL for API calls",
        },
        project: {
          name: "Project",
          type: "string",
          required: false,
          description: "OpenAI project",
        },
      }
    case "anthropic":
      return {
        apiKey: {
          name: "API Key",
          type: "string",
          required: true,
          description: "Your Anthropic API key",
        },
        baseURL: {
          name: "Base URL",
          type: "string",
          required: false,
          description: "Custom base URL for API calls (default: https://api.anthropic.com/v1)",
        },
        thinking: {
          name: "Thinking",
          type: "object",
          required: false,
          description: "Thinking configuration for Anthropic models",
          properties: {
            type: {
              name: "Type",
              type: "enum",
              required: true,
              description: "Type of thinking",
              options: ["enabled", "disabled"],
            },
            budgetTokens: {
              name: "Budget Tokens",
              type: "number",
              required: false,
              description: "Token budget for thinking",
            },
          },
        },
      }
    case "google":
      return {
        apiKey: {
          name: "API Key",
          type: "string",
          required: true,
          description: "Your Google AI API key",
        },
        baseURL: {
          name: "Base URL",
          type: "string",
          required: false,
          description: "Custom base URL for API calls (default: https://generativelanguage.googleapis.com/v1beta)",
        },
        responseModalities: {
          name: "Response Modalities",
          type: "array",
          required: false,
          description: "Types of content the model can generate",
          itemType: "enum",
          options: ["TEXT", "IMAGE"],
        },
        thinkingConfig: {
          name: "Thinking Config",
          type: "object",
          required: false,
          description: "Configuration for model thinking",
          properties: {
            thinkingBudget: {
              name: "Thinking Budget",
              type: "number",
              required: false,
              description: "Token budget for thinking",
            },
          },
        },
      }
    case "deepseek":
      return {
        apiKey: {
          name: "API Key",
          type: "string",
          required: true,
          description: "Your DeepSeek API key",
        },
        baseURL: {
          name: "Base URL",
          type: "string",
          required: false,
          description: "Base URL for API calls",
        },
      }
    case "azure":
      return {
        apiKey: {
          name: "API Key",
          type: "string",
          required: true,
          description: "Your Azure OpenAI API key",
        },
        resourceName: {
          name: "Resource Name",
          type: "string",
          required: false,
          description: "Name of your Azure OpenAI resource",
        },
        baseURL: {
          name: "Base URL",
          type: "string",
          required: false,
          description: "Base URL for API calls (overrides resourceName if provided)",
        },
        apiVersion: {
          name: "API Version",
          type: "string",
          required: false,
          description: "Azure OpenAI API version",
          default: "2024-10-01-preview",
        },
      }
    case "openai-compatible":
      return {
        apiKey: {
          name: "API Key",
          type: "string",
          required: true,
          description: "Provider API key for authenticating requests",
        },
        providerName: {
          name: "Provider Name",
          type: "string",
          required: true,
          description: "Name of the OpenAI compatible provider (e.g., lmstudio, nim, baseten)",
        },
        baseURL: {
          name: "Base URL",
          type: "string",
          required: true,
          description: "Base URL for API calls (e.g., https://api.provider.com/v1)",
        },
        options: {
          name: "Advanced Options",
          type: "object",
          required: false,
          description: "Advanced provider-specific options",
          properties: {
            queryParams: {
              name: "Query Parameters",
              type: "object",
              required: false,
              description: "Custom URL query parameters (e.g., api-version for Azure AI services)",
            },
          },
        },
      }
    default:
      return {}
  }
}
