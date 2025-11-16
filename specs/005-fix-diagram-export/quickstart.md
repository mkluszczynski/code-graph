# Quickstart: Fix Diagram Export & Add Clipboard Copy

**Feature**: 005-fix-diagram-export  
**Date**: 2025-11-16  
**Estimated Duration**: 2-3 days

## Overview

Fix PNG export to properly crop diagrams to content size (eliminating excessive whitespace) and add clipboard copy functionality for quick sharing. Remove non-functional SVG export option.

**User Impact**: Users can now export correctly-sized diagram images and copy them directly to clipboard for pasting into emails, documents, and chat applications.

---

## Prerequisites

✅ **Required Reading**:
- [spec.md](./spec.md) - Feature specification with user stories
- [data-model.md](./data-model.md) - Type definitions and data flow
- [research.md](./research.md) - Technical decisions and implementation approach
- contracts/bounding-box.contract.md - Bounding box calculation contract
- contracts/clipboard-copy.contract.md - Clipboard copy contract

✅ **Development Environment**:
- Node.js 20+ LTS
- pnpm 8+
- VS Code with TypeScript and React extensions

✅ **Existing Knowledge**:
- React 19+ with hooks
- TypeScript 5.9+
- React Flow basics (@xyflow/react)
- Vitest and Playwright testing

---

## Quick Setup

```bash
# 1. Ensure you're on the feature branch
git checkout 005-fix-diagram-export

# 2. Install dependencies (if not already done)
cd frontend
pnpm install

# 3. Run development server
pnpm dev

# 4. Open test runner in watch mode (separate terminal)
pnpm test

# 5. Run E2E tests (when ready)
pnpm test:e2e
```

---

## Implementation Phases

### Phase 1: Bounding Box Calculation (P1 - PNG Export Fix)

**Goal**: Fix PNG export to crop images to diagram content with minimal padding

**Duration**: 4-6 hours

**Tasks**:
1. ✅ Read contracts/bounding-box.contract.md thoroughly
2. Write contract tests in `frontend/tests/unit/diagram-visualization/BoundingBox.test.ts`
   - Test cases TC-001 through TC-006 (success cases)
   - Error cases EC-001 through EC-005
   - Verify tests FAIL (red phase)
3. Implement `calculateBoundingBox()` function in `DiagramExporter.ts`
   - Use `getNodesBounds()` from @xyflow/react
   - Add padding calculation
   - Add validation for empty nodes and invalid padding
4. Run tests until they PASS (green phase)
5. Refactor for clarity (maintain green)

**Success Criteria**:
- ✅ All 11 contract tests passing
- ✅ Function completes in <100ms for 100 nodes
- ✅ Exported PNGs are ≤110% of minimum bounding box size

**Files Modified**:
- `frontend/src/diagram-visualization/DiagramExporter.ts` (add calculateBoundingBox)
- `frontend/src/shared/types/index.ts` (add BoundingBox type)
- `frontend/tests/unit/diagram-visualization/BoundingBox.test.ts` (new file)

---

### Phase 2: Update PNG Export (P1 - Continued)

**Goal**: Integrate bounding box calculation into PNG export flow

**Duration**: 2-3 hours

**Tasks**:
1. Modify `exportToPng()` in DiagramExporter.ts
   - Replace hardcoded width/height with `calculateBoundingBox()`
   - Update html-to-image options with proper transform
   - Add performance monitoring (warn if >2s)
2. Update integration tests in `frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx`
   - Test export with various diagram sizes
   - Verify image dimensions match expected bounds
   - Test error handling for empty diagrams
3. Manual testing:
   - Export diagram with 5 classes → verify no excessive whitespace
   - Export large diagram → verify complete diagram captured
   - Export small diagram → verify compact output

**Success Criteria**:
- ✅ Exported images contain only diagram content + padding
- ✅ Export completes in <2s for 20 entities
- ✅ Visual appearance matches viewport (colors, fonts, layout)

**Files Modified**:
- `frontend/src/diagram-visualization/DiagramExporter.ts` (update exportToPng)
- `frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx` (new file)

---

### Phase 3: Clipboard Copy (P2 - New Feature)

**Goal**: Add clipboard copy functionality

**Duration**: 4-6 hours

**Tasks**:
1. ✅ Read contracts/clipboard-copy.contract.md thoroughly
2. Write contract tests in `frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts`
   - Test cases TC-001 through TC-007
   - Error cases EC-001 through EC-003
   - Mock navigator.clipboard API
   - Verify tests FAIL (red phase)
3. Implement `copyImageToClipboard()` in DiagramExporter.ts
   - Convert data URL to Blob using fetch()
   - Use navigator.clipboard.write() with ClipboardItem
   - Map errors to ClipboardResult with user-friendly messages
   - Add 10-second timeout for blob conversion
