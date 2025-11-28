# Contract: Folder Operations

**Feature Branch**: `006-folder-management`  
**Date**: 2025-11-28  
**Files**: 
- `frontend/src/file-tree/FolderOperations.ts`
- `frontend/src/project-management/ProjectManager.ts` (additions)
- `frontend/src/shared/store/index.ts` (additions to FileSlice)

## Overview

Functions for creating, deleting, renaming, and duplicating folders with recursive file handling and IndexedDB persistence.

---

## FolderOperations.ts Interface

```typescript
import type { ProjectFile } from "../shared/types";

/**
 * Result of a folder operation
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

/**
 * Get all files whose path starts with the given folder path
 * @param files - All project files
 * @param folderPath - Folder path prefix to match
 * @returns Files within the folder (recursive)
 */
export function getFilesInFolder(
  files: ProjectFile[],
  folderPath: string
): ProjectFile[];

/**
 * Check if a folder path is valid (not too deeply nested)
 * @param path - Full folder path
 * @param maxDepth - Maximum nesting depth (default: 10)
 * @returns Validation result
 */
export function validateFolderDepth(
  path: string,
  maxDepth?: number
): { isValid: boolean; error?: string };

/**
 * Generate a unique folder name for duplication
 * @param baseName - Original folder name
 * @param existingNames - Existing folder names at same level
 * @returns Unique name like "folder copy" or "folder copy 2"
 */
export function generateDuplicateFolderName(
  baseName: string,
  existingNames: string[]
): string;

/**
 * Compute the parent path from a full path
 * @param path - Full path (file or folder)
 * @returns Parent folder path, or "/" for root-level items
 */
export function getParentPath(path: string): string;

/**
 * Build new path after folder rename
 * @param filePath - Original file path
 * @param oldFolderPath - Original folder path
 * @param newFolderPath - New folder path
 * @returns Updated file path
 */
export function updatePathForRename(
  filePath: string,
  oldFolderPath: string,
  newFolderPath: string
): string;
```

---

## ProjectManager.ts Additions

```typescript
/**
 * Create an empty file with specified name in parent folder
 * @param name - File name (with or without extension)
 * @param parentPath - Parent folder path
 * @returns Created file
 */
async createEmptyFile(name: string, parentPath: string): Promise<ProjectFile>;

/**
 * Delete all files within a folder (recursive)
 * Uses single transaction for atomicity
 * @param folderPath - Path of folder to delete
 * @returns Number of files deleted
 */
async deleteFolderContents(folderPath: string): Promise<number>;

/**
 * Update paths for all files within a renamed folder
 * Uses single transaction for atomicity
 * @param oldPath - Original folder path
 * @param newPath - New folder path
 * @returns Number of files updated
 */
async updateFolderPaths(oldPath: string, newPath: string): Promise<number>;

/**
 * Duplicate all files within a folder to a new location
 * Uses single transaction for atomicity
 * @param sourcePath - Source folder path
 * @param targetPath - Target folder path
 * @returns Array of newly created file IDs
 */
async duplicateFolderContents(
  sourcePath: string,
  targetPath: string
): Promise<string[]>;
```

---

## Zustand FileSlice Additions

```typescript
interface FileSlice {
  // ... existing ...

  /**
   * Create an empty file and add to store
   * @param name - File name
   * @param parentPath - Parent folder path
   * @returns Created file
   */
  createEmptyFile: (name: string, parentPath: string) => Promise<ProjectFile>;

  /**
   * Create a folder (validates path, no actual storage needed)
   * Folders are virtual - derived from file paths
   * @param name - Folder name
   * @param parentPath - Parent folder path
   */
  createFolder: (name: string, parentPath: string) => Promise<void>;

  /**
   * Delete folder and all contents with optimistic update
   * @param folderPath - Path of folder to delete
   */
  deleteFolder: (folderPath: string) => Promise<FolderOperationResult>;

  /**
   * Rename folder and update all contained file paths
   * @param oldPath - Current folder path
   * @param newPath - New folder path
   */
  renameFolder: (
    oldPath: string,
    newPath: string
  ) => Promise<FolderOperationResult>;

  /**
   * Duplicate folder and all contents
   * @param folderPath - Path of folder to duplicate
   */
  duplicateFolder: (folderPath: string) => Promise<FolderOperationResult>;
}
```

---

## Behavior Contract

### Create Folder

| Step | Behavior |
|------|----------|
| 1 | Validate folder name (non-empty, no invalid chars) |
| 2 | Validate folder depth (max 10 levels from `/`) |
| 3 | Check for duplicate folder at same level |
| 4 | No IndexedDB write (folders are virtual) |
| 5 | Folder appears in tree when files are added to it |

