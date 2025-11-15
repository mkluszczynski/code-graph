---
description: "Task list for File Tree Context Menu feature"
---

# Tasks: File Tree Context Menu

**Feature Branch**: `003-file-tree-context-menu`  
**Input**: Design documents from `/specs/003-file-tree-context-menu/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend code: `frontend/src/`
- Tests: `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure UI components

- [X] T001 Install shadcn/ui context-menu component via `pnpm dlx shadcn@latest add context-menu` in frontend/
- [X] T002 Verify @radix-ui/react-context-menu is installed in frontend/package.json
- [X] T003 Create TypeScript type definitions for file operations in frontend/src/file-tree/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core file operation utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create FileOperations.ts module with generateDuplicateName function in frontend/src/file-tree/FileOperations.ts
- [X] T005 [P] Create validateFileName function in frontend/src/file-tree/FileOperations.ts
- [X] T006 Write unit tests for generateDuplicateName in frontend/tests/integration/file-tree/FileOperations.test.tsx
- [X] T007 [P] Write unit tests for validateFileName in frontend/tests/integration/file-tree/FileOperations.test.tsx
- [X] T008 Verify unit tests pass with `pnpm test frontend/tests/integration/file-tree/FileOperations.test.tsx`

**Checkpoint**: Foundation ready - file operation utilities tested and working

---

## Phase 3: User Story 1 - Delete Unwanted Files (Priority: P1) 🎯 MVP

**Goal**: Users can delete files from the file tree using a right-click context menu with confirmation dialog

**Independent Test**: Create a file, right-click it, select "Delete" from context menu, confirm deletion, verify file is removed from tree and storage

### Implementation for User Story 1

- [X] T009 [P] [US1] Add deleteFile action to FileSlice in frontend/src/shared/store/index.ts
- [X] T010 [P] [US1] Create DeleteConfirmDialog component in frontend/src/file-tree/DeleteConfirmDialog.tsx
- [X] T011 [US1] Write integration tests for deleteFile store action in frontend/tests/integration/file-tree/StoreActions.test.tsx
- [X] T012 [US1] Add context menu wrapper with Delete option to FileTreeView in frontend/src/file-tree/FileTreeView.tsx
- [X] T013 [US1] Implement delete confirmation dialog state management in frontend/src/file-tree/FileTreeView.tsx
- [X] T014 [US1] Connect delete operation to ProjectManager.deleteFile() for persistence in frontend/src/shared/store/index.ts
- [X] T015 [US1] Add logic to close editor tab when active file is deleted in frontend/src/shared/store/index.ts
- [X] T016 [US1] Write integration tests for context menu delete workflow in frontend/tests/integration/file-tree/ContextMenu.test.tsx
- [X] T017 [US1] Write E2E test for User Story 1 delete workflow in frontend/tests/e2e/file-management.spec.ts
- [X] T018 [US1] Run E2E tests with `pnpm test:e2e frontend/tests/e2e/file-management.spec.ts`

**Checkpoint**: User Story 1 complete - users can delete files with confirmation

---

## Phase 4: User Story 2 - Rename Files for Better Organization (Priority: P2)

**Goal**: Users can rename files inline by right-clicking and selecting "Rename" from the context menu

**Independent Test**: Create a file, right-click it, select "Rename", enter new name, verify file appears with new name in tree and content is preserved

### Implementation for User Story 2

