/**
 * FileTreeView Component
 *
 * Recursive file tree component for displaying project files and folders
 */

import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import React from "react";
import { useStore } from "../shared/store";
import { cn } from "../shared/utils";
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

  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
    new Set()
  );

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

  return (
    <div className="w-full">
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
              >
                {expandedFolders.has(node.id) ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
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
            <button
              onClick={() => handleFileClick(node.id)}
              className={cn(
                "flex items-center gap-1 w-full px-2 py-1 text-sm rounded-sm transition-colors",
                "cursor-pointer select-none",
                activeFileId === node.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-accent/50 hover:text-accent-foreground"
              )}
              style={{ paddingLeft: `${level * 12 + 24}px` }}
            >
              <File className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="truncate">{node.name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
