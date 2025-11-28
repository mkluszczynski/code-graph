# Contract: CreateDialog Component

**Feature Branch**: `006-folder-management`  
**Date**: 2025-11-28  
**Component**: `frontend/src/components/CreateDialog.tsx`

## Overview

Dialog component for creating new files or folders with inline validation, keyboard navigation, and accessibility support.

---

## Interface

```typescript
import type { CreateItemType } from "../file-tree/types";

export interface CreateDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Type of item to create
   */
  type: CreateItemType; // "file" | "folder"

  /**
   * Parent folder path where item will be created
   * @example "/src" or "/" for root
   */
  parentPath: string;

  /**
   * Existing item names in the parent folder (for duplicate detection)
   */
  existingNames: string[];

  /**
   * Called when user confirms creation with valid name
   * @param name - The validated item name
   * @returns Promise that resolves when creation succeeds
   * @throws Error if creation fails (displayed as inline error)
   */
  onSubmit: (name: string) => Promise<void>;

  /**
   * Called when user cancels dialog
   */
  onCancel: () => void;
}
```

---

## Behavior Contract

### Dialog Lifecycle

| Event | Behavior |
|-------|----------|
| Open (`open: true`) | Reset input to empty (or ".ts" for files), focus input, clear errors |
| Close (Cancel/Escape) | Call `onCancel()`, do not call `onSubmit()` |
| Close (Success) | Call `onSubmit()`, close after promise resolves |

### Input Behavior

| Event | Behavior |
|-------|----------|
| Type in input | Update local state, clear any existing error |
| Enter key | Submit form (same as clicking Create button) |
| Escape key | Cancel dialog (same as clicking Cancel button) |
| Tab key | Navigate to next focusable element (Cancel → Create) |

### Validation

| Condition | Error Message |
|-----------|---------------|
| Empty name | "{File\|Folder} name is required" |
| Invalid characters (`/\:*?"<>|`) | "Name contains invalid characters" |
| Duplicate name | "A {file\|folder} with this name already exists" |

### Auto-Focus

- On dialog open, focus the name input
- For file creation, position cursor at start (before ".ts" placeholder)
- On validation error, keep focus on input

### Loading State

| State | UI Behavior |
|-------|-------------|
| `isSubmitting: false` | Input enabled, buttons enabled |
| `isSubmitting: true` | Input disabled, Cancel disabled, Create shows "Creating..." |
| `isSubmitting: true` | Escape key disabled, click outside disabled |

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Dialog role | Radix `<Dialog>` provides automatically |
| Focus trap | Radix `<Dialog>` provides automatically |
| Title | `<DialogTitle>` with "New File" or "New Folder" |
| Description | `<DialogDescription>` with parent path context |
| Error announcement | `role="alert"` on error message |
| Input labeling | `<Label htmlFor="name">` with `aria-invalid` and `aria-describedby` |

---

## Test Cases

### Unit Tests (`frontend/tests/unit/components/CreateDialog.test.tsx`)

```typescript
describe('CreateDialog', () => {
  describe('Rendering', () => {
    it('renders dialog when open is true');
    it('does not render dialog when open is false');
    it('displays correct title for file type');
    it('displays correct title for folder type');
    it('displays parent path in description');
  });

  describe('Input Behavior', () => {
    it('focuses input on dialog open');
    it('clears input value when dialog opens');
    it('updates input value on user typing');
    it('clears error message when user types');
  });

  describe('Validation', () => {
    it('shows error for empty name on submit');
    it('shows error for invalid characters on submit');
    it('shows error for duplicate name on submit');
    it('does not close dialog when validation fails');
    it('keeps focus on input after validation error');
  });

  describe('Submission', () => {
    it('calls onSubmit with trimmed name');
    it('normalizes filename with .ts extension when missing');
    it('does not normalize folder names');
    it('disables inputs during submission');
    it('shows loading state on Create button');
    it('closes dialog after successful submission');
    it('shows error and keeps dialog open on submission failure');
  });

  describe('Keyboard Navigation', () => {
    it('submits form on Enter key');
    it('cancels dialog on Escape key');
    it('prevents close during submission');
  });

  describe('Accessibility', () => {
    it('has accessible dialog title');
    it('has accessible dialog description');
    it('marks input as invalid when error exists');
    it('associates error message with input via aria-describedby');
    it('announces error with role="alert"');
  });
});
```

### Integration Tests (`frontend/tests/integration/folder-management/CreateFile.test.tsx`)

```typescript
describe('Create File Integration', () => {
  it('creates empty file in src folder via dialog');
  it('creates file in nested folder');
  it('adds .ts extension when omitted');
  it('prevents duplicate file names');
  it('persists file to IndexedDB');
  it('updates file tree after creation');
  it('selects newly created file in editor');
});
```

---

## Example Usage

```tsx
function FileTreePanel() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<CreateItemType>('file');
  const createEmptyFile = useStore((s) => s.createEmptyFile);
  const createFolder = useStore((s) => s.createFolder);
  
  const handleAddFile = () => {
    setCreateType('file');
    setDialogOpen(true);
  };
  
  const handleAddFolder = () => {
    setCreateType('folder');
    setDialogOpen(true);
  };
  
  const handleSubmit = async (name: string) => {
    if (createType === 'file') {
      await createEmptyFile(name, currentPath);
    } else {
      await createFolder(name, currentPath);
    }
    setDialogOpen(false);
  };
  
  return (
    <>
      <AddButton onAddFile={handleAddFile} onAddFolder={handleAddFolder} />
      <CreateDialog
        open={dialogOpen}
        type={createType}
        parentPath={currentPath}
        existingNames={currentFolderNames}
        onSubmit={handleSubmit}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}
```

---

## Dependencies

- `@radix-ui/react-dialog` (via shadcn/ui)
- `lucide-react` for icons
- `@/components/ui/dialog` (existing shadcn component)
- `@/components/ui/button` (existing shadcn component)
- `@/components/ui/input` (existing shadcn component)
- `@/components/ui/label` (existing shadcn component)
