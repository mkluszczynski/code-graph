````markdown
# Tasks: Add Files to Folders & Drag-and-Drop Organization

**Input**: Design documents from `/specs/007-file-folder-dnd/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓, contracts/ ✓

**Tests**: TDD approach - tests written before implementation per contract specifications.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add types and state management infrastructure needed by all user stories

- [ ] T001 Add DragState and DropTarget interfaces to `frontend/src/file-tree/types.ts`
- [ ] T002 Add MoveOperation, DropValidation, and DropErrorCode types to `frontend/src/shared/types/index.ts`
- [ ] T003 Add DragDropSlice to Zustand store in `frontend/src/shared/store/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and persistence methods that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### DragDropManager Contract Tests

- [ ] T004 [P] Create contract test file `frontend/tests/unit/file-tree/DragDropManager.test.ts` with CT-001 to CT-010 tests (all should fail initially)

### DragDropManager Implementation

- [ ] T005 Create `frontend/src/file-tree/DragDropManager.ts` with validateDrop, isAncestorOrSame, computeNewPath, isSameLocation methods
- [ ] T006 Verify all DragDropManager contract tests pass (CT-001 to CT-010)

### ProjectManager Move Operations Contract Tests

- [ ] T007 [P] Create contract test file `frontend/tests/unit/project-management/ProjectManagerMove.test.ts` with CT-011 to CT-022 tests (all should fail initially)

### ProjectManager Move Operations Implementation

- [ ] T008 Add nameExistsInFolder method to `frontend/src/project-management/ProjectManager.ts`
- [ ] T009 Add getItemNamesInFolder method to `frontend/src/project-management/ProjectManager.ts`
- [ ] T010 Add moveFile method to `frontend/src/project-management/ProjectManager.ts`
- [ ] T011 Add moveFolder method with atomic transaction to `frontend/src/project-management/ProjectManager.ts`
- [ ] T012 Verify all ProjectManager move contract tests pass (CT-011 to CT-022)

**Checkpoint**: Foundation ready - DragDropManager and ProjectManager move operations complete, all 22 contract tests passing

---

## Phase 3: User Story 1 - Create File Inside Folder via Context Menu (Priority: P1) 🎯 MVP

**Goal**: Users can right-click on a folder and create a new file directly inside it

**Independent Test**: Right-click folder → "Add File" → Enter filename → File created inside that folder with correct path

### Tests for User Story 1

- [ ] T013 [P] [US1] Create integration test file `frontend/tests/integration/file-tree/AddFileToFolder.test.tsx` with tests for:
  - Context menu shows "Add File" option on folder right-click
  - CreateDialog opens with folder path as parentPath
  - File created with correct nested path
  - Validation error shown for duplicate filename
  - Folder auto-expands after file creation

### Implementation for User Story 1

- [ ] T014 [US1] Add "Add File" context menu item to folder context menu in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T015 [US1] Add handleAddFileToFolder handler that opens CreateDialog with folder path in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T016 [US1] Update CreateDialog to accept and use parentPath prop for file creation in `frontend/src/components/CreateDialog.tsx` (if not already supported)
- [ ] T017 [US1] Add auto-expand folder after file creation in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T018 [US1] Verify all User Story 1 integration tests pass

**Checkpoint**: User Story 1 complete - users can add files to folders via context menu in <5s (SC-001)

---

## Phase 4: User Story 2 - Drag and Drop Files into Folders (Priority: P2)

**Goal**: Users can drag files and drop them into folders to reorganize

**Independent Test**: Drag file from root → Drop onto folder → File path updated and file appears inside folder

### Tests for User Story 2

- [ ] T019 [P] [US2] Create integration test file `frontend/tests/integration/file-tree/FileDragDrop.test.tsx` with tests for:
  - Drag start shows visual feedback (data-dragging attribute)
  - Drag over folder shows drop indicator (data-drop-target attribute)
  - Drop on valid folder updates file path
  - Drop on folder with duplicate name shows error
  - Escape key cancels drag operation
  - Auto-expand triggers after 500ms hover
  - Drop at root level moves file to root

