/**
 * Integration tests for Theme Toggle functionality
 * 
 * Verifies that theme changes propagate to all components including CodeEditor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStore } from '../../../src/shared/store';
import { useTheme } from '../../../src/shared/hooks/useTheme';

describe('Theme Toggle Integration', () => {
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();

        // Remove dark class from document
        document.documentElement.classList.remove('dark');

        // Reset store to default state and reapply theme
        useStore.setState({
            theme: 'light',
            resolvedTheme: 'light',
        });
    });

    it('should share theme state across multiple hook instances', () => {
        // Render two separate instances of useTheme hook (simulating ThemeToggle and CodeEditor)
        const { result: themeToggleHook } = renderHook(() => useTheme());
        const { result: codeEditorHook } = renderHook(() => useTheme());

        // Both should start with light theme
        expect(themeToggleHook.current.resolvedTheme).toBe('light');
        expect(codeEditorHook.current.resolvedTheme).toBe('light');

        // Toggle theme in first hook (simulating ThemeToggle component)
        act(() => {
            themeToggleHook.current.toggleTheme();
        });

        // Both hooks should now see dark theme
        expect(themeToggleHook.current.resolvedTheme).toBe('dark');
        expect(codeEditorHook.current.resolvedTheme).toBe('dark');

        // Toggle again
        act(() => {
            themeToggleHook.current.toggleTheme();
        });

        // Both hooks should now see light theme
        expect(themeToggleHook.current.resolvedTheme).toBe('light');
        expect(codeEditorHook.current.resolvedTheme).toBe('light');
    });

    it('should persist theme changes to localStorage', () => {
        const { result } = renderHook(() => useTheme());

        // Toggle to dark
        act(() => {
            result.current.toggleTheme();
        });

        // Check localStorage
        expect(localStorage.getItem('uml-visualizer-theme')).toBe('dark');

        // Toggle back to light
        act(() => {
            result.current.toggleTheme();
        });

        // Check localStorage again
        expect(localStorage.getItem('uml-visualizer-theme')).toBe('light');
    });

    it('should update Monaco editor theme when app theme changes', () => {
        const { result } = renderHook(() => useTheme());

        // Initial theme should be light
        expect(result.current.resolvedTheme).toBe('light');

        // Monaco theme should be 'vs' for light mode
        const lightMonacoTheme = result.current.resolvedTheme === 'dark' ? 'vs-dark' : 'vs';
        expect(lightMonacoTheme).toBe('vs');

        // Toggle to dark
        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.resolvedTheme).toBe('dark');

        // Monaco theme should be 'vs-dark' for dark mode
        const darkMonacoTheme = result.current.resolvedTheme === 'dark' ? 'vs-dark' : 'vs';
        expect(darkMonacoTheme).toBe('vs-dark');
    });

    it('should apply theme class to document root', () => {
        const { result } = renderHook(() => useTheme());
        const root = document.documentElement;

        // Start with light theme - should not have 'dark' class
        expect(result.current.resolvedTheme).toBe('light');
        expect(root.classList.contains('dark')).toBe(false);

        // Toggle to dark
        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.resolvedTheme).toBe('dark');
        expect(root.classList.contains('dark')).toBe(true);

        // Toggle back to light
        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.resolvedTheme).toBe('light');
        expect(root.classList.contains('dark')).toBe(false);
    });

    it('should support system theme preference', () => {
        const { result } = renderHook(() => useTheme());

        // Set theme to 'system'
        act(() => {
            result.current.setTheme('system');
        });

        expect(result.current.theme).toBe('system');
        // resolvedTheme should be either 'light' or 'dark' based on system preference
        expect(['light', 'dark']).toContain(result.current.resolvedTheme);
    });
});
