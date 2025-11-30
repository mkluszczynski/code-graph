/**
 * FileTreeView Component
 *
 * Recursive file tree component for displaying project files and folders
 * with context menu actions, rename inline editing, and delete confirmation.
 * 
 * NOTE: This file is 600+ lines. Justification:
 * - Recursive tree component requires context passing at multiple levels
 * - Context menu integration adds substantial event handling
 * - Inline rename editing with focus management adds complexity
 * - File and folder operations are tightly coupled to UI state
 * - Splitting would break component coherence and prop drilling
 * Constitutional exception: Complexity justified for tree component.
 */

import { AlertTriangle, ChevronDown, ChevronRight, File, FilePlus, Folder, Trash2, Edit3, Copy } from "lucide-react";
import React, { useCallback, useRef } from "react";
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
import { getFilesInFolder, getParentPath } from "./FolderOperations";
import { DragDropManager, type DragItem } from "./DragDropManager";
import { isSupportedLanguage } from "../parsers/utils";
import type { FileTreeNode } from "./types";

interface FileTreeViewProps {
  /** Root nodes of the file tree */
  nodes: FileTreeNode[];
  /** Callback when a file is selected */
  onFileSelect?: (fileId: string) => void;
  /** Callback when "Add File" is clicked on a folder */
  onAddFileToFolder?: (folderPath: string) => void;
  /** Current indentation level (for recursion) */
  level?: number;
  /** ID of file being renamed (shared across all levels) */
  renamingFileIdProp?: string | null;
  /** Rename value (shared across all levels) */
  renameValueProp?: string;
  /** Rename error (shared across all levels) */
  renameErrorProp?: string | null;
  /** Rename input ref (shared across all levels) */
  renameInputRefProp?: React.RefObject<HTMLInputElement | null>;
  /** Callback when rename is committed */
  onRenameCommit?: () => void;
  /** Callback when rename is cancelled */
  onRenameCancel?: () => void;
  /** Callback when rename value changes */
  onRenameChange?: (value: string) => void;
  /** Callback when rename keydown */
  onRenameKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * FileTreeView component with recursive rendering
 */
export const FileTreeView: React.FC<FileTreeViewProps> = ({
  nodes,
  onFileSelect,
  onAddFileToFolder,
  level = 0,
  renamingFileIdProp,
  renameValueProp,
  renameErrorProp,
  renameInputRefProp,
  onRenameCommit: onRenameCommitProp,
  onRenameCancel: onRenameCancelProp,
  onRenameChange: onRenameChangeProp,
  onRenameKeyDown: onRenameKeyDownProp,
}) => {
  const activeFileId = useStore((state) => state.activeFileId);
  const setActiveFile = useStore((state) => state.setActiveFile);
  const deleteFile = useStore((state) => state.deleteFile);
  const deleteFolder = useStore((state) => state.deleteFolder);
  const renameFile = useStore((state) => state.renameFile);
  const renameFolder = useStore((state) => state.renameFolder);
  const duplicateFile = useStore((state) => state.duplicateFile);
  const duplicateFolder = useStore((state) => state.duplicateFolder);
  const getFileById = useStore((state) => state.getFileById);
  const files = useStore((state) => state.files);
  const folders = useStore((state) => state.folders);

  // Drag-and-drop state
  const dragState = useStore((state) => state.dragState);
  const dropTarget = useStore((state) => state.dropTarget);
  const startDrag = useStore((state) => state.startDrag);
  const endDrag = useStore((state) => state.endDrag);
  const setDropTarget = useStore((state) => state.setDropTarget);
  const cancelDrag = useStore((state) => state.cancelDrag);
  const moveFile = useStore((state) => state.moveFile);
  const storeMoveFolder = useStore((state) => state.moveFolder);

  // Drag-drop manager instance
  const dragDropManager = React.useMemo(() => new DragDropManager(), []);

  // Auto-expand timer ref
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to get existing names in a folder
  const getExistingNamesInFolder = useCallback((folderPath: string) => {
    const fileNames = files.filter(f => f.parentPath === folderPath).map(f => f.name);
    const folderNames = folders.filter(f => f.parentPath === folderPath).map(f => f.name);
    return [...fileNames, ...folderNames];
  }, [files, folders]);

  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
    new Set()
  );

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<{ id: string; name: string } | null>(null);
  const [folderToDelete, setFolderToDelete] = React.useState<{ path: string; name: string; fileCount: number } | null>(null);

