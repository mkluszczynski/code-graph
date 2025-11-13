/**
 * File Tree Type Definitions
 *
 * Types for hierarchical file tree structure and navigation
 */

/**
 * Represents a node in the hierarchical file tree
 */
export interface FileTreeNode {
  /** Unique identifier (file ID for files, generated for folders) */
  id: string;
  /** Display name (file name or folder name) */
  name: string;
  /** Full path (e.g., "/src/models/Person.ts" or "/src/models") */
  path: string;
  /** Type of node */
  type: "file" | "folder";
  /** Child nodes (for folders) */
  children: FileTreeNode[];
  /** Parent node ID (null for root nodes) */
  parentId: string | null;
  /** Whether the folder is expanded (only for folders) */
  isExpanded?: boolean;
  /** File extension (only for files, e.g., "ts", "tsx") */
  extension?: string;
}

/**
 * Options for building the file tree
 */
export interface FileTreeOptions {
  /** Whether to sort files alphabetically */
  sortAlphabetically?: boolean;
  /** Whether to group files by folder */
  groupByFolder?: boolean;
  /** Custom sort function */
  sortFn?: (a: FileTreeNode, b: FileTreeNode) => number;
}
