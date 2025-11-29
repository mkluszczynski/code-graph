# Tasks: Dart Language Support

**Input**: Design documents from `/specs/008-dart-language-support/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Included as per TDD approach from plan.md Test-First Gate.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Paths follow plan.md structure:
- Source: `frontend/src/`
- Tests: `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, new dependencies, unified parsers module creation

- [ ] T001 Install web-tree-sitter dependency via `pnpm add web-tree-sitter`
- [ ] T002 [P] Create `frontend/public/wasm/` directory for WASM files
- [ ] T003 [P] Add postinstall script to package.json to copy tree-sitter.wasm to public/wasm/
- [ ] T004 [P] Update vite.config.ts to handle WASM (exclude fs, configure optimizeDeps)
- [ ] T005 Add SupportedLanguage type to `frontend/src/shared/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create unified parsers module, migrate TypeScript parser, setup parser infrastructure

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### 2.1: Parser Abstraction Layer

- [ ] T006 Create LanguageParser abstract base class in `frontend/src/parsers/LanguageParser.ts`
- [ ] T007 [P] Create ParserRegistry class in `frontend/src/parsers/ParserRegistry.ts`
- [ ] T008 [P] Create parser module index with exports in `frontend/src/parsers/index.ts`

### 2.2: TypeScript Parser Migration

- [ ] T009 Move TypeScriptParser to `frontend/src/parsers/typescript/TypeScriptParser.ts` (extend LanguageParser)
- [ ] T010 [P] Move ClassExtractor to `frontend/src/parsers/typescript/ClassExtractor.ts`
- [ ] T011 [P] Move InterfaceExtractor to `frontend/src/parsers/typescript/InterfaceExtractor.ts`
- [ ] T012 [P] Move PropertyExtractor to `frontend/src/parsers/typescript/PropertyExtractor.ts`
- [ ] T013 [P] Move MethodExtractor to `frontend/src/parsers/typescript/MethodExtractor.ts`
- [ ] T014 [P] Move RelationshipAnalyzer to `frontend/src/parsers/typescript/RelationshipAnalyzer.ts`
- [ ] T015 [P] Create typescript module index in `frontend/src/parsers/typescript/index.ts`

### 2.3: Update Imports Across Codebase

- [ ] T016 Update imports in `frontend/src/code-editor/useEditorController.ts` to use new parsers module
- [ ] T017 [P] Update imports in `frontend/src/diagram-visualization/ImportResolver.ts`
- [ ] T018 [P] Update test imports in `frontend/tests/` to use new parsers module

### 2.4: Language Detection Utilities

- [ ] T019 Create detectLanguage() and isSupportedLanguage() utilities in `frontend/src/parsers/utils.ts`
- [ ] T020 Register TypeScriptParser in parserRegistry in `frontend/src/parsers/index.ts`

### 2.5: Regression Testing

- [ ] T021 Run existing TypeScript parser tests to verify migration (regression check)
- [ ] T022 Remove deprecated `frontend/src/typescript-parser/` directory after migration verified

**Checkpoint**: Parser infrastructure ready - TypeScript parsing works via new unified module

---

## Phase 3: User Story 1 - Create File with Custom Extension (Priority: P1) 🎯 MVP

**Goal**: Allow users to specify file extension when creating files, enabling multi-language support

**Independent Test**: Create a new file with `.dart` or `.ts` extension, verify it's created with the correct extension

### Contract Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T023 [P] [US1] Contract test for validateFileExtension() in `frontend/tests/unit/file-tree/FileExtensionValidation.test.ts`
- [ ] T024 [P] [US1] Contract test for extension validation edge cases (VE-001 to VE-007 from contracts)

### Integration Tests for User Story 1

- [ ] T025 [P] [US1] Integration test for CreateDialog extension validation in `frontend/tests/integration/file-tree/FileCreationExtension.test.tsx`

### Implementation for User Story 1

- [ ] T026 [US1] Add validateFileExtension() function to `frontend/src/file-tree/FileOperations.ts`
- [ ] T027 [US1] Modify CreateDialog to require file extension (remove auto-.ts logic) in `frontend/src/components/CreateDialog.tsx`
- [ ] T028 [US1] Add extension validation error messages to CreateDialog
- [ ] T029 [US1] Update file creation flow to accept user-specified extension

**Checkpoint**: Users can create files with any extension (.ts, .dart, .py, etc.)

---

## Phase 4: User Story 2 - Visualize Dart Class Diagrams (Priority: P2)

**Goal**: Parse Dart files and generate UML class diagrams with classes, properties, methods, and relationships

**Independent Test**: Create a Dart file with classes, verify the diagram displays correct nodes and relationships

### Contract Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T030 [P] [US2] Contract test for DartParser.parse() in `frontend/tests/unit/parsers/dart/DartParser.test.ts` (DP-001 to DP-010)
- [ ] T031 [P] [US2] Contract test for ClassExtractor in `frontend/tests/unit/parsers/dart/ClassExtractor.test.ts` (CE-001 to CE-005)
- [ ] T032 [P] [US2] Contract test for PropertyExtractor in `frontend/tests/unit/parsers/dart/PropertyExtractor.test.ts` (PE-001 to PE-008)
- [ ] T033 [P] [US2] Contract test for MethodExtractor in `frontend/tests/unit/parsers/dart/MethodExtractor.test.ts` (ME-001 to ME-008)
- [ ] T034 [P] [US2] Contract test for RelationshipAnalyzer in `frontend/tests/unit/parsers/dart/RelationshipAnalyzer.test.ts` (RA-001 to RA-005)

### Integration Tests for User Story 2

- [ ] T035 [P] [US2] Integration test for Dart parser + DiagramGenerator in `frontend/tests/integration/parsers/DartDiagramGeneration.test.tsx`
- [ ] T036 [P] [US2] Integration test for mixed TypeScript/Dart project view in `frontend/tests/integration/parsers/MixedLanguageProject.test.tsx`

### Implementation for User Story 2

#### 4.1: WASM Setup

- [ ] T037 [US2] Download/build tree-sitter-dart.wasm and place in `frontend/public/wasm/`
- [ ] T038 [US2] Create WASM loader utility for Dart parser initialization

#### 4.2: Dart Parser Core

- [ ] T039 [US2] Create DartParser class (extends LanguageParser) in `frontend/src/parsers/dart/DartParser.ts`
- [ ] T040 [P] [US2] Implement Dart ClassExtractor in `frontend/src/parsers/dart/ClassExtractor.ts`
- [ ] T041 [P] [US2] Implement Dart InterfaceExtractor in `frontend/src/parsers/dart/InterfaceExtractor.ts`
- [ ] T042 [P] [US2] Implement Dart PropertyExtractor in `frontend/src/parsers/dart/PropertyExtractor.ts`
- [ ] T043 [P] [US2] Implement Dart MethodExtractor in `frontend/src/parsers/dart/MethodExtractor.ts`
- [ ] T044 [US2] Implement Dart RelationshipAnalyzer in `frontend/src/parsers/dart/RelationshipAnalyzer.ts`
- [ ] T045 [US2] Create dart module index in `frontend/src/parsers/dart/index.ts`

#### 4.3: Parser Registration & Integration

- [ ] T046 [US2] Register DartParser in parserRegistry in `frontend/src/parsers/index.ts`
- [ ] T047 [US2] Update useEditorController to use parserRegistry.parse() for language routing

**Checkpoint**: Dart files display correct UML diagrams with classes, properties, methods, and relationships

---

## Phase 5: User Story 3 - Unsupported Language Warning (Priority: P3)

**Goal**: Display warning icon on files with unsupported extensions in file tree

**Independent Test**: Create a file with .py extension, verify warning icon appears and tooltip shows on hover

### Contract Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T048 [P] [US3] Contract test for detectLanguage() in `frontend/tests/unit/parsers/LanguageDetection.test.ts` (LD-001 to LD-008)
- [ ] T049 [P] [US3] Contract test for isSupportedLanguage() in `frontend/tests/unit/parsers/LanguageDetection.test.ts` (SL-001 to SL-004)

### Integration Tests for User Story 3

- [ ] T050 [P] [US3] Integration test for warning icon display in `frontend/tests/integration/file-tree/UnsupportedLanguageWarning.test.tsx`

### Implementation for User Story 3

- [ ] T051 [US3] Add warning icon with tooltip for unsupported files in `frontend/src/file-tree/FileTreeView.tsx`
- [ ] T052 [US3] Import AlertTriangle icon and Tooltip from shadcn/ui
- [ ] T053 [US3] Add ARIA labels for accessibility on warning icon

**Checkpoint**: Unsupported files show warning icon with tooltip explaining diagram visualization is not available

---

## Phase 6: E2E Testing & Validation

**Purpose**: End-to-end tests validating complete user workflows

- [ ] T054 [P] E2E test for file creation with extension in `frontend/tests/e2e/dart-language.spec.ts`
- [ ] T055 [P] E2E test for Dart diagram visualization in `frontend/tests/e2e/dart-language.spec.ts`
- [ ] T056 [P] E2E test for unsupported language warning in `frontend/tests/e2e/dart-language.spec.ts`
- [ ] T057 [P] E2E test for mixed TypeScript/Dart project view in `frontend/tests/e2e/dart-language.spec.ts`
- [ ] T058 E2E test for Dart syntax error handling in `frontend/tests/e2e/dart-language.spec.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, performance validation, cleanup