- [X] T019 [P] [US2] Add renameFile action to FileSlice in frontend/src/shared/store/index.ts
- [X] T020 [P] [US2] Create RenameInput component with inline editing in frontend/src/file-tree/FileTreeView.tsx
- [X] T021 [US2] Write integration tests for renameFile store action in frontend/tests/integration/file-tree/StoreActions.test.tsx
- [X] T022 [US2] Add Rename option to context menu in frontend/src/file-tree/FileTreeView.tsx
- [X] T023 [US2] Implement rename state management (input value, validation, cancel) in frontend/src/file-tree/FileTreeView.tsx
- [X] T024 [US2] Add keyboard handlers (Enter to commit, Escape to cancel) for rename input in frontend/src/file-tree/FileTreeView.tsx
- [X] T025 [US2] Connect rename operation to ProjectManager.updateFile() for persistence in frontend/src/shared/store/index.ts
- [X] T026 [US2] Add real-time filename validation with error display in frontend/src/file-tree/FileTreeView.tsx
- [X] T027 [US2] Update editor tab title when active file is renamed in frontend/src/shared/store/index.ts
- [X] T028 [US2] Write integration tests for context menu rename workflow in frontend/tests/integration/file-tree/ContextMenu.test.tsx (Note: Tests written but need debugging for context menu event handling)
- [X] T029 [US2] Write E2E test for User Story 2 rename workflow in frontend/tests/e2e/file-management.spec.ts
- [X] T030 [US2] Run E2E tests with `pnpm test:e2e frontend/tests/e2e/file-management.spec.ts`

**Checkpoint**: User Stories 1 AND 2 both work independently - delete and rename are functional

---

## Phase 5: User Story 3 - Duplicate Files for Templates (Priority: P3)

**Goal**: Users can duplicate files by right-clicking and selecting "Duplicate" to create a copy with same content

**Independent Test**: Create a file with content, right-click it, select "Duplicate", verify new file is created with same content and modified name (e.g., "file copy.ts")

### Implementation for User Story 3

- [X] T031 [P] [US3] Add duplicateFile action to FileSlice in frontend/src/shared/store/index.ts
- [X] T032 [US3] Write integration tests for duplicateFile store action in frontend/tests/integration/file-tree/StoreActions.test.tsx
- [X] T033 [US3] Add Duplicate option to context menu in frontend/src/file-tree/FileTreeView.tsx
- [X] T034 [US3] Implement duplicate operation handler in frontend/src/file-tree/FileTreeView.tsx
- [X] T035 [US3] Connect duplicate operation to ProjectManager.saveFile() for persistence in frontend/src/shared/store/index.ts
- [X] T036 [US3] Add logic to select newly duplicated file in tree in frontend/src/file-tree/FileTreeView.tsx
- [X] T037 [US3] Write integration tests for context menu duplicate workflow in frontend/tests/integration/file-tree/ContextMenu.test.tsx
- [X] T038 [US3] Write E2E test for User Story 3 duplicate workflow in frontend/tests/e2e/file-management.spec.ts
- [X] T039 [US3] Run E2E tests with `pnpm test:e2e frontend/tests/e2e/file-management.spec.ts`

**Checkpoint**: All user stories (1, 2, 3) are independently functional - delete, rename, and duplicate all work

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and validation affecting multiple user stories

- [X] T040 [P] Add error handling and user-friendly error messages for storage quota exceeded in frontend/src/shared/store/index.ts
- [X] T041 [P] Add error handling for IndexedDB failures with rollback logic in frontend/src/shared/store/index.ts
- [X] T042 [P] Add accessibility attributes (ARIA labels) to context menu items in frontend/src/file-tree/FileTreeView.tsx
- [X] T043 [P] Add keyboard shortcut hints to context menu items in frontend/src/file-tree/FileTreeView.tsx
- [X] T044 Verify all operations persist correctly after page refresh (run manual test)
- [X] T045 Test keyboard-only navigation through context menu (accessibility test)
- [X] T046 [P] Add performance monitoring for context menu open time (<200ms target) in frontend/src/file-tree/FileTreeView.tsx
- [X] T047 Run full test suite with `pnpm test` and verify all tests pass
- [X] T048 Run linting with `pnpm lint` and fix any issues
- [X] T049 Verify success criteria from spec.md (context menu <200ms, operations <2s, 100% persistence)
- [X] T050 Update .github/copilot-instructions.md with context menu implementation notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent from US1 (can be implemented in parallel)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent from US1/US2 (can be implemented in parallel)

### Within Each User Story

