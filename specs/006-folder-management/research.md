# Research: File and Folder Management with Improved UX

**Feature Branch**: `006-folder-management`  
**Date**: 2025-11-28  
**Status**: Complete

## Executive Summary

This document captures research findings for implementing folder management and improved file creation UX. Key decisions: use shadcn Dialog with local state for form management (not react-hook-form), flat storage with path-based indexing in IndexedDB, and single-transaction batch operations for recursive folder operations.

---

## Research Areas

### 1. shadcn/ui Dialog Component for File/Folder Creation

**Decision**: Use shadcn Dialog with controlled local state pattern

**Rationale**:
- Single input field (filename) doesn't warrant react-hook-form complexity (+25KB bundle)
- Local state with `useState` is sufficient for simple validation
- Matches existing patterns in the codebase (e.g., `DeleteConfirmDialog`)
- shadcn Dialog is built on Radix UI, providing excellent accessibility out-of-the-box

**Alternatives Considered**:
1. **react-hook-form + zod**: Rejected - overkill for single-field form, adds ~25KB
2. **Native browser prompt**: Rejected - poor UX, no styling, no inline validation
3. **Uncontrolled dialog with DialogTrigger**: Rejected - need programmatic control for async submission

**Key Implementation Patterns**:

```typescript
// Controlled Dialog pattern
interface CreateDialogProps {
  open: boolean;
  type: "file" | "folder";
  parentPath: string;
  existingNames: string[];
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

// Auto-focus on open
<DialogContent
  onOpenAutoFocus={(e) => {
    e.preventDefault();
    inputRef.current?.focus();
  }}
  onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
>

// Inline validation with ARIA
<Input
  aria-invalid={error ? "true" : "false"}
  aria-describedby={error ? "name-error" : undefined}
/>
{error && <p id="name-error" role="alert">{error}</p>}
```

**Key Accessibility Features (built into Radix)**:
- ✅ Focus trapping within dialog
- ✅ Escape to close (can be disabled during submission)
- ✅ Screen reader announcements via DialogTitle/DialogDescription
- ✅ Tab navigation through focusable elements

---

### 2. IndexedDB Folder Structure Modeling

**Decision**: Flat storage with path-based indexing (no nested objects)

**Rationale**:
- IndexedDB doesn't efficiently query nested objects
- Path-based indexes enable prefix queries for folder contents
- Easier to update individual files without rewriting entire tree
- Matches existing `ProjectFile` structure

**Alternatives Considered**:
1. **Nested storage (folder contains children array)**: Rejected - requires full rewrite for any change
2. **Separate folder store**: Rejected - adds complexity, harder to maintain consistency
3. **Virtual folders (computed from paths)**: Selected - simplest, works with existing schema

**Schema Enhancement**:

```typescript
interface ProjectFile {
  id: string;
  name: string;
  path: string;           // e.g., "/src/components/Button.tsx"
  parentPath: string;     // e.g., "/src/components" (NEW - for folder queries)
  content: string;
  lastModified: number;
  isActive: boolean;
}

// New index for folder queries
store.createIndex('by-parent-path', 'parentPath', { unique: false });
```

**Folder Representation**:
- Folders are not stored as separate records
- Folders are derived from file paths (virtual folders)
- `FileTreeManager` already builds tree from flat file list

---

### 3. Recursive Folder Operations in IndexedDB

**Decision**: Batch operations within single transaction for atomicity

**Rationale**:
- Single transaction ensures all-or-nothing semantics (automatic rollback on error)
- Batch deletes with `Promise.all` are faster than sequential
- For 50 files, single transaction completes in <100ms
- No need for chunked processing at this scale

**Alternatives Considered**:
1. **Sequential deletes in separate transactions**: Rejected - no atomicity, slower
2. **Chunked processing with progress**: Rejected - over-engineering for 50 files
3. **Web Worker for large operations**: Rejected - complexity not justified for current scale

**Pattern: Recursive Delete**:

```typescript
async deleteFolderRecursive(folderPath: string): Promise<void> {
  const tx = this.db.transaction('files', 'readwrite');
  const pathIndex = tx.store.index('by-path');
  
  // Use key range for prefix matching
  const range = IDBKeyRange.bound(folderPath, folderPath + '\uffff', false, true);
  
  // Collect all IDs to delete
  const idsToDelete: string[] = [];
  let cursor = await pathIndex.openCursor(range);
  while (cursor) {
    idsToDelete.push(cursor.value.id);
    cursor = await cursor.continue();
  }
  
  // Batch delete in same transaction
  await Promise.all(idsToDelete.map(id => tx.store.delete(id)));
  await tx.done; // Commits or throws
}
```

