/**
 * AI Service Factory
 */
import {AIService, AIServiceConfig} from "@/core/types/ai.ts";
import {createOpenAI} from "@ai-sdk/openai";
import {createAnthropic} from "@ai-sdk/anthropic";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {createDeepSeek} from "@ai-sdk/deepseek";
import {createAzure} from '@ai-sdk/azure';
import {createOpenAICompatible} from '@ai-sdk/openai-compatible';

import {ProviderV1} from "@ai-sdk/provider";
import {VercelAIAdapter} from "./vercel-adapter";

type ModelConfigType = Record<string, string[]>;

// Available models for each provider
export const AVAILABLE_MODELS: ModelConfigType = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    anthropic: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
    google: ["gemini-1.5-pro", "gemini-1.5-flash"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
    azure: [],
    "openai-compatible": [],
};


export function createAIService(
    config: AIServiceConfig
): AIService {
    let ai: ProviderV1;

    switch (config.providerType) {
        case "openai":
            ai = createOpenAI({apiKey: config.apiKey});
            break;
        case "anthropic":
            ai = createAnthropic({apiKey: config.apiKey});
            break;
        case "google":
            ai = createGoogleGenerativeAI({apiKey: config.apiKey});
            break;
        case "deepseek":
            ai = createDeepSeek({apiKey: config.apiKey});
            break;
        case "azure":
            ai = createAzure({apiKey: config.apiKey});
            break;
        case "openai-compatible":
            ai = createOpenAICompatible({
                name: config.providerName || 'custom-provider',
                apiKey: config.apiKey,
                baseURL: config.baseURL || '',
                queryParams: config.options?.queryParams || {}
            });
            break;
        default:
            throw new Error(`Unsupported provider: ${config.providerType}`);
    }
    return new VercelAIAdapter(ai, config.model);
}

/**
 * Get available AI providers and models for UI
 * @returns Object containing available providers and their models
 */
export function getAvailableAIModels() {
    return AVAILABLE_MODELS;
}

/**
 * 定义配置字段类型
 */
export type ConfigFieldType = 'string' | 'boolean' | 'number' | 'object' | 'array' | 'enum';

/**
 * 配置字段接口
 */
export interface ConfigField {
    name: string;
    type: ConfigFieldType;
    required: boolean;
    description: string;
    default?: any;
    options?: string[]; // 用于enum类型
    properties?: Record<string, ConfigField>; // 用于object类型
    itemType?: ConfigFieldType; // 用于array类型
}

/**
 * 提供商配置接口
 */
export type ProviderConfig = Record<string, ConfigField>;

/**
 * 获取不同AI提供商可以配置的连接选项
 * 注：经过调查，@ai-sdk库不直接导出schema信息，所以这些配置需要手动维护
 * @param provider AI提供商名称
 * @returns 提供商配置选项的结构化描述
 */
export function getAIProviderSettings(provider: string): ProviderConfig {
    switch (provider) {
        case "openai":
            return {
                apiKey: {
                    name: "API Key",
                    type: "string",
                    required: true,
                    description: "Your OpenAI API key"
                },
                organization: {
                    name: "Organization ID",
                    type: "string",
                    required: false,
                    description: "Your OpenAI organization ID (optional)"
                },
                baseURL: {
                    name: "Base URL",
                    type: "string",
                    required: false,
                    description: "Custom base URL for API calls"
                },
                project: {
                    name: "Project",
                    type: "string",
                    required: false,
                    description: "OpenAI project"
                }
            };
        case "anthropic":
            return {
                apiKey: {
                    name: "API Key",
                    type: "string",
                    required: true,
                    description: "Your Anthropic API key"
                },
                baseURL: {
                    name: "Base URL",
                    type: "string",
                    required: false,
                    description: "Custom base URL for API calls (default: https://api.anthropic.com/v1)"
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
                            options: ["enabled", "disabled"]
                        },
                        budgetTokens: {
                            name: "Budget Tokens",
                            type: "number",
                            required: false,
                            description: "Token budget for thinking"
                        }
                    }
                }
            };
        case "google":
            return {
                apiKey: {
                    name: "API Key",
                    type: "string",
                    required: true,
                    description: "Your Google AI API key"
                },
                baseURL: {
                    name: "Base URL",
                    type: "string",
                    required: false,
                    description: "Custom base URL for API calls (default: https://generativelanguage.googleapis.com/v1beta)"
                },
                responseModalities: {
                    name: "Response Modalities",
                    type: "array",
                    required: false,
                    description: "Types of content the model can generate",
                    itemType: "enum",
                    options: ["TEXT", "IMAGE"]
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
                            description: "Token budget for thinking"
                        }
                    }
                }
            };
        case "deepseek":
            return {
                apiKey: {
                    name: "API Key",
                    type: "string",
                    required: true,
                    description: "Your DeepSeek API key"
                },
                baseURL: {
                    name: "Base URL",
                    type: "string",
                    required: false,
                    description: "Base URL for API calls"
                }
            };
        case "azure":
            return {
                apiKey: {
                    name: "API Key",
                    type: "string",
                    required: true,
                    description: "Your Azure OpenAI API key"
                },
                resourceName: {
                    name: "Resource Name",
                    type: "string",
                    required: false,
                    description: "Name of your Azure OpenAI resource"
                },
                baseURL: {
                    name: "Base URL",
                    type: "string",
                    required: false,
                    description: "Base URL for API calls (overrides resourceName if provided)"
                },
                apiVersion: {
                    name: "API Version",
                    type: "string",
                    required: false,
                    description: "Azure OpenAI API version",
                    default: "2024-10-01-preview"
                }
            };
        case "openai-compatible":
            return {
                apiKey: {
                    name: "API Key",
                    type: "string",
                    required: true,
                    description: "Provider API key for authenticating requests"
                },
                providerName: {
                    name: "Provider Name",
                    type: "string",
                    required: true,
                    description: "Name of the OpenAI compatible provider (e.g., lmstudio, nim, baseten)"
                },
                baseURL: {
                    name: "Base URL",
                    type: "string",
                    required: true,
                    description: "Base URL for API calls (e.g., https://api.provider.com/v1)"
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
                            description: "Custom URL query parameters (e.g., api-version for Azure AI services)"
                        }
                    }
                }
            };
        default:
            return {};
    }
}