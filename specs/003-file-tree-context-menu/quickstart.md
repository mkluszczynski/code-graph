# Quickstart Guide: File Tree Context Menu

**Feature**: 003-file-tree-context-menu  
**Date**: 2025-11-15  
**Branch**: `003-file-tree-context-menu`

## Overview

This guide provides a step-by-step walkthrough for implementing the file tree context menu feature. Follow these phases in order.

## Prerequisites

- Node.js 20+ LTS installed
- pnpm package manager installed
- Existing project cloned and dependencies installed
- Familiarity with React, TypeScript, and Zustand

## Phase 0: Setup and Dependencies

### 1. Install shadcn Context Menu Component

```bash
cd frontend
pnpm dlx shadcn@latest add context-menu
```

This installs:
- `@radix-ui/react-context-menu` (if not already present)
- `src/components/ui/context-menu.tsx` component

### 2. Verify Installation

```bash
# Check that context-menu component exists
ls src/components/ui/context-menu.tsx

# Verify package.json includes radix context menu
grep "@radix-ui/react-context-menu" package.json
```

## Phase 1: Core Data Structures (TDD - Write Tests First)

### 1.1 Create Type Definitions

**File**: `frontend/src/file-tree/types.ts`

Add new types:

```typescript
export interface FileOperationResult {
  success: boolean;
  error?: string;
  newFileId?: string;
  operation: 'rename' | 'duplicate' | 'delete';
  fileId: string;
}

export type FileOperationErrorType =
  | 'DUPLICATE_NAME'
  | 'INVALID_NAME'
  | 'EMPTY_NAME'
  | 'STORAGE_QUOTA'
  | 'STORAGE_ERROR'
  | 'FILE_NOT_FOUND'
  | 'UNKNOWN_ERROR';
```

### 1.2 Write Tests for Name Generation (RED)

**File**: `frontend/tests/integration/file-tree/FileOperations.test.tsx`

```typescript
import { describe, expect, it } from 'vitest';
import { generateDuplicateName, validateFileName } from '@/file-tree/FileOperations';

describe('generateDuplicateName', () => {
  it('adds "copy" suffix to filename', () => {
    const result = generateDuplicateName('/src/MyClass.ts', []);
    expect(result).toBe('/src/MyClass copy.ts');
  });

  it('increments copy number when duplicate exists', () => {
    const existing = ['/src/MyClass copy.ts'];
    const result = generateDuplicateName('/src/MyClass.ts', existing);
    expect(result).toBe('/src/MyClass copy 2.ts');
  });

  it('continues incrementing for multiple copies', () => {
    const existing = ['/src/MyClass copy.ts', '/src/MyClass copy 2.ts'];
    const result = generateDuplicateName('/src/MyClass.ts', existing);
    expect(result).toBe('/src/MyClass copy 3.ts');
  });
});

describe('validateFileName', () => {
  it('returns null for valid filename', () => {
    const result = validateFileName('MyClass.ts', '/src/MyClass.ts', []);
    expect(result).toBeNull();
  });

  it('returns error for empty filename', () => {
    const result = validateFileName('', '/src/', []);
    expect(result).toBe('Filename cannot be empty');
  });

  it('returns error for invalid characters', () => {
    const result = validateFileName('My/Class.ts', '/src/', []);
    expect(result).toContain('invalid characters');
  });

  it('returns error for duplicate filename', () => {
    const existing = ['/src/MyClass.ts'];
    const result = validateFileName('MyClass.ts', '/src/Other.ts', existing);
    expect(result).toContain('already exists');
  });
});
```

**Run tests** (should FAIL - RED):
```bash
pnpm test tests/integration/file-tree/FileOperations.test.tsx
```

### 1.3 Implement File Operations (GREEN)

**File**: `frontend/src/file-tree/FileOperations.ts` (NEW)

```typescript
/**
 * Generate unique duplicate filename
 */
export function generateDuplicateName(
  originalPath: string,
  existingPaths: string[]
): string {
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

/**
 * Validate filename
 */
export function validateFileName(
  name: string,
  currentPath: string,
  existingPaths: string[],
  excludeFileId?: string
): string | null {
  if (!name || name.trim() === '') {
    return 'Filename cannot be empty';
  }

  const invalidChars = /[\/\\:*?"<>|]/;
  if (invalidChars.test(name)) {
    return 'Filename contains invalid characters: / \\ : * ? " < > |';
  }

  if (!name.includes('.')) {
    return 'Filename must have an extension';
  }

  const directory = currentPath.substring(0, currentPath.lastIndexOf('/'));
  const newPath = `${directory}/${name}`;

  if (existingPaths.includes(newPath) && newPath !== currentPath) {
    return `A file named "${name}" already exists`;
  }

  return null;
}
```