- [ ] T059 [P] Update user-guide.md with Dart language support and file extension instructions in `frontend/docs/user-guide.md`
- [ ] T060 [P] Add JSDoc comments to DartParser and extractors
- [ ] T061 [P] Add JSDoc comments to ParserRegistry and LanguageParser
- [ ] T062 Verify function sizes are under 50 lines (Constitution Check)
- [ ] T063 Verify file sizes are under 300 lines (Constitution Check)
- [ ] T064 Remove any debug console.log statements
- [ ] T065 Run full test suite and verify all tests pass
- [ ] T066 Validate performance: diagram update <200ms for 10 entities (SC-002)
- [ ] T067 Document bundle size impact of tree-sitter WASM
- [ ] T068 Update .github/copilot-instructions.md with feature completion status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - US1 can proceed independently (file extension validation)
  - US2 depends on US1 (need to create .dart files to test parsing)
  - US3 can proceed independently (warning icons)
- **E2E Testing (Phase 6)**: Depends on all user stories being complete
- **Polish (Phase 7)**: Depends on E2E testing completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P2)**: Soft dependency on US1 (testing requires creating .dart files)
- **User Story 3 (P3)**: Can start after Phase 2 - No dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Extractors can be built in parallel
- Core parser depends on extractors
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004 can run in parallel (different files)
- T010-T015 can run in parallel (independent file moves)
- T016, T017, T018 can run in parallel (import updates)
- All contract tests within a story can run in parallel
- All extractors (T040-T044) can be built in parallel
- US1 and US3 can be developed in parallel (different concerns)
- All E2E tests can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# After LanguageParser is created, these can run in parallel:
Task: T007 "Create ParserRegistry class"
Task: T008 "Create parser module index"

