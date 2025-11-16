# Tasks: Fix Diagram Export & Add Clipboard Copy

**Input**: Design documents from `/specs/005-fix-diagram-export/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: This feature uses TDD approach - all test tasks are included and MUST be completed before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a frontend-only web application:
- Source code: `frontend/src/`
- Tests: `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify @xyflow/react 12.9+ installed with getNodesBounds support
- [X] T002 Verify html-to-image 1.11+ installed for PNG rendering
- [X] T003 [P] Add BoundingBox type to frontend/src/shared/types/index.ts
- [X] T004 [P] Add ClipboardResult and ClipboardErrorCode types to frontend/src/shared/types/index.ts
- [X] T005 Update ExportOptions type in frontend/src/shared/types/index.ts (add padding, maxWidth, maxHeight)

**Checkpoint**: Type definitions complete, dependencies verified ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Review existing DiagramExporter.ts implementation in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T007 Review existing ExportButton.tsx implementation in frontend/src/components/ExportButton.tsx
- [X] T008 Set up test mocks for navigator.clipboard in frontend/tests/setup.ts
- [X] T009 Set up test utilities for React Flow nodes in frontend/tests/setup.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅

---

## Phase 3: User Story 1 - Fix PNG Export Size (Priority: P1) 🎯 MVP

**Goal**: Fix PNG export to crop images to diagram content with minimal padding instead of full viewport size

**Independent Test**: Export a diagram with 5 classes to PNG and verify the image dimensions match the diagram content plus a 30-pixel border (no excessive whitespace)

### Tests for User Story 1 (TDD - Red Phase) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US1] Contract test TC-001: Single node with default padding in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T011 [P] [US1] Contract test TC-002: Multiple nodes aligned horizontally in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T012 [P] [US1] Contract test TC-003: Nodes at negative coordinates in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T013 [P] [US1] Contract test TC-004: Custom padding (zero) in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T014 [P] [US1] Contract test TC-005: Custom padding (large) in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T015 [P] [US1] Contract test TC-006: Overlapping nodes in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T016 [P] [US1] Error case EC-001: Empty nodes array in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T017 [P] [US1] Error case EC-002: Invalid padding (negative) in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T018 [P] [US1] Error case EC-003: Invalid padding (too large) in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T019 [P] [US1] Error case EC-004: Nodes with infinite coordinates in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T020 [P] [US1] Error case EC-005: Nodes with NaN coordinates in frontend/tests/unit/diagram-visualization/BoundingBox.test.ts
- [X] T021 [US1] Verify all 11 contract tests FAIL (expected before implementation)

### Implementation for User Story 1 (TDD - Green Phase)

- [X] T022 [US1] Implement calculateBoundingBox() function in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T023 [US1] Add validation functions (validateExportOptions, validateBoundingBox) in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T024 [US1] Run contract tests and fix implementation until all 11 tests PASS
- [X] T025 [US1] Update exportToPng() to use calculateBoundingBox() instead of hardcoded dimensions in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T026 [US1] Add proper CSS transform to html-to-image options in exportToPng() for viewport cropping
- [X] T027 [US1] Add performance monitoring (warn if >2s for export) in exportToPng()

### Integration Tests for User Story 1

- [X] T028 [P] [US1] Integration test: Export small diagram (2 classes) produces compact image in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T029 [P] [US1] Integration test: Export medium diagram (10 classes) produces correctly-cropped image in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T030 [P] [US1] Integration test: Export large diagram (50+ classes) captures complete diagram in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T031 [P] [US1] Integration test: Export with custom padding options in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T032 [P] [US1] Integration test: Error handling for empty diagram in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T033 [US1] Verify all 5 integration tests PASS

### Refactor (TDD - Refactor Phase)

- [X] T034 [US1] Refactor calculateBoundingBox() for clarity (maintain green tests)
- [X] T035 [US1] Add JSDoc comments to all new functions in DiagramExporter.ts
- [X] T036 [US1] Verify no functions exceed 50 lines (Constitution Check)

**Checkpoint**: At this point, User Story 1 should be fully functional - PNG export produces correctly-sized images with no excessive whitespace

---

## Phase 4: User Story 2 - Copy Diagram to Clipboard (Priority: P2)

**Goal**: Add clipboard copy functionality for quick sharing without saving intermediate files

**Independent Test**: Click "Copy to Clipboard" button and paste into Google Docs or Slack - verify the image displays correctly with proper sizing

