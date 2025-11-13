# Implementation Plan: TypeScript UML Graph Visualizer

**Branch**: `001-uml-graph-visualizer` | **Date**: 2025-11-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-uml-graph-visualizer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

An IDE-like web application that provides real-time UML class diagram visualization for TypeScript code. Users can create classes/interfaces through an "Add" button, edit code in an integrated editor, and see the UML diagram automatically update to reflect code structure and relationships. The application features a project file tree for navigation, bidirectional linking between diagram nodes and code files, and supports visualization of inheritance, implementation, and association relationships with proper UML notation.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ LTS  
**Primary Dependencies**: React 18+ (frontend framework), TypeScript Compiler API (for code parsing), pnpm (package manager), React Flow + dagre (UML diagram rendering), Monaco Editor via @monaco-editor/react (code editor component), Zustand (state management), idb (IndexedDB wrapper), shadcn/ui (UI components), Lucide React (icons), Tailwind CSS (styling)  
**Storage**: IndexedDB (via idb library) for project files (client-side file system), localStorage for metadata  
**Testing**: Vitest (unit & integration), @testing-library/react (React testing), Playwright (E2E framework)  
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)  
**Project Type**: Web application (frontend + Vite bundler, no backend required for MVP)  
**Performance Goals**: Diagram re-render <2s for files with up to 20 classes, code parsing <500ms (debounced), UI interactions <100ms response time  
**Constraints**: Real-time code parsing and visualization, client-side only (no server), responsive layout for 1280px+ displays, handle up to 50 classes in a single project  
**Scale/Scope**: Single-user desktop application (web-based), initial support for 10-20 TypeScript files per project, 30+ classes navigable with zoom/pan

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines
  - [x] No files planned >300 lines
  - [x] All names are descriptive and reveal intent
  - [x] No code duplication in design
  - [x] Complexity justified in writing (if applicable)

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers (file-tree, code-editor, diagram-visualization, typescript-parser as features)
  - [x] Feature modules have clear boundaries
  - [x] Feature is independently understandable
  - [x] Shared code has clear purpose and justification

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria (7 user stories with 4 acceptance scenarios each in spec.md)
  - [x] Test strategy documented (contract tests for TypeScript parser API, integration tests for diagram generation pipeline, unit tests for individual parsers/renderers)
  - [x] Tests will be written before implementation (TDD workflow enforced)
  - [x] Coverage targets defined (>80% for business logic: parser, diagram generator, file tree manager)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs (spec.md has 7 detailed user stories)
  - [x] User stories prioritized (P1: US1-4, P2: US5-6, P3: US7)
  - [x] Error messages are actionable and user-friendly (TypeScript syntax errors show last valid diagram state with clear error indication)
  - [x] Performance expectations defined from user perspective (2s diagram updates, 1s file navigation, <100ms UI response)

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
# Web application structure (frontend only, no backend)
frontend/
├── src/
│   ├── components/
│   │   └── ui/                 # shadcn/ui components (button, dialog, etc.)
│   ├── file-tree/              # Feature: Project file tree navigation
│   │   ├── FileTreeView.tsx
│   │   ├── FileTreeManager.ts
│   │   └── __tests__/
│   ├── code-editor/            # Feature: TypeScript code editing
│   │   ├── CodeEditor.tsx
│   │   ├── EditorController.ts
│   │   └── __tests__/
│   ├── typescript-parser/      # Feature: TS code parsing & analysis
│   │   ├── TypeScriptParser.ts
│   │   ├── ClassExtractor.ts
│   │   ├── RelationshipAnalyzer.ts
│   │   └── __tests__/
│   ├── diagram-visualization/  # Feature: UML diagram rendering
│   │   ├── DiagramRenderer.tsx
│   │   ├── LayoutEngine.ts
│   │   ├── NodeRenderer.tsx
│   │   ├── RelationshipRenderer.tsx
│   │   └── __tests__/
│   ├── project-management/     # Feature: File creation & management
│   │   ├── ProjectManager.ts
│   │   ├── FileCreator.ts
│   │   └── __tests__/
│   ├── shared/                 # Shared utilities
│   │   ├── types/              # TypeScript type definitions
│   │   ├── hooks/              # React hooks
│   │   └── utils/              # Common utilities
│   ├── App.tsx                 # Main application component
│   └── main.tsx                # Application entry point
├── public/
│   └── index.html
├── tests/
│   ├── contract/               # Contract tests for parser API
│   ├── integration/            # Integration tests (parser → diagram)
│   └── e2e/                    # End-to-end user scenario tests
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── package.json
├── tsconfig.json
├── vite.config.ts              # Build configuration
└── vitest.config.ts            # Test configuration
```

**Structure Decision**: Web application with feature-driven organization. Primary features are organized by domain capability (file-tree, code-editor, typescript-parser, diagram-visualization, project-management) rather than technical layers. This aligns with Constitution principle II (Feature-Driven Structure) and allows each feature to be independently developed and tested. The frontend-only architecture uses client-side storage (localStorage/IndexedDB) for managing TypeScript project files, eliminating the need for a backend API in the MVP.

## Complexity Tracking

No constitutional violations requiring justification. All gates passed.

---

## Phase 0: Research - COMPLETED ✅

**Output**: `research.md`

All "NEEDS CLARIFICATION" items have been researched and resolved:

1. ✅ **Frontend Framework**: React 18+ selected (best Monaco Editor integration, rich ecosystem, proven for IDE apps)
2. ✅ **UML Diagram Library**: React Flow selected (React-first, interactive features, dagre layout support)
3. ✅ **Code Editor Component**: Monaco Editor selected (full TypeScript support, IntelliSense, familiar VSCode UX)
4. ✅ **E2E Testing Framework**: Playwright selected (best TypeScript support, speed, reliability, multi-browser)

**Best Practices Documented**:

- TypeScript Compiler API usage patterns
- React Flow layout strategies (dagre algorithm)
- Performance optimization (debouncing, memoization, Web Workers)
- IndexedDB storage patterns (idb library)

---

## Phase 1: Design & Contracts - COMPLETED ✅

### Deliverables

1. ✅ **data-model.md**: Complete entity definitions

   - 15 core entities defined (ProjectFile, ClassDefinition, InterfaceDefinition, Relationship, DiagramNode, etc.)
   - Validation rules for each entity
   - State transitions documented
   - TypeScript type definitions provided

2. ✅ **contracts/** directory: 3 API contract documents

   - `typescript-parser.contract.md`: Parser API with 12 contract tests
   - `diagram-generator.contract.md`: Diagram generator API with 12 contract tests
   - `project-manager.contract.md`: File management API with 18 contract tests

3. ✅ **quickstart.md**: Developer onboarding guide
   - Setup instructions
   - TDD workflow explanation
   - Technology quick-starts (TypeScript Compiler API, React Flow, Monaco, IndexedDB, Zustand)
   - Common tasks and troubleshooting

### Agent Context Updated

✅ GitHub Copilot instructions updated with:

- TypeScript 5.x, Node.js 20+ LTS
- React 18+, TypeScript Compiler API, pnpm, React Flow + dagre, Monaco Editor, Zustand, idb
- IndexedDB + localStorage storage strategy
- Web application project type

### Constitution Re-Check (Post-Design)

✅ **All gates still passing after Phase 1 design**:

- Clean Code: Feature-driven structure with clear module boundaries
- Feature-Driven Structure: 5 feature modules (file-tree, code-editor, typescript-parser, diagram-visualization, project-management)
- Test-First: 42 contract tests defined across 3 contracts before implementation
- User Experience: All design decisions traced back to user scenarios in spec.md

---

## Ready for Phase 2: Task Breakdown

The implementation plan is complete. Next steps:

1. **Run `/speckit.tasks` command** to generate `tasks.md` with detailed implementation tasks
2. **Begin TDD workflow**:
   - Write contract tests for TypeScript Parser
   - Implement parser to pass tests
   - Write contract tests for Diagram Generator
   - Implement diagram generator
   - Continue with remaining modules

---

## Summary

**Branch**: `001-uml-graph-visualizer`  
**Status**: Phase 1 Complete - Ready for Implementation  
**Documents Generated**:

- ✅ plan.md (this file)
- ✅ research.md
- ✅ data-model.md
- ✅ quickstart.md
- ✅ contracts/typescript-parser.contract.md
- ✅ contracts/diagram-generator.contract.md
- ✅ contracts/project-manager.contract.md

**Technology Stack Confirmed**:

- Frontend: React 18 + TypeScript 5.x + Vite
- UI: shadcn/ui + Lucide React + Tailwind CSS
- Parsing: TypeScript Compiler API
- Editor: Monaco Editor
- Diagrams: React Flow + dagre
- State: Zustand
- Storage: IndexedDB (idb)
- Testing: Vitest + Playwright

**Next Command**: `/speckit.tasks` to create implementation task breakdown
