# API Contracts: File Tree Context Menu

**Feature**: 003-file-tree-context-menu  
**Date**: 2025-11-15  
**Type**: TypeScript Interfaces (Client-side)

## Overview

This document defines the TypeScript contracts (interfaces) for the file tree context menu feature. Since this is a client-side only feature with no backend API, contracts are defined as TypeScript interfaces and function signatures.

## 1. File Operations Interface

### `FileOperations` (NEW)

Core interface for file management operations.

```typescript
/**
 * File operations handler for context menu actions
 * 
 * Coordinates between UI layer (FileTreeView) and data layer (Zustand + ProjectManager)
 */
interface FileOperations {
  /**
   * Rename a file
   * 
   * @param fileId - Unique identifier of file to rename
   * @param newName - New filename (including extension)
   * @returns Promise resolving to operation result
   * 
   * @throws {Error} If file not found
   * @throws {Error} If newName is invalid or duplicate
   */
  renameFile(fileId: string, newName: string): Promise<FileOperationResult>;
  
  /**
   * Duplicate a file
   * 
   * @param fileId - Unique identifier of file to duplicate
   * @returns Promise resolving to operation result with new file ID
   * 
   * @throws {Error} If file not found
   * @throws {Error} If storage quota exceeded
   */
  duplicateFile(fileId: string): Promise<FileOperationResult>;
  
  /**
   * Delete a file
   * 
   * @param fileId - Unique identifier of file to delete
   * @returns Promise resolving to operation result
   * 
   * @throws {Error} If file not found
   * @throws {Error} If storage operation fails
   */
  deleteFile(fileId: string): Promise<FileOperationResult>;
  
  /**
   * Validate a filename
   * 
   * @param name - Filename to validate (including extension)
   * @param currentPath - Current file path (for directory context)
   * @param excludeFileId - Optional file ID to exclude from duplicate check (for renames)
   * @returns Error message if invalid, null if valid
   */
  validateFileName(name: string, currentPath: string, excludeFileId?: string): string | null;
  
  /**
   * Generate unique name for duplicate file
   * 
   * @param originalPath - Path of original file
   * @param existingPaths - Array of all existing file paths
   * @returns New unique path for duplicate file
   */
  generateDuplicateName(originalPath: string, existingPaths: string[]): string;
}
```

## 2. State Management Contracts

### `ContextMenuState` (NEW)

```typescript
/**
 * State for context menu UI
 */
interface ContextMenuState {
  /** ID of file for which context menu is open (null when closed) */
  openFileId: string | null;
  
  /** Position of context menu (mouse coordinates) */
  position: { x: number; y: number } | null;
  
  /** Whether menu is currently visible */
  isOpen: boolean;
}
```

### `RenameState` (NEW)

```typescript
/**
 * State for inline rename operation
 */
interface RenameState {
  /** ID of file being renamed (null when not renaming) */
  fileId: string | null;
  
  /** Current value in rename input */
  inputValue: string;
  
  /** Validation error message (null when valid) */
  error: string | null;
  
  /** Original filename (for cancel/rollback) */
  originalName: string;
}
```

### `DeleteConfirmationState` (NEW)

```typescript
/**
 * State for delete confirmation dialog
 */
interface DeleteConfirmationState {
  /** ID of file to be deleted (null when dialog closed) */
  fileId: string | null;
  
  /** File name (for display in confirmation message) */
  fileName: string;
  
  /** Whether dialog is open */
  isOpen: boolean;
  
  /** Whether delete operation is in progress */
  isDeleting: boolean;
}
```

### `FileOperationResult` (NEW)

```typescript
/**
 * Result of a file operation
 */
interface FileOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  
  /** Error message if operation failed */
  error?: string;
  
  /** New file ID (for duplicate operation) */
  newFileId?: string;
  
  /** Operation type */
  operation: 'rename' | 'duplicate' | 'delete';
  
  /** Original file ID that was operated on */
  fileId: string;
}
```

## 3. Component Props Contracts

### `FileTreeViewProps` (EXTEND)

Existing component props, no changes needed. Context menu wraps existing nodes.

