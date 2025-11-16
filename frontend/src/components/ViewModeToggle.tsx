/**
 * ViewModeToggle Component
 *
 * Toggle button to switch between File View and Project View modes
 * for the UML diagram visualization.
 *
 * - File View: Shows only entities from the currently selected file (focused view)
 * - Project View: Shows all entities from all files in the project (strategic overview)
 *
 * Keyboard shortcuts:
 * - Ctrl/Cmd + Shift + F: Switch to File View
 * - Ctrl/Cmd + Shift + P: Switch to Project View
 */

import { FileText, FolderTree } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { useStore } from '../shared/store';

export function ViewModeToggle() {
    const diagramViewMode = useStore((state) => state.diagramViewMode);
    const setDiagramViewMode = useStore((state) => state.setDiagramViewMode);

    // Keyboard shortcuts for view mode switching
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifierKey = isMac ? e.metaKey : e.ctrlKey;

            if (modifierKey && e.shiftKey) {
                if (e.key === 'F') {
                    e.preventDefault();
                    setDiagramViewMode('file');
                } else if (e.key === 'P') {
                    e.preventDefault();
                    setDiagramViewMode('project');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setDiagramViewMode]);

    return (
        <div
            className="flex items-center gap-1 rounded-md border border-border bg-background p-1"
            role="group"
            aria-label="Diagram view mode"
        >
            <Button
                variant={diagramViewMode === 'file' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDiagramViewMode('file')}
                title="File View: Show only entities from selected file (Ctrl+Shift+F)"
                className="gap-2"
                aria-label="Switch to file view mode (keyboard shortcut: Ctrl+Shift+F)"
                aria-pressed={diagramViewMode === 'file'}
            >
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>File View</span>
            </Button>
            <Button
                variant={diagramViewMode === 'project' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDiagramViewMode('project')}
                title="Project View: Show all entities from all files (Ctrl+Shift+P)"
                className="gap-2"
                aria-label="Switch to project view mode (keyboard shortcut: Ctrl+Shift+P)"
                aria-pressed={diagramViewMode === 'project'}
            >
                <FolderTree className="h-4 w-4" aria-hidden="true" />
                <span>Project View</span>
            </Button>
        </div>
    );
}
