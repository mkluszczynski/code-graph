# Tasks: Persist Code Changes Between Sessions

**Feature**: 002 - Persist Code Changes Between Sessions  
**Branch**: `002-persist-code-changes`  
**Input**: Design documents from `/specs/002-persist-code-changes/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **Checkbox**: `- [ ]` (markdown checkbox)
- **[ID]**: Sequential task ID (T001, T002, T003...)
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `frontend/src/`, `frontend/tests/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add persistence-specific types and constants to existing codebase

- [X] T001 [P] Add StorageMetadata type to frontend/src/shared/types/index.ts
- [X] T002 [P] Add QuotaExceededError and StorageUnavailableError to frontend/src/shared/types/errors.ts
- [X] T003 [P] Add AUTO_SAVE_DEBOUNCE_MS (500), STORAGE_WARNING_THRESHOLD (90), STORAGE_ERROR_THRESHOLD (95) constants to frontend/src/shared/constants.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create PersistenceSlice in frontend/src/shared/store/index.ts with state (lastSavedTimestamp, isSaving, saveError, autoSaveEnabled, pendingSaves, storageMetadata) and actions (setSaving, setSaveError, setLastSaved, addPendingSave, removePendingSave, setAutoSaveEnabled, updateStorageMetadata)
- [X] T005 Create PersistenceController class in frontend/src/project-management/PersistenceController.ts with constructor, private properties (projectManager, broadcastChannel, debounceTimers), and method stubs
- [X] T006 [P] Implement testStorageAvailability() method in frontend/src/project-management/PersistenceController.ts
- [X] T007 [P] Implement checkStorageQuota() method in frontend/src/project-management/PersistenceController.ts
- [X] T008 Implement setupBroadcastChannel() private method in frontend/src/project-management/PersistenceController.ts for multi-tab detection
- [X] T009 Create PersistenceControllerContext in frontend/src/project-management/PersistenceControllerContext.tsx for React context
- [X] T010 Create usePersistenceController() hook in frontend/src/project-management/usePersistenceController.ts to access context

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Edit and Persist Code Changes (Priority: P1) 🎯 MVP

**Goal**: Users can edit code in the Monaco editor and have changes automatically saved to IndexedDB, surviving browser refresh and tab closure.

**Independent Test**: Edit any TypeScript file, type some code, wait 1 second, refresh browser, verify edits remain visible.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Create unit test for persistence slice state updates in frontend/tests/unit/persistence-slice.test.ts (test setSaving, setSaveError, setLastSaved, addPendingSave, removePendingSave)
- [ ] T012 [P] [US1] Create unit test for debounce logic in frontend/tests/unit/debounce-auto-save.test.ts (test rapid edits batch into single save after 500ms)
- [ ] T013 [P] [US1] Create contract test for PersistenceController.debouncedSaveFile() in frontend/tests/unit/persistence-controller.contract.test.ts
- [ ] T014 [P] [US1] Create contract test for PersistenceController.saveFile() in frontend/tests/unit/persistence-controller.contract.test.ts
- [ ] T015 [P] [US1] Create integration test for editor typing → auto-save workflow in frontend/tests/integration/auto-save.test.ts
- [ ] T016 [P] [US1] Create e2e test for full persistence workflow (edit, refresh, verify) in frontend/tests/e2e/persistence.spec.ts

### Implementation for User Story 1

- [X] T017 [US1] Implement debouncedSaveFile() method in frontend/src/project-management/PersistenceController.ts (add to pendingSaves, clear existing timer, set new 500ms timer)
- [X] T018 [US1] Implement saveFile() method in frontend/src/project-management/PersistenceController.ts (check storage availability, call ProjectManager.updateFile(), update store state, notify other tabs via BroadcastChannel)
- [X] T019 [US1] Implement restorePersistedState() method in frontend/src/project-management/PersistenceController.ts (load file tree from IndexedDB, restore last active file from localStorage)
- [X] T020 [US1] Implement initialize() method in frontend/src/project-management/PersistenceController.ts (test storage availability, check quota, restore persisted state, update store)
- [X] T021 [US1] Implement cleanup() method in frontend/src/project-management/PersistenceController.ts (close BroadcastChannel, clear all debounce timers)
- [X] T022 [US1] Modify useEditorController hook in frontend/src/code-editor/useEditorController.ts to call persistenceController.debouncedSaveFile() on handleEditorChange when content is dirty
- [X] T023 [US1] Initialize PersistenceController in frontend/src/App.tsx useEffect (create instance, call initialize(), provide via context, cleanup on unmount)
- [X] T024 [US1] Add lastActiveFileId persistence to localStorage in frontend/src/code-editor/useEditorController.ts when activeFile changes

**Checkpoint**: At this point, User Story 1 should be fully functional - code edits persist across browser refresh

---

## Phase 4: User Story 2 - Recover from Browser Crashes (Priority: P2)

