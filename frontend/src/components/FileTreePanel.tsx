import { useMemo, useState, useCallback, useEffect } from "react";
import { FileTreeManager } from "../file-tree/FileTreeManager";
import { FileTreeView } from "../file-tree/FileTreeView";
import { AddButton } from "./AddButton";
import { CreateDialog } from "./CreateDialog";
import { ErrorBoundary } from "./ErrorBoundary";
import { useStore } from "../shared/store";
import type { ProjectFile } from "../shared/types";
import type { CreateItemType } from "../file-tree/types";

interface FileTreePanelProps {
    files: ProjectFile[];
    isInitialized: boolean;
    isCreatingFile: boolean;
}

export function FileTreePanel({
    files,
    isInitialized,
    isCreatingFile,
}: FileTreePanelProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [createType, setCreateType] = useState<CreateItemType>("file");

    const createEmptyFile = useStore((s) => s.createEmptyFile);
    const folders = useStore((s) => s.folders);
    const loadFolders = useStore((s) => s.loadFolders);

    // Load folders on mount
    useEffect(() => {
        if (isInitialized) {
            loadFolders();
        }
    }, [isInitialized, loadFolders]);

    const fileTreeManager = useMemo(() => new FileTreeManager(), []);
    const fileTree = useMemo(() => {
        return fileTreeManager.buildTree(files, folders);
    }, [files, folders, fileTreeManager]);

    // Get existing file and folder names at root level for duplicate detection
    const existingNames = useMemo(() => {
        // For now, we create files at /src by default
        const fileNames = files
            .filter((f) => f.parentPath === "/src")
            .map((f) => f.name);
        const folderNames = folders
            .filter((f) => f.parentPath === "/src")
            .map((f) => f.name);
        return [...fileNames, ...folderNames];
    }, [files, folders]);

    const handleAddFile = useCallback(() => {
        setCreateType("file");
        setDialogOpen(true);
    }, []);

    const handleAddFolder = useCallback(() => {
        setCreateType("folder");
        setDialogOpen(true);
    }, []);

    const createFolder = useStore((s) => s.createFolder);

    const handleSubmit = useCallback(async (name: string) => {
        if (createType === "file") {
            await createEmptyFile(name, "/src");
        } else {
            await createFolder(name, "/src");
        }
        setDialogOpen(false);
    }, [createType, createEmptyFile, createFolder]);

    const handleCancel = useCallback(() => {
        setDialogOpen(false);
    }, []);

    return (
        <aside className="h-full bg-muted border-r flex flex-col">
            <div className="p-3 border-b bg-background flex items-center justify-between">
                <h2 className="text-sm font-medium">Project Files</h2>
                <AddButton
                    onAddFile={handleAddFile}
                    onAddFolder={handleAddFolder}
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

            <CreateDialog
                open={dialogOpen}
                type={createType}
                parentPath="/src"
                existingNames={existingNames}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </aside>
    );
}
