````markdown
# Implementation Plan: File Tree Context Menu

**Branch**: `003-file-tree-context-menu` | **Date**: 2025-11-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-file-tree-context-menu/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add right-click context menu functionality to the file tree with Rename, Duplicate, and Delete operations. Users can manage files directly in the file tree without needing external tools. Implementation uses shadcn/ui Context Menu component integrated with existing FileTreeView component, FileTreeManager, and Zustand store for state management. All operations persist to IndexedDB via existing ProjectManager.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 20+ LTS  
**Primary Dependencies**: React 18+, Zustand 5.0 (state), idb 8.0 (IndexedDB), shadcn/ui (UI components), @radix-ui/react-context-menu (context menu primitive), Lucide React (icons)  
**Storage**: IndexedDB via idb library for file persistence  
**Testing**: Vitest 4.0 (unit/integration), Playwright 1.56 (E2E), @testing-library/react 16.3  
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web application (React frontend with client-side storage)  
**Performance Goals**: Context menu appears <200ms after right-click, file operations complete <2s, UI updates <100ms  
**Constraints**: Client-side only (no backend), IndexedDB quota limits, single-page app with instant updates  
**Scale/Scope**: Small to medium projects (<1000 files), local development environment

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines
  - [x] No files planned >300 lines
  - [x] All names are descriptive and reveal intent
  - [x] No code duplication in design
  - [x] Complexity justified in writing (if applicable)

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers
  - [x] Feature modules have clear boundaries
  - [x] Feature is independently understandable
  - [x] Shared code has clear purpose and justification

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria
  - [x] Test strategy documented (contract, integration, unit)
  - [x] Tests will be written before implementation
  - [x] Coverage targets defined (>80% for business logic)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs
  - [x] User stories prioritized (P1, P2, P3...)
  - [x] Error messages are actionable and user-friendly
  - [x] Performance expectations defined from user perspective

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── file-tree/
│   │   ├── FileTreeView.tsx          # MODIFY: Add context menu wrapper
│   │   ├── FileTreeManager.ts        # MODIFY: Add rename/duplicate/delete methods
│   │   ├── FileOperations.ts         # NEW: File operation handlers
│   │   └── types.ts                  # MODIFY: Add context menu types
│   ├── components/
│   │   └── ui/
│   │       ├── context-menu.tsx      # NEW: shadcn context menu component
│   │       └── dialog.tsx            # EXISTING: Used for delete confirmation
│   ├── shared/
│   │   ├── store/
│   │   │   └── index.ts              # MODIFY: Add file operation actions
│   │   └── types/
│   │       └── index.ts              # MODIFY: Add file operation types
│   └── project-management/
│       ├── ProjectManager.ts         # MODIFY: Add rename/duplicate/delete to DB
│       └── FileCreator.ts            # EXISTING: Used for duplicate logic
└── tests/
    ├── integration/
    │   └── file-tree/
    │       └── FileOperations.test.tsx   # NEW: Integration tests
    └── e2e/
        └── file-management.spec.ts       # NEW: E2E tests
```

**Structure Decision**: Feature code lives in `frontend/src/file-tree/` module following feature-driven structure. Context menu UI component in `frontend/src/components/ui/` per shadcn convention. File operations integrate with existing `project-management/` for persistence. Tests organized by type (integration, e2e) mirroring source structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitution gates passed.
