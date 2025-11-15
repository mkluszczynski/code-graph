import { useMemo } from "react";
import { FileTreeManager } from "../file-tree/FileTreeManager";
import { FileTreeView } from "../file-tree/FileTreeView";
import { AddButton } from "./AddButton";
import { ErrorBoundary } from "./ErrorBoundary";
import type { ProjectFile } from "../shared/types";

interface FileTreePanelProps {
    files: ProjectFile[];
    isInitialized: boolean;
    onCreateClass: () => void;
    onCreateInterface: () => void;
    isCreatingFile: boolean;
}

export function FileTreePanel({
    files,
    isInitialized,
    onCreateClass,
    onCreateInterface,
    isCreatingFile,
}: FileTreePanelProps) {
    const fileTreeManager = useMemo(() => new FileTreeManager(), []);
    const fileTree = useMemo(() => {
        return fileTreeManager.buildTree(files);
    }, [files, fileTreeManager]);

    return (
        <aside className="h-full bg-muted border-r flex flex-col">
            <div className="p-3 border-b bg-background flex items-center justify-between">
                <h2 className="text-sm font-medium">Project Files</h2>
                <AddButton
                    onCreateClass={onCreateClass}
                    onCreateInterface={onCreateInterface}
                    isLoading={isCreatingFile}
                />
            </div>
            <div className="flex-1 overflow-auto p-2">
                {isInitialized && fileTree.length > 0 ? (
                    <ErrorBoundary
                        fallback={
                            <div className="text-sm text-destructive p-2">
                                Error loading file tree
                            </div>
                        }
                    >
                        <FileTreeView nodes={fileTree} />
                    </ErrorBoundary>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        {isInitialized ? "No files yet" : "Loading..."}
                    </div>
                )}
            </div>
        </aside>
    );
}
