# Research: Fix Diagram Export & Add Clipboard Copy

**Feature**: 005-fix-diagram-export  
**Date**: 2025-11-16  
**Status**: Complete

## Research Questions

### 1. How to calculate accurate bounding boxes for React Flow diagrams?

**Decision**: Use `getNodesBounds()` from @xyflow/react with custom padding calculation

**Rationale**:
- React Flow provides `getNodesBounds()` that returns the minimum bounding rectangle containing all nodes
- Returns `{ x, y, width, height }` representing the absolute coordinates and dimensions
- Handles node positioning, dimensions, and transformations automatically
- Already integrated in existing codebase (imported but not properly utilized)
- More reliable than manually calculating bounds from node positions

**Implementation approach**:
```typescript
import { getNodesBounds } from "@xyflow/react";

function calculateBoundingBox(nodes: Node[], padding: number = 30) {
  const bounds = getNodesBounds(nodes);
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + (padding * 2),
    height: bounds.height + (padding * 2)
  };
}
```

**Alternatives considered**:
- Manual calculation from node positions: Rejected due to complexity and potential for errors with transformations
- Using viewport dimensions: Rejected as this is the current buggy behavior causing excessive whitespace
- SVG getBBox(): Rejected as it doesn't work well with React Flow's DOM structure

**References**:
- React Flow API: https://reactflow.dev/api-reference/utils/get-nodes-bounds
- Current implementation in DiagramExporter.ts uses `getViewportForBounds()` incorrectly

---

### 2. How to properly crop html-to-image output to bounding box?

**Decision**: Use html-to-image with custom `width`, `height`, and CSS transform options

**Rationale**:
- html-to-image library supports `width`, `height` parameters to control output dimensions
- CSS `transform` can be applied via `style` option to position the viewport correctly
- Need to translate viewport by negative x/y offset to "crop" to desired region
- This approach avoids post-processing the image (cropping after generation)

**Implementation approach**:
```typescript
import { toPng } from "html-to-image";

const bbox = calculateBoundingBox(nodes, padding);
const dataUrl = await toPng(viewportElement, {
  backgroundColor: '#ffffff',
  width: bbox.width,
  height: bbox.height,
  style: {
    width: `${bbox.width}px`,
    height: `${bbox.height}px`,
    transform: `translate(${-bbox.x}px, ${-bbox.y}px) scale(1)`,
  },
});
```

**Alternatives considered**:
- Generate full viewport then crop with canvas: Rejected due to unnecessary memory overhead and extra processing
- Use clipPath or clip-rect: Rejected as html-to-image doesn't support these directly
- Multiple rendering passes: Rejected due to complexity and performance concerns

**References**:
- html-to-image options: https://github.com/bubkoo/html-to-image#options
- CSS transform documentation: https://developer.mozilla.org/en-US/docs/Web/CSS/transform

---

### 3. How to copy images to clipboard in modern browsers?

**Decision**: Use Clipboard API with `navigator.clipboard.write()` and `ClipboardItem`

**Rationale**:
- Modern Clipboard API supports writing images directly (not just text)
- Requires converting data URL to Blob before writing
- Supported in Chrome 76+, Firefox 87+, Safari 13.1+, Edge 79+
- Requires HTTPS or localhost (security requirement)
- Needs clipboard-write permission (usually granted automatically)

**Implementation approach**:
```typescript
async function copyImageToClipboard(dataUrl: string): Promise<void> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  // Write to clipboard
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob })
  ]);
}
```

**Error handling**:
- Permission denied: Show user-friendly message about enabling clipboard permissions
- Not supported: Detect `navigator.clipboard` availability, fall back to showing error
- Blob conversion failure: Handle fetch errors gracefully

**Alternatives considered**:
- Legacy `document.execCommand('copy')`: Rejected as deprecated and only works with text
- Copy as base64 text: Rejected as it doesn't paste as image in external apps
- Download then instruct user to copy: Rejected as poor UX

**Browser compatibility notes**:
- Chrome/Edge: Full support
- Firefox: Full support (requires HTTPS)
- Safari: Full support (requires user gesture)
- All major browsers on desktop and mobile (with varying gesture requirements)

**References**:
- Clipboard API: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- ClipboardItem: https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem
- Browser compatibility: https://caniuse.com/async-clipboard

---

### 4. Best practices for html-to-image performance and quality?

**Decision**: Use default quality settings, add performance monitoring, implement proper error recovery

**Rationale**:
- html-to-image defaults are optimized for quality/performance balance
- PNG format preferred over JPEG for diagrams (lossless, supports transparency)
- Large diagrams (100+ entities) may cause memory issues - detect and warn users
- Add performance timing to identify slow operations

**Best practices**:
```typescript
// 1. Check diagram size before export
if (nodes.length > 100) {
  console.warn('Large diagram may take longer to export');
}

// 2. Use performance API for monitoring
const startTime = performance.now();
await toPng(element, options);
const duration = performance.now() - startTime;
if (duration > 2000) {
  console.warn(`Export took ${duration}ms`);
}

// 3. Proper error handling
try {
  await toPng(element, options);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    throw new Error('Diagram too large. Try reducing the number of entities.');
  }
  throw new Error('Export failed. Please try again.');
}
```