**Run tests** (should PASS - GREEN):
```bash
pnpm test tests/integration/file-tree/FileOperations.test.tsx
```

## Phase 2: Zustand Store Actions (TDD)

### 2.1 Write Store Action Tests (RED)

**File**: `frontend/tests/integration/file-tree/StoreActions.test.tsx`

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import { useStore } from '@/shared/store';

describe('File operation store actions', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({ files: [] });
  });

  it('renameFile updates file name and path', async () => {
    const file = {
      id: '1',
      name: 'OldName.ts',
      path: '/src/OldName.ts',
      content: 'test',
      lastModified: Date.now(),
      isActive: false
    };
    
    useStore.setState({ files: [file] });
    
    await useStore.getState().renameFile('1', 'NewName.ts');
    
    const updatedFile = useStore.getState().files[0];
    expect(updatedFile.name).toBe('NewName.ts');
    expect(updatedFile.path).toBe('/src/NewName.ts');
  });

  it('duplicateFile creates new file with copy suffix', async () => {
    const file = {
      id: '1',
      name: 'Original.ts',
      path: '/src/Original.ts',
      content: 'test content',
      lastModified: Date.now(),
      isActive: false
    };
    
    useStore.setState({ files: [file] });
    
    const result = await useStore.getState().duplicateFile('1');
    
    expect(result.success).toBe(true);
    expect(result.newFileId).toBeDefined();
    
    const files = useStore.getState().files;
    expect(files).toHaveLength(2);
    expect(files[1].name).toBe('Original copy.ts');
    expect(files[1].content).toBe('test content');
  });

  it('deleteFile removes file from store', async () => {
    const file = {
      id: '1',
      name: 'ToDelete.ts',
      path: '/src/ToDelete.ts',
      content: 'test',
      lastModified: Date.now(),
      isActive: false
    };
    
    useStore.setState({ files: [file] });
    
    await useStore.getState().deleteFile('1');
    
    expect(useStore.getState().files).toHaveLength(0);
  });
});
```

**Run tests** (should FAIL - RED):
```bash
pnpm test tests/integration/file-tree/StoreActions.test.tsx
```

### 2.2 Implement Store Actions (GREEN)

**File**: `frontend/src/shared/store/index.ts`

Add to `FileSlice`:

```typescript
import { generateDuplicateName, validateFileName } from '../../file-tree/FileOperations';

// Inside createFileSlice:
renameFile: async (fileId: string, newName: string) => {
  const file = get().getFileById(fileId);
  if (!file) {
    return {
      success: false,
      error: 'File not found',
      operation: 'rename' as const,
      fileId
    };
  }

  const allPaths = get().files.map(f => f.path);
  const error = validateFileName(newName, file.path, allPaths, fileId);
  
  if (error) {
    return {
      success: false,
      error,
      operation: 'rename' as const,
      fileId
    };
  }

  const newPath = file.path.replace(file.name, newName);
  
  set((state) => ({
    files: state.files.map((f) =>
      f.id === fileId
        ? { ...f, name: newName, path: newPath, lastModified: Date.now() }
        : f
    ),
  }));

  // TODO: Persist to IndexedDB via ProjectManager

  return {
    success: true,
    operation: 'rename' as const,
    fileId
  };
},

duplicateFile: async (fileId: string) => {
  const file = get().getFileById(fileId);
  if (!file) {
    return {
      success: false,
      error: 'File not found',
      operation: 'duplicate' as const,
      fileId
    };
  }

  const allPaths = get().files.map(f => f.path);
  const newPath = generateDuplicateName(file.path, allPaths);
  const newName = newPath.split('/').pop()!;

  const newFile = {
    ...file,
    id: crypto.randomUUID(),
    name: newName,
    path: newPath,
    lastModified: Date.now(),
    isActive: false
  };

  get().addFile(newFile);

  // TODO: Persist to IndexedDB via ProjectManager

  return {
    success: true,
    operation: 'duplicate' as const,
    fileId,
    newFileId: newFile.id
  };
},

