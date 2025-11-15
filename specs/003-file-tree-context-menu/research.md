# Research Document: File Tree Context Menu

**Feature**: 003-file-tree-context-menu  
**Date**: 2025-11-15  
**Status**: Complete

## Overview

This document consolidates research findings for implementing right-click context menu functionality in the file tree, covering UI component selection, state management patterns, file operation patterns, and testing strategies.

## Research Topics

### 1. shadcn/ui Context Menu Component

**Decision**: Use `@radix-ui/react-context-menu` via shadcn/ui CLI

**Rationale**:
- Already using shadcn/ui components (Dialog, Dropdown, ScrollArea) in project
- Radix UI provides accessible, unstyled primitives with full keyboard support
- Context Menu primitive follows WAI-ARIA design patterns
- Consistent with existing component architecture
- Zero additional dependencies beyond Radix UI

**Alternatives Considered**:
- Custom context menu implementation: Rejected due to accessibility complexity and reinventing the wheel
- react-contexify: Rejected as it adds another library when we already have shadcn/ui ecosystem
- Headless UI: Rejected as project already standardized on Radix UI via shadcn

**Implementation Details**:
```bash
# Install via shadcn CLI
pnpm dlx shadcn@latest add context-menu
```

**API Usage Pattern**:
```tsx
<ContextMenu>
  <ContextMenuTrigger>{/* File tree item */}</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={handleRename}>Rename</ContextMenuItem>
    <ContextMenuItem onSelect={handleDuplicate}>Duplicate</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem onSelect={handleDelete}>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**Key Features**:
- Automatic positioning and collision detection
- Keyboard navigation (arrow keys, Enter, Escape)
- Screen reader support
- Portal rendering (avoids z-index conflicts)
- Controlled/uncontrolled modes

### 2. File Operation State Management

**Decision**: Extend Zustand store with file operation actions

**Rationale**:
- Project already uses Zustand for all state management
- Existing `FileSlice` has `updateFile`, `removeFile` methods as foundation
- Zustand slice pattern allows adding operations without bloating store
- Simple API matches existing patterns: `updateFile(id, { name })`, `removeFile(id)`, `addFile(duplicate)`

**Alternatives Considered**:
- Local component state: Rejected because operations affect multiple components (tree, editor, diagram)
- Context API: Rejected as Zustand is already the standard and more performant
- Redux: Rejected as overkill and not aligned with project's chosen state library

**Implementation Pattern**:
```typescript
// Extend FileSlice in store/index.ts
interface FileSlice {
  // ... existing methods
  renameFile: (fileId: string, newName: string) => Promise<void>;
  duplicateFile: (fileId: string) => Promise<string>;
  deleteFile: (fileId: string) => Promise<void>;
}
```

**Integration Points**:
- `renameFile`: Updates file.name, file.path, calls ProjectManager.updateFile()
- `duplicateFile`: Creates new file with modified name, calls ProjectManager.saveFile()
- `deleteFile`: Removes from store, closes editor if active, calls ProjectManager.deleteFile()

### 3. File Rename Inline Editing Pattern

**Decision**: Use controlled input with blur/escape/enter handlers

**Rationale**:
- Familiar UX pattern (matches VS Code, Finder, Explorer)
- Simple implementation with React controlled components
- No additional dependencies required
- Easy to validate in real-time

**Alternatives Considered**:
- Modal dialog for rename: Rejected as it interrupts workflow and requires extra clicks
- contentEditable: Rejected due to cross-browser quirks and accessibility issues
- Third-party inline edit library: Rejected as overkill for simple text input

**Implementation Pattern**:
```tsx
const [editingFileId, setEditingFileId] = useState<string | null>(null);
const [editValue, setEditValue] = useState("");

