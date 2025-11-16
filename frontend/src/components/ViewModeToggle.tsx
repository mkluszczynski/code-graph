/**
 * ViewModeToggle Component
 *
 * Toggle button to switch between File View and Project View modes
 * for the UML diagram visualization.
 *
 * - File View: Shows only entities from the currently selected file (focused view)
 * - Project View: Shows all entities from all files in the project (strategic overview)
 */

import { FileText, FolderTree } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../shared/store';

export function ViewModeToggle() {
    const diagramViewMode = useStore((state) => state.diagramViewMode);
    const setDiagramViewMode = useStore((state) => state.setDiagramViewMode);

    return (
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
            <Button
                variant={diagramViewMode === 'file' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDiagramViewMode('file')}
                title="File View: Show only entities from selected file"
                className="gap-2"
            >
                <FileText className="h-4 w-4" />
                <span>File View</span>
            </Button>
            <Button
                variant={diagramViewMode === 'project' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDiagramViewMode('project')}
                title="Project View: Show all entities from all files"
                className="gap-2"
            >
                <FolderTree className="h-4 w-4" />
                <span>Project View</span>
            </Button>
        </div>
    );
}