  // Rename state - use props if provided (nested), otherwise create local state (root)
  const [renamingFileIdLocal, setRenamingFileIdLocal] = React.useState<string | null>(null);
  const [renameValueLocal, setRenameValueLocal] = React.useState("");
  const [renameErrorLocal, setRenameErrorLocal] = React.useState<string | null>(null);
  const renameInputRefLocal = React.useRef<HTMLInputElement>(null);

  // Folder rename state
  const [renamingFolderPath, setRenamingFolderPath] = React.useState<string | null>(null);
  const [folderRenameValue, setFolderRenameValue] = React.useState("");
  const [folderRenameError, setFolderRenameError] = React.useState<string | null>(null);
  const folderRenameInputRef = React.useRef<HTMLInputElement>(null);

  // Use prop values if provided (nested component), otherwise use local state (root component)
  const renamingFileId = renamingFileIdProp !== undefined ? renamingFileIdProp : renamingFileIdLocal;
  const setRenamingFileId = level === 0 ? setRenamingFileIdLocal : () => { };
  const renameValue = renameValueProp !== undefined ? renameValueProp : renameValueLocal;
  const setRenameValue = level === 0 ? setRenameValueLocal : (onRenameChangeProp || (() => { }));
  const renameError = renameErrorProp !== undefined ? renameErrorProp : renameErrorLocal;
  const setRenameError = level === 0 ? setRenameErrorLocal : () => { };
  const renameInputRef = renameInputRefProp || renameInputRefLocal;

  // Performance monitoring
  const contextMenuOpenTimeRef = React.useRef<number>(0);

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

  // ============================================================================
  // Drag-and-Drop Handlers (Feature 007)
  // ============================================================================