**Goal**: Users who experience browser crashes can recover their most recent code changes when reopening the application.

**Independent Test**: Make edits, force-close browser (kill process), reopen application, verify recent changes are recovered.

### Tests for User Story 2

- [ ] T025 [P] [US2] Create integration test for state restoration on page load in frontend/tests/integration/restore-state.test.ts (simulate refresh, verify files and content restored)
- [ ] T026 [P] [US2] Create e2e test for crash recovery in frontend/tests/e2e/crash-recovery.spec.ts (use Playwright to close and reopen browser, verify recovery)

### Implementation for User Story 2

- [X] T027 [US2] Ensure ProjectManager.updateFile() in frontend/src/project-management/ProjectManager.ts updates lastModified timestamp on every save (verify existing implementation)
- [X] T028 [US2] Add error boundary to frontend/src/App.tsx to prevent crashes from breaking persistence (optional but recommended) - ErrorBoundary already exists
- [X] T029 [US2] Add beforeunload event listener to log save status in frontend/src/App.tsx for debugging crash scenarios

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - crash recovery is functional

---

## Phase 5: User Story 3 - Clear Understanding of Save State (Priority: P3)

**Goal**: Users can see visual feedback about whether their changes are being saved, have been saved, or failed to save.

**Independent Test**: Edit code and observe save indicators - should show "Saving..." during save, "Saved X seconds ago" after success, or error message on failure.

### Tests for User Story 3

- [ ] T030 [P] [US3] Create unit test for SaveIndicator component in frontend/tests/unit/SaveIndicator.test.ts (test different states: saving, saved, error)
- [ ] T031 [P] [US3] Create integration test for save state visibility in frontend/tests/integration/save-state-ui.test.ts (verify indicators update during save workflow)

### Implementation for User Story 3

- [X] T032 [P] [US3] Create SaveIndicator component in frontend/src/components/SaveIndicator.tsx (displays isSaving, lastSavedTimestamp, saveError from store)
- [X] T033 [US3] Create StorageWarningBanner component in frontend/src/components/StorageWarningBanner.tsx (displays warnings for quota exceeded, storage unavailable, multiple tabs)
- [X] T034 [US3] Add SaveIndicator to CodeEditor layout in frontend/src/code-editor/CodeEditor.tsx (top-right corner or status bar)
- [X] T035 [US3] Add StorageWarningBanner to App layout in frontend/src/App.tsx (top of page, dismissible)

**Checkpoint**: All user stories should now be independently functional - complete save state visibility

---

## Phase 6: Edge Cases & Error Handling

**Purpose**: Handle edge cases defined in spec.md and ensure graceful degradation

### Tests for Edge Cases

- [ ] T036 [P] Create unit test for quota exceeded handling in frontend/tests/unit/quota-check.test.ts (mock QuotaExceededError, verify graceful degradation)
- [ ] T037 [P] Create unit test for storage unavailable handling in frontend/tests/unit/storage-unavailable.test.ts (mock IndexedDB failure, verify in-memory fallback)
- [ ] T038 [P] Create integration test for multi-tab conflict in frontend/tests/integration/multi-tab.test.ts (simulate two tabs, verify warning shown)

### Implementation for Edge Cases

- [X] T039 [P] Add quota exceeded error handling in PersistenceController.saveFile() in frontend/src/project-management/PersistenceController.ts (catch QuotaExceededError, set user-friendly error message, disable auto-save)
- [X] T040 [P] Add storage unavailable fallback in PersistenceController.initialize() in frontend/src/project-management/PersistenceController.ts (if testStorageAvailability() fails, set autoSaveEnabled=false, show banner)
- [X] T041 Add multi-tab conflict detection in PersistenceController.setupBroadcastChannel() in frontend/src/project-management/PersistenceController.ts (listen for TAB_ANNOUNCE messages, set hasMultipleTabs=true, show warning)
- [X] T042 Add FILE_UPDATED message handler in PersistenceController.setupBroadcastChannel() in frontend/src/project-management/PersistenceController.ts (reload file if not currently editing, show warning if editing)

**Checkpoint**: Edge cases handled gracefully - no data loss or crashes

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T043 [P] Add JSDoc comments to all PersistenceController methods in frontend/src/project-management/PersistenceController.ts
- [X] T044 [P] Add JSDoc comments to PersistenceSlice actions in frontend/src/shared/store/index.ts
- [ ] T045 Update user guide documentation in frontend/docs/user-guide.md to explain auto-save behavior and edge cases
- [ ] T046 Create quickstart validation script in specs/002-persist-code-changes/quickstart.md to verify all acceptance scenarios
- [ ] T047 Run full test suite (unit + integration + e2e) and verify >80% coverage for persistence code
- [X] T048 Verify all constitutional gates pass (functions <50 lines, files <300 lines, feature-driven structure, user-friendly errors)
- [ ] T049 Manual testing: Follow all quickstart scenarios in specs/002-persist-code-changes/quickstart.md
- [X] T050 Code review: Ensure no code duplication between PersistenceController and ProjectManager

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) and User Story 1 (Phase 3) completion
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) and User Story 1 (Phase 3) completion
- **Edge Cases (Phase 6)**: Depends on User Story 1 (Phase 3) completion
- **Polish (Phase 7)**: Depends on all user stories and edge cases completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ INDEPENDENT
- **User Story 2 (P2)**: Requires User Story 1 saveFile() implementation, but adds crash recovery logic ✅ MOSTLY INDEPENDENT
- **User Story 3 (P3)**: Requires User Story 1 store state, but only adds UI components ✅ INDEPENDENT

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. PersistenceSlice and PersistenceController foundation before integration
3. Core save/restore logic before UI indicators
4. Story complete and tested before moving to next priority