// In FileTreeView:
{isEditing ? (
  <input
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onBlur={handleCommitRename}
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleCommitRename();
      if (e.key === 'Escape') handleCancelRename();
    }}
    autoFocus
  />
) : (
  <span>{node.name}</span>
)}
```

**Validation Strategy**:
- Check for empty names before commit
- Check for duplicate names in same folder
- Display error message below input on validation failure
- Preserve focus on input until valid name entered or cancelled

### 4. File Duplicate Naming Convention

**Decision**: Use pattern `[original-name] copy[.ext]` with incremental numbering

**Rationale**:
- Matches macOS Finder convention (familiar to users)
- Clear indication that file is a copy
- Easy to generate programmatically
- Human-readable and predictable

**Alternatives Considered**:
- Timestamp suffix (e.g., `file-2025-11-15-123456.ts`): Rejected as less readable
- UUID suffix: Rejected as cryptic and not user-friendly
- Prompt user for name: Rejected as extra friction (can rename after if needed)

**Implementation Algorithm**:
```typescript
function generateDuplicateName(originalPath: string, existingPaths: string[]): string {
  const { dir, name, ext } = parsePath(originalPath);
  
  let copyName = `${name} copy${ext}`;
  let counter = 2;
  
  while (existingPaths.includes(`${dir}/${copyName}`)) {
    copyName = `${name} copy ${counter}${ext}`;
    counter++;
  }
  
  return `${dir}/${copyName}`;
}
```

**Examples**:
- `MyClass.ts` → `MyClass copy.ts`
- `MyClass copy.ts` → `MyClass copy 2.ts`
- `MyClass copy 2.ts` → `MyClass copy 3.ts`

### 5. Delete Confirmation Pattern

**Decision**: Use existing shadcn Dialog component with confirm/cancel buttons

**Rationale**:
- Already have Dialog component in project (used elsewhere)
- Prevents accidental deletions (critical for user trust)
- Standard pattern users expect for destructive actions
- Accessible (focus trap, ESC to cancel, Enter to confirm)

**Alternatives Considered**:
- No confirmation: Rejected as too risky for accidental data loss
- Undo/redo system: Rejected as complex and out of scope for this feature
- "Are you sure?" native confirm(): Rejected as non-customizable and blocks UI thread

**Implementation Pattern**:
```tsx
<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete {fileToDelete?.name}?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. The file will be permanently deleted.
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

**UX Considerations**:
- Focus "Cancel" button by default (safer option)
- Show filename in confirmation message for clarity
- Use red "Delete" button to signal destructive action
- Keep dialog centered and modal (blocks other interactions)

### 6. IndexedDB Persistence Integration

**Decision**: Use existing ProjectManager methods with new file operations

**Rationale**:
- ProjectManager already handles all file CRUD via idb library
- Existing `updateFile()` and `deleteFile()` methods work for rename/delete
- `saveFile()` method handles duplicate by creating new entry
- Consistent error handling and storage quota checks already implemented

**Alternatives Considered**:
- Direct idb calls from components: Rejected as violates separation of concerns
- New separate storage manager: Rejected as duplicates existing ProjectManager functionality

**Integration Points**:
```typescript
// In FileTreeManager or store actions:
async renameFile(fileId: string, newName: string) {
  const file = this.getFileById(fileId);
  const newPath = updatePathName(file.path, newName);
  
  await projectManager.updateFile(fileId, {
    name: newName,
    path: newPath,
    lastModified: Date.now()
  });
}

async duplicateFile(fileId: string) {
  const file = this.getFileById(fileId);
  const newPath = generateDuplicateName(file.path, allPaths);
  
  const newFile = {
    ...file,
    id: generateId(),
    path: newPath,
    name: extractFileName(newPath),
    lastModified: Date.now()
  };
  
  await projectManager.saveFile(newFile);
  return newFile.id;
}

async deleteFile(fileId: string) {
  await projectManager.deleteFile(fileId);
}
```

**Error Handling**:
- Catch quota exceeded errors and display user-friendly message
- Catch database errors and show retry option
- Optimistic updates with rollback on failure

### 7. Testing Strategy

**Decision**: Three-tier testing approach (Unit → Integration → E2E)

**Rationale**:
- Unit tests: Fast feedback for business logic (name generation, validation)
- Integration tests: Verify component interactions with mocked storage
- E2E tests: Verify complete user workflows in real browser