4. Add ClipboardResult and ClipboardErrorCode types to shared/types/index.ts
5. Run tests until they PASS (green phase)
6. Refactor for clarity (maintain green)

**Success Criteria**:
- ✅ All 10 contract tests passing
- ✅ Clipboard copy completes in <2s
- ✅ User-friendly error messages for all failure cases
- ✅ Works in Chrome, Firefox, Safari, Edge

**Files Modified**:
- `frontend/src/diagram-visualization/DiagramExporter.ts` (add copyImageToClipboard)
- `frontend/src/shared/types/index.ts` (add ClipboardResult, ClipboardErrorCode)
- `frontend/tests/unit/diagram-visualization/ClipboardCopy.test.ts` (new file)

---

### Phase 4: Update UI (P2 - Continued)

**Goal**: Add clipboard copy button to ExportButton component

**Duration**: 2-3 hours

**Tasks**:
1. Add "Copy to Clipboard" menu item in ExportButton.tsx
   - Create `onCopyToClipboard` prop and handler
   - Add Clipboard icon (from lucide-react)
   - Display success/error feedback based on ClipboardResult
2. Wire up clipboard copy in App.tsx
   - Create handler that calls DiagramExporter.copyImageToClipboard()
   - Generate image using same logic as PNG export
   - Pass handler to ExportButton
3. Update integration tests
   - Test clipboard button appears and is clickable
   - Test success feedback display
   - Test error feedback display
   - Mock clipboard API in tests

**Success Criteria**:
- ✅ Copy button visible in export menu
- ✅ Success message displayed on successful copy
- ✅ Error message displayed on failure with actionable guidance
- ✅ Integration tests passing

**Files Modified**:
- `frontend/src/components/ExportButton.tsx` (add clipboard menu item)
- `frontend/src/App.tsx` (add clipboard handler)
- `frontend/tests/integration/diagram-visualization/DiagramExport.test.tsx` (add clipboard tests)

---

### Phase 5: Remove SVG Export (P3 - Cleanup)

**Goal**: Remove non-functional SVG export option

**Duration**: 1-2 hours

**Tasks**:
1. Remove SVG menu item from ExportButton.tsx
   - Delete `onExportSvg` prop
   - Remove "Export as SVG" DropdownMenuItem
2. Deprecate `exportToSvg()` in DiagramExporter.ts
   - Add @deprecated JSDoc comment
   - Make function throw error with helpful message
3. Remove SVG-related tests
   - Delete SVG test cases from ExportButton.test.tsx
   - Update integration tests
4. Update documentation (if any mentions SVG export)

**Success Criteria**:
- ✅ Only PNG and Clipboard options visible in export menu
- ✅ No references to SVG export in UI
- ✅ All tests passing after removal

**Files Modified**:
- `frontend/src/components/ExportButton.tsx` (remove SVG option)
- `frontend/src/diagram-visualization/DiagramExporter.ts` (deprecate exportToSvg)
- `frontend/src/components/__tests__/ExportButton.test.tsx` (remove SVG tests)

---

### Phase 6: E2E Testing (All Priorities)

**Goal**: Validate full user workflows with E2E tests

**Duration**: 2-3 hours

**Tasks**:
1. Create `frontend/tests/e2e/diagram-export.spec.ts`
2. Test User Story 1 scenarios (PNG export with correct sizing)
   - Create diagram with 5 classes
   - Export to PNG
   - Verify image size matches expected bounds
   - Verify image content visually (Playwright screenshot comparison)
3. Test User Story 2 scenarios (clipboard copy)
   - Create diagram
   - Click "Copy to Clipboard"
   - Mock clipboard API to capture copied data
   - Verify copied image is valid PNG
   - Verify success message displayed
4. Test error scenarios
   - Empty diagram → error message
   - Clipboard permission denied → helpful error
5. Manual verification
   - Export PNG and open in image viewer
   - Copy to clipboard and paste in Google Docs, Slack, email

**Success Criteria**:
- ✅ All E2E tests passing
- ✅ Manual verification successful across different applications
- ✅ Performance meets targets (<2s for typical diagrams)

**Files Created**:
- `frontend/tests/e2e/diagram-export.spec.ts` (new file)

---

## Testing Strategy

### Test Pyramid

```
       E2E (6 tests)               ← Full user workflows
      /              \
 Integration (12 tests)            ← Component + module interactions
    /                  \
Contract/Unit (21 tests)           ← Business logic, isolated functions
```

**Total Tests**: ~39 new tests

### Running Tests

```bash
# Unit + Integration tests (watch mode)
pnpm test

# Unit + Integration tests (single run with coverage)
pnpm test -- --coverage

# E2E tests (headless)
pnpm test:e2e

# E2E tests (headed mode for debugging)
pnpm test:e2e --headed

# Run specific test file
pnpm test DiagramExport.test.tsx
```

