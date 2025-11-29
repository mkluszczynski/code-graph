# Quickstart: Add Files to Folders & Drag-and-Drop Organization

**Feature**: 007-file-folder-dnd  
**Date**: 2025-11-29

## Overview

This feature adds two main capabilities:
1. **Add File to Folder**: Right-click on a folder → "Add File" to create a file inside that folder
2. **Drag-and-Drop**: Drag files/folders and drop them into other folders to reorganize

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FileTreeView.tsx                                │
│  ┌─────────────────┐  ┌───────────────────┐  ┌────────────────────────────┐ │
│  │ Context Menu    │  │ Drag Handlers     │  │ Drop Handlers              │ │
│  │ - Add File      │  │ - onDragStart     │  │ - onDragOver               │ │
│  │ - Rename        │  │ - onDrag          │  │ - onDragEnter/Leave        │ │
│  │ - Delete        │  │ - onDragEnd       │  │ - onDrop                   │ │
│  └────────┬────────┘  └────────┬──────────┘  └─────────────┬──────────────┘ │
│           │                    │                           │                 │
│           ▼                    ▼                           ▼                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DragDropManager.ts                              │ │
│  │  • validateDrop()  • isAncestorOrSame()  • computeNewPath()            │ │
│  └─────────────────────────────────┬──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Zustand Store                                     │
│  ┌─────────────────────┐  ┌─────────────────────────────────────────────┐   │
│  │ DragDropSlice       │  │ FileSlice                                   │   │
│  │ - dragState         │  │ - moveFile()                                │   │
│  │ - dropTarget        │  │ - moveFolder()                              │   │
│  │ - startDrag()       │  │ - addFileToFolder()                         │   │
│  │ - endDrag()         │  └───────────────────────┬─────────────────────┘   │
│  └─────────────────────┘                          │                          │
└───────────────────────────────────────────────────┼──────────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ProjectManager.ts                                   │
│  • moveFile()  • moveFolder()  • nameExistsInFolder()  • getItemNamesIn...  │
└───────────────────────────────────────────────────┬──────────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            IndexedDB                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐                           │
│  │ files store         │  │ folders store        │                           │
│  │ - by-path index     │  │ - by-path index      │                           │
│  │ - by-parent-path    │  │ - by-parent-path     │                           │
│  └─────────────────────┘  └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: User Story 1 - Add File to Folder (P1)

**Goal**: Add "Add File" option to folder context menu

**Files to Modify**:
- `frontend/src/file-tree/FileTreeView.tsx` - Add context menu item

**Implementation Steps**:
1. Add "Add File" menu item to folder context menu (after existing menu items)
2. Track which folder was right-clicked (store path in state)
3. Open CreateDialog with folder path as parentPath
4. Reuse existing file creation flow

**Key Code**:
```tsx
// In folder context menu section of FileTreeView.tsx
<ContextMenuItem
  onClick={() => handleAddFileToFolder(node.path, node.name)}
  aria-label={`Add file to ${node.name}`}
  data-testid="context-menu-add-file"
>
  <FilePlus className="h-4 w-4 mr-2" aria-hidden="true" />
  <span>Add File</span>
</ContextMenuItem>
```

**Tests**: 5 integration tests (T001-T005)

---

### Phase 2: DragDropManager Core (Foundation for P2/P3)

**Goal**: Create validation and utility functions

**Files to Create**:
- `frontend/src/file-tree/DragDropManager.ts`

**Implementation**:
```typescript
export class DragDropManager {
  validateDrop(dragItem: DragItem, targetPath: string, existingNames: string[]): DropValidation {
    // Check same location
    if (this.isSameLocation(dragItem.parentPath, targetPath)) {
      return { isValid: false, errorCode: 'same_location' };
    }
    
    // Check circular reference for folders
    if (dragItem.type === 'folder' && this.isAncestorOrSame(dragItem.path, targetPath)) {
      return { 
        isValid: false, 
        errorCode: 'circular_reference',
        errorMessage: 'Cannot move a folder into itself or its subfolders'
      };
    }
    
    // Check duplicate name
    if (existingNames.includes(dragItem.name)) {
      return {
        isValid: false,
        errorCode: 'duplicate_name',
        errorMessage: `A ${dragItem.type} named "${dragItem.name}" already exists in this folder`
      };
    }
    
    return { isValid: true };
  }
  
  isAncestorOrSame(ancestorPath: string, descendantPath: string): boolean {
    if (ancestorPath === descendantPath) return true;
    return descendantPath.startsWith(ancestorPath + '/');
  }
  
  computeNewPath(itemName: string, targetFolderPath: string): string {
    if (targetFolderPath === '/') return `/${itemName}`;
    return `${targetFolderPath}/${itemName}`;
  }
  
  isSameLocation(itemParentPath: string, targetPath: string): boolean {
    return itemParentPath === targetPath;
  }
}
```

**Tests**: 10 contract tests (CT-001 to CT-010)

---

### Phase 3: ProjectManager Move Operations

**Goal**: Add file/folder move persistence

**Files to Modify**:
- `frontend/src/project-management/ProjectManager.ts`