### Implementation for User Story 2

- [ ] T020 [US2] Add startDrag and endDrag actions to DragDropSlice in `frontend/src/shared/store/index.ts`
- [ ] T021 [US2] Add setDropTarget action with validation to DragDropSlice in `frontend/src/shared/store/index.ts`
- [ ] T022 [US2] Add moveFile action to FileSlice that calls ProjectManager.moveFile in `frontend/src/shared/store/index.ts`
- [ ] T023 [US2] Add draggable attribute and onDragStart handler to file items in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T024 [US2] Add onDragEnd handler to clear drag state in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T025 [US2] Add onDragOver, onDragEnter, onDragLeave, onDrop handlers to folder items in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T026 [US2] Add drop target validation using DragDropManager in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T027 [US2] Add CSS classes for drag states (data-dragging, data-drop-target, data-drop-invalid) in `frontend/src/App.css`
- [ ] T028 [US2] Implement auto-expand on 500ms hover using setTimeout in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T029 [US2] Add Escape key handler to cancel drag operation in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T030 [US2] Verify all User Story 2 integration tests pass

**Checkpoint**: User Story 2 complete - files can be dragged and dropped into folders with <100ms visual feedback (SC-002, SC-003, SC-004)

---

## Phase 5: User Story 3 - Drag and Drop Folders into Other Folders (Priority: P3)

**Goal**: Users can drag folders (with all contents) into other folders to reorganize project structure

**Independent Test**: Drag folder with files → Drop onto another folder → Folder and all contents moved with paths updated correctly

### Tests for User Story 3

- [ ] T031 [P] [US3] Create integration test file `frontend/tests/integration/file-tree/FolderDragDrop.test.tsx` with tests for:
  - Drag start shows visual feedback on folder
  - Drop on valid folder moves folder and updates all paths
  - Drop on self returns circular_reference error
  - Drop on descendant folder returns circular_reference error
  - Drop on folder with duplicate name shows error
  - Active file reference updates when moved file's parent folder is moved
  - Nested folder structure preserved after move

### Implementation for User Story 3

- [ ] T032 [US3] Add moveFolder action to FileSlice that calls ProjectManager.moveFolder in `frontend/src/shared/store/index.ts`
- [ ] T033 [US3] Add draggable attribute and onDragStart handler to folder items in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T034 [US3] Update drop validation to handle folder-specific rules (circular reference) in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T035 [US3] Update onDrop handler to detect item type and call appropriate move action in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T036 [US3] Add active file reference update after folder move in `frontend/src/shared/store/index.ts`
- [ ] T037 [US3] Verify all User Story 3 integration tests pass

**Checkpoint**: User Story 3 complete - folders can be reorganized with all contents preserved (SC-005, SC-006, SC-008)

---

## Phase 6: E2E Testing & Edge Cases

**Purpose**: Full workflow validation and edge case handling

- [ ] T038 [P] Create E2E test file `frontend/tests/e2e/file-folder-dnd.spec.ts` with tests for:
  - User Story 1 complete workflow: Add file to folder
  - User Story 2 complete workflow: Drag file to folder
  - User Story 3 complete workflow: Drag folder to folder
  - Drag outside file tree panel cancels operation
  - Rapid drag operations don't cause race conditions
  - Drop while folder is in rename mode completes correctly
  - IndexedDB failure shows error and rolls back
  - Moving currently open file keeps editor working (SC-009)
  - 3-level folder reorganization completes in <30s (SC-010)
- [ ] T039 Run all E2E tests and verify passing

