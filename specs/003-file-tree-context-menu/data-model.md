# Data Model: File Tree Context Menu

**Feature**: 003-file-tree-context-menu  
**Date**: 2025-11-15  
**Status**: Complete

## Overview

This document defines the data entities, state transitions, and validation rules for the file tree context menu feature. The feature extends existing entities rather than introducing new core data structures.

## Entity Definitions

### 1. ContextMenuState (NEW)

Manages the ephemeral state of the context menu UI.

```typescript
interface ContextMenuState {
  /** ID of file for which context menu is open (null when closed) */
  openFileId: string | null;
  
  /** Position of context menu (mouse coordinates) */
  position: { x: number; y: number } | null;
  
  /** Whether menu is currently visible */
  isOpen: boolean;
}
```

**Characteristics**:
- Ephemeral (not persisted)
- Single menu open at a time
- Cleared when menu closes or action is taken

### 2. RenameState (NEW)

Manages inline rename operation state.

```typescript
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

**Validation Rules**:
- `inputValue` cannot be empty string
- `inputValue` cannot match existing file name in same directory
- `inputValue` cannot contain invalid characters: `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`
- File extension must be preserved (e.g., `.ts`, `.tsx`)

**State Transitions**:
1. IDLE (fileId=null) → EDITING (fileId set, inputValue=originalName)
2. EDITING → VALIDATING (on blur/enter)
3. VALIDATING → IDLE (on success) OR EDITING (on error)
4. EDITING → IDLE (on escape/cancel)

### 3. DeleteConfirmationState (NEW)

Manages delete confirmation dialog state.

```typescript
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

**State Transitions**:
1. CLOSED (isOpen=false) → OPEN (user clicks Delete in context menu)
2. OPEN → DELETING (user confirms)
3. DELETING → CLOSED (delete completes or fails)
4. OPEN → CLOSED (user cancels)

### 4. FileOperationResult (NEW)

Result type for file operations (rename, duplicate, delete).

```typescript
interface FileOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  
  /** Error message if operation failed */
  error?: string;
  
  /** New file ID (for duplicate operation) */
  newFileId?: string;
  
  /** Operation type */
  operation: 'rename' | 'duplicate' | 'delete';
}
```

**Error Types**:
- `DUPLICATE_NAME`: File with same name already exists
- `INVALID_NAME`: Filename contains invalid characters
- `EMPTY_NAME`: Filename is empty
- `STORAGE_QUOTA`: IndexedDB quota exceeded
- `STORAGE_ERROR`: IndexedDB operation failed
- `FILE_NOT_FOUND`: File ID does not exist

### 5. Extensions to Existing Entities

#### FileSlice (Zustand Store) - EXTEND

Add new actions to existing FileSlice:

```typescript
interface FileSlice {
  // ... existing properties and methods
  
  /** Rename a file (updates name and path) */
  renameFile: (fileId: string, newName: string) => Promise<FileOperationResult>;
  
  /** Duplicate a file (creates copy with modified name) */
  duplicateFile: (fileId: string) => Promise<FileOperationResult>;
  
  /** Delete a file (removes from store and closes editor if active) */
  deleteFile: (fileId: string) => Promise<FileOperationResult>;
  
  /** Validate filename (check for duplicates and invalid characters) */
  validateFileName: (name: string, currentPath: string, excludeFileId?: string) => string | null;
}
```

#### ProjectFile (Existing) - NO CHANGES

No modifications needed to ProjectFile entity. Operations update existing fields:
- `name`: Updated by rename operation
- `path`: Updated by rename operation to reflect new name
- `lastModified`: Updated by all operations
- `content`: Copied by duplicate operation

#### FileTreeNode (Existing) - NO CHANGES

No modifications needed. Context menu renders around existing file nodes.

## State Transitions

### Rename Operation State Machine

