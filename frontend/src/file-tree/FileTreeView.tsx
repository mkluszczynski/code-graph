/**
 * FileTreeView Component
 *
 * Recursive file tree component for displaying project files and folders
 */

import { ChevronDown, ChevronRight, File, Folder, Trash2, Edit3, Copy } from "lucide-react";
import React from "react";
import { useStore } from "../shared/store";
import { cn } from "../shared/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { FileTreeNode } from "./types";

interface FileTreeViewProps {
  /** Root nodes of the file tree */
  nodes: FileTreeNode[];
  /** Callback when a file is selected */
  onFileSelect?: (fileId: string) => void;
  /** Current indentation level (for recursion) */
  level?: number;
}

/**
 * FileTreeView component with recursive rendering
 */
export const FileTreeView: React.FC<FileTreeViewProps> = ({
  nodes,
  onFileSelect,
  level = 0,
}) => {
  const activeFileId = useStore((state) => state.activeFileId);
  const setActiveFile = useStore((state) => state.setActiveFile);
  const deleteFile = useStore((state) => state.deleteFile);
  const renameFile = useStore((state) => state.renameFile);
  const duplicateFile = useStore((state) => state.duplicateFile);
  const getFileById = useStore((state) => state.getFileById);

  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
    new Set()
  );

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<{ id: string; name: string } | null>(null);

  // Rename state
  const [renamingFileId, setRenamingFileId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameError, setRenameError] = React.useState<string | null>(null);
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-expand src folder when it has children (for better UX)
  React.useEffect(() => {
    if (level === 0) {
      const srcFolder = nodes.find(node => node.name === 'src' && node.type === 'folder');
      if (srcFolder && srcFolder.children.length > 0) {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(srcFolder.id);
          return newSet;
        });
      }
    }
  }, [nodes, level]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFileClick = (fileId: string) => {
    setActiveFile(fileId);
    onFileSelect?.(fileId);
  };

  const handleDeleteClick = (fileId: string) => {
    const file = getFileById(fileId);
    if (file) {
      setFileToDelete({ id: file.id, name: file.name });
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      try {
        await deleteFile(fileToDelete.id);
        setDeleteDialogOpen(false);
        setFileToDelete(null);
      } catch (error) {
        console.error("Failed to delete file:", error);
        // TODO: Show error toast/notification
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  const handleRenameStart = (fileId: string) => {
    const file = getFileById(fileId);
    if (file) {
      setRenamingFileId(fileId);
      setRenameValue(file.name);
      setRenameError(null);
      // Focus input after render
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 0);
    }
  };

  const handleRenameCommit = async () => {
    if (!renamingFileId || !renameValue.trim()) {
      setRenameError("Filename cannot be empty");
      return;
    }

    try {
      await renameFile(renamingFileId, renameValue.trim());
      setRenamingFileId(null);
      setRenameValue("");
      setRenameError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to rename file";
      setRenameError(errorMessage);
      // Keep input focused so user can fix the error
      renameInputRef.current?.focus();
    }
  };

  const handleRenameCancel = () => {
    setRenamingFileId(null);
    setRenameValue("");
    setRenameError(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleRenameCancel();
    }
  };

  const handleDuplicateClick = async (fileId: string) => {
    try {
      const result = await duplicateFile(fileId);
      if (result.success && result.newFileId) {
        // Select the newly duplicated file
        setActiveFile(result.newFileId);
      } else if (result.error) {
        console.error("Failed to duplicate file:", result.error);
        // TODO: Show error toast/notification
      }
    } catch (error) {
      console.error("Failed to duplicate file:", error);
      // TODO: Show error toast/notification
    }
  };

  return (
    <div className="w-full">
      {/* Delete confirmation dialog */}
      {fileToDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          fileName={fileToDelete.name}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {nodes.map((node) => (
        <div key={node.id}>
          {node.type === "folder" ? (
            <div>
              <button
                onClick={() => toggleFolder(node.id)}
                className={cn(
                  "flex items-center gap-1 w-full px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors",
                  "cursor-pointer select-none"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                data-testid={`folder-${node.name}`}
              >
                {expandedFolders.has(node.id) ? (
                  <ChevronDown className="h-4 w-4 shrink-0" data-lucide="chevron-down" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" data-lucide="chevron-right" />
                )}
                <Folder className="h-4 w-4 shrink-0 text-blue-500" />
                <span className="truncate">{node.name}</span>
              </button>

              {expandedFolders.has(node.id) && node.children.length > 0 && (
                <FileTreeView
                  nodes={node.children}
                  onFileSelect={onFileSelect}
                  level={level + 1}
                />
              )}
            </div>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div
                  className={cn(
                    "file-tree-item flex items-center gap-1 w-full px-2 py-1 text-sm rounded-sm transition-colors",
                    "cursor-pointer select-none",
                    activeFileId === node.id
                      ? "selected bg-accent text-accent-foreground font-medium"
                      : "hover:bg-accent/50 hover:text-accent-foreground"
                  )}
                  style={{ paddingLeft: `${level * 12 + 24}px` }}
                  data-testid={`file-${node.name}`}
                  onClick={() => renamingFileId !== node.id && handleFileClick(node.id)}
                >
                  <File className="h-4 w-4 shrink-0 text-gray-500" />
                  {renamingFileId === node.id ? (
                    <div className="flex-1 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameCommit}
                        onKeyDown={handleRenameKeyDown}
                        className={cn(
                          "flex-1 px-1 py-0.5 text-sm bg-background border rounded",
                          renameError ? "border-destructive" : "border-input"
                        )}
                        data-testid={`rename-input-${node.name}`}
                      />
                      {renameError && (
                        <span className="text-xs text-destructive" data-testid="rename-error">
                          {renameError}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="truncate">{node.name}</span>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleRenameStart(node.id)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleDuplicateClick(node.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleDeleteClick(node.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
        </div>
      ))}
    </div>
  );
};