**Known limitations**:
- html-to-image captures DOM snapshot, may not include dynamic content rendered after capture
- External fonts must be loaded before capture (React Flow uses system fonts, not an issue)
- Very large diagrams (>10MB output) may fail due to browser memory limits

**Alternatives considered**:
- Pre-render to canvas: Rejected as React Flow already renders to DOM efficiently
- Progressive rendering: Rejected as added complexity not justified for typical use cases
- WebGL rendering: Rejected as overkill for UML diagrams

**References**:
- html-to-image performance tips: https://github.com/bubkoo/html-to-image#performance
- Canvas memory limits: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size

---

### 5. How to handle SVG export removal without breaking existing functionality?

**Decision**: Remove SVG export UI and handler, keep internal SVG generation for potential future use

**Rationale**:
- Current SVG export is broken due to incorrect implementation
- SVG export requires different approach than PNG (React Flow has `toSvg` helper but needs integration)
- Removing from UI prevents user confusion and support burden
- Keep `exportToSvg` function stub in DiagramExporter.ts for future implementation
- No breaking changes as this is a UI-only feature (no API consumers)

**Implementation approach**:
```typescript
// In ExportButton.tsx - remove SVG menu item and handler
// Before:
// <DropdownMenuItem onClick={() => handleExport(onExportSvg, "SVG")}>
//   Export as SVG
// </DropdownMenuItem>

// After: Only PNG and Clipboard options remain

// In DiagramExporter.ts - deprecate but keep function
/**
 * @deprecated SVG export is disabled. Will be reimplemented in future release.
 */
export async function exportToSvg(...) {
  throw new Error('SVG export is not available. Please use PNG export or clipboard copy.');
}
```

**User communication**:
- If users try old keyboard shortcuts, show deprecation message
- Update any documentation mentioning SVG export
- No migration needed as export is a one-time action (no saved state)

**Alternatives considered**:
- Fix SVG export instead: Rejected as out of scope for this feature (P3 cleanup priority)
- Complete removal of code: Rejected to maintain option for future reimplementation
- Keep UI but show "Coming Soon": Rejected as confusing for users

---

## Technology Stack Validation

### Dependencies Verified

✅ **@xyflow/react 12.9+**: Provides `getNodesBounds()` and React Flow integration  
✅ **html-to-image 1.11+**: Handles DOM to PNG conversion with cropping support  
✅ **React 19+**: Modern React with hooks for state management  
✅ **TypeScript 5.9+**: Type safety for bounding box calculations and clipboard operations  
✅ **Vitest 4.0+**: Unit and integration testing framework  
✅ **@testing-library/react 16.3+**: Component testing utilities  
✅ **Playwright 1.56+**: E2E testing with clipboard API mocking

### New Dependencies

**None required** - All functionality can be implemented with existing dependencies

---

## Implementation Strategy

### Phase 1: Bounding Box Calculation (P1 - PNG Export Fix)

1. Create `calculateBoundingBox()` utility in DiagramExporter.ts
2. Add contract tests for bounding box calculation
3. Modify `exportToPng()` to use calculated bounding box
4. Add integration tests for PNG export with various diagram sizes
5. Verify exported images meet SC-001 (≤110% of minimum bounds)

### Phase 2: Clipboard Copy (P2 - New Feature)

1. Create `copyImageToClipboard()` function in DiagramExporter.ts
2. Add contract tests for clipboard operations (with mocks)
3. Add "Copy to Clipboard" button to ExportButton.tsx
4. Implement error handling for clipboard permission errors
5. Add E2E tests with Playwright (clipboard API mocking)

### Phase 3: SVG Cleanup (P3 - UI Cleanup)

1. Remove SVG menu item from ExportButton.tsx
2. Deprecate `exportToSvg()` function with error message
3. Update tests to remove SVG export scenarios
4. Update documentation

### Testing Strategy

**Contract Tests** (frontend/tests/unit/diagram-visualization/):
- BoundingBox.test.ts: Test bounding box calculation with various node configurations
- ClipboardCopy.test.ts: Test clipboard operations with mocked Clipboard API

**Integration Tests** (frontend/tests/integration/diagram-visualization/):
- DiagramExport.test.tsx: Test ExportButton + DiagramExporter integration
- Verify export flow with different diagram states
- Test error handling and user feedback

**E2E Tests** (frontend/tests/e2e/):
- diagram-export.spec.ts: Full user workflows for export and clipboard copy
- Mock clipboard API for automated testing
- Verify visual appearance of exported images

---

## Open Questions & Risks

### Resolved

✅ **Q**: Can we accurately calculate bounding box for all diagram types?  
**A**: Yes, React Flow's `getNodesBounds()` handles all node positioning and transformations.

✅ **Q**: Will clipboard copy work across all target browsers?  
**A**: Yes, Clipboard API is widely supported in modern browsers (Chrome 76+, Firefox 87+, Safari 13.1+).

✅ **Q**: How to handle very large diagrams (100+ entities)?  
**A**: Add performance monitoring and user warnings. Set practical limits in UI if needed.

### Remaining

None - all technical questions resolved.

---

## References

- React Flow Documentation: https://reactflow.dev/api-reference
- html-to-image GitHub: https://github.com/bubkoo/html-to-image
- Clipboard API MDN: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- Project Constitution: ../../.specify/memory/constitution.md
- Feature Spec: ./spec.md
