'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Server, Trash2, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { AIServerForm } from './ai-server-form';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings, saveAIServers, debounce, type AIServer } from '@/core/config/settings';

export function AIServerSettings() {
    const [servers, setServers] = useState<AIServer[]>([]);
    const [expandedServer, setExpandedServer] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // 创建防抖保存函数
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce((aiServers: AIServer[]) => {
            setIsSaving(true);
            saveAIServers(aiServers)
                .then(() => {
                    console.log('Save AI Servers success:', aiServers);
                })
                .catch((error) => {
                    console.error('Failed to save AI servers:', error);
                })
                .finally(() => {
                    setIsSaving(false);
                });
        }, 1000),
        [],
    );

    // 加载设置
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getSettings();
                setServers(settings.aiServers);
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to load AI server settings:', error);
                setIsInitialized(true);
            }
        };

        loadSettings();
    }, []);

    // 当设置变更时自动保存
    useEffect(() => {
        if (isInitialized) {
            debouncedSave(servers);
        }
    }, [servers, debouncedSave, isInitialized]);

    const addServer = () => {
        const newServer: AIServer = {
            id: `server-${Date.now()}`,
            name: `AI Server ${servers.length + 1}`,
            provider: 'openai',
            model: 'gpt-4o',
            settings: {
                apiKey: '',
            },
            isDefault: false,
        };
        setServers((prev) => [...prev, newServer]);
        setExpandedServer(newServer.id);
    };

    const removeServer = (id: string) => {
        setServers((prevServers) => {
            const serverToRemove = prevServers.find((s) => s.id === id);
            const filteredServers = prevServers.filter((server) => server.id !== id);

            if (filteredServers.length === 0) {
                return [];
            }

            // if the removed server was the default, set the first remaining server as default
            if (serverToRemove?.isDefault) {
                return filteredServers.map((server, index) => ({
                    ...server,
                    isDefault: index === 0,
                }));
            }

            return filteredServers;
        });

        if (expandedServer === id) {
            setExpandedServer(null);
        }
    };

    const updateServer = (updatedServer: AIServer) => {
        setServers((prevServers) =>
            prevServers.map((server) => (server.id === updatedServer.id ? updatedServer : server)),
        );
    };

    const toggleExpand = (id: string) => {
        setExpandedServer((prev) => (prev === id ? null : id));
    };

    const setDefaultServer = (id: string) => {
        setServers((prevServers) =>
            prevServers.map((server) => ({
                ...server,
                isDefault: server.id === id,
            })),
        );
    };

    return (
        <Card className="border-2 border-primary/10 gradient-border card-glow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <span className="gradient-text">AI Server Settings</span>
                </CardTitle>
                <CardDescription>
                    Configure your AI providers and models for language learning
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {servers.map((server) => (
                        <motion.div
                            key={server.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            transition={{ duration: 0.3 }}
                            className="rounded-lg border shadow-sm hover:shadow-md transition-shadow card-glow"
                        >
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer"
                                onClick={() => toggleExpand(server.id)}
                                style={{ position: 'relative' }}
                            >
                                <div className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-primary" />
                                    <div className="font-medium">{server.name}</div>
                                    <div className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                        {server.provider}
                                    </div>
                                    <div className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                        {server.model}
                                    </div>
                                    {server.isDefault && (
                                        <div className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary-foreground font-medium">
                                            Default
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!server.isDefault && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDefaultServer(server.id);
                                            }}
                                            className="text-xs h-8 btn-bounce"
                                        >
                                            Set as Default
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeServer(server.id);
                                        }}
                                        disabled={servers.length === 1} // 禁止删除最后一个服务器
                                        className="btn-bounce"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    {expandedServer === server.id ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </div>
                            <AnimatePresence>
                                {expandedServer === server.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t p-4">
                                            <AIServerForm server={server} onUpdate={updateServer} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {isSaving && (
                    <div className="text-xs text-muted-foreground text-right animate-pulse">
                        Saving changes...
                    </div>
                )}

                <Button
                    variant="default"
                    className="w-full py-6 btn-bounce group enhanced-button bg-gradient-to-r from-primary/80 to-secondary/80"
                    onClick={addServer}
                >
                    <PlusCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Add AI Server
                </Button>
            </CardContent>
        </Card>
    );
}
