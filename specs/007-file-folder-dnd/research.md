# Research: Add Files to Folders & Drag-and-Drop Organization

**Feature**: 007-file-folder-dnd  
**Date**: 2025-11-29  
**Status**: Complete

## Research Tasks

### 1. HTML5 Drag-and-Drop API in React

**Decision**: Use native HTML5 Drag-and-Drop API with React synthetic events

**Rationale**:
- Native browser support without additional dependencies
- React provides synthetic event wrappers for all DnD events (onDragStart, onDragOver, onDrop, etc.)
- Project already uses no external DnD libraries; keeping bundle size minimal
- Performance is adequate for typical file tree operations (100-200 items)

**Alternatives Considered**:
- **react-dnd**: Full-featured but adds ~45KB to bundle, overkill for file tree DnD
- **dnd-kit**: Modern alternative but adds dependency complexity
- **@atlaskit/pragmatic-drag-and-drop**: Enterprise-grade but heavy for this use case

**Implementation Pattern**:
```typescript
// React event handler approach
const handleDragStart = (e: React.DragEvent, item: FileTreeNode) => {
  e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, type: item.type }));
  e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault(); // Required to allow drop
  e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e: React.DragEvent, targetFolder: FileTreeNode) => {
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData('application/json'));
  // Execute move operation
};
```

---

### 2. Circular Reference Detection for Folder Moves

**Decision**: Implement ancestry check before allowing drop

**Rationale**:
- Must prevent user from dropping folder onto itself or any descendant
- Simple path-based check is sufficient: target path must not start with source path
- Error message should be clear and actionable

**Implementation Pattern**:
```typescript
function isDescendantOf(targetPath: string, sourcePath: string): boolean {
  // Cannot drop folder onto itself
  if (targetPath === sourcePath) return true;
  
  // Cannot drop folder onto any of its descendants
  // /src/models cannot be dropped into /src/models/entities
  return targetPath.startsWith(sourcePath + '/');
}

function validateDrop(source: DragItem, target: DropTarget): DropValidation {
  if (source.type === 'folder' && isDescendantOf(target.path, source.path)) {
    return { 
      valid: false, 
      error: 'Cannot move a folder into itself or its descendants' 
    };
  }
  return { valid: true };
}
```

---

### 3. Visual Feedback Patterns for Drag-and-Drop

**Decision**: Use CSS classes for drag ghost, drop indicator, and hover effects

**Rationale**:
- Consistent with existing hover states in FileTreeView
- CSS-based approach is performant (GPU-accelerated)
- Tailwind utility classes align with project styling approach

**Visual States**:
1. **Drag Ghost**: Semi-transparent clone of dragged item (native browser default is acceptable)
2. **Drop Indicator**: Border highlight on valid drop targets
3. **Invalid Drop**: Cursor changes to `not-allowed`
4. **Auto-expand Hover**: Visual timer indicator (optional, timeout is primary mechanism)

**CSS Classes**:
```css
/* Dragging state on source item */
.file-tree-item[data-dragging="true"] {
  opacity: 0.5;
}

/* Valid drop target */
.file-tree-folder[data-drop-target="true"] {
  @apply ring-2 ring-primary ring-offset-1;
}

/* Invalid drop target */
.file-tree-folder[data-drop-invalid="true"] {
  @apply ring-2 ring-destructive ring-offset-1;
}
```

---

### 4. Auto-Expand on Hover Implementation

**Decision**: Use setTimeout with 500ms delay, clear on drag leave

**Rationale**:
- 500ms is UX standard for hover-to-expand (matches OS file managers)
- Clear timeout on leave to prevent unexpected expansions
- Track hover start time for accurate timing

**Implementation Pattern**:
```typescript
const AUTO_EXPAND_DELAY = 500; // ms

// In drag-over handler
const handleDragEnter = (folderId: string) => {
  if (expandedFolders.has(folderId)) return; // Already expanded
  
  hoverTimeoutRef.current = setTimeout(() => {
    setExpandedFolders(prev => new Set(prev).add(folderId));
  }, AUTO_EXPAND_DELAY);
};

const handleDragLeave = () => {
  if (hoverTimeoutRef.current) {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
  }
};
```

---

### 5. Atomic Move Operations in IndexedDB

**Decision**: Use IndexedDB transactions with rollback on failure

**Rationale**:
- Existing ProjectManager uses single transaction for folder operations
- Move = update paths in transaction, commit only if all succeed
- Store original state before transaction for UI rollback