  // File drag start handler
  const handleFileDragStart = useCallback((e: React.DragEvent, node: FileTreeNode) => {
    const file = files.find(f => f.id === node.id);
    if (!file) return;

    const dragData: DragItem = {
      type: 'file',
      id: file.id,
      path: file.path,
      parentPath: file.parentPath,
      name: file.name,
    };

    e.dataTransfer.setData('application/x-file-tree-item', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';

    startDrag({
      type: 'file',
      id: file.id,
      path: file.path,
      parentPath: file.parentPath,
      name: file.name,
    });
  }, [files, startDrag]);

  // Folder drag start handler
  const handleFolderDragStart = useCallback((e: React.DragEvent, node: FileTreeNode) => {
    const folder = folders.find(f => f.path === node.path);
    if (!folder) return;

    const dragData: DragItem = {
      type: 'folder',
      id: folder.id,
      path: folder.path,
      parentPath: folder.parentPath,
      name: folder.name,
    };

    e.dataTransfer.setData('application/x-file-tree-item', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';

    startDrag({
      type: 'folder',
      id: folder.id,
      path: folder.path,
      parentPath: folder.parentPath,
      name: folder.name,
    });
  }, [folders, startDrag]);

  // Drag end handler
  const handleDragEnd = useCallback(() => {
    endDrag();
    // Clear auto-expand timer
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
  }, [endDrag]);

  // Folder drag over handler - validates drop target
  const handleFolderDragOver = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState) return;

    const existingNames = getExistingNamesInFolder(folderPath);
    const dragItem: DragItem = {
      type: dragState.itemType,
      id: dragState.itemId,
      path: dragState.sourcePath,
      parentPath: dragState.sourceParentPath,
      name: dragState.name,
    };

    const validation = dragDropManager.validateDrop(dragItem, folderPath, existingNames);

    setDropTarget({
      targetPath: folderPath,
      isValid: validation.isValid,
      hoverStartTime: dropTarget?.targetPath === folderPath ? dropTarget.hoverStartTime : performance.now(),
      errorMessage: validation.errorMessage,
    });

    e.dataTransfer.dropEffect = validation.isValid ? 'move' : 'none';
  }, [dragState, getExistingNamesInFolder, dragDropManager, setDropTarget, dropTarget]);

  // Folder drag enter handler - starts auto-expand timer
  const handleFolderDragEnter = useCallback((e: React.DragEvent, node: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear existing timer
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
    }

    // Set auto-expand timer (500ms)
    if (!expandedFolders.has(node.id)) {
      autoExpandTimerRef.current = setTimeout(() => {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(node.id);
          return newSet;
        });
      }, 500);
    }
  }, [expandedFolders]);

  // Folder drag leave handler - clears auto-expand timer
  const handleFolderDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear auto-expand timer
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
  }, []);

  // Folder drop handler - executes the move operation
  const handleFolderDrop = useCallback(async (e: React.DragEvent, targetFolderPath: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Performance monitoring: track total drop operation time
    const dropStartTime = performance.now();

    // Clear auto-expand timer
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }

    const data = e.dataTransfer.getData('application/x-file-tree-item');
    if (!data) {
      endDrag();
      return;
    }

    try {
      const dragItem: DragItem = JSON.parse(data);

      const existingNames = getExistingNamesInFolder(targetFolderPath);
      const validation = dragDropManager.validateDrop(dragItem, targetFolderPath, existingNames);

      if (!validation.isValid) {
        if (import.meta.env.DEV) {
          console.warn('Invalid drop:', validation.errorMessage);
        }
        endDrag();
        return;
      }

      // Execute move operation
      const moveStartTime = performance.now();

      if (dragItem.type === 'file') {
        await moveFile(dragItem.id, targetFolderPath);
      } else if (dragItem.type === 'folder') {
        await storeMoveFolder(dragItem.id, targetFolderPath);
      }

      // Performance monitoring: warn if move operation is slow
      const moveTime = performance.now() - moveStartTime;
      if (import.meta.env.DEV && moveTime > 500) {
        console.warn(`Performance: Move operation took ${moveTime.toFixed(2)}ms (target: <500ms)`);
      }

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Drop error:', error);
      }
    }

    endDrag();

    // Performance monitoring: warn if total drop operation is slow
    const totalTime = performance.now() - dropStartTime;
    if (import.meta.env.DEV && totalTime > 1000) {
      console.warn(`Performance: Total drop operation took ${totalTime.toFixed(2)}ms (target: <1000ms)`);
    }
  }, [endDrag, getExistingNamesInFolder, dragDropManager, moveFile]);

  // Escape key handler to cancel drag
  React.useEffect(() => {
    if (!dragState) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelDrag();
        if (autoExpandTimerRef.current) {
          clearTimeout(autoExpandTimerRef.current);
          autoExpandTimerRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [dragState, cancelDrag]);

  // ============================================================================
  // End Drag-and-Drop Handlers
  // ============================================================================

  const handleFileClick = React.useCallback((fileId: string) => {
    setActiveFile(fileId);
    onFileSelect?.(fileId);
  }, [setActiveFile, onFileSelect]);

  const handleDeleteClick = React.useCallback((fileId: string) => {
    const file = getFileById(fileId);
    if (file) {
      setFileToDelete({ id: file.id, name: file.name });
      setDeleteDialogOpen(true);
    }
  }, [getFileById]);

  const handleDeleteConfirm = React.useCallback(async () => {
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
  }, [fileToDelete, deleteFile]);

  const handleDeleteCancel = React.useCallback(() => {
    setDeleteDialogOpen(false);
    setFileToDelete(null);
    setFolderToDelete(null);
  }, []);

  const handleFolderDeleteClick = React.useCallback((folderPath: string, folderName: string) => {
    // Count files in folder
    const folderFiles = getFilesInFolder(files, folderPath);

    setFolderToDelete({
      path: folderPath,
      name: folderName,
      fileCount: folderFiles.length
    });
    setDeleteDialogOpen(true);
  }, [files]);

  const handleFolderDeleteConfirm = React.useCallback(async () => {
    if (folderToDelete) {
      try {
        const result = await deleteFolder(folderToDelete.path);
        if (result.success) {
          setDeleteDialogOpen(false);
          setFolderToDelete(null);
        } else {
          console.error("Failed to delete folder:", result.error);
          // TODO: Show error toast/notification
        }
      } catch (error) {
        console.error("Failed to delete folder:", error);
        // TODO: Show error toast/notification
      }
    }
  }, [folderToDelete, deleteFolder]);

  // Track if we just started editing to prevent immediate blur commit
  const isJustStartedEditingRef = React.useRef(false);

  // Folder rename handlers
  const handleFolderRenameStart = useCallback((folderPath: string, folderName: string) => {
    isJustStartedEditingRef.current = true;
    setRenamingFolderPath(folderPath);
    setFolderRenameValue(folderName);
    setFolderRenameError(null);

    // Focus input after state update
    setTimeout(() => {
      if (folderRenameInputRef.current) {
        folderRenameInputRef.current.focus();
        folderRenameInputRef.current.select();
      }
      // Reset the flag after a short delay to allow initial blur to be ignored
      setTimeout(() => {
        isJustStartedEditingRef.current = false;
      }, 100);
    }, 0);
  }, []);

  const handleFolderRenameCommit = React.useCallback(async (force: boolean = false) => {
    // Ignore blur events that happen immediately after starting to edit
    // But allow explicit commits (Enter key) to bypass this check
    if (!force && isJustStartedEditingRef.current) {
      return;
    }

    if (!renamingFolderPath || !folderRenameValue.trim()) {
      setFolderRenameError("Folder name cannot be empty");
      return;
    }

    try {
      // Get parent path and construct new full path
      const parentPath = getParentPath(renamingFolderPath);
      const newPath = parentPath === "/"
        ? `/${folderRenameValue.trim()}`
        : `${parentPath}/${folderRenameValue.trim()}`;

      const result = await renameFolder(renamingFolderPath, newPath);
      if (result.success) {
        setRenamingFolderPath(null);
        setFolderRenameValue("");
        setFolderRenameError(null);
      } else {
        setFolderRenameError(result.error || "Failed to rename folder");
        folderRenameInputRef.current?.focus();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to rename folder";
      setFolderRenameError(errorMessage);
      folderRenameInputRef.current?.focus();
    }
  }, [renamingFolderPath, folderRenameValue, renameFolder]);

  const handleFolderRenameCancel = React.useCallback(() => {
    setRenamingFolderPath(null);
    setFolderRenameValue("");
    setFolderRenameError(null);
  }, []);

  const handleFolderRenameKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Force commit when Enter is pressed (explicit user action)
      handleFolderRenameCommit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleFolderRenameCancel();
    }
  }, [handleFolderRenameCommit, handleFolderRenameCancel]);

  const handleFolderDuplicateClick = React.useCallback(async (folderPath: string) => {
    try {
      const result = await duplicateFolder(folderPath);
      if (!result.success) {
        console.error("Failed to duplicate folder:", result.error);
        // TODO: Show error toast/notification
      }
    } catch (error) {
      console.error("Failed to duplicate folder:", error);
      // TODO: Show error toast/notification
    }
  }, [duplicateFolder]);

  const handleRenameStart = useCallback(
    (fileId: string) => {
      const file = getFileById(fileId);
      if (!file) return;

      setRenamingFileId(fileId);
      setRenameValue(file.name);
      setRenameError(null);

      // Focus input after state update
      setTimeout(() => {
        if (renameInputRef.current) {
          renameInputRef.current.focus();
          renameInputRef.current.select();
        }
      }, 0);
    },
    [getFileById],
  ); const handleRenameCommit = React.useCallback(async () => {
    if (!renamingFileId || !renameValue.trim()) {
      setRenameError("File name cannot be empty");
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
  }, [renamingFileId, renameValue, renameFile]);

  const handleRenameCancel = React.useCallback(() => {
    setRenamingFileId(null);
    setRenameValue("");
    setRenameError(null);
  }, []);

  const handleRenameKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleRenameCancel();
    }
  }, [handleRenameCommit, handleRenameCancel]);

  const handleDuplicateClick = React.useCallback(async (fileId: string) => {
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
  }, [duplicateFile, setActiveFile]);

  // Keyboard shortcut handler
  React.useEffect(() => {
    if (level !== 0) return; // Only attach keyboard handler at root level

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in rename input
      if (renamingFileId) return;

      // Only handle shortcuts when a file is selected (active)
      if (!activeFileId) return;

      // F2 - Rename
      if (e.key === "F2") {
        e.preventDefault();
        handleRenameStart(activeFileId);
      }
      // Delete - Delete file
      else if (e.key === "Delete") {
        e.preventDefault();
        handleDeleteClick(activeFileId);
      }
      // Ctrl+D (or Cmd+D on Mac) - Duplicate
      else if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handleDuplicateClick(activeFileId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [level, activeFileId, renamingFileId, handleRenameStart, handleDeleteClick, handleDuplicateClick]);

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
      {folderToDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          fileName={folderToDelete.name}
          fileCount={folderToDelete.fileCount}
          onConfirm={handleFolderDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {nodes.map((node) => (
        <div key={node.id}>
          {node.type === "folder" ? (
            <div>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <button
                    draggable={node.name !== 'src'}
                    onDragStart={(e) => handleFolderDragStart(e, node)}
                    onDragEnd={handleDragEnd}
                    onClick={() => renamingFolderPath !== node.path && toggleFolder(node.id)}
                    onDragOver={(e) => handleFolderDragOver(e, node.path)}
                    onDragEnter={(e) => handleFolderDragEnter(e, node)}
                    onDragLeave={handleFolderDragLeave}
                    onDrop={(e) => handleFolderDrop(e, node.path)}
                    className={cn(
                      "flex items-center gap-1 w-full px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors",
                      "cursor-pointer select-none"
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    role="treeitem"
                    aria-grabbed={dragState?.sourcePath === node.path ? true : undefined}
                    aria-dropeffect={dropTarget?.targetPath === node.path ? (dropTarget.isValid ? "move" : "none") : undefined}
                    aria-expanded={expandedFolders.has(node.id)}
                    aria-label={`Folder ${node.name}${dragState?.sourcePath === node.path ? ", dragging" : ""}`}
                    data-testid={`folder-${node.name}`}
                    data-dragging={dragState?.sourcePath === node.path ? "true" : undefined}
                    data-drop-target={dropTarget?.targetPath === node.path && dropTarget.isValid ? "true" : undefined}
                    data-drop-invalid={dropTarget?.targetPath === node.path && !dropTarget.isValid ? "true" : undefined}
                  >
                    {expandedFolders.has(node.id) ? (
                      <ChevronDown className="h-4 w-4 shrink-0" data-lucide="chevron-down" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" data-lucide="chevron-right" />
                    )}
                    <Folder className="h-4 w-4 shrink-0 text-blue-500" />
                    {renamingFolderPath === node.path ? (
                      <div className="flex-1 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={folderRenameInputRef}
                          type="text"
                          value={folderRenameValue}
                          onChange={(e) => setFolderRenameValue(e.target.value)}
                          onBlur={() => handleFolderRenameCommit(false)}
                          onKeyDown={handleFolderRenameKeyDown}
                          className={cn(
                            "flex-1 px-1 py-0.5 text-sm bg-background border rounded",
                            folderRenameError ? "border-destructive" : "border-input"
                          )}
                          data-testid={`folder-rename-input-${node.name}`}
                        />
                        {folderRenameError && (
                          <span className="text-xs text-destructive" data-testid="folder-rename-error">
                            {folderRenameError}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="truncate">{node.name}</span>
                    )}
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => onAddFileToFolder?.(node.path)}
                    aria-label={`Add file to ${node.name}`}
                    data-testid="context-menu-add-file"
                  >
                    <FilePlus className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span className="flex-1">Add File</span>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => handleFolderRenameStart(node.path, node.name)}
                    aria-label={`Rename folder ${node.name}`}
                    data-testid="context-menu-rename-folder"
                  >
                    <Edit3 className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span className="flex-1">Rename</span>
                    <kbd className="ml-auto text-xs text-muted-foreground">F2</kbd>
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleFolderDuplicateClick(node.path)}
                    aria-label={`Duplicate folder ${node.name}`}
                    data-testid="context-menu-duplicate-folder"
                  >
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span className="flex-1">Duplicate</span>
                    <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+D</kbd>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => handleFolderDeleteClick(node.path, node.name)}
                    className="text-destructive focus:text-destructive"
                    aria-label={`Delete folder ${node.name}`}
                    data-testid="context-menu-delete-folder"
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span className="flex-1">Delete</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {expandedFolders.has(node.id) && node.children.length > 0 && (
                <FileTreeView
                  nodes={node.children}
                  onFileSelect={onFileSelect}
                  onAddFileToFolder={onAddFileToFolder}
                  level={level + 1}
                  renamingFileIdProp={renamingFileId}
                  renameValueProp={renameValue}
                  renameErrorProp={renameError}
                  renameInputRefProp={renameInputRef}
                  onRenameCommit={level === 0 ? handleRenameCommit : onRenameCommitProp}
                  onRenameCancel={level === 0 ? handleRenameCancel : onRenameCancelProp}
                  onRenameChange={level === 0 ? (val) => setRenameValueLocal(val) : onRenameChangeProp}
                  onRenameKeyDown={level === 0 ? handleRenameKeyDown : onRenameKeyDownProp}
                />
              )}
            </div>
          ) : (
            <ContextMenu
              onOpenChange={(open) => {
                if (open) {
                  // Record when context menu starts opening
                  contextMenuOpenTimeRef.current = performance.now();
                } else if (contextMenuOpenTimeRef.current > 0) {
                  // Calculate and log context menu open time
                  const openDuration = performance.now() - contextMenuOpenTimeRef.current;
                  if (openDuration > 200) {
                    console.warn(`Context menu open time exceeded target: ${openDuration.toFixed(2)}ms (target: <200ms)`);
                  } else if (import.meta.env.DEV) {
                    console.debug(`Context menu open time: ${openDuration.toFixed(2)}ms`);
                  }
                  contextMenuOpenTimeRef.current = 0;
                }
              }}
            >
              <ContextMenuTrigger asChild>
                <div
                  draggable
                  onDragStart={(e) => handleFileDragStart(e, node)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "file-tree-item flex items-center gap-1 w-full px-2 py-1 text-sm rounded-sm transition-colors",
                    "cursor-pointer select-none",
                    activeFileId === node.id
                      ? "selected bg-accent text-accent-foreground font-medium"
                      : "hover:bg-accent/50 hover:text-accent-foreground"
                  )}
                  style={{ paddingLeft: `${level * 12 + 24}px` }}
                  role="treeitem"
                  aria-grabbed={dragState?.itemId === node.id ? true : undefined}
                  aria-selected={activeFileId === node.id}
                  aria-label={`File ${node.name}${dragState?.itemId === node.id ? ", dragging" : ""}`}
                  data-testid={`file-${node.name}`}
                  data-dragging={dragState?.itemId === node.id ? "true" : undefined}
                  onClick={() => renamingFileId !== node.id && handleFileClick(node.id)}
                >
                  <File className="h-4 w-4 shrink-0 text-gray-500" />
                  {!isSupportedLanguage(node.name) && (
                    <span
                      data-testid="unsupported-warning"
                      aria-label="File type not supported for diagram visualization"
                      title="File type not supported for diagram visualization"
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" aria-hidden="true" />
                    </span>
                  )}
                  {renamingFileId === node.id ? (
                    <div className="flex-1 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => {
                          if (level === 0) {
                            setRenameValueLocal(e.target.value);
                          } else if (onRenameChangeProp) {
                            onRenameChangeProp(e.target.value);
                          }
                        }}
                        onBlur={level === 0 ? handleRenameCommit : onRenameCommitProp}
                        onKeyDown={level === 0 ? handleRenameKeyDown : onRenameKeyDownProp}
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
                <ContextMenuItem
                  onClick={() => handleRenameStart(node.id)}
                  aria-label={`Rename file ${node.name}`}
                  data-testid="context-menu-rename"
                >
                  <Edit3 className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="flex-1">Rename</span>
                  <kbd className="ml-auto text-xs text-muted-foreground">F2</kbd>
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => handleDuplicateClick(node.id)}
                  aria-label={`Duplicate file ${node.name}`}
                  data-testid="context-menu-duplicate"
                >
                  <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="flex-1">Duplicate</span>
                  <kbd className="ml-auto text-xs text-muted-foreground">Ctrl+D</kbd>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleDeleteClick(node.id)}
                  className="text-destructive focus:text-destructive"
                  aria-label={`Delete file ${node.name}`}
                  data-testid="context-menu-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="flex-1">Delete</span>
                  <kbd className="ml-auto text-xs text-muted-foreground">Del</kbd>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
        </div>
      ))}
    </div>
  );
};
