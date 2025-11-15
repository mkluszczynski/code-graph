# Implementation Plan: Persist Code Changes Between Sessions

**Branch**: `002-persist-code-changes` | **Date**: 2025-11-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-persist-code-changes/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Users currently lose all code changes when they refresh the browser or close the tab. This feature implements automatic persistence of code edits to IndexedDB with debounced auto-save (500ms-1000ms after typing stops), ensuring changes survive browser refreshes, crashes, and tab closures. The implementation extends the existing `ProjectManager` class to add an `updateFileContent()` method that's called from the code editor controller, and handles edge cases like storage quota exceeded, multi-tab conflicts, and storage unavailability.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ LTS  
**Primary Dependencies**: React 18+, Zustand (state management), idb 8.0+ (IndexedDB wrapper), Monaco Editor, TypeScript Compiler API  
**Storage**: IndexedDB (via idb library) for client-side file persistence  
**Testing**: Vitest (unit tests), Playwright (e2e tests), fake-indexeddb (mocking), Testing Library (React components)  
**Target Platform**: Modern browsers (Chrome 24+, Firefox 16+, Safari 10+, Edge 12+) - client-side web application  
**Project Type**: Web (frontend SPA with Vite build system)  
**Performance Goals**: 
  - Auto-save debounce: 500ms-1000ms after typing stops (industry standard)
  - Storage write time: <100ms per file save operation
  - App load time: <2 seconds to restore all persisted files
  - Parse and diagram update: Existing <1 second debounce (already implemented)
**Constraints**:
  - Client-side only (no server/backend)
  - IndexedDB quota limits (~50MB minimum, typically 50% of available disk)
  - Must handle storage unavailability gracefully (incognito mode, corporate restrictions)
  - Multi-tab "last write wins" strategy
  - No data loss on browser refresh or crash
**Scale/Scope**: 
  - Support 50+ modified files without storage issues
  - Files up to 10KB each (typical TypeScript class/interface files)
  - Total project storage ~500KB-1MB expected

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines - Debounced auto-save function ~30 lines, storage quota check ~25 lines
  - [x] No files planned >300 lines - Extending existing ProjectManager (~300 lines) with +50 lines, new PersistenceController ~150 lines
  - [x] All names are descriptive and reveal intent - `debouncedAutoSave`, `checkStorageQuota`, `handleStorageError`, `restorePersistedState`
  - [x] No code duplication in design - Reuses existing IndexedDB utilities in `shared/utils/db.ts` and `ProjectManager.updateFile()`
  - [x] Complexity justified in writing - Debouncing is industry standard for auto-save to prevent excessive writes; multi-tab handling requires storage event listeners (unavoidable browser API complexity)

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers - Persistence logic lives in `project-management/` (feature module) and integrates with `code-editor/` controller
  - [x] Feature modules have clear boundaries - Clear separation: `ProjectManager` (file CRUD + persistence), `useEditorController` (editor integration), `db.ts` (storage primitives)
  - [x] Feature is independently understandable - Persistence can be understood and tested without knowing diagram visualization or TypeScript parsing details
  - [x] Shared code has clear purpose and justification - `shared/utils/db.ts` provides reusable IndexedDB primitives used by multiple modules

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria - 3 user stories (P1-P3) with 6 acceptance scenarios in spec.md, plus edge cases defined
  - [x] Test strategy documented - Contract tests for `updateFileContent()`, integration tests for editor auto-save workflow, unit tests for debounce logic and quota checking, e2e tests for refresh persistence
  - [x] Tests will be written before implementation - TDD workflow: tests for each acceptance scenario before implementation
  - [x] Coverage targets defined - >80% for business logic (debounce, quota check, multi-tab detection), 100% for critical path (auto-save, restore on load)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs - Spec.md leads with 3 prioritized user stories describing user problems and value
  - [x] User stories prioritized (P1, P2, P3...) - P1 (edit persistence), P2 (crash recovery), P3 (save state visibility)
  - [x] Error messages are actionable and user-friendly - "Storage quota exceeded. Try deleting unused files." (not "QuotaExceededError: DOMException 22"), "Multiple tabs detected. Changes in this tab may be overwritten." (clear warning, not technical jargon)
  - [x] Performance expectations defined from user perspective - "Changes saved within 1 second of stopping typing" (SC-002), "Project restores in under 2 seconds" (SC-003) - user-perceivable metrics

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
│   ├── code-editor/
│   │   ├── CodeEditor.tsx                    # Monaco editor component
│   │   └── useEditorController.ts            # MODIFY: Add debounced auto-save
│   ├── project-management/
│   │   ├── ProjectManager.ts                 # MODIFY: Already has updateFile(), ensure it persists to IndexedDB
│   │   └── PersistenceController.ts          # NEW: Handles quota checks, multi-tab detection, restore on load
│   ├── shared/
│   │   ├── store/
│   │   │   └── index.ts                      # MODIFY: Add persistence state (lastSaved timestamp, quota status)
│   │   ├── types/
│   │   │   ├── index.ts                      # MODIFY: Add StorageMetadata type
│   │   │   └── errors.ts                     # MODIFY: Add QuotaExceededError, StorageUnavailableError
│   │   ├── utils/
│   │   │   └── db.ts                         # EXISTS: Already has updateFileContent() - reuse it
│   │   └── constants.ts                      # MODIFY: Add AUTOSAVE_DEBOUNCE_MS = 500
│   └── App.tsx                                # MODIFY: Initialize PersistenceController on mount
└── tests/
    ├── integration/
    │   ├── auto-save.test.ts                  # NEW: Editor typing → auto-save → IndexedDB
    │   └── restore-state.test.ts              # NEW: Page refresh → restored files
    ├── e2e/
    │   └── persistence.spec.ts                # NEW: Full user workflow with real browser storage
    └── unit/
        ├── debounce-auto-save.test.ts         # NEW: Debounce logic unit tests
        └── quota-check.test.ts                # NEW: Storage quota validation