```typescript
/**
 * Props for FileTreeView component (existing)
 */
interface FileTreeViewProps {
  /** Root nodes of the file tree */
  nodes: FileTreeNode[];
  
  /** Callback when a file is selected */
  onFileSelect?: (fileId: string) => void;
  
  /** Current indentation level (for recursion) */
  level?: number;
}
```

### `FileContextMenuProps` (NEW)

```typescript
/**
 * Props for context menu wrapper component
 */
interface FileContextMenuProps {
  /** File node that context menu is attached to */
  fileNode: FileTreeNode;
  
  /** Child content (the file tree item) */
  children: React.ReactNode;
  
  /** Callback when rename is initiated */
  onRenameStart?: (fileId: string) => void;
  
  /** Callback when duplicate is initiated */
  onDuplicate?: (fileId: string) => void;
  
  /** Callback when delete is initiated */
  onDeleteStart?: (fileId: string) => void;
}
```

### `RenameInputProps` (NEW)

```typescript
/**
 * Props for inline rename input component
 */
interface RenameInputProps {
  /** Current filename value */
  value: string;
  
  /** File ID being renamed */
  fileId: string;
  
  /** Callback when value changes */
  onChange: (value: string) => void;
  
  /** Callback when rename is committed (Enter or blur) */
  onCommit: () => void;
  
  /** Callback when rename is cancelled (Escape) */
  onCancel: () => void;
  
  /** Validation error message (if any) */
  error: string | null;
}
```

### `DeleteConfirmDialogProps` (NEW)

```typescript
/**
 * Props for delete confirmation dialog
 */
interface DeleteConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  
  /** File name to display in confirmation message */
  fileName: string;
  
  /** File ID to delete */
  fileId: string;
  
  /** Callback when delete is confirmed */
  onConfirm: (fileId: string) => void;
  
  /** Whether delete operation is in progress */
  isDeleting: boolean;
}
```

## 4. Zustand Store Actions (EXTEND)

### `FileSlice` Actions (ADD)

```typescript
/**
 * Extended FileSlice with file operation actions
 */
interface FileSlice {
  // ... existing properties and methods
  
  /**
   * Rename a file (updates name, path, and persists to DB)
   * 
   * @param fileId - File to rename
   * @param newName - New filename
   * @returns Promise resolving to operation result
   */
  renameFile: (fileId: string, newName: string) => Promise<FileOperationResult>;
  
  /**
   * Duplicate a file (creates copy with modified name)
   * 
   * @param fileId - File to duplicate
   * @returns Promise resolving to operation result with new file ID
   */
  duplicateFile: (fileId: string) => Promise<FileOperationResult>;
  
  /**
   * Delete a file (removes from store, closes editor if active, persists to DB)
   * 
   * @param fileId - File to delete
   * @returns Promise resolving to operation result
   */
  deleteFile: (fileId: string) => Promise<FileOperationResult>;
  
  /**
   * Validate a filename (checks for duplicates and invalid characters)
   * 
   * @param name - Filename to validate
   * @param currentPath - Current file path
   * @param excludeFileId - Optional file ID to exclude from duplicate check
   * @returns Error message if invalid, null if valid
   */
  validateFileName: (name: string, currentPath: string, excludeFileId?: string) => string | null;
}
```

## 5. Event Handler Contracts

### Context Menu Events

```typescript
/**
 * Event handlers for context menu actions
 */
interface ContextMenuHandlers {
  /**
   * Handle context menu open
   * 
   * @param fileId - File ID for which menu is opening
   * @param position - Mouse position { x, y }
   */
  onContextMenuOpen: (fileId: string, position: { x: number; y: number }) => void;
  
  /**
   * Handle context menu close
   */
  onContextMenuClose: () => void;
  
  /**
   * Handle rename action selected
   * 
   * @param fileId - File to rename
   */
  onRenameAction: (fileId: string) => void;
  
  /**
   * Handle duplicate action selected
   * 
   * @param fileId - File to duplicate
   */
  onDuplicateAction: (fileId: string) => void;
  
  /**
   * Handle delete action selected
   * 
   * @param fileId - File to delete
   */
  onDeleteAction: (fileId: string) => void;
}
```

### Rename Events

