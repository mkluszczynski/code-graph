/**
 * useTheme - Hook for managing application theme (light/dark mode)
 * 
 * Implements dark mode support using Tailwind CSS dark: classes
 */

import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'uml-visualizer-theme';

/**
 * Get system theme preference
 */
function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';

    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

/**
 * Get stored theme preference or default to system
 */
function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';

    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return stored || 'system';
}

/**
 * Resolve theme to actual light/dark value
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'system') {
        return getSystemTheme();
    }
    return theme;
}

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark') {
    const root = document.documentElement;

    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

/**
 * Hook for managing application theme
 */
export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(getStoredTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
        resolveTheme(getStoredTheme())
    );

    /**
     * Set theme and persist to localStorage
     */
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);

        const resolved = resolveTheme(newTheme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
    }, []);

    /**
     * Toggle between light and dark (ignoring system)
     */
    const toggleTheme = useCallback(() => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    }, [resolvedTheme, setTheme]);

    /**
     * Initialize theme on mount
     */
    useEffect(() => {
        const initialTheme = getStoredTheme();
        const resolved = resolveTheme(initialTheme);
        setResolvedTheme(resolved);
        applyTheme(resolved);
    }, []);

    /**
     * Listen for system theme changes (when theme is 'system')
     */
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const resolved = e.matches ? 'dark' : 'light';
            setResolvedTheme(resolved);
            applyTheme(resolved);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [theme]);

    return {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
    };
}
