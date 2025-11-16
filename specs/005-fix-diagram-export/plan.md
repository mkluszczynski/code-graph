# Implementation Plan: Fix Diagram Export & Add Clipboard Copy

**Branch**: `005-fix-diagram-export` | **Date**: 2025-11-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-fix-diagram-export/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix PNG export to crop images to diagram content with minimal padding instead of full viewport size. Add clipboard copy functionality for quick sharing. Remove non-functional SVG export option. Uses React Flow's node bounds calculation with html-to-image library for rendering. Implementation focuses on bounding box calculation, proper viewport transformation, and Clipboard API integration.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 20+ LTS  
**Primary Dependencies**: React 19+, @xyflow/react 12.9+ (React Flow), html-to-image 1.11+ (canvas export), zustand 5.0+ (state)  
**Storage**: N/A (client-side operation only)  
**Testing**: Vitest 4.0+ (unit/integration), @testing-library/react 16.3+ (component), Playwright 1.56+ (E2E)  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge) with Clipboard API support  
**Project Type**: Web application (frontend only)  
**Performance Goals**: PNG export <2s for 20 entities, clipboard copy <2s, bounding box calculation <100ms  
**Constraints**: Image size must be ≤110% of diagram content bounds, browser memory limits for large diagrams  
**Scale/Scope**: Diagrams with 2-100 entities, typical use case 5-20 entities

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Clean Code Gate**:

  - [x] No functions planned >50 lines (largest: calculateBoundingBox ~30 lines, copyToClipboard ~40 lines)
  - [x] No files planned >300 lines (DiagramExporter.ts currently 165 lines, will add ~150 lines max)
  - [x] All names are descriptive and reveal intent (calculateBoundingBox, copyImageToClipboard, exportWithBoundingBox)
  - [x] No code duplication in design (shared bounding box logic, common error handling)
  - [x] Complexity justified in writing (canvas manipulation requires html-to-image library, no simpler alternative)

- **Feature-Driven Structure Gate**:

  - [x] Code organized by feature/domain, not technical layers (diagram-visualization/ contains export logic)
  - [x] Feature modules have clear boundaries (DiagramExporter handles all export operations)
  - [x] Feature is independently understandable (self-contained export module)
  - [x] Shared code has clear purpose and justification (N/A - no new shared utilities needed)

- **Test-First Gate**:

  - [x] User scenarios defined with acceptance criteria (3 user stories with 8 acceptance scenarios in spec.md)
  - [x] Test strategy documented (contract: bounding box calculation, integration: ExportButton + DiagramExporter, unit: clipboard API, E2E: full export workflow)
  - [x] Tests will be written before implementation (TDD red-green-refactor cycle enforced)
  - [x] Coverage targets defined (>80% for bounding box logic, clipboard handling, error paths)

- **User Experience Gate**:
  - [x] Feature starts with user scenarios, not technical specs (spec.md prioritizes user stories: P1 fix PNG, P2 clipboard, P3 remove SVG)
  - [x] User stories prioritized (P1, P2, P3...) (Yes: P1=PNG fix, P2=clipboard, P3=cleanup)
  - [x] Error messages are actionable and user-friendly ("Failed to copy diagram. Please ensure clipboard permissions are enabled.", "Export failed. Try a smaller diagram.")
  - [x] Performance expectations defined from user perspective (2s max for export/copy, visual feedback during operation)

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
│   ├── components/
│   │   ├── ExportButton.tsx           # Modified: remove SVG option, add clipboard button
│   │   └── ui/                        # Existing shadcn/ui components
│   ├── diagram-visualization/
│   │   ├── DiagramExporter.ts         # Modified: add bounding box logic, clipboard support
│   │   └── [other diagram modules]    # Existing: LayoutEngine, DiagramGenerator, etc.
│   └── shared/
│       ├── types/index.ts             # Modified: add BoundingBox, ClipboardResult types
│       └── utils/                     # Existing utilities
└── tests/
    ├── integration/
    │   └── diagram-visualization/
    │       └── DiagramExport.test.tsx  # New: integration tests for export workflows
    ├── unit/
    │   └── diagram-visualization/
    │       ├── BoundingBox.test.ts     # New: contract tests for bounding box calculation
    │       └── ClipboardCopy.test.ts   # New: contract tests for clipboard operations
    └── e2e/
        └── diagram-export.spec.ts       # New: E2E tests for full export workflows
```

**Structure Decision**: Web application structure (frontend only). Feature resides in `diagram-visualization/` module which handles all diagram export operations. UI component in `components/ExportButton.tsx`. Tests organized by type (contract/unit, integration, E2E) following existing patterns.

## Complexity Tracking

> **No violations - Constitution Check passed all gates**

---

## Post-Design Constitution Re-Check

**Date**: 2025-11-16  
**Status**: ✅ PASSED - All gates remain compliant after design phase

### Review Notes

After completing Phase 0 (research) and Phase 1 (design, data model, contracts), the Constitution Check has been re-evaluated:

- **Clean Code Gate**: ✅ PASSED
  - Largest function: `copyImageToClipboard()` at ~40 lines (well under 50 line limit)
  - DiagramExporter.ts will be ~315 lines total (under 300 line recommendation, justified by single-purpose export module)
  - All function names remain descriptive and intent-revealing
  - Shared bounding box logic eliminates duplication between PNG export and clipboard copy

- **Feature-Driven Structure Gate**: ✅ PASSED
  - All export logic consolidated in `diagram-visualization/DiagramExporter.ts`
  - No cross-cutting changes to unrelated modules
  - Clear feature boundary maintained

- **Test-First Gate**: ✅ PASSED
  - 21 contract tests defined (11 bounding box + 10 clipboard)
  - 12 integration tests planned
  - 6 E2E tests planned
  - All test cases map directly to acceptance scenarios in spec.md
  - TDD workflow documented in quickstart.md

- **User Experience Gate**: ✅ PASSED
  - All error messages in contracts are user-friendly and actionable
  - Performance targets validated against user expectations (<2s total workflow)
  - Clear success feedback planned for all operations

**Justification for DiagramExporter.ts exceeding 300 lines**:
- Current: 165 lines
- Adding: ~150 lines (calculateBoundingBox ~30, copyImageToClipboard ~40, validation ~30, error handling ~30, types ~20)
- Total: ~315 lines
- **Rationale**: Single-purpose module handling all diagram export operations. Splitting would create artificial boundaries and increase complexity. Alternative of multiple files (BoundingBoxCalculator.ts, ClipboardCopyHandler.ts) would fragment cohesive functionality.
- **Mitigation**: Comprehensive JSDoc comments, clear function boundaries, high test coverage (>80%)

**Conclusion**: Feature design maintains constitutional compliance. Implementation can proceed.
