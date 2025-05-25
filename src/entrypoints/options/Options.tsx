import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeProvider } from '@/components/settings/theme-provider';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { GeneralSettings } from '@/components/settings/general-settings';
import { SubtitleSettings } from '@/components/settings/subtitle-settings';
import { AIServerSettings } from '@/components/settings/ai-server-settings';
import { Logo } from '@/components/settings/logo';

export default function Options() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            forcedTheme={undefined}
        >
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-8 relative">
                <div className="scanline absolute inset-0 pointer-events-none z-0"></div>
                <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-16 items-center justify-between py-4">
                        <div className="flex items-center gap-2">
                            <Logo />
                            <h1 className="text-xl font-bold tracking-tight gradient-text tech-glow">
                                Acquire Language
                            </h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="container py-6 relative z-10">
                    <div className="mx-auto max-w-5xl space-y-8">
                        <div className="flex flex-col items-start gap-2">
                            <h2 className="text-3xl font-bold tracking-tight text-primary tech-glow">
                                Settings
                            </h2>
                            <p className="text-muted-foreground">
                                Customize your language learning adventure!
                            </p>
                </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 relative z-10">
                                <TabsTrigger value="general" className="gradient-text">
                                    General
                                </TabsTrigger>
                                <TabsTrigger value="subtitle" className="gradient-text">
                                    Subtitle
                                </TabsTrigger>
                                <TabsTrigger value="ai" className="gradient-text">
                                    AI Servers
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="general" className="mt-6 relative z-10">
                                <GeneralSettings />
                            </TabsContent>
                            <TabsContent value="subtitle" className="mt-6 relative z-10">
                                <SubtitleSettings />
                            </TabsContent>
                            <TabsContent value="ai" className="mt-6 relative z-10">
                                <AIServerSettings />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </ThemeProvider>
    );
}
