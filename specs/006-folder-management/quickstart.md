# Quickstart: File and Folder Management

**Feature Branch**: `006-folder-management`  
**Date**: 2025-11-28

## Prerequisites

- Node.js 20+ LTS
- pnpm (installed globally)
- Git

## Quick Setup

```bash
# Clone and checkout feature branch
git clone https://github.com/mkluszczynski/code-graph.git
cd code-graph
git checkout 006-folder-management

# Install dependencies
cd frontend
pnpm install

# Start development server
pnpm dev
```

Open http://localhost:5173 in your browser.

---

## Feature Overview

### User Story 1: Simplified File Creation (P1)

Create empty files without pre-defined templates:

1. Click **"Add File"** button in file tree panel
2. Select **"Add File"** from dropdown
3. Enter filename (e.g., `utils.ts`)
4. Press Enter or click **Create**

**Notes**:
- `.ts` extension added automatically if omitted
- Inline validation shows errors without closing dialog

### User Story 2: Create and Delete Folders (P2)

Organize code with custom folders:

1. Click **"Add File"** button
2. Select **"Add Folder"**
3. Enter folder name (e.g., `components`)
4. Press Enter or click **Create**

To delete a folder:
1. Right-click the folder in file tree
2. Select **Delete**
3. Confirm deletion (warns if folder has contents)

### User Story 3: Rename and Duplicate Folders (P3)

Rename:
1. Right-click folder → **Rename**
2. Type new name
3. Press Enter

Duplicate:
1. Right-click folder → **Duplicate**
2. Folder copied as "foldername copy"

### User Story 4: Improved Dialog UX (P4)

All dialogs use shadcn components with:
- Auto-focus on input
- Enter to submit, Escape to cancel
- Inline validation
- Loading states

---

## Development Workflow

### Run Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests with coverage
pnpm test:coverage
```

### Key Files to Modify

| File | Purpose |
|------|---------|
| `src/components/AddButton.tsx` | Change dropdown menu items |
| `src/components/CreateDialog.tsx` | **NEW** - File/folder creation dialog |
| `src/file-tree/FileTreeView.tsx` | Add folder context menu |
| `src/file-tree/FolderOperations.ts` | **NEW** - Recursive folder operations |
| `src/project-management/ProjectManager.ts` | Add folder CRUD methods |
| `src/shared/store/index.ts` | Add folder actions to FileSlice |

### Test Files to Create

| File | Tests |
|------|-------|
| `tests/unit/components/CreateDialog.test.tsx` | Dialog rendering, validation, keyboard |
| `tests/unit/file-tree/FolderOperations.test.ts` | Path utilities, name generation |
| `tests/integration/folder-management/CreateFile.test.tsx` | File creation workflow |
| `tests/integration/folder-management/CreateFolder.test.tsx` | Folder creation workflow |
| `tests/integration/folder-management/FolderContextMenu.test.tsx` | Context menu operations |
| `tests/e2e/folder-management.spec.ts` | Full user workflows |

---

## TDD Workflow

### Phase 1: Write Failing Tests

```bash
# Create test file first
touch frontend/tests/unit/components/CreateDialog.test.tsx

# Run tests (should fail - component doesn't exist)
pnpm test CreateDialog
```

### Phase 2: Implement Minimum Code

```bash
# Create component
touch frontend/src/components/CreateDialog.tsx

# Implement until tests pass
pnpm test CreateDialog --watch
```

### Phase 3: Refactor

- Extract common validation logic
- Ensure <50 lines per function
- Ensure <300 lines per file

---

## Common Tasks

### Add shadcn Dialog (if not already added)

```bash
pnpm dlx shadcn@latest add dialog
```

### Check Linting

```bash
pnpm lint
```

### Type Check

```bash
pnpm typecheck
```

### Build Production

```bash
pnpm build
```

---

## Validation Checklist

Before PR:

- [ ] All tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Types check (`pnpm typecheck`)
- [ ] No console errors in browser
- [ ] Keyboard navigation works
- [ ] Screen reader announces dialog title
- [ ] IndexedDB persists across reload
- [ ] Rollback works on failure

---

## Troubleshooting

### Dialog doesn't open
- Check `open` prop is controlled by state
- Verify `onOpenChange` updates state

### IndexedDB errors
- Open DevTools → Application → IndexedDB
- Clear storage if schema mismatch
- Check `by-parent-path` index exists

### Tests fail with "not found"
- Run `pnpm install` to ensure dependencies
- Check test setup imports `@testing-library/react`

### Folder not appearing in tree
- Folders are virtual - only appear when they contain files
- Check `parentPath` is set correctly on files
