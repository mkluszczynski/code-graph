# Data Model: File and Folder Management

**Feature Branch**: `006-folder-management`  
**Date**: 2025-11-28  
**Status**: Complete

## Entity Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   ProjectFile   │────▶│   FileTreeNode   │────▶│   CreateDialogState │
│  (persistence)  │     │   (UI display)   │     │    (UI component)   │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  IndexedDB      │     │   Zustand Store  │     │   React Component   │
│  (files store)  │     │   (FileSlice)    │     │   (CreateDialog)    │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
```

---

## 1. ProjectFile (Extended)

**Purpose**: Represents a file stored in IndexedDB. Extended with `parentPath` for folder queries.

**Source**: `frontend/src/shared/types/index.ts`

```typescript
/**
 * Represents a file in the project
 * Stored in IndexedDB 'files' object store
 */
export interface ProjectFile {
  /** Unique identifier (UUID) */
  id: string;
  
  /** File name with extension (e.g., "Person.ts") */
  name: string;
  
  /** Full path from project root (e.g., "/src/models/Person.ts") */
  path: string;
  
  /** Parent folder path (e.g., "/src/models") - NEW for folder queries */
  parentPath: string;
  
  /** File content (TypeScript source code) */
  content: string;
  
  /** Unix timestamp of last modification */
  lastModified: number;
  
  /** Whether this file is currently open in editor */
  isActive: boolean;
}
```

**Indexes** (IndexedDB):
- `by-path`: Unique index on `path` for lookups and prefix queries
- `by-parent-path`: Non-unique index on `parentPath` for folder content queries
- `by-name`: Non-unique index on `name` for search
- `by-modified`: Non-unique index on `lastModified` for sorting

**Validation Rules**:
- `id`: Required, UUID format
- `name`: Required, non-empty, no invalid characters (`/\:*?"<>|`)
- `path`: Required, starts with `/`, unique
- `parentPath`: Required, derived from `path` (parent directory)
- `content`: Required (can be empty string)
- `lastModified`: Required, Unix timestamp

**State Transitions**:
- Created → (rename) → path/name/parentPath updated
- Created → (move) → path/parentPath updated
- Created → (delete) → removed from store

---

## 2. FileTreeNode (Unchanged)

**Purpose**: Represents a node in the UI file tree (file or folder).

**Source**: `frontend/src/file-tree/types.ts`

```typescript
/**
 * Represents a node in the hierarchical file tree
 * Built from flat ProjectFile list by FileTreeManager
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
```

**Notes**:
- Folders are virtual (not stored in IndexedDB)
- Folder IDs are generated as `folder-{path}` by FileTreeManager
- Tree structure computed from flat file list on every render

---

## 3. CreateDialogState (New)

**Purpose**: Manages state for the file/folder creation dialog.

**Source**: `frontend/src/components/CreateDialog.tsx` (local state)

```typescript
/**
 * Dialog type for creation
 */
export type CreateItemType = "file" | "folder";

/**
 * Props for CreateDialog component
 */
export interface CreateDialogProps {
  /** Whether dialog is open */
  open: boolean;
  
  /** Type of item to create */
  type: CreateItemType;
  
  /** Parent folder path (e.g., "/src" or "/" for root) */
  parentPath: string;
  
  /** Existing names in parent folder (for duplicate detection) */
  existingNames: string[];
  
  /** Callback when item is created successfully */
  onSubmit: (name: string) => Promise<void>;
  
  /** Callback when dialog is cancelled */
  onCancel: () => void;
}

/**
 * Internal dialog state (managed with useState)
 */
interface CreateDialogInternalState {
  /** Current input value */
  name: string;
  
  /** Validation error message (null if valid) */
  error: string | null;
  
  /** Whether submission is in progress */
  isSubmitting: boolean;
}
```

**Validation Rules**:
- `name`: Non-empty, no invalid characters, not duplicate in parent folder
- For files: Must include extension or `.ts` added automatically
- For folders: No extension required

**State Transitions**:
- Closed → Open: Reset name to "", error to null, isSubmitting to false
- Typing: Update name, clear error
- Submit (invalid): Set error, keep dialog open
- Submit (valid): Set isSubmitting, call onSubmit
- Submit success: Close dialog
- Submit error: Set error, clear isSubmitting
- Cancel: Close dialog

---

## 4. FolderOperation (New)

**Purpose**: Represents a folder operation for recursive processing.

**Source**: `frontend/src/file-tree/FolderOperations.ts`