### Coverage Targets

- **Contract/Unit**: >80% coverage for DiagramExporter.ts
- **Integration**: 100% coverage for ExportButton user interactions
- **E2E**: 100% coverage for acceptance scenarios in spec.md

---

## Common Pitfalls & Solutions

### Issue: Bounding box calculation returns NaN

**Cause**: Nodes with invalid dimensions or unmeasured nodes  
**Solution**: Ensure nodes have valid width/height; use React Flow's measured dimensions

```typescript
// Check node dimensions before calculating
const validNodes = nodes.filter(n => 
  Number.isFinite(n.width) && Number.isFinite(n.height)
);
```

---

### Issue: html-to-image captures wrong viewport area

**Cause**: Incorrect transform or missing scale factor  
**Solution**: Use negative translate values to shift viewport correctly

```typescript
// Correct transform
transform: `translate(${-bbox.x}px, ${-bbox.y}px) scale(1)`
// NOT: translate(${bbox.x}px, ${bbox.y}px)
```

---

### Issue: Clipboard copy fails silently

**Cause**: Missing user gesture or HTTPS requirement  
**Solution**: Ensure function is called from click handler and page is HTTPS/localhost

```typescript
// Good: Direct user gesture
<button onClick={handleCopy}>Copy</button>

// Bad: Delayed or indirect call
setTimeout(handleCopy, 1000); // May fail in some browsers
```

---

### Issue: Tests fail with "clipboard is not defined"

**Cause**: Navigator.clipboard not available in test environment  
**Solution**: Mock the clipboard API in tests

```typescript
// In test setup
global.navigator.clipboard = {
  write: vi.fn().mockResolvedValue(undefined),
  // ... other methods
};
```

---

### Issue: Exported image has wrong colors or missing styles

**Cause**: Styles not applied before html-to-image capture  
**Solution**: Ensure React Flow has finished rendering; wait for RAF

```typescript
await new Promise(resolve => requestAnimationFrame(resolve));
const dataUrl = await toPng(element, options);
```

---

## Validation Checklist

Before marking feature complete, verify:

- [ ] All 39+ tests passing (unit, integration, E2E)
- [ ] PNG export produces correctly-sized images (≤110% of bounds)
- [ ] Clipboard copy works in Chrome, Firefox, Safari, Edge
- [ ] Error messages are user-friendly and actionable
- [ ] Performance meets targets (<2s for export/copy with 20 entities)
- [ ] SVG export option removed from UI
- [ ] Manual testing successful:
  - [ ] Export small diagram (2 classes) → compact image
  - [ ] Export medium diagram (10 classes) → properly cropped
  - [ ] Export large diagram (50+ classes) → complete diagram captured
  - [ ] Copy to clipboard → paste in Google Docs (works)
  - [ ] Copy to clipboard → paste in Slack (works)
  - [ ] Copy to clipboard → paste in email client (works)
- [ ] Code review completed
- [ ] Documentation updated (if needed)
- [ ] Constitution Check gates still passing

---

## Success Metrics

**Quantitative**:
- ✅ Exported PNG file size reduced by >60% (measured before/after)
- ✅ Image dimensions within 110% of minimum bounding box
- ✅ Export/copy completes in <2s for diagrams with ≤20 entities
- ✅ >80% test coverage for DiagramExporter module
- ✅ Zero SVG export references in UI

**Qualitative**:
- ✅ Users report successful clipboard paste in external apps
- ✅ No user confusion about export options
- ✅ Error messages are clear and helpful

---

## Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Bounding Box | 4-6h | P1 |
| Phase 2: Update PNG Export | 2-3h | P1 |
| Phase 3: Clipboard Copy | 4-6h | P2 |
| Phase 4: Update UI | 2-3h | P2 |
| Phase 5: Remove SVG | 1-2h | P3 |
| Phase 6: E2E Testing | 2-3h | All |
| **Total** | **15-23h** | **~2-3 days** |

---

## Next Steps

1. **Read all prerequisite documents** (spec, data-model, research, contracts)
2. **Start with Phase 1** (bounding box calculation)
3. **Follow TDD strictly** (red → green → refactor)
4. **Run tests frequently** (keep feedback loop tight)
5. **Manual testing after each phase** (verify user experience)
6. **Update this checklist** as you complete each task

---

## Need Help?

- **Bounding box questions**: See research.md "How to calculate accurate bounding boxes"
- **Clipboard API issues**: See research.md "How to copy images to clipboard"
- **Performance concerns**: See research.md "Best practices for html-to-image performance"
- **Test setup**: See existing tests in `frontend/tests/` for patterns

**Remember**: Tests first, implementation second. Trust the TDD process!
