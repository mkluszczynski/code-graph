````markdown
# Implementation Plan: UML Diagram Scope Control & Cross-File Import Resolution

**Branch**: `004-diagram-scope` | **Date**: 2025-11-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-diagram-scope/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix critical diagram scope issue where all entities from all files are shown simultaneously, making single-file analysis confusing. Implement isolated file view (default), cross-file import resolution for dependencies, and optional project-wide view. Technical approach: extend DiagramGenerator with scope filtering, add ImportResolver to parse import statements and trace dependencies, introduce ViewModeState to toggle between file/project views.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 20+ LTS  
**Primary Dependencies**: React 18+, Zustand 5.0 (state), React Flow 12+ (@xyflow/react), dagre (layout), TypeScript Compiler API, idb 8.0 (IndexedDB)  
**Storage**: IndexedDB via idb library for file persistence (client-side)  
**Testing**: Vitest 4.0 (unit/integration), Playwright 1.56 (E2E), @testing-library/react  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari), client-side web application  
**Project Type**: Web application (single-page React app with frontend-only architecture)  
**Performance Goals**: Diagram update <200ms for files with 10 entities, <300ms for project view with 50 entities, import resolution <100ms per file  
**Constraints**: Client-side only (no backend), IndexedDB storage limits, must handle circular imports without infinite loops  
**Scale/Scope**: Projects with up to 100 files, up to 30 entities per file, up to 50 cross-file relationships in project view

**Current Architecture**:
- TypeScriptParser: Parses code and extracts class/interface definitions (`frontend/src/typescript-parser/`)
- DiagramGenerator: Converts parsed entities to React Flow nodes/edges (`frontend/src/diagram-visualization/`)
- Zustand Store: Central state with FileSlice, DiagramSlice, ParserSlice (`frontend/src/shared/store/index.ts`)
- useEditorController: Orchestrates parsing and diagram updates when files change

**Known Issues**:
- DiagramGenerator currently receives ALL parsed entities from ALL files (via `useAllParsedEntities`)
- No filtering by file scope or import relationships
- Diagram shows unrelated classes from other files when viewing a single file

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines
  - [x] No files planned >300 lines (ImportResolver, EntityFilter, ViewModeState all <250 lines)
  - [x] All names are descriptive and reveal intent (DiagramScope, ImportResolver, EntityFilter)
  - [x] No code duplication in design
  - [x] Complexity justified in writing (N/A - no exceptional complexity)

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers (diagram-visualization/ contains all diagram scope logic)
  - [x] Feature modules have clear boundaries (ImportResolver independent, EntityFilter independent)
  - [x] Feature is independently understandable (diagram scope is isolated from parser/editor)
  - [x] Shared code has clear purpose and justification (types shared via shared/types)

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria (3 user stories with 14 scenarios total in spec.md)
  - [x] Test strategy documented (contract tests for ImportResolver, integration tests for scope switching, E2E for user workflows)
  - [x] Tests will be written before implementation (TDD mandatory per constitution)
  - [x] Coverage targets defined (>80% for ImportResolver, EntityFilter, scope logic)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs (spec.md has 3 detailed user stories)
  - [x] User stories prioritized (P1: isolated view, P2: cross-file imports, P3: project view)
  - [x] Error messages are actionable and user-friendly (broken imports silently ignored, parse errors maintain last valid diagram)
  - [x] Performance expectations defined from user perspective (200ms for file view, 300ms for project view)

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
│   ├── diagram-visualization/          # Feature: Diagram generation and scope control
│   │   ├── DiagramGenerator.ts         # MODIFIED: Add scope filtering
│   │   ├── ImportResolver.ts           # NEW: Parse imports and build dependency graph
│   │   ├── EntityFilter.ts             # NEW: Filter entities by scope rules
│   │   ├── DiagramExporter.ts          # Existing (unchanged)
│   │   ├── LayoutEngine.ts             # Existing (unchanged)
│   │   ├── UMLFormatter.ts             # Existing (unchanged)
│   │   └── __tests__/
│   │       ├── DiagramGenerator.contract.test.ts  # MODIFIED: Add scope tests
│   │       ├── ImportResolver.contract.test.ts    # NEW: Import resolution tests
│   │       └── EntityFilter.unit.test.ts          # NEW: Filtering logic tests
│   ├── shared/
│   │   ├── store/
│   │   │   └── index.ts                # MODIFIED: Add ViewModeSlice
│   │   └── types/
│   │       └── index.ts                # MODIFIED: Add DiagramScope, ImportInfo types
│   ├── components/
│   │   └── ViewModeToggle.tsx          # NEW: Toggle between File/Project view
│   └── code-editor/
│       └── useEditorController.ts      # MODIFIED: Pass active file to diagram generator
└── tests/
    ├── integration/
    │   └── diagram-scope/
    │       ├── FileView.test.tsx       # NEW: File view isolation tests
    │       ├── CrossFileImports.test.tsx # NEW: Import resolution tests
    │       └── ProjectView.test.tsx    # NEW: Project view tests
    └── e2e/
        └── diagram-scope.spec.ts       # NEW: E2E scope switching scenarios
