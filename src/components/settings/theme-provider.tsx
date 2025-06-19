'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { useGlobalTheme } from '@/hooks/useGlobalTheme';

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
