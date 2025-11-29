/**
 * File Tree Type Definitions
 *
 * Types for hierarchical file tree structure and navigation
 */

/**
 * Type of item to create (file or folder)
 */
export type CreateItemType = "file" | "folder";

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

/**
 * File operation types for context menu actions
 */
export type FileOperationType = "rename" | "duplicate" | "delete";

/**
 * Context menu action handler
 */
export interface FileOperationHandler {
  /** Type of operation */
  type: FileOperationType;
  /** Handler function that receives the file ID */
  handler: (fileId: string) => void | Promise<void>;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Whether the filename is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Options for generating duplicate file names
 */
export interface DuplicateNameOptions {
  /** Existing file names in the same directory */
  existingNames: string[];
  /** Maximum number of attempts to find unique name */
  maxAttempts?: number;
}

/**
 * Result of a folder operation (create, delete, rename, duplicate)
 */
export interface FolderOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Number of files affected (created, deleted, or updated) */
  affectedCount: number;
  /** New folder path (for rename/duplicate operations) */
  newPath?: string;
  /** Error message if operation failed */
  error?: string;
}

// ============================================================================
// Drag-and-Drop Types (Feature 007)
// ============================================================================

/**
 * Type of item being dragged
 */
export type DragItemType = 'file' | 'folder';

/**
 * Represents the state of an active drag operation
 */
export interface DragState {
  /** Type of item being dragged */
  itemType: DragItemType;
  /** ID of the dragged item (fileId for files, folder path for folders) */
  itemId: string;
  /** Full path of the dragged item */
  sourcePath: string;
  /** Parent folder path of the dragged item (for rollback) */
  sourceParentPath: string;
  /** Name of the item being dragged */
  name: string;
  /** Timestamp when drag started (for performance monitoring) */
  dragStartTime: number;
}

/**
 * Represents a potential drop target during drag hover
 */
export interface DropTarget {
  /** Path of the target folder */
  targetPath: string;
  /** Whether this is a valid drop target for current drag */
  isValid: boolean;
  /** Timestamp when hover started (for auto-expand) */
  hoverStartTime: number;
  /** Validation error message (if isValid === false) */
  errorMessage?: string;
}