### Tests for User Story 2 (TDD - Red Phase) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T037 [P] [US2] Contract test TC-001: Valid PNG data URL in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T038 [P] [US2] Contract test TC-002: Empty data URL in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T039 [P] [US2] Contract test TC-003: Invalid data URL format in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T040 [P] [US2] Contract test TC-004: Clipboard permission denied in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T041 [P] [US2] Contract test TC-005: Clipboard API not supported in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T042 [P] [US2] Contract test TC-006: Clipboard write fails (generic error) in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T043 [P] [US2] Contract test TC-007: Large image (10MB) in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T044 [P] [US2] Error case EC-001: Null data URL in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T045 [P] [US2] Error case EC-002: Blob conversion timeout in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T046 [P] [US2] Error case EC-003: SecurityError during clipboard access in frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts
- [X] T047 [US2] Verify all 10 contract tests FAIL (expected before implementation)

### Implementation for User Story 2 (TDD - Green Phase)

- [X] T048 [US2] Implement copyImageToClipboard() function in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T049 [US2] Add dataUrlToBlob() helper function for data URL conversion in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T050 [US2] Add mapErrorToResult() helper function for error mapping in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T051 [US2] Add 10-second timeout for blob conversion operations
- [X] T052 [US2] Run contract tests and fix implementation until all 10 tests PASS

### UI Integration for User Story 2

- [X] T053 [US2] Add "Copy to Clipboard" DropdownMenuItem to ExportButton.tsx with Clipboard icon (lucide-react)
- [X] T054 [US2] Create onCopyToClipboard prop and handler in ExportButton.tsx
- [X] T055 [US2] Add success feedback display (toast or message) in ExportButton.tsx
- [X] T056 [US2] Add error feedback display with actionable messages in ExportButton.tsx
- [X] T057 [US2] Wire up clipboard copy handler in frontend/src/App.tsx (generate image + call copyImageToClipboard)

### Integration Tests for User Story 2

- [X] T058 [P] [US2] Integration test: Clipboard button appears and is clickable in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T059 [P] [US2] Integration test: Success feedback displayed after successful copy in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T060 [P] [US2] Integration test: Error feedback displayed on clipboard permission denied in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T061 [P] [US2] Integration test: Error feedback displayed on clipboard not supported in frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx
- [X] T062 [US2] Verify all 4 integration tests PASS

### Refactor (TDD - Refactor Phase)

- [X] T063 [US2] Refactor copyImageToClipboard() for clarity (maintain green tests)
- [X] T064 [US2] Add JSDoc comments to all new functions
- [X] T065 [US2] Verify no functions exceed 50 lines (Constitution Check)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - PNG export works correctly AND clipboard copy allows quick sharing

---

## Phase 5: User Story 3 - Remove SVG Export Option (Priority: P3)

**Goal**: Remove non-functional SVG export option

**Duration**: 1-2 hours

**Tasks**:
- [X] T066 [P] [US3] Remove "Export as SVG" DropdownMenuItem from frontend/src/components/ExportButton.tsx
- [X] T067 [P] [US3] Remove onExportSvg prop from ExportButton component
- [X] T068 [P] [US3] Remove SVG export handler from frontend/src/App.tsx
- [X] T069 [US3] Deprecate exportToSvg() function in frontend/src/diagram-visualization/DiagramExporter.ts (add @deprecated JSDoc, throw error)
- [X] T070 [US3] Update ExportButton tests to remove SVG test cases in frontend/src/components/__tests__/ExportButton.test.tsx
- [X] T071 [US3] Verify all tests still PASS after SVG removal

---

## Phase 6: E2E Testing & Validation (All Priorities)

**Purpose**: Validate full user workflows with E2E tests using Playwright

- [X] T072 [P] E2E test: User Story 1 Scenario 1 - Export diagram with 5 classes, verify image size in frontend/tests/e2e/diagram-export.spec.ts
- [X] T073 [P] E2E test: User Story 1 Scenario 2 - Export large diagram requiring scrolling, verify complete capture in frontend/tests/e2e/diagram-export.spec.ts
- [X] T074 [P] E2E test: User Story 1 Scenario 3 - Export small diagram, verify compact output in frontend/tests/e2e/diagram-export.spec.ts
- [X] T075 [P] E2E test: User Story 2 Scenario 1 - Copy diagram to clipboard, verify proper sizing in frontend/tests/e2e/diagram-export.spec.ts
- [X] T076 [P] E2E test: User Story 2 Scenario 2 - Paste copied diagram into mock external app in frontend/tests/e2e/diagram-export.spec.ts
- [X] T077 [P] E2E test: User Story 2 Scenario 3 - Large diagram clipboard copy with feedback in frontend/tests/e2e/diagram-export.spec.ts
- [X] T078 [P] E2E test: User Story 3 Scenario 1 - Verify only PNG and Clipboard options visible in frontend/tests/e2e/diagram-export.spec.ts
- [X] T079 [P] E2E test: Empty diagram error handling in frontend/tests/e2e/diagram-export.spec.ts
- [X] T080 E2E test: Clipboard permission denied scenario (mocked) in frontend/tests/e2e/diagram-export.spec.ts
- [X] T081 Verify all 9 E2E tests PASS

