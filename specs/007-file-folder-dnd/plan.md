````markdown
# Implementation Plan: Add Files to Folders & Drag-and-Drop Organization

**Branch**: `007-file-folder-dnd` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-file-folder-dnd/spec.md`

## Summary

Implement folder context menu "Add File" option and HTML5 drag-and-drop for file/folder reorganization. The feature enables users to create files directly inside folders via context menu and move files/folders via intuitive drag-and-drop operations with visual feedback, auto-expand on hover, and rollback on failure.

**Technical Approach**: Extend existing `FileTreeView` component with HTML5 drag-and-drop event handlers using React's synthetic events. Add `DragState` and `DropTarget` state to Zustand store. Implement `MoveOperation` in ProjectManager with atomic IndexedDB transactions.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+  
**Primary Dependencies**: React, Zustand 5.0 (state), idb 8.0 (IndexedDB), shadcn/ui (UI components), Lucide React (icons)  
**Storage**: IndexedDB (via idb library) for file/folder persistence  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (frontend-only SPA)  
**Performance Goals**: Drag feedback <100ms, drop indicator <50ms, move ops <1s files/<3s folders  
**Constraints**: 100% data preservation on move, rollback on failure, no data loss  
**Scale/Scope**: Typical project with 10-100 files, 3-level folder nesting

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines
  - [x] No files planned >300 lines (except FileTreeView.tsx with justified constitutional exception)
  - [x] All names are descriptive and reveal intent
  - [x] No code duplication in design (reuse existing FolderOperations utilities)
  - [x] Complexity justified in writing: FileTreeView.tsx already has constitutional exception for tree complexity

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers (file-tree/)
  - [x] Feature modules have clear boundaries (DragDropManager separate from FileTreeView)
  - [x] Feature is independently understandable
  - [x] Shared code has clear purpose and justification (types in shared/types)

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria (spec.md has 18 scenarios)
  - [x] Test strategy documented (contract for DragDropManager, integration for FileTreeView, E2E for workflows)
  - [x] Tests will be written before implementation
  - [x] Coverage targets defined (>80% for DragDropManager, MoveOperation)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs
  - [x] User stories prioritized (P1: Add File, P2: File DnD, P3: Folder DnD)
  - [x] Error messages are actionable and user-friendly (duplicate name, circular reference)
  - [x] Performance expectations defined from user perspective (SC-001 to SC-010)

## Project Structure

### Documentation (this feature)

```text
specs/007-file-folder-dnd/
├── plan.md              # This file
├── research.md          # Phase 0 output - DnD patterns, accessibility
├── data-model.md        # Phase 1 output - DragState, DropTarget, MoveOperation
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - DragDropManager contract
└── tasks.md             # Phase 2 output - task breakdown
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── file-tree/
│   │   ├── FileTreeView.tsx        # MODIFY: Add DnD handlers, "Add File" context menu
│   │   ├── DragDropManager.ts      # NEW: Drag state, drop validation, move ops
│   │   ├── FolderOperations.ts     # MODIFY: Add moveFile, moveFolder utilities
│   │   └── types.ts                # MODIFY: Add DragState, DropTarget types
│   ├── shared/
│   │   ├── types/index.ts          # MODIFY: Add MoveOperation type
│   │   └── store/index.ts          # MODIFY: Add drag/drop slice
│   ├── project-management/
│   │   └── ProjectManager.ts       # MODIFY: Add moveFile, moveFolder methods
│   └── components/
│       └── CreateDialog.tsx        # EXISTING: Reuse for "Add File" in folder
└── tests/
    ├── unit/
    │   └── file-tree/
    │       └── DragDropManager.test.ts    # NEW: Contract tests
    ├── integration/
    │   └── file-tree/
    │       └── DragDrop.test.tsx          # NEW: Integration tests
    └── e2e/
        └── file-folder-dnd.spec.ts        # NEW: E2E tests
```

**Structure Decision**: Extending existing `file-tree/` feature module with new `DragDropManager.ts` for drag-and-drop logic, keeping UI handlers in `FileTreeView.tsx`. This follows the established pattern from Feature 003 (context menu) and Feature 006 (folder management).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| FileTreeView.tsx >300 lines | Recursive tree component with context menu + DnD requires event handlers at multiple levels | Splitting would break component coherence; already has constitutional exception |
````