```typescript
/**
 * Type of folder operation
 */
export type FolderOperationType = "create" | "delete" | "rename" | "duplicate";

/**
 * Result of a folder operation
 */
export interface FolderOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  
  /** Number of files affected */
  affectedCount: number;
  
  /** New folder path (for rename/duplicate operations) */
  newPath?: string;
  
  /** Error message if operation failed */
  error?: string;
}

/**
 * Options for folder delete operation
 */
export interface DeleteFolderOptions {
  /** Path of folder to delete */
  folderPath: string;
  
  /** Whether to show confirmation for non-empty folders */
  requireConfirmation?: boolean;
}

/**
 * Options for folder rename operation
 */
export interface RenameFolderOptions {
  /** Current folder path */
  oldPath: string;
  
  /** New folder path */
  newPath: string;
}

/**
 * Options for folder duplicate operation
 */
export interface DuplicateFolderOptions {
  /** Source folder path */
  sourcePath: string;
  
  /** Target folder path (auto-generated if not provided) */
  targetPath?: string;
}
```

---

## 5. AddButtonAction (Modified)

**Purpose**: Dropdown menu items for the Add button.

**Source**: `frontend/src/components/AddButton.tsx`

```typescript
/**
 * Props for AddButton component (MODIFIED)
 */
export interface AddButtonProps {
  /** Callback when "Add File" is selected */
  onAddFile: () => void;
  
  /** Callback when "Add Folder" is selected */
  onAddFolder: () => void;
  
  /** Whether an operation is in progress */
  isLoading?: boolean;
}

// REMOVED: onCreateClass, onCreateInterface (template-based creation)
```

---

## Entity Relationships

```
ProjectFile (stored in IndexedDB)
    │
    ├── parentPath ─────────────────────┐
    │                                   │
    └── path ──────────────────────────┐│
                                       ││
FileTreeNode (computed for UI)         ││
    │                                  ││
    ├── type: "file" ──────────────────┼┘
    │   └── maps to ProjectFile.id     │
    │                                  │
    └── type: "folder" ────────────────┘
        └── virtual, derived from paths
        └── children: FileTreeNode[]

CreateDialog (UI component)
    │
    ├── onSubmit ──▶ Creates ProjectFile
    │               └── parentPath set from dialog's parentPath prop
    │
    └── existingNames ◀── Derived from siblings in FileTreeNode
```

---

## Database Schema (IndexedDB)

```typescript
interface UMLGraphDB {
  files: {
    key: string;  // ProjectFile.id
    value: ProjectFile;
    indexes: {
      'by-path': string;        // Unique, for path lookups
      'by-parent-path': string; // Non-unique, for folder contents
      'by-name': string;        // Non-unique, for search
      'by-modified': number;    // Non-unique, for sorting
    };
  };
}
```

**Migration Required**: Add `by-parent-path` index (database version 2)

---

## Zustand Store Updates

### FileSlice Additions

```typescript
interface FileSlice {
  // ... existing properties ...
  
  /** Create an empty file in specified folder */
  createEmptyFile: (name: string, parentPath: string) => Promise<ProjectFile>;
  
  /** Create a folder (virtual - just validates path is valid) */
  createFolder: (name: string, parentPath: string) => Promise<void>;
  
  /** Delete a folder and all its contents */
  deleteFolder: (folderPath: string) => Promise<FolderOperationResult>;
  
  /** Rename a folder and update all contained file paths */
  renameFolder: (oldPath: string, newPath: string) => Promise<FolderOperationResult>;
  
  /** Duplicate a folder and all its contents */
  duplicateFolder: (folderPath: string) => Promise<FolderOperationResult>;
}
```

---

## Validation Functions

```typescript
// frontend/src/file-tree/FileOperations.ts

/**
 * Validates a file or folder name
 */
export function validateItemName(
  name: string, 
  type: "file" | "folder"
): FileValidationResult {
  if (!name || name.trim() === '') {
    return { 
      isValid: false, 
      error: `${type === 'file' ? 'File' : 'Folder'} name cannot be empty` 
    };
  }
  
  const invalidChars = /[/\\:*?"<>|]/;
  if (invalidChars.test(name)) {
    return { 
      isValid: false, 
      error: 'Name contains invalid characters: / \\ : * ? " < > |' 
    };
  }
  
  return { isValid: true };
}

/**
 * Normalizes a file name (adds .ts extension if missing)
 */
export function normalizeFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed.includes('.')) {
    return `${trimmed}.ts`;
  }
  return trimmed;
}

/**
 * Generates a unique folder name for duplication
 */
export function generateDuplicateFolderName(
  baseName: string, 
  existingNames: string[]
): string {
  // Same pattern as generateDuplicateName for files
  // Returns "folder copy", "folder copy 2", etc.
}
```