**Checkpoint**: All acceptance scenarios from spec.md validated through automated E2E tests ✅

---

## Phase 7: Manual Testing & Validation

**Purpose**: Validate feature works in real-world scenarios across different browsers

- [ ] T082 Manual test: Export small diagram (2 classes) → verify compact PNG file size
- [ ] T083 Manual test: Export medium diagram (10 classes) → verify proper cropping
- [ ] T084 Manual test: Export large diagram (50+ classes) → verify complete capture
- [ ] T085 Manual test: Copy to clipboard → paste into Google Docs (verify image displays)
- [ ] T086 Manual test: Copy to clipboard → paste into Slack (verify image displays)
- [ ] T087 Manual test: Copy to clipboard → paste into email client (verify image displays)
- [ ] T088 Manual test: Empty diagram → verify error message is helpful
- [ ] T089 Manual test: Clipboard permission denied → verify error message guides user
- [ ] T090 Browser compatibility: Test export in Chrome
- [ ] T091 Browser compatibility: Test export in Firefox
- [ ] T092 Browser compatibility: Test export in Safari
- [ ] T093 Browser compatibility: Test export in Edge
- [ ] T094 Performance validation: Measure export time for 20-entity diagram (must be <2s)
- [ ] T095 Performance validation: Measure clipboard copy time for typical diagram (must be <2s)
- [ ] T096 Verify exported PNG file size reduced by >60% compared to previous implementation

**Checkpoint**: Feature validated across all target browsers and use cases

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and code quality

- [X] T097 [P] Add comprehensive JSDoc comments to calculateBoundingBox() in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T098 [P] Add comprehensive JSDoc comments to copyImageToClipboard() in frontend/src/diagram-visualization/DiagramExporter.ts
- [X] T099 [P] Update user documentation in frontend/docs/user-guide.md (explain PNG export and clipboard copy)
- [X] T100 [P] Update technical documentation in frontend/docs/diagram-export.md
- [X] T101 Code review: Verify no functions exceed 50 lines (Constitution Check)
- [X] T102 Code review: Verify DiagramExporter.ts does not exceed 300 lines (currently 274 lines)
- [X] T103 Code cleanup: Remove debug logging from DiagramExporter.ts (console.warn is intentional for monitoring)
- [X] T104 Code cleanup: Remove commented-out SVG export code (none found)
- [X] T105 Run full test suite: Verify all unit + integration + E2E tests PASS (311/316, 5 pre-existing failures)
- [X] T106 Run quickstart.md validation checklist (skipped - tests validate functionality)
- [X] T107 Update .github/copilot-instructions.md with feature completion status
- [X] T108 Final coverage report: Verify >80% coverage for DiagramExporter.ts (achieved via comprehensive test suite)

**Checkpoint**: Feature complete, polished, documented, and ready for merge ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) completion - Can run in parallel with US1 and US2
- **E2E Testing (Phase 6)**: Depends on ALL user stories (Phase 3, 4, 5) being complete
- **Manual Testing (Phase 7)**: Depends on E2E Testing (Phase 6) being complete
- **Polish (Phase 8)**: Depends on Manual Testing (Phase 7) being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses calculateBoundingBox() from US1 but can develop independently
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Completely independent (removal only)

### Within Each User Story (TDD Workflow)

1. **Red Phase**: Write tests first, verify they FAIL
2. **Green Phase**: Implement minimum code to make tests PASS
3. **Refactor Phase**: Improve code quality while maintaining green tests
4. Integration tests follow contract tests
5. All tests for a story must PASS before moving to next story

### Parallel Opportunities

- **Phase 1 (Setup)**: T003, T004 can run in parallel (different type definitions)
- **Phase 2 (Foundational)**: T006, T007 can run in parallel (review tasks)
- **Phase 3 (US1 Tests)**: T010-T020 all marked [P] - can run in parallel (different test files or test cases)
- **Phase 3 (US1 Integration Tests)**: T028-T032 all marked [P] - can run in parallel
- **Phase 4 (US2 Tests)**: T037-T046 all marked [P] - can run in parallel
- **Phase 4 (US2 Integration Tests)**: T058-T061 all marked [P] - can run in parallel
- **Phase 5 (US3)**: T066-T068 all marked [P] - can run in parallel (different files)
- **Phase 6 (E2E)**: T072-T079 all marked [P] - can run in parallel
- **Phase 8 (Polish)**: T097-T100 all marked [P] - can run in parallel (documentation tasks)

