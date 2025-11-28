# Contract: AddButton Component (Modified)

**Feature Branch**: `006-folder-management`  
**Date**: 2025-11-28  
**Component**: `frontend/src/components/AddButton.tsx`

## Overview

Modified dropdown button component that provides options to create new files or folders. Replaces the previous "New Class" / "New Interface" template-based options.

---

## Interface

### Before (Current)

```typescript
export interface AddButtonProps {
  onCreateClass: () => void;
  onCreateInterface: () => void;
  isLoading?: boolean;
}
```

### After (Modified)

```typescript
export interface AddButtonProps {
  /**
   * Callback when "Add File" is selected
   * Should open CreateDialog with type="file"
   */
  onAddFile: () => void;

  /**
   * Callback when "Add Folder" is selected
   * Should open CreateDialog with type="folder"
   */
  onAddFolder: () => void;

  /**
   * Whether an operation is in progress
   * Disables button and shows loading spinner when true
   */
  isLoading?: boolean;
}
```

---

## Behavior Contract

### Dropdown Menu

| Trigger | Behavior |
|---------|----------|
| Click button | Open dropdown menu |
| Click "Add File" | Call `onAddFile()`, close menu |
| Click "Add Folder" | Call `onAddFolder()`, close menu |
| Click outside | Close menu |
| Press Escape | Close menu |

### Loading State

| State | Behavior |
|-------|----------|
| `isLoading: false` | Button shows "Add File" with Plus icon |
| `isLoading: true` | Button shows "Creating..." with spinner, disabled |

### Menu Items

| Item | Icon | Label | Callback |
|------|------|-------|----------|
| 1 | `File` | "Add File" | `onAddFile()` |
| 2 | `Folder` | "Add Folder" | `onAddFolder()` |

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Button role | Radix `DropdownMenuTrigger` provides automatically |
| Menu role | Radix `DropdownMenuContent` provides `menu` role |
| Item role | Radix `DropdownMenuItem` provides `menuitem` role |
| Keyboard nav | Arrow keys to navigate, Enter to select |
| Focus management | Focus returns to trigger on close |

---

## Visual Design

```
┌─────────────────┐
│  + Add File  ▼  │  <- Button (dropdown trigger)
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ 📄 Add File     │  <- Menu item 1
├─────────────────┤
│ 📁 Add Folder   │  <- Menu item 2
└─────────────────┘
```

---

## Test Cases

### Unit Tests (`frontend/tests/unit/components/AddButton.test.tsx`)

```typescript
describe('AddButton', () => {
  describe('Rendering', () => {
    it('renders button with "Add File" label');
    it('renders Plus icon');
    it('shows loading spinner when isLoading is true');
    it('shows "Creating..." text when isLoading is true');
    it('disables button when isLoading is true');
  });

  describe('Dropdown Menu', () => {
    it('opens dropdown on button click');
    it('shows "Add File" menu item with File icon');
    it('shows "Add Folder" menu item with Folder icon');
    it('calls onAddFile when "Add File" is clicked');
    it('calls onAddFolder when "Add Folder" is clicked');
    it('closes dropdown after menu item click');
    it('disables menu items when isLoading is true');
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown on Enter key');
    it('navigates items with arrow keys');
    it('selects item on Enter key');
    it('closes dropdown on Escape key');
  });
});
```

---

## Migration Notes

### Removed Props
- `onCreateClass` - No longer needed (template-based creation removed)
- `onCreateInterface` - No longer needed (template-based creation removed)

### Removed Menu Items
- "New Class" - Removed
- "New Interface" - Removed

### Added Props
- `onAddFile` - Opens file creation dialog
- `onAddFolder` - Opens folder creation dialog

### Consumer Updates Required

```tsx
// Before
<AddButton
  onCreateClass={handleCreateClass}
  onCreateInterface={handleCreateInterface}
  isLoading={isCreating}
/>

// After
<AddButton
  onAddFile={() => openDialog('file')}
  onAddFolder={() => openDialog('folder')}
  isLoading={isCreating}
/>
```

---

## Implementation

```tsx
import { File, Folder, Loader2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface AddButtonProps {
  onAddFile: () => void;
  onAddFolder: () => void;
  isLoading?: boolean;
}

export function AddButton({
  onAddFile,
  onAddFolder,
  isLoading = false,
}: AddButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Creating..." : "Add File"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onAddFile} disabled={isLoading}>
          <File className="h-4 w-4 mr-2" />
          Add File
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddFolder} disabled={isLoading}>
          <Folder className="h-4 w-4 mr-2" />
          Add Folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Dependencies

- `lucide-react` - Icons (File, Folder, Loader2, Plus)
- `@/components/ui/button` - shadcn Button
- `@/components/ui/dropdown-menu` - shadcn DropdownMenu