deleteFile: async (fileId: string) => {
  const file = get().getFileById(fileId);
  if (!file) {
    return {
      success: false,
      error: 'File not found',
      operation: 'delete' as const,
      fileId
    };
  }

  get().removeFile(fileId);

  // TODO: Persist to IndexedDB via ProjectManager

  return {
    success: true,
    operation: 'delete' as const,
    fileId
  };
},
```

**Run tests** (should PASS - GREEN):
```bash
pnpm test tests/integration/file-tree/StoreActions.test.tsx
```

## Phase 3: UI Components (TDD)

### 3.1 Write Component Tests (RED)

**File**: `frontend/tests/integration/file-tree/ContextMenu.test.tsx`

```typescript
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTreeView } from '@/file-tree/FileTreeView';

describe('FileTreeView context menu', () => {
  it('shows context menu on right-click', async () => {
    const nodes = [
      {
        id: '1',
        name: 'MyClass.ts',
        path: '/src/MyClass.ts',
        type: 'file' as const,
        children: []
      }
    ];

    render(<FileTreeView nodes={nodes} />);

    const file = screen.getByText('MyClass.ts');
    await userEvent.pointer({ keys: '[MouseRight]', target: file });

    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('starts rename when Rename is clicked', async () => {
    const nodes = [
      {
        id: '1',
        name: 'MyClass.ts',
        path: '/src/MyClass.ts',
        type: 'file' as const,
        children: []
      }
    ];

    render(<FileTreeView nodes={nodes} />);

    const file = screen.getByText('MyClass.ts');
    await userEvent.pointer({ keys: '[MouseRight]', target: file });
    await userEvent.click(screen.getByText('Rename'));

    expect(screen.getByRole('textbox')).toHaveValue('MyClass.ts');
  });
});
```

**Run tests** (should FAIL - RED):
```bash
pnpm test tests/integration/file-tree/ContextMenu.test.tsx
```

### 3.2 Implement Context Menu (GREEN)

**File**: `frontend/src/file-tree/FileTreeView.tsx`

Modify to add context menu:

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Add state for rename
const [renamingFileId, setRenamingFileId] = React.useState<string | null>(null);
const [renameValue, setRenameValue] = React.useState("");

// Wrap file items with context menu
{node.type === "file" ? (
  <ContextMenu>
    <ContextMenuTrigger asChild>
      <button
        onClick={() => handleFileClick(node.id)}
        className={/* ... */}
      >
        <File className="h-4 w-4 shrink-0 text-gray-500" />
        {renamingFileId === node.id ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={handleRenameKeyDown}
            autoFocus
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </button>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem onSelect={() => handleRenameStart(node.id)}>
        Rename
      </ContextMenuItem>
      <ContextMenuItem onSelect={() => handleDuplicate(node.id)}>
        Duplicate
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => handleDeleteStart(node.id)}>
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
) : (
  /* folder rendering */
)}
```

Add handlers:

```tsx
const handleRenameStart = (fileId: string) => {
  const file = useStore.getState().getFileById(fileId);
  if (file) {
    setRenamingFileId(fileId);
    setRenameValue(file.name);
  }
};

const handleRenameCommit = async () => {
  if (renamingFileId && renameValue) {
    await useStore.getState().renameFile(renamingFileId, renameValue);
  }
  setRenamingFileId(null);
};

const handleRenameKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleRenameCommit();
  } else if (e.key === 'Escape') {
    setRenamingFileId(null);
  }
};

const handleDuplicate = async (fileId: string) => {
  await useStore.getState().duplicateFile(fileId);
};

const handleDeleteStart = (fileId: string) => {
  // TODO: Show delete confirmation dialog
  console.log('Delete:', fileId);
};
```

**Run tests** (should PASS - GREEN):
```bash
pnpm test tests/integration/file-tree/ContextMenu.test.tsx
```

## Phase 4: E2E Tests

### 4.1 Write E2E Tests

**File**: `frontend/tests/e2e/file-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('File Tree Context Menu', () => {
  test('User Story 1: Delete file workflow', async ({ page }) => {
    await page.goto('/');
    
    // Create test file
    await page.getByRole('button', { name: /new file/i }).click();
    
    // Right-click and delete
    await page.getByTestId('file-NewFile.ts').click({ button: 'right' });
    await page.getByText('Delete').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Verify file is removed
    await expect(page.getByTestId('file-NewFile.ts')).not.toBeVisible();
  });

  test('User Story 2: Rename file workflow', async ({ page }) => {
    await page.goto('/');
    
    // Create test file
    await page.getByRole('button', { name: /new file/i }).click();
    
    // Right-click and rename
    await page.getByTestId('file-NewFile.ts').click({ button: 'right' });
    await page.getByText('Rename').click();
    
    // Enter new name
    const input = page.getByRole('textbox');
    await input.fill('RenamedFile.ts');
    await input.press('Enter');
    
    // Verify new name
    await expect(page.getByText('RenamedFile.ts')).toBeVisible();
  });

  test('User Story 3: Duplicate file workflow', async ({ page }) => {
    await page.goto('/');
    
    // Create test file
    await page.getByRole('button', { name: /new file/i }).click();
    
    // Right-click and duplicate
    await page.getByTestId('file-NewFile.ts').click({ button: 'right' });
    await page.getByText('Duplicate').click();
    
    // Verify copy exists
    await expect(page.getByText('NewFile copy.ts')).toBeVisible();
    await expect(page.getByText('NewFile.ts')).toBeVisible();
  });
});
```

**Run E2E tests**:
```bash
pnpm test:e2e
```

## Phase 5: Integration with ProjectManager

### 5.1 Add Persistence Layer

**File**: `frontend/src/project-management/ProjectManager.ts`

Verify these methods exist (they should from feature 002):

```typescript
async updateFile(fileId: string, updates: Partial<ProjectFile>): Promise<void>
async deleteFile(fileId: string): Promise<void>
async saveFile(file: ProjectFile): Promise<void>
```

### 5.2 Connect Store to ProjectManager

Update store actions to persist:

```typescript
// In renameFile action:
await projectManager.updateFile(fileId, {
  name: newName,
  path: newPath,
  lastModified: Date.now()
});

// In duplicateFile action:
await projectManager.saveFile(newFile);

// In deleteFile action:
await projectManager.deleteFile(fileId);
```

## Phase 6: Polish and Validation

### 6.1 Add Delete Confirmation Dialog

Use existing Dialog component:

```tsx
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [fileToDelete, setFileToDelete] = useState<string | null>(null);

const handleDeleteStart = (fileId: string) => {
  setFileToDelete(fileId);
  setDeleteDialogOpen(true);
};

const handleConfirmDelete = async () => {
  if (fileToDelete) {
    await useStore.getState().deleteFile(fileToDelete);
  }
  setDeleteDialogOpen(false);
  setFileToDelete(null);
};

// Render:
<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete File?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleConfirmDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 6.2 Add Error Handling

Display validation errors in rename input:

```tsx
const [renameError, setRenameError] = useState<string | null>(null);

const handleRenameCommit = async () => {
  if (renamingFileId && renameValue) {
    const result = await useStore.getState().renameFile(renamingFileId, renameValue);
    if (!result.success) {
      setRenameError(result.error || 'Unknown error');
      return;
    }
  }
  setRenamingFileId(null);
  setRenameError(null);
};

// Display error below input:
{renameError && (
  <span className="text-xs text-red-500">{renameError}</span>
)}
```

## Testing Checklist

- [ ] All unit tests pass (`pnpm test`)
- [ ] All integration tests pass
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Coverage >80% for new code
- [ ] Manual testing of all user scenarios
- [ ] Accessibility testing (keyboard navigation)

## Development Commands

```bash
# Run development server
pnpm dev

# Run unit and integration tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run linting
pnpm lint

# Build for production
pnpm build
```

## Success Criteria Verification

After implementation, verify:

1. ✅ Context menu appears <200ms after right-click
2. ✅ Rename operation completes <2s
3. ✅ Duplicate operation completes <2s
4. ✅ Delete operation completes <2s
5. ✅ All operations persist to IndexedDB
6. ✅ Operations survive page refresh
7. ✅ Validation prevents duplicate names
8. ✅ Delete confirmation prevents accidental deletion

## Next Steps

After completing this feature:

1. Update `.github/copilot-instructions.md` with new technologies
2. Create PR against main branch
3. Request code review
4. Merge after approval
5. Deploy to production

## Troubleshooting

**Context menu not appearing:**
- Check Radix UI is installed: `npm list @radix-ui/react-context-menu`
- Verify ContextMenu component is imported correctly
- Check browser console for errors

**Tests failing:**
- Clear test cache: `pnpm test --clearCache`
- Verify fake-indexeddb is installed for store tests
- Check test file paths are correct

**Rename validation not working:**
- Verify validateFileName function is imported
- Check existingPaths array includes all files
- Console.log validation result for debugging

**Delete not persisting:**
- Verify ProjectManager.deleteFile is called
- Check IndexedDB in browser DevTools
- Ensure error handling doesn't silently fail
