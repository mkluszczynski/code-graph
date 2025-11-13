/**
 * FileTreeManager - Manages file tree structure construction and navigation
 *
 * Converts flat file lists into hierarchical tree structures for display
 */

import type { ProjectFile } from "../shared/types";
import type { FileTreeNode, FileTreeOptions } from "./types";

/**
 * Manages file tree construction and navigation
 */
export class FileTreeManager {
  /**
   * Build hierarchical file tree from flat file list
   *
   * @param files - Flat array of ProjectFile objects
   * @param options - Optional configuration for tree building
   * @returns Array of root-level FileTreeNode objects
   */
  buildTree(files: ProjectFile[], options?: FileTreeOptions): FileTreeNode[] {
    if (files.length === 0) {
      return [];
    }

    // Map to store all nodes by their path
    const nodeMap = new Map<string, FileTreeNode>();

    // Create file nodes first
    for (const file of files) {
      const pathParts = file.path.split("/").filter((part) => part !== "");
      const fileName = pathParts[pathParts.length - 1];
      const extension = fileName.includes(".")
        ? fileName.split(".").pop() || ""
        : "";

      const fileNode: FileTreeNode = {
        id: file.id,
        name: fileName,
        path: file.path,
        type: "file",
        children: [],
        parentId: null,
        extension,
      };

      nodeMap.set(file.path, fileNode);

      // Create folder nodes for all parent directories
      let currentPath = "";
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        currentPath += "/" + folderName;

        if (!nodeMap.has(currentPath)) {
          const folderId = `folder-${currentPath.replace(/\//g, "-")}`;
          const folderNode: FileTreeNode = {
            id: folderId,
            name: folderName,
            path: currentPath,
            type: "folder",
            children: [],
            parentId: null,
            isExpanded: false,
          };
          nodeMap.set(currentPath, folderNode);
        }
      }
    }

    // Build parent-child relationships
    for (const node of nodeMap.values()) {
      const pathParts = node.path.split("/").filter((part) => part !== "");

      if (pathParts.length > 1) {
        // Find parent path
        const parentPathParts = pathParts.slice(0, -1);
        const parentPath = "/" + parentPathParts.join("/");
        const parentNode = nodeMap.get(parentPath);

        if (parentNode) {
          node.parentId = parentNode.id;
          parentNode.children.push(node);
        }
      }
    }

    // Sort children if requested
    if (options?.sortAlphabetically !== false) {
      for (const node of nodeMap.values()) {
        if (node.type === "folder") {
          node.children = this.sortNodes(node.children, options?.sortFn);
        }
      }
    }

    // Find and return root nodes (nodes with parentId === null)
    const rootNodes = Array.from(nodeMap.values()).filter(
      (node) => node.parentId === null
    );

    return this.sortNodes(rootNodes, options?.sortFn);
  }

  /**
   * Sort file tree nodes alphabetically (folders first, then files)
   *
   * @param nodes - Array of FileTreeNode objects to sort
   * @param customSortFn - Optional custom sort function
   * @returns Sorted array of nodes
   */
  private sortNodes(
    nodes: FileTreeNode[],
    customSortFn?: (a: FileTreeNode, b: FileTreeNode) => number
  ): FileTreeNode[] {
    if (customSortFn) {
      return [...nodes].sort(customSortFn);
    }

    return [...nodes].sort((a, b) => {
      // Folders come before files
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      // Within same type, sort alphabetically by name
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  /**
   * Sort files alphabetically for backward compatibility
   *
   * @param files - Array of ProjectFile objects
   * @returns Sorted array of files
   */
  sortFiles(files: ProjectFile[]): ProjectFile[] {
    return [...files].sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  /**
   * Find a file node in the tree by file ID
   *
   * @param tree - Array of root FileTreeNode objects
   * @param fileId - File ID to search for
   * @returns FileTreeNode if found, undefined otherwise
   */
  findFileInTree(
    tree: FileTreeNode[],
    fileId: string
  ): FileTreeNode | undefined {
    for (const node of tree) {
      if (node.id === fileId && node.type === "file") {
        return node;
      }

      // Recursively search in children
      if (node.children.length > 0) {
        const found = this.findFileInTree(node.children, fileId);
        if (found) {
          return found;
        }
      }
    }

    return undefined;
  }
}