**Implementation Pattern**:
```typescript
async moveFile(fileId: string, targetFolderPath: string): Promise<MoveResult> {
  await this.ensureDB();
  
  const file = await this.db!.get('files', fileId);
  if (!file) throw new StorageError('moveFile', 'File not found');
  
  const newPath = `${targetFolderPath}/${file.name}`;
  
  // Check for duplicates at target
  const existingFile = await this.getFileByPath(newPath);
  if (existingFile) {
    throw new FileExistsError(file.name);
  }
  
  // Update file with new paths
  const updatedFile: ProjectFile = {
    ...file,
    path: newPath,
    parentPath: targetFolderPath,
    lastModified: Date.now(),
  };
  
  await this.db!.put('files', updatedFile);
  return { success: true, newPath };
}

async moveFolder(sourcePath: string, targetPath: string): Promise<MoveResult> {
  await this.ensureDB();
  
  const newFolderPath = `${targetPath}/${sourcePath.split('/').pop()}`;
  
  // Use transaction for atomicity
  const tx = this.db!.transaction(['files', 'folders'], 'readwrite');
  
  try {
    // 1. Update folder record
    await this.renameFolder(sourcePath, newFolderPath);
    
    // 2. Update all nested file paths
    await this.updateFolderPaths(sourcePath, newFolderPath);
    
    await tx.done;
    return { success: true, newPath: newFolderPath };
  } catch (error) {
    // Transaction auto-aborts on error
    throw error;
  }
}
```

---

### 6. Escape Key to Cancel Drag

**Decision**: Use onKeyDown handler on document during drag

**Rationale**:
- Native DnD API has limited escape key support
- Global keydown listener during drag provides reliable cancellation
- Clean up listener on drag end

**Implementation Pattern**:
```typescript
useEffect(() => {
  if (!isDragging) return;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Reset drag state
      setDragState(null);
      // Note: Native drag ghost may persist until mouseup
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isDragging]);
```

---

### 7. Active File Reference Update on Move

**Decision**: Update activeFileId path reference in Zustand store after move

**Rationale**:
- Editor stores activeFileId which points to file by ID (not path)
- File ID remains constant after move, only path changes
- File content is preserved automatically (same file object)

**Implementation**:
- Since we use file ID (UUID) not path as the reference, no special handling needed
- File content is stored with the file object, moves with it
- Editor continues to work with same file ID post-move

---

### 8. Context Menu "Add File" Integration

**Decision**: Add "Add File" option to folder context menu, reuse CreateDialog

**Rationale**:
- Existing CreateDialog component handles file creation with validation
- Folder context menu already exists (Feature 006)
- Pass folder path as parentPath to CreateDialog

**Implementation**:
```typescript
// In FileTreeView folder context menu
<ContextMenuItem
  onClick={() => handleAddFileToFolder(node.path)}
  aria-label={`Add file to ${node.name}`}
  data-testid="context-menu-add-file"
>
  <FilePlus className="h-4 w-4 mr-2" aria-hidden="true" />
  <span>Add File</span>
</ContextMenuItem>
```

---

### 9. Accessibility Considerations for Drag-and-Drop

**Decision**: Provide keyboard alternative for move operations

**Rationale**:
- Native HTML5 DnD is not keyboard accessible
- Screen reader users need alternative method to move items
- Context menu "Move to..." option as future enhancement (out of scope for P1-P3)

**Current Scope**:
- Focus on visual drag-and-drop for P2/P3
- Ensure draggable items have `aria-grabbed` state
- Announce drag start/end to screen readers via live region

**Implementation Notes**:
```typescript
// ARIA attributes for draggable items
<div
  draggable
  aria-grabbed={isDragging}
  role="treeitem"
  aria-label={`${node.name}, ${node.type}`}
>
```

---

### 10. Performance Considerations

**Decision**: Debounce drop validation, memoize tree node rendering

**Rationale**:
- Drag events fire rapidly during movement (every pixel)
- Drop validation should only run on meaningful hover changes
- Tree nodes should not re-render during drag unless highlighted

**Implementation**:
- Memoize FileTreeNode components with `React.memo`
- Track hovered folder ID separately from drop validation
- Only validate drop when hover target changes

---

## Summary

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| DnD Library | Native HTML5 | Zero dependencies, adequate for use case |
| Circular Detection | Path-based ancestry check | Simple, reliable |
| Visual Feedback | Tailwind CSS classes | Consistent with project style |
| Auto-Expand | 500ms setTimeout | UX standard |
| Persistence | IndexedDB transactions | Atomic operations, rollback support |
| Escape Cancel | Document keydown listener | Reliable cancellation |
| Active File | ID-based (no change needed) | UUIDs persist through moves |
| Add File Menu | Reuse CreateDialog | Component already exists |
| Accessibility | ARIA attributes + future enhancement | Basic support now |
| Performance | Memoization + hover debounce | Smooth 60fps drag |