```

**Structure Decision**: This is a web application (frontend SPA). The persistence feature extends existing modules (`project-management/`, `code-editor/`) rather than creating a new top-level domain. This aligns with the feature-driven structure principle because:
- Persistence is part of the "project management" domain (file operations)
- Editor integration is part of the "code editing" domain (auto-save on typing)
- Storage primitives remain in `shared/utils/` as reusable infrastructure

No backend or mobile components exist; this is purely client-side browser storage.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitutional gates pass:
- Functions stay under 50 lines
- Files stay under 300 lines (ProjectManager at ~300, adding ~50 lines is acceptable)
- Feature-driven structure maintained
- Test-first approach defined
- User-centric design with clear priorities

---

## Post-Design Constitution Re-Check

**Date**: 2025-11-15  
**Status**: ✅ PASSED - All gates remain compliant after design phase

### Re-evaluation Results:

- **Clean Code Gate**: ✅ PASS
  - PersistenceController: ~200 lines total (well under 300)
  - Largest function: `initialize()` at ~35 lines (under 50)
  - All functions have single responsibility
  - No code duplication (reuses existing ProjectManager methods)
  
- **Feature-Driven Structure Gate**: ✅ PASS
  - Persistence module lives in `project-management/` feature (correct domain)
  - Clear boundaries: PersistenceController (orchestration) vs ProjectManager (storage primitives)
  - Store slice follows Zustand patterns (co-located with other slices)
  
- **Test-First Gate**: ✅ PASS
  - Contract tests defined for all public methods (persistence-controller.contract.md)
  - Unit tests scoped: debounce logic, quota checks, slice actions
  - Integration tests defined: auto-save workflow, state restoration
  - E2E tests defined: full user persistence scenarios
  - Coverage targets: >80% business logic, 100% critical path
  
- **User Experience Gate**: ✅ PASS
  - All error messages are user-friendly and actionable (see contracts/)
  - Graceful degradation for all failure modes (storage unavailable, quota exceeded)
  - Performance targets are user-perceivable (<2s restore, <1s auto-save)
  - Visual feedback designed (save indicators, warning banners)

### Design Changes from Initial Plan:

None. The design maintains all commitments from the initial Constitution Check. No compromises or workarounds were needed.

### Conclusion:

The design is constitutionally compliant and ready for implementation (Phase 2: tasks).