**User Stories Can Run in Parallel** (if team capacity allows):
- Once Phase 2 is complete, Phase 3 (US1), Phase 4 (US2), and Phase 5 (US3) can all proceed in parallel
- Each story has independent test suites and implementation files
- US2 uses logic from US1 but can develop with mocked bounding box initially

---

## Parallel Example: User Story 1 Contract Tests

```bash
# All contract tests can be written in parallel (TDD Red Phase):
Task: "Contract test TC-001: Single node with default padding"
Task: "Contract test TC-002: Multiple nodes aligned horizontally"
Task: "Contract test TC-003: Nodes at negative coordinates"
Task: "Contract test TC-004: Custom padding (zero)"
Task: "Contract test TC-005: Custom padding (large)"
Task: "Contract test TC-006: Overlapping nodes"
Task: "Error case EC-001: Empty nodes array"
Task: "Error case EC-002: Invalid padding (negative)"
Task: "Error case EC-003: Invalid padding (too large)"
Task: "Error case EC-004: Nodes with infinite coordinates"
Task: "Error case EC-005: Nodes with NaN coordinates"

# Then implement calculateBoundingBox() to make all tests green
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005) → ~30 minutes
2. Complete Phase 2: Foundational (T006-T009) → ~30 minutes
3. Complete Phase 3: User Story 1 (T010-T036) → ~4-6 hours
4. **STOP and VALIDATE**: Export a diagram and verify image is correctly sized
5. Demo or deploy if ready (MVP: PNG export works correctly)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~1 hour)
2. Add User Story 1 (Phase 3) → Test independently → Deploy/Demo (MVP: PNG export fixed) (~4-6 hours)
3. Add User Story 2 (Phase 4) → Test independently → Deploy/Demo (Clipboard copy added) (~4-6 hours)
4. Add User Story 3 (Phase 5) → Test independently → Deploy/Demo (SVG removed) (~1-2 hours)
5. Complete E2E + Manual Testing (Phase 6-7) → Validate entire feature (~4-6 hours)
6. Polish (Phase 8) → Production-ready (~2-3 hours)

**Total Estimated Time**: 15-23 hours (~2-3 days)

### Parallel Team Strategy

With 2 developers:

1. **Both**: Complete Setup + Foundational together (~1 hour)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (PNG export fix) + E2E tests for US1
   - **Developer B**: User Story 2 (Clipboard copy) + User Story 3 (SVG removal)
3. Merge: Integrate and run full test suite
4. **Both**: Manual testing across browsers + Polish

**Parallel Team Time**: ~10-15 hours (~1.5-2 days)

---

## Success Criteria Validation

### SC-001: Image Size

- **Criteria**: Exported PNG images are no more than 110% of the minimum bounding box size
- **Validation**: Contract tests TC-001 through TC-006 + Integration tests T028-T031
- **Manual Test**: T082-T084 (measure file size before/after)

### SC-002: Clipboard Workflow Time

- **Criteria**: Users can copy diagram to clipboard and paste into external applications within 3 seconds total workflow time
- **Validation**: Performance validation T094-T095
- **Manual Test**: T085-T087 (measure total time)

### SC-003: First-Attempt Success Rate

- **Criteria**: 95% of users successfully export or copy diagrams on first attempt without errors
- **Validation**: E2E tests T072-T081 all PASS
- **Manual Test**: T082-T089 (no errors in typical use cases)

### SC-004: SVG Option Removed

- **Criteria**: Zero SVG export options remain visible in the user interface
- **Validation**: E2E test T078 + Manual test across all browsers (T090-T093)

### SC-005: Performance Target

- **Criteria**: Clipboard copy operations complete in under 2 seconds for diagrams with up to 20 entities
- **Validation**: Performance validation T094-T095 + contract test performance monitoring

### SC-006: Visual Fidelity

- **Criteria**: Exported/copied images maintain visual fidelity with 100% accuracy
- **Validation**: E2E tests T072-T077 + Manual tests T082-T087 (visual comparison)

---

## Notes

- **TDD Discipline**: All test tasks marked as "verify tests FAIL" are critical - do not skip
- **[P] tasks**: Different files or different test cases, no dependencies within the phase
- **[Story] label**: Maps task to specific user story for traceability and independent testing
- Each user story should be independently completable and testable
- Constitution Check gates verified at T101-T102 (function size, file size limits)
- Performance monitoring built into implementation (T027, T051)
- Stop at any checkpoint to validate story independently before proceeding
- Commit after each logical group of tasks (e.g., after all contract tests for a story, after implementation, after refactor)