```typescript
/**
 * Event handlers for rename operation
 */
interface RenameHandlers {
  /**
   * Handle rename input change
   * 
   * @param value - New input value
   */
  onRenameChange: (value: string) => void;
  
  /**
   * Handle rename commit (Enter key or blur)
   * 
   * @param fileId - File being renamed
   * @param newName - New filename
   */
  onRenameCommit: (fileId: string, newName: string) => Promise<void>;
  
  /**
   * Handle rename cancel (Escape key)
   * 
   * @param fileId - File being renamed
   */
  onRenameCancel: (fileId: string) => void;
}
```

### Delete Events

```typescript
/**
 * Event handlers for delete operation
 */
interface DeleteHandlers {
  /**
   * Handle delete confirmation dialog open
   * 
   * @param fileId - File to delete
   */
  onDeleteDialogOpen: (fileId: string) => void;
  
  /**
   * Handle delete confirmation
   * 
   * @param fileId - File to delete
   */
  onDeleteConfirm: (fileId: string) => Promise<void>;
  
  /**
   * Handle delete cancellation
   */
  onDeleteCancel: () => void;
}
```

## 6. Error Types

### `FileOperationError` (NEW)

```typescript
/**
 * Error types for file operations
 */
type FileOperationErrorType =
  | 'DUPLICATE_NAME'      // File with same name already exists
  | 'INVALID_NAME'        // Filename contains invalid characters
  | 'EMPTY_NAME'          // Filename is empty
  | 'STORAGE_QUOTA'       // IndexedDB quota exceeded
  | 'STORAGE_ERROR'       // IndexedDB operation failed
  | 'FILE_NOT_FOUND'      // File ID does not exist
  | 'UNKNOWN_ERROR';      // Unexpected error

/**
 * File operation error
 */
interface FileOperationError extends Error {
  /** Error type */
  type: FileOperationErrorType;
  
  /** Original error message */
  message: string;
  
  /** File ID that caused error */
  fileId: string;
  
  /** Operation that failed */
  operation: 'rename' | 'duplicate' | 'delete';
}
```

## 7. Test Contracts

### Test Utilities

```typescript
/**
 * Mock file operations for testing
 */
interface MockFileOperations extends FileOperations {
  /** Reset mock call history */
  mockReset: () => void;
  
  /** Get call count for specific operation */
  getCallCount: (operation: 'rename' | 'duplicate' | 'delete') => number;
  
  /** Set mock result for next operation */
  setMockResult: (result: FileOperationResult) => void;
}

/**
 * Test helpers for file tree context menu
 */
interface FileTreeTestHelpers {
  /** Simulate right-click on file */
  rightClickFile: (fileName: string) => Promise<void>;
  
  /** Select context menu item */
  selectMenuItem: (itemText: string) => Promise<void>;
  
  /** Type into rename input */
  typeInRenameInput: (text: string) => Promise<void>;
  
  /** Confirm delete dialog */
  confirmDelete: () => Promise<void>;
  
  /** Wait for file operation to complete */
  waitForOperation: () => Promise<void>;
}
```

## Contract Checklist

- [x] File operation interfaces defined (renameFile, duplicateFile, deleteFile)
- [x] State management contracts defined (ContextMenuState, RenameState, DeleteConfirmationState)
- [x] Component props contracts defined (FileContextMenuProps, RenameInputProps, DeleteConfirmDialogProps)
- [x] Event handler contracts defined (ContextMenuHandlers, RenameHandlers, DeleteHandlers)
- [x] Error types defined (FileOperationError, FileOperationErrorType)
- [x] Test contracts defined (MockFileOperations, FileTreeTestHelpers)
- [x] Return types specified for all operations (FileOperationResult)
- [x] All parameters documented with JSDoc comments
- [x] Async operations marked with Promise return types
- [x] Optional parameters marked with `?`

## Summary

All contracts are defined as TypeScript interfaces since this is a client-side feature. No REST API or GraphQL schema needed. Contracts cover:

1. **Core Operations**: FileOperations interface with rename, duplicate, delete
2. **State Management**: Context menu, rename, and delete confirmation state
3. **Component Props**: All new components have defined prop interfaces
4. **Event Handlers**: Clear handler contracts for all user interactions
5. **Error Handling**: Typed error system with specific error types
6. **Testing**: Mock interfaces and test helper utilities

All contracts follow existing project conventions (Zustand slices, React component patterns, IndexedDB persistence).
