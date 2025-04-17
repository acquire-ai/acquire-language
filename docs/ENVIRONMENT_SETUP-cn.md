# 环境变量设置

[English](ENVIRONMENT_SETUP.md)

本文档说明如何为开发环境设置环境变量。

## 使用 .env 文件

1. 在项目根目录创建一个基于 `.env.example` 的 `.env` 文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，将占位符替换为您的实际值：
   ```
   ACQUIRE_API_KEY=your_actual_api_key_here
   ```

3. 应用程序在启动时会自动加载这些环境变量。

## 可用的环境变量

| 变量                      | 描述                                        | 默认值         |
|---------------------------|-------------------------------------------|---------------|
| ACQUIRE_NATIVE_LANGUAGE   | 用户的母语代码                              | zh-CN         |
| ACQUIRE_TARGET_LANGUAGE   | 正在学习的语言                              | en-US         |
| ACQUIRE_LANGUAGE_LEVEL    | 用户的语言水平 (A1, A2, B1, B2, C1, C2)     | B1            |
| ACQUIRE_AI_MODEL          | 使用的AI模型 (deepseek, gpt-4o-mini等)      | deepseek      |
| ACQUIRE_API_KEY           | 所选AI服务的API密钥                         | (空)          |

## 设置优先级

设置加载的优先级如下：

1. 环境变量（最高优先级）
2. 浏览器存储中的用户配置
3. 默认设置（最低优先级）

这意味着环境变量中设置的任何值都将覆盖浏览器中存储的用户设置。

## 开发工作流程

对于本地开发，我们建议：

1. 用必要的值设置您的 `.env` 文件
2. 启动开发服务器
3. 扩展将使用您的环境变量

这样您就不必在浏览器界面中重复输入API密钥和其他设置，提高开发效率。

对于生产构建，确保移除或忽略 `.env` 文件，防止在您的代码库或构建中包含敏感信息。

## 相关文档

[返回开发指南](DEVELOPMENT-cn.md) 