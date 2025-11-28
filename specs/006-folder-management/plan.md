# Implementation Plan: File and Folder Management with Improved UX

**Branch**: `006-folder-management` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-folder-management/spec.md`

## Summary

Refactor file creation to remove template-based approach (class/interface) in favor of simple "Add File" / "Add Folder" options. Enable full folder management (create, delete, rename, duplicate) with recursive operations. Replace native browser prompts with shadcn Dialog components for improved UX.

**Technical Approach**: 
- Modify `AddButton.tsx` to show "Add File" and "Add Folder" menu items
- Create `CreateDialog.tsx` component using shadcn Dialog for file/folder name input
- Extend `ProjectManager.ts` with folder CRUD operations and recursive file operations
- Enhance `FileTreeView.tsx` with folder context menu (rename, duplicate, delete)
- Update Zustand store with folder-aware file operations

## Technical Context

**Language/Version**: TypeScript 5.x, React 18+, Node.js 20+ LTS  
**Primary Dependencies**: React 18+, Zustand 5.0 (state), shadcn/ui (UI components), Lucide React (icons), idb 8.0+ (IndexedDB wrapper), Radix UI primitives  
**Storage**: IndexedDB via idb library for client-side file persistence  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Frontend-only web application  
**Performance Goals**: 
- File/folder creation <5 seconds (SC-001, SC-002)
- Dialog validation feedback <200ms (SC-003)
- Folder deletion <3s for 50 files (SC-005)
- Folder rename <2s for 50 files (SC-006)  
**Constraints**: 
- IndexedDB storage quota (~50MB typical)
- No backend/server dependencies
- WCAG 2.1 Level AA accessibility  
**Scale/Scope**: 
- Up to 10 levels of folder nesting (SC-004)
- Up to 50 files per folder for recursive operations

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines
  - [x] No files planned >300 lines
  - [x] All names are descriptive and reveal intent
  - [x] No code duplication in design
  - [ ] Complexity justified in writing (if applicable) - Store file already 345 lines, documented justification exists

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers
  - [x] Feature modules have clear boundaries
  - [x] Feature is independently understandable
  - [x] Shared code has clear purpose and justification

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria (4 user stories with 23 acceptance scenarios)
  - [x] Test strategy documented (contract, integration, unit)
  - [x] Tests will be written before implementation
  - [x] Coverage targets defined (>80% for business logic)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs
  - [x] User stories prioritized (P1, P2, P3, P4)
  - [x] Error messages are actionable and user-friendly (FR-002, FR-007)
  - [x] Performance expectations defined from user perspective (SC-001 through SC-011)

## Project Structure

### Documentation (this feature)

```text
specs/006-folder-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── create-dialog.contract.md
│   ├── folder-operations.contract.md
│   └── add-button.contract.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── AddButton.tsx           # MODIFY: Change menu to "Add File"/"Add Folder"
│   │   ├── CreateDialog.tsx        # NEW: shadcn Dialog for file/folder creation
│   │   └── ui/
│   │       └── dialog.tsx          # Existing shadcn component
│   ├── file-tree/
│   │   ├── FileTreeView.tsx        # MODIFY: Add folder context menu
│   │   ├── FileOperations.ts       # MODIFY: Add folder operation utilities
│   │   ├── FolderOperations.ts     # NEW: Folder-specific recursive operations
│   │   └── types.ts                # MODIFY: Add folder operation types
│   ├── project-management/
│   │   └── ProjectManager.ts       # MODIFY: Add folder CRUD operations
│   └── shared/
│       ├── store/
│       │   └── index.ts            # MODIFY: Add folder actions to FileSlice
│       └── types/
│           └── index.ts            # MODIFY: Add FolderNode type if needed
└── tests/
    ├── unit/
    │   ├── components/
    │   │   └── CreateDialog.test.tsx     # NEW
    │   └── file-tree/
    │       └── FolderOperations.test.ts  # NEW
    ├── integration/
    │   └── folder-management/
    │       ├── CreateFile.test.tsx       # NEW
    │       ├── CreateFolder.test.tsx     # NEW
    │       └── FolderContextMenu.test.tsx # NEW
    └── e2e/
        └── folder-management.spec.ts     # NEW
```

**Structure Decision**: Frontend-only web application. All new code follows existing feature-driven structure with components in `/components`, file tree logic in `/file-tree`, and persistence in `/project-management`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| Store file 345 lines | Central state hub with 8 feature slices, slice pattern requires co-location for type safety | Documented in file header, splitting would break Zustand slice composition |
