import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeProvider } from '@/components/settings/theme-provider';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { Logo } from '@/components/settings/logo';
import { Youtube, BookOpen, Settings, Sparkles } from 'lucide-react';

function App() {
    // Open options page
    const openOptionsPage = () => {
        browser.tabs.create({ url: '/options.html' });
    };

    // Open vocabulary page
    const openVocabularyPage = () => {
        browser.tabs.create({ url: '/vocabulary.html' });
    };

    // Open YouTube
    const openYouTube = () => {
        browser.tabs.create({ url: 'https://www.youtube.com' });
    };

    return (
        <ThemeProvider>
            <div className="w-80 min-h-96 bg-gradient-to-b from-background to-muted/20 relative">
                <div className="scanline absolute inset-0 pointer-events-none z-0"></div>

                {/* Header */}
                <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-10">
                    <div className="flex h-14 items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <Logo />
                            <h1 className="text-lg font-bold tracking-tight gradient-text tech-glow">
                                Acquire Language
                            </h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-4 space-y-4 relative z-10">
                    {/* Welcome Card */}
                    <Card className="card-glow gradient-border hover-lift">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary tech-glow">
                                <Sparkles className="h-5 w-5" />
                                Welcome Learning!
                            </CardTitle>
                            <CardDescription>
                                Learn languages naturally by watching videos
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={openYouTube}
                            className="w-full h-12 enhanced-button btn-bounce tech-pulse"
                            size="lg"
                        >
                            <Youtube className="mr-2 h-5 w-5" />
                            Open YouTube
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={openVocabularyPage}
                                variant="outline"
                                className="h-11 hover-lift gradient-border"
                            >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Vocabulary
                            </Button>

                            <Button
                                onClick={openOptionsPage}
                                variant="outline"
                                className="h-11 hover-lift gradient-border"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 text-center">
                        <p className="text-xs text-muted-foreground">
                            Make language learning more natural
                        </p>
                    </div>
                </main>
            </div>
        </ThemeProvider>
    );
}

export default App;