```
┌─────────────┐
│    IDLE     │
│ (no rename) │
└──────┬──────┘
       │ User selects "Rename" from context menu
       ▼
┌─────────────────┐
│    EDITING      │
│ Input focused,  │
│ value=original  │
└────┬───┬────┬───┘
     │   │    │
     │   │    └─────────────────────────────┐
     │   │ Escape pressed                   │
     │   │                                  │
     │   └───────────────┐                  │
     │ Blur or Enter     │                  │
     ▼                   ▼                  ▼
┌─────────────┐    ┌──────────┐      ┌────────┐
│ VALIDATING  │    │ CANCEL   │      │ CANCEL │
│ Check name  │    │ Rollback │      │ Direct │
└──┬────────┬─┘    └────┬─────┘      └───┬────┘
   │        │           │                 │
   │        │           ▼                 │
   │        │      ┌─────────┐            │
   │        │      │  IDLE   │◄───────────┘
   │        │      └─────────┘
   │        │
   │ Valid  │ Invalid
   │        ▼
   │   ┌──────────────┐
   │   │    ERROR     │
   │   │ Show message │
   │   │ Keep editing │
   │   └──────────────┘
   │
   ▼
┌─────────────────┐
│    SAVING       │
│ Update store +  │
│ persist to DB   │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │  IDLE   │
    └─────────┘
```

### Delete Operation State Machine

```
┌─────────────┐
│    IDLE     │
│ (no dialog) │
└──────┬──────┘
       │ User selects "Delete" from context menu
       ▼
┌────────────────┐
│  CONFIRMATION  │
│  Dialog open   │
└───┬────────┬───┘
    │        │
    │        │ User clicks "Cancel" or Escape
    │        ▼
    │   ┌─────────┐
    │   │  IDLE   │
    │   └─────────┘
    │
    │ User clicks "Delete" (confirm)
    ▼
┌─────────────────┐
│   DELETING      │
│ Show loading    │
└────────┬────────┘
         │
    ┬────┴────┐
    │         │
    │ Error   │ Success
    ▼         ▼
┌──────┐  ┌──────────────┐
│ IDLE │  │   DELETED    │
│Show  │  │ Update store │
│error │  │ Close editor │
└──────┘  │ if active    │
          └──────┬───────┘
                 │
                 ▼
            ┌─────────┐
            │  IDLE   │
            └─────────┘
```

### Duplicate Operation State Machine

```
┌─────────────┐
│    IDLE     │
└──────┬──────┘
       │ User selects "Duplicate" from context menu
       ▼
┌──────────────────┐
│  NAME_GENERATION │
│ Generate copy    │
│ name with suffix │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   DUPLICATING    │
│ Create new file  │
│ Copy content     │
│ Save to DB       │
└────────┬─────────┘
         │
    ┬────┴────┐
    │         │
    │ Error   │ Success
    ▼         ▼
┌──────┐  ┌──────────────┐
│ IDLE │  │  DUPLICATED  │
│Show  │  │ Add to store │
│error │  │ Select new   │
└──────┘  │ file         │
          └──────┬───────┘
                 │
                 ▼
            ┌─────────┐
            │  IDLE   │
            └─────────┘
```

## Validation Rules

### Filename Validation

**Rule**: Valid filename for rename operation

**Implementation**:
```typescript
function validateFileName(
  name: string, 
  currentPath: string, 
  excludeFileId?: string
): string | null {
  // Rule 1: Cannot be empty
  if (!name || name.trim() === '') {
    return 'Filename cannot be empty';
  }
  
  // Rule 2: Cannot contain invalid characters
  const invalidChars = /[\/\\:*?"<>|]/;
  if (invalidChars.test(name)) {
    return 'Filename contains invalid characters: / \\ : * ? " < > |';
  }
  
  // Rule 3: Must have extension
  if (!name.includes('.')) {
    return 'Filename must have an extension';
  }
  
  // Rule 4: Cannot duplicate existing name in same directory
  const directory = currentPath.substring(0, currentPath.lastIndexOf('/'));
  const conflictingFile = files.find(f => 
    f.path.startsWith(directory) && 
    f.name === name &&
    f.id !== excludeFileId
  );
  
  if (conflictingFile) {
    return `A file named "${name}" already exists`;
  }
  
  return null; // Valid
}
```

### Duplicate Name Generation

**Rule**: Generate unique name for duplicated file

