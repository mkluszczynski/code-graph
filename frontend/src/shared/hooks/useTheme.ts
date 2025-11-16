/**
 * useTheme - Hook for managing application theme (light/dark mode)
 * 
 * Implements dark mode support using Tailwind CSS dark: classes
 * Theme state is managed in Zustand store for global reactivity
 */

import { useStore } from '../store';

export type { Theme } from '../store';

/**
 * Hook for managing application theme
 * 
 * Uses Zustand store to ensure theme changes are reactive across all components
 */
export function useTheme() {
    const theme = useStore((state) => state.theme);
    const resolvedTheme = useStore((state) => state.resolvedTheme);
    const setTheme = useStore((state) => state.setTheme);
    const toggleTheme = useStore((state) => state.toggleTheme);

    return {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
    };
}