```

**Structure Decision**: Web application (frontend-only). Feature code organized under `diagram-visualization/` module following existing pattern. New components for view toggle follow existing component structure. Store modifications extend existing Zustand slice pattern.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All gates passed in Phase 0 and remain valid after Phase 1 design.

## Phase Summary

### Phase 0: Outline & Research ✅ COMPLETE

**Artifacts Generated**:
- `research.md` - Technical decisions for import parsing, circular dependency handling, path resolution, relationship detection, view mode state, auto-layout, and performance optimization

**Key Decisions**:
1. Use TypeScript Compiler API for import parsing (AST traversal)
2. BFS with visited set for circular dependency handling
3. Custom path resolver with file path lookup table
4. Extend existing DiagramGenerator (no changes to relationship detection)
5. Add ViewModeSlice to Zustand store
6. Continue using dagre layout with adjusted spacing
7. Reuse 300ms debounce pattern from existing code

**All NEEDS CLARIFICATION Resolved**: Yes - All technical unknowns have been researched and decided

---

### Phase 1: Design & Contracts ✅ COMPLETE

**Artifacts Generated**:
- `data-model.md` - Entity schemas (DiagramScope, ImportInfo, DependencyNode, FilteredEntitySet, ViewModeState)
- `contracts/import-resolver.contract.md` - API contract for ImportResolver with 12 contract tests
- `contracts/entity-filter.contract.md` - API contract for EntityFilter with filtering logic
- `quickstart.md` - Developer guide with implementation checklist and debugging tips
- `.github/copilot-instructions.md` - Updated with new technologies (TypeScript Compiler API, dependency graph patterns)

**Constitution Re-Check**: All gates still PASS after design phase

**Design Validation**:
- ✅ All entities have clear schemas with validation rules
- ✅ All functions have explicit contracts with examples
- ✅ Performance requirements defined (timing targets)
- ✅ Error handling strategy documented (no exceptions, defensive programming)
- ✅ Testing requirements specified (75 total tests across contract/integration/E2E)
- ✅ Data flow documented (ProjectFile → DependencyNode → FilteredEntitySet → Diagram)

---

### Phase 2: Task Breakdown ⏭️ NEXT

**Command**: `/speckit.tasks` (run separately after plan approval)

**Expected Output**: `tasks.md` with granular implementation tasks broken down by:
- Component/module
- Test-first sequence (write test → verify red → implement → verify green → refactor)
- Estimated complexity
- Dependencies between tasks

---

## Implementation Readiness Checklist

- [x] Feature specification complete (spec.md)
- [x] User scenarios defined with acceptance criteria
- [x] Technical research complete (research.md)
- [x] Data model designed (data-model.md)
- [x] API contracts specified (contracts/)
- [x] Developer guide created (quickstart.md)
- [x] Agent context updated (copilot-instructions.md)
- [x] Constitution gates passed
- [x] No unresolved clarifications
- [ ] Tasks broken down (Phase 2 - separate command)
- [ ] Implementation started (Phase 3+)

**Status**: Ready for Phase 2 (task breakdown)

**Branch**: `004-diagram-scope` (created by setup script)

**Next Steps**:
1. Review plan.md for completeness
2. Run `/speckit.tasks` to generate task breakdown
3. Begin TDD implementation following quickstart.md

````