**Implementation**:
```typescript
function generateDuplicateName(originalPath: string, existingPaths: string[]): string {
  const parts = originalPath.split('/');
  const filename = parts[parts.length - 1];
  const directory = parts.slice(0, -1).join('/');
  
  const extensionIndex = filename.lastIndexOf('.');
  const baseName = filename.substring(0, extensionIndex);
  const extension = filename.substring(extensionIndex);
  
  let newName = `${baseName} copy${extension}`;
  let counter = 2;
  
  while (existingPaths.includes(`${directory}/${newName}`)) {
    newName = `${baseName} copy ${counter}${extension}`;
    counter++;
  }
  
  return `${directory}/${newName}`;
}
```

**Examples**:
- `/src/MyClass.ts` → `/src/MyClass copy.ts`
- `/src/MyClass copy.ts` → `/src/MyClass copy 2.ts`
- `/src/utils/helper.ts` → `/src/utils/helper copy.ts`

### Delete Validation

**Rule**: Can delete any file (no validation required)

**Note**: Delete confirmation dialog provides safety net. No technical restrictions on which files can be deleted since this is a client-side application with no special system files.

## Persistence Strategy

### Rename Operation

**Data Changes**:
1. Update `ProjectFile.name` to new name
2. Update `ProjectFile.path` to reflect new filename
3. Update `ProjectFile.lastModified` to current timestamp
4. Persist changes to IndexedDB via `ProjectManager.updateFile()`

**Rollback Strategy**:
- Store original name/path before operation
- If IndexedDB update fails, revert in-memory state
- Show error message to user

### Duplicate Operation

**Data Changes**:
1. Create new `ProjectFile` with:
   - New unique ID (generated via crypto.randomUUID())
   - Modified name (via `generateDuplicateName()`)
   - Modified path (to match new name)
   - Same content as original file
   - Current timestamp for lastModified
   - isActive = false (not auto-opened)
2. Persist new file to IndexedDB via `ProjectManager.saveFile()`
3. Add new file to store via `addFile()`

**Rollback Strategy**:
- If IndexedDB save fails, do not add to in-memory store
- Show error message to user

### Delete Operation

**Data Changes**:
1. Remove file from Zustand store via `removeFile()`
2. Delete from IndexedDB via `ProjectManager.deleteFile()`
3. If file is active in editor, close editor tab and clear activeFileId
4. Remove from diagram if file contained parsed entities

**Rollback Strategy**:
- Optimistic update: Remove from UI immediately
- If IndexedDB delete fails, re-add to store
- Show error message to user

## Component Data Flow

```
User Action (Right-click)
        │
        ▼
┌──────────────────┐
│  FileTreeView    │◄─── FileTreeNode[]
│  (Presentation)  │
└────────┬─────────┘
         │ Context menu selection
         ▼
┌──────────────────────┐
│  FileOperations      │◄─── selectedFileId
│  (Business Logic)    │
└──────┬───────────────┘
       │
       ├─► validateFileName() → RenameState
       │
       ├─► generateDuplicateName() → DuplicateState
       │
       └─► confirmDelete() → DeleteConfirmationState
                │
                ▼
       ┌─────────────────┐
       │  Zustand Store  │
       │  (State Mgmt)   │
       └────────┬────────┘
                │
                ▼
       ┌──────────────────┐
       │ ProjectManager   │
       │ (Persistence)    │
       └────────┬─────────┘
                │
                ▼
            IndexedDB
```

## Summary

**New Entities**:
- ContextMenuState (ephemeral UI state)
- RenameState (inline edit state + validation)
- DeleteConfirmationState (dialog state)
- FileOperationResult (operation result type)

**Extended Entities**:
- FileSlice: +3 actions (renameFile, duplicateFile, deleteFile)
- FileSlice: +1 validation (validateFileName)

**Unchanged Entities**:
- ProjectFile (operations use existing fields)
- FileTreeNode (context menu wraps existing nodes)
- DiagramNode/DiagramEdge (updates triggered by store changes)

**Validation Rules**:
- Filename: non-empty, no invalid chars, has extension, no duplicates
- Duplicate naming: "[name] copy[.ext]" with incremental numbers
- Delete: no validation required (confirmation provides safety)

**State Machines**: Defined for Rename, Delete, and Duplicate operations with clear transitions and error handling paths.