**Checkpoint**: All user stories validated with E2E tests

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Add ARIA attributes (aria-grabbed, role="treeitem") to draggable items in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T041 [P] Add performance monitoring for drag feedback (<100ms) and move operations (<1s files, <3s folders) in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T042 [P] Add JSDoc comments to DragDropManager methods in `frontend/src/file-tree/DragDropManager.ts`
- [ ] T043 [P] Add JSDoc comments to ProjectManager move methods in `frontend/src/project-management/ProjectManager.ts`
- [ ] T044 [P] Update user-guide.md with drag-and-drop instructions in `frontend/docs/user-guide.md`
- [ ] T045 Verify no functions exceed 50 lines (constitution check)
- [ ] T046 Verify DragDropManager.ts under 300 lines (constitution check)
- [ ] T047 Remove any debug console.log statements
- [ ] T048 Update `.github/copilot-instructions.md` with feature completion status
- [ ] T049 Run full test suite and verify all tests pass
- [ ] T050 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (P1) → US2 (P2) → US3 (P3) in priority order
  - Or can run in parallel with multiple developers
- **E2E Testing (Phase 6)**: Depends on all user stories being complete
- **Polish (Phase 7)**: Depends on E2E tests passing

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Reuses patterns from US2 but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Store actions before UI handlers
- UI handlers before visual feedback
- Core implementation before polish
- Story complete before moving to next priority

### Parallel Opportunities

- T004 and T007 can run in parallel (test files for different modules)
- T013, T019, T031 can run in parallel (test files for different stories)
- All tasks marked [P] can run in parallel within their phase
- T040-T044 can all run in parallel (different files, documentation)

---

## Parallel Example: Foundational Phase

```bash
# Launch all contract tests in parallel:
Task T004: "Create DragDropManager contract tests"
Task T007: "Create ProjectManager move contract tests"

# After tests written, implement in sequence:
Task T005: "Create DragDropManager implementation"
Task T006: "Verify DragDropManager tests pass"
Task T008-T011: "Add ProjectManager methods"
Task T012: "Verify ProjectManager tests pass"
```

## Parallel Example: All User Story Tests

```bash
# Once Foundational is complete, launch all story tests in parallel:
Task T013: "Create AddFileToFolder integration tests"
Task T019: "Create FileDragDrop integration tests"
Task T031: "Create FolderDragDrop integration tests"

# Then implement stories sequentially by priority:
Tasks T014-T018: "User Story 1 implementation"
Tasks T020-T030: "User Story 2 implementation"
Tasks T032-T037: "User Story 3 implementation"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T012) - 22 contract tests passing
3. Complete Phase 3: User Story 1 (T013-T018)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - users can add files to folders

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (file DnD)
4. Add User Story 3 → Test independently → Deploy/Demo (folder DnD)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (simplest, quickest to deliver)
   - Developer B: User Story 2 (after A finishes or in parallel)
   - Developer C: User Story 3 (can reuse patterns from US2)
3. Stories complete and integrate independently

---

## Summary

| Phase | Task Count | Focus |
|-------|-----------|-------|
| Setup | 3 | Types and state infrastructure |
| Foundational | 9 | DragDropManager + ProjectManager move operations |
| User Story 1 (P1) | 6 | Add File to folder via context menu |
| User Story 2 (P2) | 12 | Drag-and-drop files |
| User Story 3 (P3) | 7 | Drag-and-drop folders |
| E2E Testing | 2 | Full workflow validation |
| Polish | 11 | Accessibility, docs, constitution check |

**Total**: 50 tasks

### Test Coverage

| Layer | Count | Focus |
|-------|-------|-------|
| Contract (Unit) | 22 | DragDropManager (10), ProjectManager (12) |
| Integration | ~19 | FileTreeView with store (per story) |
| E2E | ~10 | Full user workflows |

### Success Criteria Mapping

| Criteria | User Story | Validation |
|----------|-----------|------------|
| SC-001 | US1 | File creation in <5s |
| SC-002 | US2 | Drag feedback in <100ms |
| SC-003 | US2 | Drop indicator in <50ms |
| SC-004 | US2 | File move in <1s |
| SC-005 | US3 | Folder move in <3s (50 files) |
| SC-006 | US3 | 100% persistence with rollback |
| SC-007 | US2/US3 | Auto-expand at 500ms ±100ms |
| SC-008 | US3 | Zero data loss |
| SC-009 | US3 | Active file accessible after move |
| SC-010 | US3 | 3-level reorganization in <30s |

````