**Pattern: Folder Rename (Update All Paths)**:

```typescript
async renameFolderRecursive(oldPath: string, newPath: string): Promise<number> {
  const tx = this.db.transaction('files', 'readwrite');
  const pathIndex = tx.store.index('by-path');
  
  const range = IDBKeyRange.bound(oldPath, oldPath + '\uffff', false, true);
  const filesToUpdate: ProjectFile[] = [];
  
  let cursor = await pathIndex.openCursor(range);
  while (cursor) {
    filesToUpdate.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  for (const file of filesToUpdate) {
    await tx.store.put({
      ...file,
      path: file.path.replace(oldPath, newPath),
      parentPath: file.parentPath?.replace(oldPath, newPath),
      lastModified: Date.now(),
    });
  }
  
  await tx.done;
  return filesToUpdate.length;
}
```

---

### 4. Transaction Management & Rollback

**Decision**: Combine IndexedDB transaction rollback with optimistic UI updates

**Rationale**:
- IndexedDB automatically rolls back transactions on error
- UI should update immediately (optimistic) for responsiveness
- On failure, restore previous UI state from captured snapshot

**Pattern: Optimistic Update with Rollback**:

```typescript
async deleteFolderWithRollback(folderId: string): Promise<void> {
  // Capture original state
  const originalFiles = [...get().files];
  const originalActiveFileId = get().activeFileId;
  
  // Calculate affected files
  const idsToDelete = new Set(getFilesInFolderRecursive(folderPath).map(f => f.id));
  
  try {
    // Optimistic UI update
    set({
      files: originalFiles.filter(f => !idsToDelete.has(f.id)),
      activeFileId: idsToDelete.has(originalActiveFileId) ? null : originalActiveFileId,
    });
    
    // Persist to IndexedDB (throws on failure)
    await projectManager.deleteFolderRecursive(folderPath);
    
  } catch (error) {
    // Rollback UI state
    set({ files: originalFiles, activeFileId: originalActiveFileId });
    throw new Error(getUserFriendlyMessage(error));
  }
}
```

---

### 5. File Name Validation

**Decision**: Reuse existing validation from `FileOperations.ts`, extend for folders

**Existing Validation** (`validateFileName`):
- Non-empty string
- No invalid characters: `/ \ : * ? " < > |`
- Return `{ isValid: boolean; error?: string }`

**Extension for Folders**:
- Same invalid character rules
- No extension required (unlike files)
- Depth limit check: warn if > 10 levels nested

**New Function**:

```typescript
export function validateFolderName(name: string): FileValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Folder name cannot be empty' };
  }
  
  const invalidChars = /[/\\:*?"<>|]/;
  if (invalidChars.test(name)) {
    return { 
      isValid: false, 
      error: 'Folder name contains invalid characters: / \\ : * ? " < > |' 
    };
  }
  
  return { isValid: true };
}
```

---

### 6. Default File Extension

**Decision**: Default to `.ts` extension when user omits extension (per FR-003)

**Rationale**:
- This is a TypeScript-focused tool
- Reduces friction for common case
- Documented behavior in spec

**Implementation**:

```typescript
function normalizeFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed.includes('.')) {
    return `${trimmed}.ts`;
  }
  return trimmed;
}
```

---

## Performance Benchmarks (Expected)

| Operation | Target (from SC) | Expected Actual |
|-----------|------------------|-----------------|
| Create file/folder | <5s | <100ms |
| Dialog validation | <200ms | <16ms (sync) |
| Delete folder (50 files) | <3s | <100ms |
| Rename folder (50 files) | <2s | <150ms |
| Duplicate folder (20 files) | <5s | <200ms |

All targets are easily achievable with single-transaction batch operations.

---

## Dependencies

**No new dependencies required**. All functionality can be built with:
- `@radix-ui/react-dialog` (already in shadcn/ui)
- `idb` (already in use)
- `zustand` (already in use)

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| How to model folders in IndexedDB? | Virtual folders derived from file paths |
| Need react-hook-form? | No, local state sufficient for single-field forms |
| How to handle recursive operations? | Single transaction with batch operations |
| Rollback strategy? | IndexedDB auto-rollback + UI state snapshot |
| Default file extension? | `.ts` when omitted |

---

## Next Steps

1. Create `data-model.md` with entity definitions
2. Create contracts for:
   - `CreateDialog` component
   - Folder operations (create, delete, rename, duplicate)
   - Updated `AddButton` component
3. Create `quickstart.md` with setup instructions