**Implementation**:
```typescript
async moveFile(fileId: string, targetFolderPath: string): Promise<ProjectFile> {
  await this.ensureDB();
  
  const file = await this.db!.get('files', fileId);
  if (!file) throw new StorageError('moveFile', 'File not found');
  
  const newPath = this.computeNewPath(file.name, targetFolderPath);
  
  // Check for duplicates
  const existing = await this.getFileByPath(newPath);
  if (existing) throw new FileExistsError(file.name);
  
  const updatedFile: ProjectFile = {
    ...file,
    path: newPath,
    parentPath: targetFolderPath,
    lastModified: Date.now(),
  };
  
  await this.db!.put('files', updatedFile);
  return updatedFile;
}

async moveFolder(sourcePath: string, targetPath: string): Promise<MoveResult> {
  await this.ensureDB();
  
  const folderName = sourcePath.split('/').pop()!;
  const newFolderPath = this.computeNewPath(folderName, targetPath);
  
  // Use single transaction for atomicity
  const tx = this.db!.transaction(['files', 'folders'], 'readwrite');
  
  // 1. Rename folder record
  await this.renameFolder(sourcePath, newFolderPath);
  
  // 2. Update all file paths in folder
  const fileCount = await this.updateFolderPaths(sourcePath, newFolderPath);
  
  await tx.done;
  
  return { newPath: newFolderPath, affectedFileCount: fileCount };
}
```

**Tests**: 12 contract tests (CT-011 to CT-022)

---

### Phase 4: User Story 2 - File Drag-and-Drop (P2)

**Goal**: Enable dragging files into folders

**Files to Modify**:
- `frontend/src/file-tree/FileTreeView.tsx` - Add drag handlers
- `frontend/src/shared/store/index.ts` - Add DragDropSlice
- `frontend/src/file-tree/types.ts` - Add drag state types

**Implementation Steps**:

1. **Add types** (`types.ts`):
```typescript
export interface DragState {
  itemType: 'file' | 'folder';
  itemId: string;
  sourcePath: string;
  sourceParentPath: string;
  dragStartTime: number;
}

export interface DropTarget {
  targetPath: string;
  isValid: boolean;
  hoverStartTime: number;
  errorMessage?: string;
}
```

2. **Add DragDropSlice** (`store/index.ts`):
```typescript
interface DragDropSlice {
  dragState: DragState | null;
  dropTarget: DropTarget | null;
  startDrag: (item: DragState) => void;
  endDrag: () => void;
  setDropTarget: (target: DropTarget | null) => void;
}
```

3. **Add drag handlers** (`FileTreeView.tsx`):
```tsx
// On file items
<div
  draggable
  onDragStart={(e) => handleDragStart(e, node)}
  onDragEnd={handleDragEnd}
  data-dragging={dragState?.itemId === node.id}
>

// On folder items
<div
  onDragOver={handleDragOver}
  onDragEnter={(e) => handleDragEnter(e, node.path)}
  onDragLeave={handleDragLeave}
  onDrop={(e) => handleDrop(e, node.path)}
  data-drop-target={dropTarget?.targetPath === node.path}
>
```

**Tests**: 7 integration tests (T006-T012)

---

### Phase 5: User Story 3 - Folder Drag-and-Drop (P3)

**Goal**: Enable dragging folders into other folders

**Files to Modify**:
- Same files as Phase 4 (extend handlers)

**Additional Logic**:
- Circular reference prevention
- Recursive path updates
- Active file reference update

**Tests**: 7 integration tests (T013-T019)

---

### Phase 6: Polish & E2E Testing

**Goal**: Visual feedback, auto-expand, keyboard cancel

**Implementation**:
1. Add CSS classes for drag states
2. Implement 500ms hover auto-expand
3. Add Escape key handler
4. Write E2E tests

**Tests**: 10+ E2E tests

---

## Test Strategy

| Layer | Count | Focus |
|-------|-------|-------|
| Contract (Unit) | 22 | DragDropManager, ProjectManager |
| Integration | 19+ | FileTreeView with store |
| E2E | 10+ | Full user workflows |

## CSS Classes for Visual Feedback

```css
/* Add to App.css or component styles */

/* Dragging state */
[data-dragging="true"] {
  opacity: 0.5;
}

/* Valid drop target */
[data-drop-target="true"] {
  @apply ring-2 ring-primary ring-offset-1 bg-accent/50;
}

/* Invalid drop target */
[data-drop-invalid="true"] {
  @apply ring-2 ring-destructive ring-offset-1;
}
```

## Key Validation Rules

1. **Duplicate Name**: Check `existingNames.includes(dragItem.name)`
2. **Circular Reference**: Check `targetPath.startsWith(sourcePath + '/')`
3. **Same Location**: Check `itemParentPath === targetPath`
4. **Root Drop**: Allow drops to `/` (root folder)

## Common Pitfalls

1. **Forgetting to prevent default on dragOver**: Required for drop to work
2. **Not handling drag leave correctly**: Clear timeout on leave
3. **Missing transaction for folder moves**: All updates must be atomic
4. **Not updating active file reference**: Keep editor working after move