### Delete Folder

| Step | Behavior |
|------|----------|
| 1 | Collect all files with paths starting with folder path |
| 2 | Optimistic update: Remove files from store immediately |
| 3 | If active file is in folder, set activeFileId to null |
| 4 | Single transaction: Delete all files from IndexedDB |
| 5 | On failure: Rollback store to original state |
| 6 | Return affected count |

### Rename Folder

| Step | Behavior |
|------|----------|
| 1 | Validate new folder name |
| 2 | Check for duplicate folder at same level |
| 3 | Collect all files with paths starting with folder path |
| 4 | Optimistic update: Update all file paths in store |
| 5 | If active file is in folder, update its path reference |
| 6 | Single transaction: Update all files in IndexedDB |
| 7 | On failure: Rollback store to original state |
| 8 | Return affected count and new path |

### Duplicate Folder

| Step | Behavior |
|------|----------|
| 1 | Generate unique target folder name |
| 2 | Collect all files in source folder |
| 3 | Generate new IDs and paths for all files |
| 4 | Single transaction: Insert all new files to IndexedDB |
| 5 | Add new files to store |
| 6 | On failure: Rollback (delete any partially created files) |
| 7 | Return affected count and new folder path |

---

## Performance Requirements

| Operation | Max Files | Time Limit | Notes |
|-----------|-----------|------------|-------|
| Delete folder | 50 | <3s | SC-005 |
| Rename folder | 50 | <2s | SC-006 |
| Duplicate folder | 20 | <5s | SC-009 |
| Get files in folder | Any | <100ms | Query optimization |

---

## Error Handling

| Error Condition | User-Facing Message |
|-----------------|---------------------|
| IndexedDB quota exceeded | "Storage quota exceeded. Please delete some files to free up space." |
| IndexedDB transaction failed | "Database error. Please try again or refresh the page." |
| Folder depth exceeded | "Cannot create folder: Maximum nesting depth (10) exceeded." |
| Duplicate folder name | "A folder with this name already exists." |
| Active file deleted | Close editor, clear diagram (no error message) |

---

## Test Cases

### Unit Tests (`frontend/tests/unit/file-tree/FolderOperations.test.ts`)

```typescript
describe('FolderOperations', () => {
  describe('getFilesInFolder', () => {
    it('returns files whose path starts with folder path');
    it('returns empty array for empty folder');
    it('includes nested files recursively');
    it('does not include files in sibling folders');
  });

  describe('validateFolderDepth', () => {
    it('allows folders up to max depth');
    it('rejects folders exceeding max depth');
    it('uses default depth of 10 when not specified');
  });

  describe('generateDuplicateFolderName', () => {
    it('returns "name copy" for first duplicate');
    it('returns "name copy 2" when "name copy" exists');
    it('finds next available number');
  });

  describe('getParentPath', () => {
    it('returns parent folder path');
    it('returns "/" for root-level items');
  });

  describe('updatePathForRename', () => {
    it('replaces folder prefix in path');
    it('handles nested paths correctly');
  });
});
```

### Integration Tests (`frontend/tests/integration/folder-management/`)

```typescript
// CreateFolder.test.tsx
describe('Create Folder Integration', () => {
  it('creates folder and displays in file tree');
  it('allows creating file inside new folder');
  it('persists folder structure through reload');
  it('validates folder name before creation');
  it('prevents duplicate folder names');
  it('enforces maximum nesting depth');
});

// DeleteFolder.test.tsx
describe('Delete Folder Integration', () => {
  it('deletes empty folder');
  it('deletes folder with files recursively');
  it('closes editor when active file is deleted');
  it('clears diagram when active file is deleted');
  it('shows confirmation for non-empty folders');
  it('rolls back on IndexedDB failure');
});

// RenameFolder.test.tsx
describe('Rename Folder Integration', () => {
  it('renames folder and updates tree');
  it('updates all file paths within folder');
  it('keeps editor open with updated path');
  it('validates new folder name');
  it('prevents duplicate folder names');
  it('rolls back on failure');
});

// DuplicateFolder.test.tsx
describe('Duplicate Folder Integration', () => {
  it('duplicates folder with unique name');
  it('copies all files recursively');
  it('generates unique file IDs');
  it('shows loading indicator for large folders');
  it('rolls back on failure');
});
```

---

## Dependencies

- `idb` - IndexedDB wrapper for transactions
- `zustand` - State management
- Existing `ProjectManager` class
- Existing `FileOperations` utilities
