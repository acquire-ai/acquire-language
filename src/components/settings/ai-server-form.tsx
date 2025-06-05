'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';
import type { AIServer } from '@/core/config/settings';
import { getAIProviderSettings } from './utils/ai-provider-settings';
import { providerModels } from './utils/provider-models';

interface AIServerFormProps {
    server: AIServer;
    onUpdate: (server: AIServer) => void;
}

export function AIServerForm({ server, onUpdate }: AIServerFormProps) {
    const [name, setName] = useState(server.name);
    const [provider, setProvider] = useState(server.provider);
    const [model, setModel] = useState(server.model);
    const [settings, setSettings] = useState<Record<string, any>>(server.settings || {});
    const [customModel, setCustomModel] = useState('');
    const [useCustomModel, setUseCustomModel] = useState(false);
    const [formChanged, setFormChanged] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
        null,
    );

    // 使用ref来存储初始值，避免重新渲染时的比较问题
    const initialValuesRef = useRef({
        name: server.name,
        provider: server.provider,
        model: server.model,
        settings: JSON.stringify(server.settings || {}),
        isDefault: server.isDefault,
    });

    const providerOptions = [
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'google', label: 'Google AI' },
        { value: 'deepseek', label: 'DeepSeek' },
        { value: 'azure', label: 'Azure OpenAI' },
        { value: 'openai-compatible', label: 'OpenAI Compatible' },
    ];

    const providerConfig = getAIProviderSettings(provider);
    const models = providerModels[provider] || [];

    // 当provider变化时重置相关设置
    useEffect(() => {
        // Reset settings when provider changes
        const newSettings: Record<string, any> = {};
        Object.keys(providerConfig).forEach((key) => {
            if (providerConfig[key].type === 'object' && providerConfig[key].properties) {
                newSettings[key] = {};
                Object.keys(providerConfig[key].properties).forEach((propKey) => {
                    newSettings[key][propKey] = settings[key]?.[propKey] || '';
                });
            } else {
                newSettings[key] = settings[key] || '';
            }
        });
        setSettings(newSettings);
        setFormChanged(true);

        // Reset model when provider changes
        if (models.length > 0) {
            setModel(models[0]);
            setUseCustomModel(false);
        } else {
            setUseCustomModel(true);
            setCustomModel('');
        }
    }, [provider]);

    // 处理表单提交
    const handleSubmit = () => {
        if (!formChanged) return;

        // 验证必填字段
        const errors: string[] = [];

        // 检查所有必填字段
        Object.entries(providerConfig).forEach(([key, config]) => {
            if (config.required && (!settings[key] || settings[key] === '')) {
                errors.push(`${config.name} is required`);
            }

            // 检查嵌套对象中的必填字段
            if (config.type === 'object' && config.properties) {
                Object.entries(config.properties).forEach(
                    ([propKey, propConfig]: [string, any]) => {
                        if (
                            propConfig.required &&
                            (!settings[key]?.[propKey] || settings[key]?.[propKey] === '')
                        ) {
                            errors.push(`${propConfig.name} is required`);
                        }
                    },
                );
            }
        });

        // 如果有验证错误，显示错误并阻止保存
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        // 清除之前的验证错误
        setValidationErrors([]);
        setIsSaving(true);

        // 模拟保存操作
        setTimeout(() => {
            onUpdate({
                id: server.id,
                name,
                provider,
                model: useCustomModel ? customModel : model,
                settings,
                isDefault: server.isDefault,
            });

            setFormChanged(false);
            setIsSaving(false);
            setShowSuccess(true);

            // 3秒后隐藏成功图标
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);

            // 更新初始值引用
            initialValuesRef.current = {
                name,
                provider,
                model: useCustomModel ? customModel : model,
                settings: JSON.stringify(settings),
                isDefault: server.isDefault,
            };
        }, 500); // 添加短暂延迟以模拟保存过程
    };

    // 处理测试连接
    const handleTestConnection = () => {
        // 验证必填字段
        const errors: string[] = [];

        // 检查所有必填字段
        Object.entries(providerConfig).forEach(([key, config]) => {
            if (config.required && (!settings[key] || settings[key] === '')) {
                errors.push(`${config.name} is required`);
            }

            // 检查嵌套对象中的必填字段
            if (config.type === 'object' && config.properties) {
                Object.entries(config.properties).forEach(
                    ([propKey, propConfig]: [string, any]) => {
                        if (
                            propConfig.required &&
                            (!settings[key]?.[propKey] || settings[key]?.[propKey] === '')
                        ) {
                            errors.push(`${propConfig.name} is required`);
                        }
                    },
                );
            }
        });

        // 如果有验证错误，显示错误并阻止测试
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        // 清除之前的验证错误和测试结果
        setValidationErrors([]);
        setTestResult(null);
        setIsTesting(true);

        // 模拟API连接测试
        setTimeout(() => {
            // 模拟随机测试结果 (70% 成功率)
            const isSuccess = Math.random() > 0.3;

            if (isSuccess) {
                setTestResult({
                    success: true,
                    message: `Successfully connected to ${provider} API!`,
                });
            } else {
                setTestResult({
                    success: false,
                    message: `Failed to connect: ${getRandomErrorMessage()}`,
                });
            }

            setIsTesting(false);
        }, 1500); // 添加延迟以模拟网络请求
    };

    // 生成随机错误消息
    const getRandomErrorMessage = () => {
        const errorMessages = [
            'Invalid API key',
            'API rate limit exceeded',
            'Connection timeout',
            'Service unavailable',
            'Authentication failed',
            'Network error',
        ];
        return errorMessages[Math.floor(Math.random() * errorMessages.length)];
    };

    const handleSettingChange = (key: string, value: any) => {
        setSettings((prev) => {
            const newSettings = {
                ...prev,
                [key]: value,
            };
            setFormChanged(true);
            return newSettings;
        });
    };

    const handleNestedSettingChange = (parentKey: string, key: string, value: any) => {
        setSettings((prev) => {
            const newSettings = {
                ...prev,
                [parentKey]: {
                    ...prev[parentKey],
                    [key]: value,
                },
            };
            setFormChanged(true);
            return newSettings;
        });
    };

    const renderSettingInput = (key: string, config: any) => {
        if (config.type === 'string') {
            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="flex items-center gap-2">
                        {config.name}
                        {config.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                        id={key}
                        type={key.toLowerCase().includes('key') ? 'password' : 'text'}
                        value={settings[key] || ''}
                        onChange={(e) => handleSettingChange(key, e.target.value)}
                        placeholder={config.description}
                    />
                </div>
            );
        }

        if (config.type === 'number') {
            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="flex items-center gap-2">
                        {config.name}
                        {config.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                        id={key}
                        type="number"
                        value={settings[key] || ''}
                        onChange={(e) => handleSettingChange(key, Number(e.target.value))}
                        placeholder={config.description}
                    />
                </div>
            );
        }

        if (config.type === 'enum') {
            return (
                <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="flex items-center gap-2">
                        {config.name}
                        {config.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                        value={settings[key] || ''}
                        onValueChange={(value) => handleSettingChange(key, value)}
                    >
                        <SelectTrigger id={key}>
                            <SelectValue placeholder={config.description} />
                        </SelectTrigger>
                        <SelectContent>
                            {config.options.map((option: string) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (config.type === 'array') {
            return (
                <div key={key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                        {config.name}
                        {config.required && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="space-y-2">
                        {config.options.map((option: string) => (
                            <div key={option} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${key}-${option}`}
                                    checked={(settings[key] || []).includes(option)}
                                    onCheckedChange={(checked) => {
                                        const currentValues = settings[key] || [];
                                        const newValues = checked
                                            ? [...currentValues, option]
                                            : currentValues.filter(
                                                  (value: string) => value !== option,
                                              );
                                        handleSettingChange(key, newValues);
                                    }}
                                />
                                <Label htmlFor={`${key}-${option}`}>{option}</Label>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (config.type === 'object' && config.properties) {
            return (
                <div key={key} className="space-y-4 rounded-lg border p-4 card-glow">
                    <h3 className="font-medium gradient-text">{config.name}</h3>
                    {Object.entries(config.properties).map(
                        ([propKey, propConfig]: [string, any]) => {
                            if (propConfig.type === 'string' || propConfig.type === 'number') {
                                return (
                                    <div key={propKey} className="space-y-2">
                                        <Label
                                            htmlFor={`${key}-${propKey}`}
                                            className="flex items-center gap-2"
                                        >
                                            {propConfig.name}
                                            {propConfig.required && (
                                                <span className="text-destructive">*</span>
                                            )}
                                        </Label>
                                        <Input
                                            id={`${key}-${propKey}`}
                                            type={propConfig.type === 'number' ? 'number' : 'text'}
                                            value={settings[key]?.[propKey] || ''}
                                            onChange={(e) =>
                                                handleNestedSettingChange(
                                                    key,
                                                    propKey,
                                                    propConfig.type === 'number'
                                                        ? Number(e.target.value)
                                                        : e.target.value,
                                                )
                                            }
                                            placeholder={propConfig.description}
                                        />
                                    </div>
                                );
                            }

                            if (propConfig.type === 'enum') {
                                return (
                                    <div key={propKey} className="space-y-2">
                                        <Label
                                            htmlFor={`${key}-${propKey}`}
                                            className="flex items-center gap-2"
                                        >
                                            {propConfig.name}
                                            {propConfig.required && (
                                                <span className="text-destructive">*</span>
                                            )}
                                        </Label>
                                        <Select
                                            value={settings[key]?.[propKey] || ''}
                                            onValueChange={(value) =>
                                                handleNestedSettingChange(key, propKey, value)
                                            }
                                        >
                                            <SelectTrigger id={`${key}-${propKey}`}>
                                                <SelectValue placeholder={propConfig.description} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {propConfig.options.map((option: string) => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            }

                            return null;
                        },
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                    id="server-name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setFormChanged(true);
                    }}
                    placeholder="Enter a name for this AI server"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="provider">AI Provider</Label>
                <Select
                    value={provider}
                    onValueChange={(value) => {
                        setProvider(value);
                        setFormChanged(true);
                    }}
                >
                    <SelectTrigger id="provider">
                        <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                        {providerOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="custom-model"
                        checked={useCustomModel}
                        onCheckedChange={(checked) => {
                            setUseCustomModel(checked === true);
                            setFormChanged(true);
                        }}
                        disabled={models.length === 0}
                    />
                    <Label htmlFor="custom-model">Use custom model name</Label>
                </div>

                {useCustomModel ? (
                    <div className="space-y-2">
                        <Label htmlFor="custom-model-name">Custom Model Name</Label>
                        <Input
                            id="custom-model-name"
                            value={customModel}
                            onChange={(e) => {
                                setCustomModel(e.target.value);
                                setFormChanged(true);
                            }}
                            placeholder="Enter custom model name"
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Select
                            value={model}
                            onValueChange={(value) => {
                                setModel(value);
                                setFormChanged(true);
                            }}
                            disabled={models.length === 0}
                        >
                            <SelectTrigger id="model">
                                <SelectValue
                                    placeholder={
                                        models.length === 0 ? 'No models available' : 'Select model'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {models.map((modelName) => (
                                    <SelectItem key={modelName} value={modelName}>
                                        {modelName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <h3 className="font-medium gradient-text">Provider Settings</h3>
                {Object.entries(providerConfig).map(([key, config]) =>
                    renderSettingInput(key, config),
                )}
            </div>

            <div className="space-y-4">
                {validationErrors.length > 0 && (
                    <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
                        <p className="font-medium mb-1">Please fix the following errors:</p>
                        <ul className="list-disc pl-5 text-sm">
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {testResult && (
                    <div
                        className={`px-4 py-2 rounded-md ${
                            testResult.success
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-destructive/10 text-destructive'
                        }`}
                    >
                        <p>{testResult.message}</p>
                    </div>
                )}

                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end">
                    <Button
                        onClick={handleTestConnection}
                        disabled={!formChanged || isTesting || isSaving}
                        variant="outline"
                        className="min-w-[140px] relative btn-bounce"
                    >
                        {isTesting ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                Testing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Test Connection
                            </span>
                        )}
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={!formChanged || isSaving}
                        className="min-w-[140px] relative btn-bounce enhanced-button"
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                Saving...
                            </span>
                        ) : showSuccess ? (
                            <span className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                Saved
                            </span>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
