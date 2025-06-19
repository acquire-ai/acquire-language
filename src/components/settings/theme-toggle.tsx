'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Monitor } from 'lucide-react';
import { saveTheme } from '@/core/config/settings';
import { useShadowTheme } from './theme-provider';

export function ShadowThemeToggle() {
    const { theme, setTheme } = useShadowTheme();
    const [mounted, setMounted] = useState(false);

    // make sure the component is only rendered after the client is mounted
    useEffect(() => {
        setMounted(true);
    }, []);

    // handle theme change and save to global settings
    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme);
        try {
            await saveTheme(newTheme);
        } catch (error) {
            console.error('Failed to save theme to global settings:', error);
        }
    };

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[999]">
                <DropdownMenuItem
                    onClick={() => handleThemeChange('light')}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('dark')}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('system')}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // make sure the component is only rendered after the client is mounted
    useEffect(() => {
        setMounted(true);
    }, []);

    // handle theme change and save to global settings
    const handleThemeChange = async (newTheme: string) => {
        setTheme(newTheme);
        try {
            await saveTheme(newTheme);
        } catch (error) {
            console.error('Failed to save theme to global settings:', error);
        }
    };

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="h-9 w-9 relative z-10">
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 relative z-10">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[999]">
                <DropdownMenuItem
                    onClick={() => handleThemeChange('light')}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('dark')}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('system')}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