# TypeScript migration moves can all run in parallel:
Task: T010 "Move ClassExtractor"
Task: T011 "Move InterfaceExtractor"
Task: T012 "Move PropertyExtractor"
Task: T013 "Move MethodExtractor"
Task: T014 "Move RelationshipAnalyzer"
```

## Parallel Example: User Story 2

```bash
# All contract tests for US2 can run in parallel:
Task: T030 "Contract test for DartParser"
Task: T031 "Contract test for ClassExtractor"
Task: T032 "Contract test for PropertyExtractor"
Task: T033 "Contract test for MethodExtractor"
Task: T034 "Contract test for RelationshipAnalyzer"

# After tests written, extractors can be built in parallel:
Task: T040 "Implement Dart ClassExtractor"
Task: T041 "Implement Dart InterfaceExtractor"
Task: T042 "Implement Dart PropertyExtractor"
Task: T043 "Implement Dart MethodExtractor"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - migrate TypeScript parser)
3. Complete Phase 3: User Story 1 (file extension support)
4. **STOP and VALIDATE**: Test file creation with custom extensions
5. Deploy/demo if ready - basic multi-language file support

### Incremental Delivery

1. Complete Setup + Foundational → Parser infrastructure ready
2. Add User Story 1 → Test independently → Users can create .dart files
3. Add User Story 2 → Test independently → Dart diagrams work
4. Add User Story 3 → Test independently → Clear UX for unsupported languages
5. Each story adds value without breaking previous stories

### Risk Mitigation

1. **TypeScript Parser Migration**: Phase 2 is critical - run all existing tests before proceeding
2. **WASM Loading**: Lazy-load Dart parser to avoid blocking initial render
3. **Bundle Size**: Document WASM impact (~12MB) - acceptable for desktop-class web app

---

## Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 5 | 3 |
| Phase 2: Foundational | 17 | 12 |
| Phase 3: User Story 1 | 7 | 3 |
| Phase 4: User Story 2 | 18 | 9 |
| Phase 5: User Story 3 | 6 | 3 |
| Phase 6: E2E Testing | 5 | 4 |
| Phase 7: Polish | 10 | 3 |
| **Total** | **68** | **37 (54%)** |

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (29 tasks) - enables multi-language file creation

**Full Feature**: All phases (68 tasks) - complete Dart language support with UML diagrams
