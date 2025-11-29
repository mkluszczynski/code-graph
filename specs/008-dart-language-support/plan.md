# Implementation Plan: Dart Language Support

**Branch**: `008-dart-language-support` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-dart-language-support/spec.md`

## Summary

Add Dart language support for UML class diagram visualization, requiring:
1. User-specified file extensions when creating files (removing auto-.ts suffix)
2. A unified `parsers` module with abstract base class for extensible parser development
3. A new Dart parser implementing the parser abstraction
4. Warning icons for unsupported file extensions in the file tree

Technical approach: Create a unified `parsers/` module that consolidates all language parsers (TypeScript, Dart, future languages) with an abstract `LanguageParser` base class. This enables easy addition of new language support by implementing the abstract interface. Move existing TypeScript parser into the new module structure. Extend the CreateDialog to require explicit file extensions. Add language detection and routing in the editor controller.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React 19+, Node.js 20+ LTS  
**Primary Dependencies**: React, Zustand 5.0, Monaco Editor, idb 8.0, shadcn/ui, Lucide React, dart-parser (to be selected - see research.md)  
**Storage**: IndexedDB (via idb library) for client-side file persistence  
**Testing**: Vitest for unit/integration tests, Playwright for E2E tests  
**Target Platform**: Modern browsers (client-side web application)  
**Project Type**: Web application (frontend only)  
**Performance Goals**: <200ms diagram update for 10 entities (SC-002), <5s file creation (SC-001)  
**Constraints**: All parsing happens client-side, offline-capable, no backend dependency  
**Scale/Scope**: Single-user code visualization tool, typically <50 files, <500 entities

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines
  - [x] No files planned >300 lines (DartParser will follow TypeScriptParser pattern ~120 lines)
  - [x] All names are descriptive and reveal intent (DartParser, parseClass, extractProperties, etc.)
  - [x] No code duplication in design (shared extraction interfaces between parsers)
  - [x] Complexity justified in writing (if applicable)

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers (dart-parser/ directory)
  - [x] Feature modules have clear boundaries (parser isolated, integrates via shared types)
  - [x] Feature is independently understandable (Dart parser mirrors TypeScript parser structure)
  - [x] Shared code has clear purpose and justification (shared types for ClassDefinition, etc.)

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria (spec.md has 13 acceptance scenarios)
  - [x] Test strategy documented (contract, integration, unit) - see below
  - [x] Tests will be written before implementation
  - [x] Coverage targets defined (>80% for business logic)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs (3 user stories in spec)
  - [x] User stories prioritized (P1, P2, P3...)
  - [x] Error messages are actionable and user-friendly (validation messages, tooltip for unsupported)
  - [x] Performance expectations defined from user perspective (SC-001 to SC-006)

### Test Strategy

| Layer | Focus | Location |
|-------|-------|----------|
| Contract | LanguageParser interface, DartParser contracts, extractors | `tests/unit/parsers/` |
| Integration | Parser + DiagramGenerator integration, file creation flow | `tests/integration/parsers/` |
| E2E | Full workflows (create .dart file, view diagram, warning icons) | `tests/e2e/dart-language.spec.ts` |

## Project Structure

### Documentation (this feature)

```text
specs/008-dart-language-support/
├── plan.md              # This file
├── research.md          # Dart parser library selection
├── data-model.md        # SupportedLanguage, LanguageParser abstraction
├── quickstart.md        # Development setup guide
├── contracts/           # Parser API contracts
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── parsers/                        # NEW: Unified parsers module
│   │   ├── index.ts                    # Public exports, parser registry
│   │   ├── LanguageParser.ts           # Abstract base class for all parsers
│   │   ├── ParserRegistry.ts           # Parser lookup by language/extension
│   │   ├── typescript/                 # MOVE: TypeScript parser (from typescript-parser/)
│   │   │   ├── TypeScriptParser.ts     # Implements LanguageParser
│   │   │   ├── ClassExtractor.ts
│   │   │   ├── InterfaceExtractor.ts
│   │   │   ├── PropertyExtractor.ts
│   │   │   ├── MethodExtractor.ts
│   │   │   └── RelationshipAnalyzer.ts
│   │   ├── dart/                       # NEW: Dart parser
│   │   │   ├── DartParser.ts           # Implements LanguageParser
│   │   │   ├── ClassExtractor.ts
│   │   │   ├── InterfaceExtractor.ts
│   │   │   ├── PropertyExtractor.ts
│   │   │   ├── MethodExtractor.ts
│   │   │   └── RelationshipAnalyzer.ts
│   │   └── __tests__/                  # Parser unit tests
│   ├── typescript-parser/              # DEPRECATED: To be moved to parsers/typescript/
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts                # MODIFY: Add SupportedLanguage, ParserConfig
│   │   └── utils/
│   │       └── languageDetection.ts    # NEW: Extension-to-parser routing
│   ├── file-tree/
│   │   ├── FileOperations.ts           # MODIFY: Remove auto-.ts extension
│   │   └── FileTreeView.tsx            # MODIFY: Add warning icon for unsupported
│   ├── components/
│   │   ├── CreateDialog.tsx            # MODIFY: Require file extension
│   │   └── UnsupportedLanguageIcon.tsx # NEW: Warning icon with tooltip
│   └── code-editor/
│       └── useEditorController.ts      # MODIFY: Use ParserRegistry instead of direct import
└── tests/
    ├── unit/
    │   └── parsers/                    # All parser contract tests
    │       ├── LanguageParser.test.ts
    │       ├── typescript/
    │       └── dart/
    ├── integration/
    │   └── parsers/                    # Parser integration tests
    └── e2e/
        └── dart-language.spec.ts       # E2E tests
```

**Structure Decision**: Unified `parsers/` module with abstract base class enables:
1. Consistent parser interface across languages
2. Easy addition of new language support (implement LanguageParser)
3. Central parser registry for language detection and routing
4. Shared test patterns and utilities

## Complexity Tracking

> No Constitution Check violations identified.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A | N/A | N/A |
