# Data Model: Add Files to Folders & Drag-and-Drop Organization

**Feature**: 007-file-folder-dnd  
**Date**: 2025-11-29  
**Status**: Complete

## Entity Definitions

### 1. DragState

Tracks the current drag-and-drop operation state.

```typescript
/**
 * Represents the state of an active drag operation
 * Null when no drag is in progress
 */
interface DragState {
  /** Type of item being dragged */
  itemType: 'file' | 'folder';
  
  /** ID of the dragged item (fileId for files, folder path for folders) */
  itemId: string;
  
  /** Full path of the dragged item */
  sourcePath: string;
  
  /** Parent folder path of the dragged item (for rollback) */
  sourceParentPath: string;
  
  /** Timestamp when drag started (for performance monitoring) */
  dragStartTime: number;
}
```

**Relationships**:
- References `ProjectFile.id` when `itemType === 'file'`
- References folder path when `itemType === 'folder'`
- Cleared to `null` on drag end or escape

**Validation Rules**:
- `sourcePath` must be a valid path in the file tree
- `dragStartTime` must be set when drag starts

---

### 2. DropTarget

Represents a potential drop target during drag hover.

```typescript
/**
 * Represents a folder being hovered over during drag
 */
interface DropTarget {
  /** Path of the target folder */
  targetPath: string;
  
  /** Whether this is a valid drop target for current drag */
  isValid: boolean;
  
  /** Timestamp when hover started (for auto-expand) */
  hoverStartTime: number;
  
  /** Validation error message (if isValid === false) */
  validationError?: string;
}
```

**Relationships**:
- Validated against `DragState` to determine `isValid`
- Triggers folder expansion after 500ms hover

**Validation Rules**:
- `targetPath` must be an existing folder path
- Cannot be same as `DragState.sourcePath` for folders
- Cannot be a descendant of `DragState.sourcePath` for folders
- Must not contain duplicate filename for files

---

### 3. MoveOperation

Represents a file or folder move action for persistence.

```typescript
/**
 * Represents a completed move operation
 */
interface MoveOperation {
  /** Type of move operation */
  type: 'file' | 'folder';
  
  /** Original path before move */
  sourcePath: string;
  
  /** New path after move */
  targetPath: string;
  
  /** Affected file paths (for folder moves, includes all nested files) */
  affectedPaths: string[];
  
  /** Operation timestamp */
  timestamp: number;
  
  /** Whether operation succeeded */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
}
```

**Relationships**:
- Created when `DragState` item is dropped on valid `DropTarget`
- Updates `ProjectFile.path` and `ProjectFile.parentPath` for affected files
- Updates `ProjectFolder.path` and `ProjectFolder.parentPath` for folder moves

**State Transitions**:
1. User initiates drop → MoveOperation created
2. IndexedDB transaction starts
3. All paths updated atomically
4. Success → operation.success = true, state updates
5. Failure → operation.success = false, rollback to original state

---

### 4. DropValidation

Result of validating a drop operation.

```typescript
/**
 * Result of drop validation check
 */
interface DropValidation {
  /** Whether the drop is allowed */
  isValid: boolean;
  
  /** Specific validation error code */
  errorCode?: 'duplicate_name' | 'circular_reference' | 'same_location' | 'invalid_target';
  
  /** User-friendly error message */
  errorMessage?: string;
}
```

**Validation Rules by Error Code**:
- `duplicate_name`: Target folder already contains item with same name
- `circular_reference`: Folder would be moved into its own descendant
- `same_location`: Item is already in target folder (no-op)
- `invalid_target`: Target is not a valid folder

---

## Zustand Store Additions

### DragDropSlice

```typescript
/**
 * Zustand slice for drag-and-drop state management
 */
interface DragDropSlice {
  // State
  dragState: DragState | null;
  dropTarget: DropTarget | null;
  
  // Actions
  startDrag: (item: { type: 'file' | 'folder'; id: string; path: string; parentPath: string }) => void;
  endDrag: () => void;
  setDropTarget: (target: DropTarget | null) => void;
  validateDrop: (targetPath: string) => DropValidation;
  executeDrop: () => Promise<MoveOperation>;
  cancelDrag: () => void;
}
```

---

## ProjectManager Additions

### New Methods

```typescript
/**
 * Move a file to a new folder
 * 
 * @param fileId - ID of the file to move
 * @param targetFolderPath - Path of destination folder
 * @returns Move operation result
 * @throws FileExistsError if file with same name exists at target
 * @throws StorageError if IndexedDB operation fails
 */
async moveFile(fileId: string, targetFolderPath: string): Promise<MoveOperation>;

/**
 * Move a folder and all its contents to a new location
 * 
 * @param sourceFolderPath - Path of folder to move
 * @param targetFolderPath - Path of destination parent folder
 * @returns Move operation result with all affected paths
 * @throws FileExistsError if folder with same name exists at target
 * @throws StorageError if IndexedDB operation fails
 */
async moveFolder(sourceFolderPath: string, targetFolderPath: string): Promise<MoveOperation>;

/**
 * Check if a file/folder name exists at a given path
 * 
 * @param name - Name to check
 * @param parentPath - Parent folder path
 * @returns true if name exists, false otherwise
 */
async nameExistsAtPath(name: string, parentPath: string): Promise<boolean>;
```

---

## Existing Entity Modifications

### FileTreeNode (types.ts)

Add drag-and-drop attributes:

```typescript
interface FileTreeNode {
  // Existing fields...
  
  /** Whether this node is currently being dragged */
  isDragging?: boolean;
  
  /** Whether this node is a valid drop target */
  isDropTarget?: boolean;
  
  /** Whether drop on this node would be invalid */
  isDropInvalid?: boolean;
}
```

---

## State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DRAG START                                  │
│  User drags file/folder → startDrag() → DragState populated         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DRAG OVER                                   │
│  User hovers over folder → setDropTarget() → validateDrop()         │
│  • Valid: DropTarget.isValid = true, show highlight                 │
│  • Invalid: DropTarget.isValid = false, show error indicator        │
│  • 500ms hover: expand folder                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                      ┌─────────────┴─────────────┐
                      ▼                           ▼
┌──────────────────────────────┐   ┌──────────────────────────────────┐
│         DROP                  │   │         CANCEL                   │
│  executeDrop() →              │   │  Escape key or drag outside →   │
│  1. Create MoveOperation      │   │  cancelDrag() → clear state     │
│  2. Update IndexedDB          │   └──────────────────────────────────┘
│  3. Update Zustand store      │
│  4. Clear drag state          │
└──────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESULT                                            │
│  Success: File/folder appears at new location                       │
│  Failure: Rollback to original state, show error message            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Error Scenarios

| Scenario | Error Code | User Message | Recovery |
|----------|------------|--------------|----------|
| Duplicate file name | `duplicate_name` | "A file named 'X' already exists in this folder" | User must rename first |
| Move folder into itself | `circular_reference` | "Cannot move a folder into itself or its subfolders" | Cancel drop, no action |
| File already in target | `same_location` | Silent no-op | No error shown |
| IndexedDB failure | `storage_error` | "Failed to move file. Please try again." | Auto-rollback, retry option |
| Network/browser crash | Transaction abort | "Operation interrupted" | Auto-rollback by IndexedDB |