**Test Coverage Targets**:
- Unit tests: >80% coverage for FileOperations, name generation, validation
- Integration tests: All context menu interactions, state updates
- E2E tests: Complete user scenarios from spec.md (P1, P2, P3)

**Unit Test Examples**:
```typescript
describe('generateDuplicateName', () => {
  it('adds "copy" suffix to filename', () => {
    expect(generateDuplicateName('/src/file.ts', [])).toBe('/src/file copy.ts');
  });
  
  it('increments copy number when duplicate exists', () => {
    const existing = ['/src/file copy.ts'];
    expect(generateDuplicateName('/src/file.ts', existing)).toBe('/src/file copy 2.ts');
  });
});
```

**Integration Test Examples**:
```typescript
describe('FileTreeView context menu', () => {
  it('shows rename input when Rename is selected', async () => {
    render(<FileTreeView nodes={mockNodes} />);
    const file = screen.getByText('MyClass.ts');
    
    await userEvent.pointer({ keys: '[MouseRight]', target: file });
    await userEvent.click(screen.getByText('Rename'));
    
    expect(screen.getByRole('textbox')).toHaveValue('MyClass.ts');
  });
});
```

**E2E Test Examples**:
```typescript
test('User Story 1: Delete file workflow', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('file-MyClass.ts').click({ button: 'right' });
  await page.getByText('Delete').click();
  await page.getByRole('button', { name: 'Delete' }).click();
  
  await expect(page.getByTestId('file-MyClass.ts')).not.toBeVisible();
});
```

### 8. Performance Considerations

**Decision**: Optimize for perceived performance over absolute speed

**Rationale**:
- Context menu <200ms response meets user expectations
- File operations <2s acceptable for client-side storage
- Optimistic UI updates make operations feel instant
- Debouncing not needed (operations are user-initiated, not continuous)

**Optimization Strategies**:
1. **Optimistic Updates**: Update UI immediately, rollback on error
2. **Lazy Rendering**: Only render context menu when opened
3. **Memoization**: Memoize file list and tree computations with useMemo
4. **Event Delegation**: Single context menu handler for entire tree

**Performance Monitoring**:
```typescript
// Measure context menu open time
const start = performance.now();
// ... open context menu
const duration = performance.now() - start;
console.log(`Context menu opened in ${duration}ms`);
```

**Target Metrics** (from spec.md):
- Context menu appears: <200ms ✓
- File operations complete: <2s ✓
- UI updates: <100ms ✓

### 9. Accessibility Requirements

**Decision**: Follow WCAG 2.1 Level AA guidelines

**Rationale**:
- Radix UI Context Menu provides built-in ARIA support
- Keyboard navigation essential for power users
- Screen reader announcements improve usability for all users

**Accessibility Features**:
- **Keyboard Support**: 
  - Right-click → Shift+F10 or Context Menu key
  - Arrow keys navigate menu items
  - Enter activates item
  - Escape closes menu
- **Screen Reader Support**:
  - ARIA roles (menu, menuitem)
  - Announce file name when context menu opens
  - Announce operation results ("File renamed to X")
- **Focus Management**:
  - Return focus to file tree item after operation
  - Focus trap in delete confirmation dialog
  - Visual focus indicators

**Testing**:
- Test with keyboard only (no mouse)
- Test with screen reader (VoiceOver/NVDA)
- Verify color contrast ratios for menu items

## Summary

All technical unknowns have been resolved:

1. **UI Component**: shadcn/ui Context Menu (Radix UI primitive)
2. **State Management**: Extend Zustand FileSlice with operation actions
3. **Rename UI**: Controlled input with blur/escape/enter handlers
4. **Duplicate Naming**: "[name] copy[.ext]" with incremental numbering
5. **Delete Confirmation**: Existing shadcn Dialog component
6. **Persistence**: Integrate with existing ProjectManager methods
7. **Testing**: Three-tier approach (unit, integration, E2E)
8. **Performance**: Optimistic updates, <200ms context menu, <2s operations
9. **Accessibility**: WCAG 2.1 AA via Radix UI primitives

No blockers identified. Ready to proceed to Phase 1 (Design & Contracts).
