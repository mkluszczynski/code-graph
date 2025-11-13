/**
 * useKeyboardShortcuts - Hook for managing keyboard shortcuts
 * 
 * Implements global keyboard shortcuts for the application:
 * - Ctrl+N / Cmd+N: New file dialog
 * - Ctrl+S / Cmd+S: Save current file
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
    handler: (event: KeyboardEvent) => void;
    description: string;
}

export interface UseKeyboardShortcutsOptions {
    onNewFile?: () => void;
    onSave?: () => void;
    enabled?: boolean;
}

export function useKeyboardShortcuts({
    onNewFile,
    onSave,
    enabled = true,
}: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

            // Ctrl+N / Cmd+N: New file
            if (cmdOrCtrl && event.key.toLowerCase() === 'n' && onNewFile) {
                event.preventDefault();
                onNewFile();
                return;
            }

            // Ctrl+S / Cmd+S: Save current file
            if (cmdOrCtrl && event.key.toLowerCase() === 's' && onSave) {
                event.preventDefault();
                onSave();
                return;
            }
        },
        [enabled, onNewFile, onSave]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, handleKeyDown]);

    return {
        shortcuts: getShortcuts(),
    };
}

/**
 * Get list of available keyboard shortcuts for display
 */
export function getShortcuts(): KeyboardShortcut[] {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '⌘' : 'Ctrl';

    return [
        {
            key: 'n',
            [isMac ? 'cmd' : 'ctrl']: true,
            handler: () => { },
            description: `${modKey}+N: Create new file`,
        },
        {
            key: 's',
            [isMac ? 'cmd' : 'ctrl']: true,
            handler: () => { },
            description: `${modKey}+S: Save current file`,
        },
    ];
}
