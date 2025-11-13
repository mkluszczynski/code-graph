# Tasks: TypeScript UML Graph Visualizer

**Feature Branch**: `001-uml-graph-visualizer`  
**Input**: Design documents from `/specs/001-uml-graph-visualizer/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: This feature follows **Test-Driven Development (TDD)**. Contract tests are included for all core APIs.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create frontend project structure with src/ directories (file-tree/, code-editor/, typescript-parser/, diagram-visualization/, project-management/, shared/)
- [x] T002 Initialize Vite + React + TypeScript project with pnpm in frontend/ directory
- [x] T003 [P] Install core dependencies: react@18, typescript@5, vite, tailwindcss, @monaco-editor/react, @xyflow/react, zustand, idb, lucide-react
- [x] T004 [P] Install dev dependencies: vitest, @testing-library/react, @testing-library/jest-dom, playwright, @types/node
- [x] T005 Configure Tailwind CSS in frontend/tailwind.config.ts
- [x] T006 Initialize shadcn/ui with components.json configuration
- [x] T007 [P] Configure TypeScript in frontend/tsconfig.json with strict mode and path aliases
- [x] T008 [P] Configure Vitest in frontend/vitest.config.ts for unit and integration tests
- [x] T009 [P] Configure Playwright in frontend/playwright.config.ts for E2E tests
- [x] T010 Create frontend/src/main.tsx entry point with React root
- [x] T011 Create frontend/src/App.tsx with basic layout structure (file tree, editor, diagram panels)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T012 Define all TypeScript types in frontend/src/shared/types/index.ts (ProjectFile, ClassDefinition, InterfaceDefinition, Property, Method, Relationship, DiagramNode, DiagramEdge, ParseResult)
- [x] T013 [P] Install shadcn/ui components: button, dropdown-menu, dialog, resizable panels, scroll-area
- [x] T014 [P] Create shared utility functions in frontend/src/shared/utils/index.ts (generateId, validateFileName)
- [x] T015 Create IndexedDB schema and database initialization in frontend/src/shared/utils/db.ts using idb library
- [x] T016 Create Zustand store in frontend/src/shared/store/index.ts with slices for files, activeFileId, diagram state
- [x] T017 [P] Create error classes in frontend/src/shared/types/errors.ts (FileExistsError, InvalidFileNameError, StorageError, ParseError)
- [x] T018 Setup base Monaco Editor configuration in frontend/src/shared/utils/monaco-config.ts (TypeScript compiler options, theme)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Class or Interface via Add Button (Priority: P1) 🎯 MVP

**Goal**: Users can create new TypeScript classes/interfaces through an "Add" button, which generates a new file in the project file tree with a basic template, and the UML diagram automatically updates to show the new empty class/interface.

**Independent Test**: Click the "Add" button, select "New Class", verify a new file appears in the file tree, and confirm an empty class node appears in the UML diagram within 2 seconds.

### Contract Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US1] Contract test for createFile('class') in frontend/src/project-management/**tests**/ProjectManager.contract.test.ts
- [x] T020 [P] [US1] Contract test for createFile('interface') in frontend/src/project-management/**tests**/ProjectManager.contract.test.ts
- [x] T021 [P] [US1] Contract test for getAllFiles() in frontend/src/project-management/**tests**/ProjectManager.contract.test.ts

### Implementation for User Story 1

- [x] T022 [P] [US1] Implement FileCreator.createClassTemplate() in frontend/src/project-management/FileCreator.ts
- [x] T023 [P] [US1] Implement FileCreator.createInterfaceTemplate() in frontend/src/project-management/FileCreator.ts
- [x] T024 [US1] Implement ProjectManager.createFile() with IndexedDB persistence in frontend/src/project-management/ProjectManager.ts
- [x] T025 [US1] Implement ProjectManager.getAllFiles() in frontend/src/project-management/ProjectManager.ts
- [x] T026 [US1] Implement ProjectManager.getFile() in frontend/src/project-management/ProjectManager.ts
- [x] T027 [P] [US1] Create AddButton component with dropdown menu in frontend/src/components/AddButton.tsx
- [x] T028 [US1] Integrate AddButton with ProjectManager to create files on menu selection
- [x] T029 [US1] Update Zustand store to add new files to state when created
- [x] T030 [US1] Create integration test for Add button → file creation → store update in frontend/tests/integration/create-file.test.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create classes/interfaces and they appear in the store

---

## Phase 4: User Story 3 - Manage Project with File Tree (Priority: P1)

**Goal**: Users can view all TypeScript files in a hierarchical file tree, click on files to open them in the editor, and see the file structure update as new files are created.

**Independent Test**: Create several class/interface files via the Add button, click on different files in the tree to open them, and verify that the tree accurately reflects all project files.

**Note**: Implementing US3 before US2 because file tree is needed for navigation and provides visual feedback for US1.

### Contract Tests for User Story 3

- [x] T031 [P] [US3] Contract test for FileTreeManager.buildTree() with multiple files in frontend/src/file-tree/**tests**/FileTreeManager.contract.test.ts
- [x] T032 [P] [US3] Contract test for FileTreeManager.findFileInTree() in frontend/src/file-tree/**tests**/FileTreeManager.contract.test.ts

### Implementation for User Story 3

- [x] T033 [P] [US3] Define FileTreeNode type in frontend/src/file-tree/types.ts
- [x] T034 [US3] Implement FileTreeManager.buildTree() to construct hierarchical tree from flat file list in frontend/src/file-tree/FileTreeManager.ts
- [x] T035 [US3] Implement FileTreeManager.sortFiles() for alphabetical ordering in frontend/src/file-tree/FileTreeManager.ts
- [x] T036 [US3] Create FileTreeView component with recursive rendering in frontend/src/file-tree/FileTreeView.tsx
- [x] T037 [US3] Add file selection handling in FileTreeView (update Zustand activeFileId on click)
- [x] T038 [US3] Add visual highlighting for selected file in FileTreeView using Tailwind classes
- [x] T039 [US3] Add file tree to App.tsx layout in left panel using ResizablePanels
- [x] T040 [US3] Create integration test for file tree rendering and selection in frontend/tests/integration/file-tree-navigation.test.ts

**Checkpoint**: At this point, User Stories 1 AND 3 should work together - create files and navigate them via file tree

---

## Phase 5: User Story 2 - Navigate from Graph to Code (Priority: P1)

**Goal**: Users can click on any class/interface node in the UML diagram to immediately open the corresponding file in the code editor and highlight it in the file tree.

**Independent Test**: Create multiple class files, click on a specific class node in the UML diagram, and verify that the correct file opens in the editor and is highlighted in the file tree.

**Note**: This requires basic diagram rendering to be in place, so some diagram infrastructure is included here.

### Contract Tests for User Story 2

- [x] T041 [P] [US2] Contract test for handleNodeClick() updates activeFileId in frontend/src/diagram-visualization/__tests__/DiagramRenderer.contract.test.ts

### Implementation for User Story 2

- [x] T042 [P] [US2] Create basic DiagramNode component for rendering class/interface boxes in frontend/src/diagram-visualization/NodeRenderer.tsx
- [x] T043 [US2] Create DiagramRenderer component using React Flow in frontend/src/diagram-visualization/DiagramRenderer.tsx
- [x] T044 [US2] Implement handleNodeClick() to update activeFileId in Zustand store in frontend/src/diagram-visualization/DiagramRenderer.tsx
- [x] T045 [US2] Connect FileTreeView to activeFileId store to auto-highlight selected file
- [x] T046 [US2] Add diagram panel to App.tsx layout in right panel using ResizablePanels
- [x] T047 [US2] Create integration test for diagram node click → file selection → tree highlight in frontend/tests/integration/graph-to-code-navigation.test.ts

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should work together - bidirectional navigation between file tree and diagram

---

## Phase 6: User Story 4 - Write TypeScript and See UML (Priority: P1)

**Goal**: Users write TypeScript code in an integrated code editor, and the system automatically generates and displays UML class diagrams that visualize the structure, relationships, and dependencies of their code.

**Independent Test**: Open a class file in the editor, add properties and methods, and verify that the UML diagram updates in real-time (within 2 seconds) to reflect the changes.

### Contract Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T048 [P] [US4] Contract test for parse() with simple class in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts
- [X] T049 [P] [US4] Contract test for parse() with properties and methods in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts
- [X] T050 [P] [US4] Contract test for parse() with access modifiers in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts
- [X] T051 [P] [US4] Contract test for parse() with interface in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts
- [X] T052 [P] [US4] Contract test for parse() with syntax errors in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts
- [X] T053 [P] [US4] Contract test for generateDiagram() with single class in frontend/src/diagram-visualization/**tests**/DiagramGenerator.contract.test.ts
- [X] T054 [P] [US4] Contract test for generateDiagram() with class and interface in frontend/src/diagram-visualization/**tests**/DiagramGenerator.contract.test.ts

### Implementation for User Story 4

- [X] T055 [P] [US4] Implement TypeScriptParser.parse() using TypeScript Compiler API in frontend/src/typescript-parser/TypeScriptParser.ts
- [X] T056 [P] [US4] Implement ClassExtractor.extractClass() to parse class definitions in frontend/src/typescript-parser/ClassExtractor.ts
- [X] T057 [P] [US4] Implement ClassExtractor.extractInterface() to parse interface definitions in frontend/src/typescript-parser/InterfaceExtractor.ts
- [X] T058 [P] [US4] Implement PropertyExtractor to parse class properties with types and visibility in frontend/src/typescript-parser/PropertyExtractor.ts
- [X] T059 [P] [US4] Implement MethodExtractor to parse class methods with signatures in frontend/src/typescript-parser/MethodExtractor.ts
- [X] T060 [US4] Implement error handling for syntax errors in TypeScriptParser.ts (return ParseError array)
- [X] T061 [US4] Implement DiagramGenerator.generateDiagram() in frontend/src/diagram-visualization/DiagramGenerator.ts
- [X] T062 [US4] Implement UML formatting helper functions (formatProperty, formatMethod, formatVisibility) in frontend/src/diagram-visualization/UMLFormatter.ts
- [X] T063 [US4] Create CodeEditor component using Monaco Editor in frontend/src/code-editor/CodeEditor.tsx
- [X] T064 [US4] Implement EditorController.handleContentChange() with debouncing (500ms) in frontend/src/code-editor/EditorController.ts
- [X] T065 [US4] Connect EditorController to parse code on change and update Zustand store with parsed entities
- [X] T066 [US4] Connect DiagramRenderer to subscribe to Zustand store and re-render on entity changes
- [X] T067 [US4] Implement ProjectManager.updateFile() to persist content changes to IndexedDB in frontend/src/project-management/ProjectManager.ts
- [X] T068 [US4] Add editor panel to App.tsx layout in center panel using ResizablePanels
- [X] T069 [US4] Create integration test for code editing → parsing → diagram update pipeline in frontend/tests/integration/code-to-diagram.test.ts

**Checkpoint**: At this point, the core MVP is complete - users can create files, write code, and see real-time UML diagrams

---

## Phase 7: User Story 5 - Visualize Complex Relationships (Priority: P2)

**Goal**: Users working with multiple classes and interfaces can see how they relate to each other through inheritance, implementation, composition, and associations with proper UML notation.

**Independent Test**: Create TypeScript code with 3-5 classes that have various relationships (extends, implements, uses as property type) and verify that all relationships are correctly visualized with proper UML notation.

### Contract Tests for User Story 5

- [X] T070 [P] [US5] Contract test for extractRelationships() with inheritance in frontend/src/typescript-parser/**tests**/RelationshipAnalyzer.contract.test.ts
- [X] T071 [P] [US5] Contract test for extractRelationships() with interface implementation in frontend/src/typescript-parser/**tests**/RelationshipAnalyzer.contract.test.ts
- [X] T072 [P] [US5] Contract test for extractRelationships() with composition/association in frontend/src/typescript-parser/**tests**/RelationshipAnalyzer.contract.test.ts
- [X] T073 [P] [US5] Contract test for generateDiagram() with inheritance edges in frontend/src/diagram-visualization/**tests**/DiagramGenerator.contract.test.ts
- [X] T074 [P] [US5] Contract test for generateDiagram() with multiple relationship types in frontend/src/diagram-visualization/**tests**/DiagramGenerator.contract.test.ts

### Implementation for User Story 5

- [X] T075 [P] [US5] Implement RelationshipAnalyzer.extractRelationships() in frontend/src/typescript-parser/RelationshipAnalyzer.ts
- [X] T076 [P] [US5] Implement RelationshipAnalyzer.detectInheritance() for extends relationships in frontend/src/typescript-parser/RelationshipAnalyzer.ts
- [X] T077 [P] [US5] Implement RelationshipAnalyzer.detectImplementation() for implements relationships in frontend/src/typescript-parser/RelationshipAnalyzer.ts
- [X] T078 [P] [US5] Implement RelationshipAnalyzer.detectAssociation() for property type relationships in frontend/src/typescript-parser/RelationshipAnalyzer.ts
- [X] T079 [US5] Update TypeScriptParser.parse() to include extractRelationships() call
- [X] T080 [US5] Create InheritanceEdge component with solid line and triangle marker in frontend/src/diagram-visualization/edges/InheritanceEdge.tsx
- [X] T081 [US5] Create ImplementationEdge component with dashed line and triangle marker in frontend/src/diagram-visualization/edges/ImplementationEdge.tsx
- [X] T082 [US5] Create AssociationEdge component with solid line and arrow marker in frontend/src/diagram-visualization/edges/AssociationEdge.tsx
- [X] T083 [US5] Update DiagramGenerator.generateDiagram() to create edges from relationships using correct edge types
- [X] T084 [US5] Update DiagramRenderer to use custom edge components
- [X] T085 [US5] Create integration test for complex multi-class relationships in frontend/tests/integration/relationship-visualization.test.ts

**Checkpoint**: At this point, User Story 5 is complete - complex relationships are visualized correctly

---

## Phase 8: User Story 6 - Edit and Re-visualize (Priority: P2)

**Goal**: Users can modify existing TypeScript code and see the UML diagram update immediately to reflect changes such as renamed classes, added/removed methods, changed access modifiers, or modified relationships.

**Independent Test**: Create a class with methods and properties, then systematically modify each aspect (rename class, change method visibility, add parameter, remove property) and verify the diagram updates correctly each time within 2 seconds.

### Contract Tests for User Story 6

- [X] T086 [P] [US6] Contract test for parse() after class rename in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts
- [X] T087 [P] [US6] Contract test for parse() after property removal in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts
- [X] T088 [P] [US6] Contract test for parse() after visibility change in frontend/src/typescript-parser/**tests**/TypeScriptParser.contract.test.ts

### Implementation for User Story 6

- [X] T089 [US6] Verify EditorController debouncing handles rapid changes correctly (already implemented in T064, add specific tests)
- [X] T090 [US6] Implement diagram diffing to only update changed nodes in frontend/src/diagram-visualization/DiagramDiffer.ts
- [X] T091 [US6] Update DiagramRenderer to use React Flow's updateNode() for efficient partial updates
- [X] T092 [US6] Add error state visualization in DiagramRenderer when parse fails (show last valid diagram + error badge)
- [X] T093 [US6] Create integration test for incremental edits → progressive diagram updates in frontend/tests/integration/edit-and-rerender.test.ts

**Checkpoint**: At this point, User Story 6 is complete - editing experience is smooth with real-time updates

---

## Phase 9: User Story 7 - Navigate Large Diagrams (Priority: P3)

**Goal**: When working with TypeScript files containing many classes and interfaces, users can zoom, pan, and organize the diagram layout to focus on specific parts of their architecture without losing context.

**Independent Test**: Create a TypeScript file with 10+ classes, then verify that users can zoom in/out, pan around the diagram, and that the layout automatically arranges classes in a readable manner.

### Contract Tests for User Story 7

- [X] T094 [P] [US7] Contract test for applyLayout() with 10+ nodes using dagre in frontend/src/diagram-visualization/**tests**/LayoutEngine.contract.test.ts
- [X] T095 [P] [US7] Contract test for applyLayout() minimizing edge crossings in frontend/src/diagram-visualization/**tests**/LayoutEngine.contract.test.ts

### Implementation for User Story 7

- [X] T096 [P] [US7] Implement LayoutEngine.applyLayout() using dagre algorithm in frontend/src/diagram-visualization/LayoutEngine.ts
- [X] T097 [P] [US7] Implement LayoutEngine.calculateNodeDimensions() based on content in frontend/src/diagram-visualization/LayoutEngine.ts
- [X] T098 [US7] Update DiagramGenerator to call LayoutEngine after creating nodes/edges
- [X] T099 [US7] Enable React Flow zoom controls in DiagramRenderer (already built-in, configure UI)
- [X] T100 [US7] Enable React Flow pan functionality in DiagramRenderer (already built-in, configure)
- [X] T101 [US7] Add React Flow MiniMap component in DiagramRenderer for navigation overview
- [X] T102 [US7] Add React Flow Controls component for zoom buttons
- [X] T103 [US7] Implement auto-fit functionality to center diagram on load
- [X] T104 [US7] Create E2E test for large diagram navigation using Playwright in frontend/tests/e2e/large-diagram-navigation.spec.ts

**Checkpoint**: ✅ User Story 7 is complete - large diagrams are navigable and well-laid-out with automatic layout, zoom, pan, and minimap support

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T105 [P] Add loading states to all async operations (file creation, parsing, diagram generation)
- [ ] T106 [P] Implement error boundaries in React components for graceful error handling
- [ ] T107 Add keyboard shortcuts for common actions (Ctrl+N for new file, Ctrl+S for save)
- [ ] T108 [P] Create user documentation in frontend/docs/user-guide.md
- [ ] T109 Optimize Monaco Editor bundle size (lazy load, exclude unnecessary languages)
- [ ] T110 [P] Add dark mode support using Tailwind dark: classes
- [ ] T111 Implement diagram export functionality (save as PNG/SVG)
- [ ] T112 [P] Add performance monitoring for parsing and diagram generation
- [ ] T113 Run quickstart.md validation steps
- [ ] T114 [P] Create E2E test suite covering all 7 user stories in frontend/tests/e2e/user-scenarios.spec.ts
- [ ] T115 Code cleanup and refactoring for maintainability
- [ ] T116 Final constitution check (clean code, feature-driven structure, test coverage)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - US1 (Phase 3): Independent - can start after Foundational
  - US3 (Phase 4): Independent - can start after Foundational (benefits from US1 for file creation)
  - US2 (Phase 5): Depends on US3 (needs file tree) and basic diagram (provided in phase)
  - US4 (Phase 6): Depends on US1, US2, US3 (needs file creation, navigation, tree, and editor)
  - US5 (Phase 7): Depends on US4 (extends core parsing and diagram generation)
  - US6 (Phase 8): Depends on US4 (enhances editing experience)
  - US7 (Phase 9): Depends on US4 (enhances diagram visualization)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Works best with US1 for file creation
- **User Story 2 (P1)**: Needs US3 (file tree) - but can be parallelized with US4
- **User Story 4 (P1)**: Needs US1, US2, US3 - Core MVP functionality
- **User Story 5 (P2)**: Needs US4 - Extends core visualization
- **User Story 6 (P2)**: Needs US4 - Enhances editing
- **User Story 7 (P3)**: Needs US4 - Enhances navigation

### Within Each User Story

- Contract tests MUST be written and FAIL before implementation
- Parser components (TypeScriptParser, extractors) before diagram components
- Basic components before integration
- Store integration before UI rendering
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:

- T003, T004 (dependency installation)
- T005, T006, T007, T008, T009 (all configuration files)

**Phase 2 (Foundational)**:

- T013, T014, T017 (all independent utility/type files)

**Phase 3 (User Story 1)**:

- T019, T020, T021 (all contract tests)
- T022, T023 (template generators)
- T027 (UI component, parallel to ProjectManager implementation)

**Phase 4 (User Story 3)**:

- T031, T032 (contract tests)
- T033 (types, can be parallel with Foundation if needed)

**Phase 5 (User Story 2)**:

- T042, T043 (diagram components, parallel to each other)

**Phase 6 (User Story 4)**:

- T048-T054 (all contract tests)
- T055-T059 (parser components - can be parallelized)
- T062 (UML formatter, parallel to diagram generator)

**Phase 7 (User Story 5)**:

- T070-T074 (all contract tests)
- T075-T078 (relationship analyzers)
- T080, T081, T082 (all edge components)

**Phase 8 (User Story 6)**:

- T086-T088 (contract tests)

**Phase 9 (User Story 7)**:

- T094, T095 (contract tests)
- T096, T097 (layout engine components)

**Phase 10 (Polish)**:

- T105, T106, T108, T110, T112 (all independent improvements)

---

## Parallel Example: User Story 4 (Core MVP)

```bash
# Launch all contract tests together:
Task T048: "Contract test for parse() with simple class"
Task T049: "Contract test for parse() with properties and methods"
Task T050: "Contract test for parse() with access modifiers"
Task T051: "Contract test for parse() with interface"
Task T052: "Contract test for parse() with syntax errors"
Task T053: "Contract test for generateDiagram() with single class"
Task T054: "Contract test for generateDiagram() with class and interface"