### Parallel Opportunities

**Within Phase 1 (Setup)**: All 3 tasks (T001, T002, T003) can run in parallel

**Within Phase 2 (Foundational)**: T006 and T007 can run in parallel (both are PersistenceController methods with no dependencies)

**Within User Story 1 Tests**: Tasks T011-T016 can all run in parallel (different test files)

**Within User Story 3 Implementation**: Tasks T032 and T033 can run in parallel (different components)

**Within Edge Cases Tests**: Tasks T036, T037, T038 can all run in parallel (different test files)

**Within Edge Cases Implementation**: Tasks T039 and T040 can run in parallel (different error handling paths)

**Within Polish Phase**: Tasks T043, T044, T045, T046 can run in parallel (different files)

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all tests for User Story 1 together:
Task: "[US1] Create unit test for persistence slice state updates in frontend/tests/unit/persistence-slice.test.ts"
Task: "[US1] Create unit test for debounce logic in frontend/tests/unit/debounce-auto-save.test.ts"
Task: "[US1] Create contract test for PersistenceController.debouncedSaveFile() in frontend/tests/unit/persistence-controller.contract.test.ts"
Task: "[US1] Create contract test for PersistenceController.saveFile() in frontend/tests/unit/persistence-controller.contract.test.ts"
Task: "[US1] Create integration test for editor typing → auto-save workflow in frontend/tests/integration/auto-save.test.ts"
Task: "[US1] Create e2e test for full persistence workflow (edit, refresh, verify) in frontend/tests/e2e/persistence.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types and constants)
2. Complete Phase 2: Foundational (PersistenceController infrastructure) ⚠️ BLOCKS all stories
3. Complete Phase 3: User Story 1 (auto-save + restore)
4. **STOP and VALIDATE**: Test User Story 1 independently using quickstart scenarios
5. Deploy/demo if ready - users can now persist code changes!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! - Auto-save works)
3. Add User Story 2 → Test independently → Deploy/Demo (Crash recovery works)
4. Add User Story 3 → Test independently → Deploy/Demo (Save indicators visible)
5. Add Edge Cases → Test all edge cases → Deploy/Demo (Graceful degradation)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T010)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (P1) - Core persistence (T011-T024)
   - **Developer B**: User Story 3 (P3) - UI indicators (T030-T035) - can start in parallel with US1 implementation
   - **Developer C**: Edge Cases (T036-T042) - can start after US1 core save logic is done
3. Developer A finishes US1 → moves to US2 (T025-T029)
4. Stories complete and integrate independently

---

## Summary

- **Total Tasks**: 50 tasks
- **Parallelizable Tasks**: 22 tasks marked [P]
- **User Stories**: 3 (P1: Edit persistence, P2: Crash recovery, P3: Save state visibility)
- **MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 24 tasks
- **Independent Test Criteria**: 
  - US1: Edit file, refresh, verify edits remain
  - US2: Edit file, force-close browser, reopen, verify recovery
  - US3: Edit file, observe save indicators during save workflow

**Success Criteria Mapping**:
- SC-001 (100% retention after refresh) → User Story 1
- SC-002 (auto-save within 1 second) → User Story 1 (500ms debounce)
- SC-003 (restore in <2 seconds) → User Story 1 + User Story 2
- SC-004 (zero data loss) → User Story 1 + User Story 2 + Edge Cases
- SC-005 (50 modified files) → Edge Cases (quota checking)
- SC-006 (graceful error handling) → Edge Cases (storage unavailable, quota exceeded)

**Format Validation**: ✅ All tasks follow the checklist format:
- `- [ ]` checkbox
- `[TaskID]` (T001-T050)
- `[P]` marker for parallelizable tasks
- `[Story]` label for user story tasks (US1, US2, US3)
- Clear description with exact file path

---

## Notes

- **Tests are INCLUDED**: All test tasks are included because TDD approach is specified in plan.md ("Test-First Gate")
- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests FAIL before implementing (TDD workflow)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution compliant: Functions <50 lines, files <300 lines, feature-driven structure, user-friendly errors
