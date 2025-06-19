'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Shadow DOM Theme Context
interface ShadowThemeContextType {
    theme: string;
    setTheme: (theme: string) => void;
}

const ShadowThemeContext = createContext<ShadowThemeContextType | undefined>(undefined);

export function useShadowTheme() {
    const context = useContext(ShadowThemeContext);
    if (!context) {
        throw new Error('useShadowTheme must be used within a ShadowThemeProvider');
    }
    return context;
}

interface ShadowThemeProviderProps {
    children: ReactNode;
    shadowRoot?: ShadowRoot | null;
}

export function ShadowThemeProvider({ children, shadowRoot }: ShadowThemeProviderProps) {
    const { theme: globalTheme } = useGlobalTheme();
    const [theme, setTheme] = useState(globalTheme);

    // Update local theme when global theme changes
    useEffect(() => {
        setTheme(globalTheme);
    }, [globalTheme]);

    // Apply theme to shadow DOM
    useEffect(() => {
        if (!shadowRoot) return;

        const htmlElement = shadowRoot.querySelector('html');
        if (!htmlElement) return;

        // Remove all theme classes
        htmlElement.classList.remove('light', 'dark');

        // Add the current theme class
        if (theme === 'system') {
            // Check system preference
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            htmlElement.classList.add(isDark ? 'dark' : 'light');
        } else {
            htmlElement.classList.add(theme);
        }
    }, [theme, shadowRoot]);

    // Listen for system theme changes when theme is 'system'
    useEffect(() => {
        if (theme !== 'system' || !shadowRoot) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const htmlElement = shadowRoot.querySelector('html');
            if (!htmlElement) return;

            htmlElement.classList.remove('light', 'dark');
            htmlElement.classList.add(mediaQuery.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, shadowRoot]);

    const contextValue = {
        theme,
        setTheme,
    };

    return (
        <ShadowThemeContext.Provider value={contextValue}>{children}</ShadowThemeContext.Provider>
    );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    const { theme } = useGlobalTheme();

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme={theme}
            enableSystem
            disableTransitionOnChange
            {...props}
        >
            {children}
        </NextThemesProvider>
    );
}