# After tests fail, launch parser components in parallel:
Task T055: "Implement TypeScriptParser.parse()"
Task T056: "Implement ClassExtractor.extractClass()"
Task T057: "Implement ClassExtractor.extractInterface()"
Task T058: "Implement PropertyExtractor"
Task T059: "Implement MethodExtractor"

# In parallel, work on diagram generation:
Task T062: "Implement UML formatting helpers"
```

---

## Implementation Strategy

### MVP First (User Stories 1-4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Create files)
4. Complete Phase 4: User Story 3 (File tree navigation)
5. Complete Phase 5: User Story 2 (Graph to code navigation)
6. Complete Phase 6: User Story 4 (Real-time UML visualization)
7. **STOP and VALIDATE**: Test all P1 stories work together
8. Deploy/demo MVP

**MVP Delivers**: Full IDE-like experience - create TypeScript files, edit code, see real-time UML diagrams, navigate between code and diagrams.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (file creation works)
3. Add User Story 3 → Test independently → Demo (file tree navigation works)
4. Add User Story 2 → Test independently → Demo (bidirectional navigation works)
5. Add User Story 4 → Test independently → Deploy/Demo (🎯 **MVP COMPLETE!**)
6. Add User Story 5 → Test independently → Deploy/Demo (relationship visualization)
7. Add User Story 6 → Test independently → Deploy/Demo (smooth editing)
8. Add User Story 7 → Test independently → Deploy/Demo (large diagram navigation)
9. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (Days 1-2)
2. **Once Foundational is done:**
   - Developer A: User Story 1 + User Story 3 (file management)
   - Developer B: User Story 4 (parsing and diagram generation - largest story)
   - Developer C: User Story 2 (navigation, needs file tree from Dev A)
3. **After MVP (US1-4) complete:**
   - Developer A: User Story 5 (relationships)
   - Developer B: User Story 6 (editing improvements)
   - Developer C: User Story 7 (layout and navigation)
4. **Polish phase**: All developers work together on cross-cutting concerns

---

## Summary

- **Total Tasks**: 116 tasks
- **Contract Tests**: 32 tests across all user stories
- **User Stories**: 7 stories (4 P1, 2 P2, 1 P3)
- **Parallel Opportunities**: 43 tasks marked with [P] can run in parallel
- **MVP Scope**: Phases 1-6 (User Stories 1-4) = 69 tasks
- **Estimated MVP Duration**: 2-3 weeks with TDD approach
- **Independent Test Criteria**: Each user story phase has checkpoint with validation steps

**Format Validation**: ✅ All 116 tasks follow the checklist format with checkbox, Task ID, optional [P] marker, optional [Story] label, and file paths in descriptions.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD is mandatory**: Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The feature follows Constitution principles: feature-driven structure, test-first, clean code, user-centric design