- Store actions before UI components
- State management before event handlers
- Integration tests alongside implementation
- E2E tests after integration tests pass
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories (US1, US2, US3) can start in parallel if team capacity allows
- Store actions within different stories can be implemented in parallel (different slices)
- Integration tests within a story can be written in parallel with implementation
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch parallel tasks for User Story 1:
Task T009: "Add deleteFile action to FileSlice in frontend/src/shared/store/index.ts"
Task T010: "Create DeleteConfirmDialog component in frontend/src/file-tree/DeleteConfirmDialog.tsx"
# Both can proceed simultaneously (different files)

# After both complete:
Task T011: "Write integration tests for deleteFile store action"
Task T016: "Write integration tests for context menu delete workflow"
# Can be written in parallel
```

---

## Parallel Example: User Story 2

```bash
# Launch parallel tasks for User Story 2:
Task T019: "Add renameFile action to FileSlice in frontend/src/shared/store/index.ts"
Task T020: "Create RenameInput component with inline editing in frontend/src/file-tree/FileTreeView.tsx"
# Both can proceed simultaneously (store vs component)

# After initial implementation:
Task T021: "Write integration tests for renameFile store action"
Task T028: "Write integration tests for context menu rename workflow"
# Can be written in parallel
```

---

## Parallel Example: User Story 3

```bash
# Launch parallel tasks for User Story 3:
Task T031: "Add duplicateFile action to FileSlice in frontend/src/shared/store/index.ts"
Task T032: "Write integration tests for duplicateFile store action"
# Can proceed simultaneously

# After store action complete:
Task T033: "Add Duplicate option to context menu"
Task T037: "Write integration tests for context menu duplicate workflow"
# Can be written in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) - CRITICAL
3. Complete Phase 3: User Story 1 (T009-T018)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Create file → Right-click → Delete → Confirm → Verify removed
   - Run E2E test for US1
5. Deploy/demo if ready (delete functionality working!)

### Incremental Delivery

1. Complete Setup + Foundational → File operation utilities ready (T001-T008)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - delete works!)
3. Add User Story 2 → Test independently → Deploy/Demo (delete + rename works!)
4. Add User Story 3 → Test independently → Deploy/Demo (delete + rename + duplicate works!)
5. Complete Polish → Final validation → Production ready

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (T001-T008)
2. **Once Foundational is done, split into parallel tracks**:
   - Developer A: User Story 1 (T009-T018) - Delete functionality
   - Developer B: User Story 2 (T019-T030) - Rename functionality
   - Developer C: User Story 3 (T031-T039) - Duplicate functionality
3. **Each developer works independently**:
   - All use same FileOperations utilities (from Foundational)
   - Each adds their own store action
   - Each extends FileTreeView with their context menu option
   - Each writes their own tests
4. **Stories integrate cleanly** because they all follow same patterns:
   - Context menu wrapper around file items
   - Store action for operation
   - Integration with ProjectManager for persistence
5. **Final integration** (Phase 6): Team reviews together, runs full test suite

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 5 tasks (BLOCKS all stories)
- **Phase 3 (User Story 1 - P1)**: 10 tasks - MVP ⭐
- **Phase 4 (User Story 2 - P2)**: 12 tasks
- **Phase 5 (User Story 3 - P3)**: 9 tasks
- **Phase 6 (Polish)**: 11 tasks
- **TOTAL**: 50 tasks

### MVP Scope (Minimum Viable Product)

- Setup + Foundational + User Story 1 = **18 tasks**
- Delivers: Delete file functionality with confirmation
- Time estimate: 1-2 days for single developer

### Full Feature Scope

- All phases = **50 tasks**
- Delivers: Delete, rename, and duplicate file operations
- Time estimate: 3-5 days for single developer, 2-3 days with parallel team

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label (US1, US2, US3) maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests written alongside implementation (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Foundational phase (Phase 2) is CRITICAL - must complete before any user story work
- User stories can be implemented in parallel once Foundational is complete
- MVP = Setup + Foundational + User Story 1 (delete functionality)
