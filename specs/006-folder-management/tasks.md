# Tasks: File and Folder Management with Improved UX

**Input**: Design documents from `/specs/006-folder-management/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD approach - tests written before implementation per project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend web app**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, types, and foundational utilities

- [x] T001 Add `CreateItemType` type to `frontend/src/file-tree/types.ts`
- [x] T002 Add `FolderOperationResult` interface to `frontend/src/file-tree/types.ts`
- [x] T003 Add `parentPath` field to `ProjectFile` interface in `frontend/src/shared/types/index.ts`
- [x] T004 [P] Create `FolderOperations.ts` file with type exports in `frontend/src/file-tree/FolderOperations.ts`
- [x] T005 [P] Add `by-parent-path` index to IndexedDB schema in `frontend/src/project-management/ProjectManager.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and validation functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement `validateItemName()` function for files and folders in `frontend/src/file-tree/FileOperations.ts`
- [x] T007 [P] Implement `getFilesInFolder()` utility function in `frontend/src/file-tree/FolderOperations.ts`
- [x] T008 [P] Implement `validateFolderDepth()` utility function in `frontend/src/file-tree/FolderOperations.ts`
- [x] T009 [P] Implement `getParentPath()` utility function in `frontend/src/file-tree/FolderOperations.ts`
- [x] T010 [P] Implement `updatePathForRename()` utility function in `frontend/src/file-tree/FolderOperations.ts`
- [x] T011 [P] Implement `generateDuplicateFolderName()` utility function in `frontend/src/file-tree/FolderOperations.ts`
- [x] T012 Implement `normalizeFileName()` function (add .ts extension if missing) in `frontend/src/file-tree/FileOperations.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Simplified File Creation (Priority: P1) 🎯 MVP

**Goal**: Users can create empty files without template selection, using a dialog with inline validation

**Independent Test**: Click "Add File" button → Enter filename in dialog → Verify empty file created in tree

### Tests for User Story 1 (TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T013 [P] [US1] Contract tests for CreateDialog file creation in `frontend/tests/unit/components/CreateDialog.test.tsx`
- [x] T014 [P] [US1] Unit tests for file name validation in `frontend/tests/unit/file-tree/FileOperations.test.ts`
- [x] T015 [P] [US1] Integration tests for file creation workflow in `frontend/tests/integration/folder-management/CreateFile.test.tsx`

### Implementation for User Story 1

- [x] T016 [US1] Create `CreateDialog.tsx` component with file creation mode in `frontend/src/components/CreateDialog.tsx`
- [x] T017 [US1] Implement dialog state management (open, name, error, isSubmitting) in `frontend/src/components/CreateDialog.tsx`
- [x] T018 [US1] Implement inline validation (empty, invalid chars, duplicate) in `frontend/src/components/CreateDialog.tsx`
- [x] T019 [US1] Implement keyboard navigation (Enter to submit, Escape to cancel) in `frontend/src/components/CreateDialog.tsx`
- [x] T020 [US1] Add auto-focus on input when dialog opens in `frontend/src/components/CreateDialog.tsx`
- [x] T021 [US1] Implement `createEmptyFile()` action in Zustand FileSlice in `frontend/src/shared/store/index.ts`
- [x] T022 [US1] Implement `ProjectManager.createEmptyFile()` method in `frontend/src/project-management/ProjectManager.ts`
- [x] T023 [US1] Modify `AddButton.tsx` to change menu from "New Class/New Interface" to "Add File/Add Folder" in `frontend/src/components/AddButton.tsx`
- [x] T024 [US1] Update `AddButton` props interface (remove `onCreateClass`, `onCreateInterface`, add `onAddFile`, `onAddFolder`) in `frontend/src/components/AddButton.tsx`
- [x] T025 [US1] Integrate CreateDialog with FileTreePanel for file creation in `frontend/src/components/FileTreePanel.tsx`
- [x] T026 [US1] Add accessibility attributes (aria-invalid, aria-describedby, role="alert") in `frontend/src/components/CreateDialog.tsx`

**Checkpoint**: User Story 1 complete - Users can create empty files via dialog ✅

---

## Phase 4: User Story 2 - Create and Delete Folders (Priority: P2)

**Goal**: Users can create custom folder structures and delete folders (with recursive content deletion)

**Independent Test**: Click "Add Folder" → Enter name → Verify folder in tree → Right-click → Delete → Confirm

### Tests for User Story 2 (TDD) ⚠️

- [x] T027 [P] [US2] Unit tests for folder utility functions in `frontend/tests/unit/file-tree/FolderOperations.test.ts`
- [x] T028 [P] [US2] Integration tests for folder creation workflow in `frontend/tests/integration/folder-management/CreateFolder.test.tsx`
- [x] T029 [P] [US2] Integration tests for folder deletion workflow in `frontend/tests/integration/folder-management/DeleteFolder.test.tsx`

### Implementation for User Story 2

- [x] T030 [US2] Add folder creation mode to CreateDialog component in `frontend/src/components/CreateDialog.tsx`
- [x] T031 [US2] Implement `createFolder()` action in Zustand FileSlice in `frontend/src/shared/store/index.ts`
- [x] T032 [US2] Implement `deleteFolder()` action with optimistic update and rollback in `frontend/src/shared/store/index.ts`
- [x] T033 [US2] Implement `ProjectManager.deleteFolderContents()` method with single transaction in `frontend/src/project-management/ProjectManager.ts`
- [x] T034 [US2] Add folder context menu with "Delete" option to `FileTreeView.tsx` in `frontend/src/file-tree/FileTreeView.tsx`
- [x] T035 [US2] Create folder-specific `DeleteConfirmDialog` variant showing content count in `frontend/src/file-tree/DeleteConfirmDialog.tsx`
- [x] T036 [US2] Handle active file deletion (close editor, clear diagram) in `frontend/src/shared/store/index.ts`
- [x] T037 [US2] Integrate CreateDialog with FileTreePanel for folder creation in `frontend/src/components/FileTreePanel.tsx`

**Checkpoint**: User Stories 1 AND 2 complete - Users can create files/folders and delete folders

---

## Phase 5: User Story 3 - Rename and Duplicate Folders (Priority: P3)

**Goal**: Users can rename and duplicate folders with recursive path updates for all contained files

**Independent Test**: Right-click folder → Rename → Verify all file paths updated → Duplicate → Verify copy created

### Tests for User Story 3 (TDD) ⚠️

- [x] T038 [P] [US3] Integration tests for folder rename workflow in `frontend/tests/integration/folder-management/RenameFolder.test.tsx`
- [x] T039 [P] [US3] Integration tests for folder duplicate workflow in `frontend/tests/integration/folder-management/DuplicateFolder.test.tsx`

### Implementation for User Story 3

- [x] T040 [US3] Implement `renameFolder()` action with optimistic update in `frontend/src/shared/store/index.ts`
- [x] T041 [US3] Implement `ProjectManager.updateFolderPaths()` method with single transaction in `frontend/src/project-management/ProjectManager.ts`
- [x] T042 [US3] Add "Rename" option to folder context menu in `frontend/src/file-tree/FileTreeView.tsx`
- [x] T043 [US3] Implement inline folder rename editing (reuse file rename pattern) in `frontend/src/file-tree/FileTreeView.tsx`
- [x] T044 [US3] Handle active file path update when parent folder is renamed in `frontend/src/shared/store/index.ts`
- [x] T045 [US3] Implement `duplicateFolder()` action in Zustand FileSlice in `frontend/src/shared/store/index.ts`
- [x] T046 [US3] Implement `ProjectManager.duplicateFolderContents()` method with single transaction in `frontend/src/project-management/ProjectManager.ts`
- [x] T047 [US3] Add "Duplicate" option to folder context menu in `frontend/src/file-tree/FileTreeView.tsx`

**Checkpoint**: User Stories 1, 2, AND 3 complete - Full folder management functionality ✅

---

## Phase 6: User Story 4 - Improved Dialog UX (Priority: P4)

**Goal**: Polish dialog experience with shadcn styling, loading states, and refined accessibility

**Independent Test**: Trigger any dialog → Verify shadcn styling, keyboard nav, accessibility announcements

### Tests for User Story 4 (TDD) ⚠️

- [x] T048 [P] [US4] Accessibility tests for CreateDialog in `frontend/tests/unit/components/CreateDialog.test.tsx`
- [x] T049 [P] [US4] Unit tests for loading state and keyboard navigation in `frontend/tests/unit/components/CreateDialog.test.tsx`

### Implementation for User Story 4

- [x] T050 [US4] Add loading indicator for operations >500ms in `frontend/src/components/CreateDialog.tsx`
- [x] T051 [US4] Add loading indicator for folder operations >500ms in `frontend/src/file-tree/FileTreeView.tsx`
- [x] T052 [US4] Ensure focus trap during submission (prevent Escape) in `frontend/src/components/CreateDialog.tsx`
- [x] T053 [US4] Add screen reader announcements for dialog title/description in `frontend/src/components/CreateDialog.tsx`
- [x] T054 [US4] Polish dialog styling consistency with existing shadcn components in `frontend/src/components/CreateDialog.tsx`

**Checkpoint**: All user stories complete with polished UX

---

## Phase 7: E2E Testing & Validation ✅

**Purpose**: End-to-end testing of complete user workflows

- [x] T055 [P] Create E2E test file structure in `frontend/tests/e2e/folder-management.spec.ts`
- [x] T056 [P] E2E test: Create file via dialog workflow in `frontend/tests/e2e/folder-management.spec.ts`
- [x] T057 [P] E2E test: Create folder via dialog workflow in `frontend/tests/e2e/folder-management.spec.ts`
- [x] T058 [P] E2E test: Delete folder with contents workflow in `frontend/tests/e2e/folder-management.spec.ts`
- [x] T059 [P] E2E test: Rename folder and verify path updates in `frontend/tests/e2e/folder-management.spec.ts`
- [x] T060 [P] E2E test: Duplicate folder workflow in `frontend/tests/e2e/folder-management.spec.ts`
- [x] T061 E2E test: Keyboard navigation through all dialogs in `frontend/tests/e2e/folder-management.spec.ts`

---

## Phase 8: Polish & Cross-Cutting Concerns ✅

**Purpose**: Documentation, cleanup, and final validation

- [x] T062 [P] Update user documentation in `frontend/docs/user-guide.md`
- [x] T063 [P] Add JSDoc comments to FolderOperations.ts functions in `frontend/src/file-tree/FolderOperations.ts`
- [x] T064 [P] Add JSDoc comments to CreateDialog component in `frontend/src/components/CreateDialog.tsx`
- [x] T065 Verify all functions under 50 lines (constitution check)
- [x] T066 Verify all files under 300 lines (constitution check) - exceptions documented
- [x] T067 Remove any debug logging from implementation files
- [x] T068 Update `.github/copilot-instructions.md` with feature completion status
- [x] T069 Run `quickstart.md` validation checklist
- [x] T070 Run full test suite and verify >80% coverage for new code
- [x] T071 Final performance validation (SC-001 through SC-011)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories should proceed in priority order (P1 → P2 → P3 → P4)
  - Each story delivers working functionality before next begins
- **E2E Testing (Phase 7)**: Depends on User Stories 1-4 completion
- **Polish (Phase 8)**: Depends on all user stories and E2E testing

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ MVP
- **User Story 2 (P2)**: Can start after US1 - Extends CreateDialog and context menu
- **User Story 3 (P3)**: Can start after US2 - Adds rename/duplicate to folder context menu
- **User Story 4 (P4)**: Can start after US1 - Polishes dialog UX (can run in parallel with US2/US3)

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Utility functions before store actions
3. Store actions before UI components
4. Core implementation before integration
5. Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
- T004, T005 can run in parallel

**Phase 2 (Foundational)**:
- T007, T008, T009, T010, T011 can run in parallel

**Phase 3 (US1 Tests)**:
- T013, T014, T015 can run in parallel

**Phase 4 (US2 Tests)**:
- T027, T028, T029 can run in parallel

**Phase 5 (US3 Tests)**:
- T038, T039 can run in parallel

**Phase 6 (US4 Tests)**:
- T048, T049 can run in parallel

**Phase 7 (E2E)**:
- T055, T056, T057, T058, T059, T060 can run in parallel

**Phase 8 (Polish)**:
- T062, T063, T064 can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all parallelizable foundational tasks together:
Task: T007 "Implement getFilesInFolder() in FolderOperations.ts"
Task: T008 "Implement validateFolderDepth() in FolderOperations.ts"  
Task: T009 "Implement getParentPath() in FolderOperations.ts"
Task: T010 "Implement updatePathForRename() in FolderOperations.ts"
Task: T011 "Implement generateDuplicateFolderName() in FolderOperations.ts"
```

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all US1 tests together (they should FAIL initially):
Task: T013 "Contract tests for CreateDialog file creation"
Task: T014 "Unit tests for file name validation"
Task: T015 "Integration tests for file creation workflow"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T012)
3. Complete Phase 3: User Story 1 (T013-T026)
4. **STOP and VALIDATE**: Test file creation end-to-end
5. Deploy/demo if ready - users can create empty files!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → Deploy (MVP: Simple file creation)
3. Add User Story 2 → Test → Deploy (Adds: Folder create/delete)
4. Add User Story 3 → Test → Deploy (Adds: Folder rename/duplicate)
5. Add User Story 4 → Test → Deploy (Adds: Polished UX)
6. E2E + Polish → Final release

### Success Criteria Mapping

| Criterion | Task(s) | Story |
|-----------|---------|-------|
| SC-001: File creation <5s | T022, T025 | US1 |
| SC-002: Folder creation <5s | T031, T037 | US2 |
| SC-003: Validation <200ms | T017, T018 | US1, US4 |
| SC-004: 10 levels deep | T008 | Foundation |
| SC-005: Delete <3s (50 files) | T033 | US2 |
| SC-006: Rename <2s (50 files) | T041 | US3 |
| SC-007: 100% persistence | T022, T033, T041, T046 | All |
| SC-008: Keyboard nav | T019, T061 | US1, US4 |
| SC-009: Duplicate <5s (20 files) | T046 | US3 |
| SC-010: No data corruption | T036, T044 | US2, US3 |
| SC-011: First folder success | E2E tests | All |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD: Verify tests fail before implementing
- Commit after each task or logical group
- Store file (index.ts) exceeds 300 lines - documented justification in plan.md
- Folders are virtual in IndexedDB - only files are stored

