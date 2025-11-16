# Data Model: Fix Diagram Export & Add Clipboard Copy

**Feature**: 005-fix-diagram-export  
**Date**: 2025-11-16  
**Status**: Complete

## Overview

This feature introduces new types for bounding box calculation and clipboard operations. Since the export functionality is purely client-side and stateless (no persistence), the data model focuses on operational types used during export/clipboard workflows.

---

## Core Entities

### BoundingBox

Represents the rectangular area containing all diagram elements with padding.

**Properties**:
- `x: number` - Left coordinate of the bounding box in pixels (absolute position)
- `y: number` - Top coordinate of the bounding box in pixels (absolute position)
- `width: number` - Width of the bounding box in pixels
- `height: number` - Height of the bounding box in pixels

**Validation Rules**:
- All properties must be finite numbers
- `width` and `height` must be > 0
- `x` and `y` can be any finite number (including negative for diagrams positioned left/above origin)

**Usage**:
- Calculated from React Flow nodes using `getNodesBounds()` + padding
- Passed to `html-to-image` for viewport cropping during export

**Relationships**:
- Derived from: `Node[]` (React Flow nodes)
- Used by: `exportToPng()`, `copyImageToClipboard()`

---

### ExportOptions (Modified)

Configuration for diagram export operations. **Extends existing type** in DiagramExporter.ts.

**Existing Properties** (unchanged):
- `backgroundColor?: string` - Background color for exported image (default: "#ffffff")
- `fileName?: string` - File name without extension (default: "diagram")

**New Properties**:
- `padding?: number` - Padding around diagram content in pixels (default: 30)
- `maxWidth?: number` - Optional maximum width constraint (for very large diagrams)
- `maxHeight?: number` - Optional maximum height constraint (for very large diagrams)

**Removed Properties**:
- ~~`width?: number`~~ - No longer used (calculated from bounding box)
- ~~`height?: number`~~ - No longer used (calculated from bounding box)

**Validation Rules**:
- `padding` must be >= 0 and <= 200 (prevent excessive padding)
- `backgroundColor` must be valid CSS color (hex, rgb, rgba, or named color)
- `fileName` must not contain invalid file system characters
- `maxWidth` and `maxHeight` if provided must be >= 100 (minimum viable export size)

**State Transitions**:
- N/A (stateless options object)

---

### ClipboardResult

Result of clipboard copy operation with success/failure information.

**Properties**:
- `success: boolean` - Whether the copy operation succeeded
- `error?: string` - User-friendly error message if `success` is false
- `errorCode?: ClipboardErrorCode` - Machine-readable error code for logging/telemetry

**ClipboardErrorCode Enum**:
```typescript
enum ClipboardErrorCode {
  PERMISSION_DENIED = 'permission_denied',
  NOT_SUPPORTED = 'not_supported',
  BLOB_CONVERSION_FAILED = 'blob_conversion_failed',
  WRITE_FAILED = 'write_failed',
  UNKNOWN = 'unknown'
}
```

**Validation Rules**:
- If `success` is false, `error` must be present
- If `success` is true, `error` and `errorCode` must be undefined

**Usage**:
- Returned by `copyImageToClipboard()` function
- Used by ExportButton component to display success/error feedback

**State Transitions**:
```
Initial State (before operation)
  ↓
Attempting Copy
  ↓
  ├─→ Success: { success: true }
  └─→ Failure: { success: false, error: "...", errorCode: "..." }
```

---

## Derived Data

### ImageDimensions (Internal)

Calculated dimensions for the exported image. **Internal to DiagramExporter.ts**, not exported.

**Properties**:
- `width: number` - Final image width in pixels
- `height: number` - Final image height in pixels
- `x: number` - X offset for viewport transform
- `y: number` - Y offset for viewport transform
- `scale: number` - Scale factor (always 1.0 for this feature, reserved for future zoom support)

**Derivation Logic**:
```typescript
function calculateImageDimensions(
  nodes: Node[], 
  options: ExportOptions
): ImageDimensions {
  const padding = options.padding ?? 30;
  const bounds = getNodesBounds(nodes);
  
  let width = bounds.width + (padding * 2);
  let height = bounds.height + (padding * 2);
  
  // Apply max constraints if provided
  if (options.maxWidth && width > options.maxWidth) {
    width = options.maxWidth;
  }
  if (options.maxHeight && height > options.maxHeight) {
    height = options.maxHeight;
  }
  
  return {
    width,
    height,
    x: bounds.x - padding,
    y: bounds.y - padding,
    scale: 1.0
  };
}
```

---

## Type Definitions

**Location**: `frontend/src/shared/types/index.ts`

```typescript
/**
 * Bounding box for diagram export operations
 */
export interface BoundingBox {
  /** Left coordinate in pixels (absolute position) */
  x: number;
  /** Top coordinate in pixels (absolute position) */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Options for exporting diagrams
 */
export interface ExportOptions {
  /** Background color (default: "#ffffff") */
  backgroundColor?: string;
  /** Padding around content in pixels (default: 30) */
  padding?: number;
  /** Maximum width constraint for large diagrams */
  maxWidth?: number;
  /** Maximum height constraint for large diagrams */
  maxHeight?: number;
  /** File name without extension (default: "diagram") */
  fileName?: string;
}

/**
 * Error codes for clipboard operations
 */
export enum ClipboardErrorCode {
  /** User denied clipboard permissions */
  PERMISSION_DENIED = 'permission_denied',
  /** Browser doesn't support Clipboard API */
  NOT_SUPPORTED = 'not_supported',
  /** Failed to convert data URL to blob */
  BLOB_CONVERSION_FAILED = 'blob_conversion_failed',
  /** Clipboard write operation failed */
  WRITE_FAILED = 'write_failed',
  /** Unknown error */
  UNKNOWN = 'unknown'
}

/**
 * Result of clipboard copy operation
 */
export interface ClipboardResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** User-friendly error message (if failed) */
  error?: string;
  /** Machine-readable error code (if failed) */
  errorCode?: ClipboardErrorCode;
}
```

---

## Validation Functions

**Location**: `frontend/src/diagram-visualization/DiagramExporter.ts`

```typescript
/**
 * Validate ExportOptions
 * @throws Error if options are invalid
 */
function validateExportOptions(options: ExportOptions): void {
  if (options.padding !== undefined) {
    if (options.padding < 0 || options.padding > 200) {
      throw new Error('Padding must be between 0 and 200 pixels');
    }
  }
  
  if (options.maxWidth !== undefined && options.maxWidth < 100) {
    throw new Error('maxWidth must be at least 100 pixels');
  }
  
  if (options.maxHeight !== undefined && options.maxHeight < 100) {
    throw new Error('maxHeight must be at least 100 pixels');
  }
  
  if (options.fileName) {
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(options.fileName)) {
      throw new Error('fileName contains invalid characters');
    }
  }
}

/**
 * Validate BoundingBox
 * @throws Error if bounding box is invalid
 */
function validateBoundingBox(bbox: BoundingBox): void {
  if (!Number.isFinite(bbox.x) || !Number.isFinite(bbox.y)) {
    throw new Error('BoundingBox x and y must be finite numbers');
  }
  
  if (!Number.isFinite(bbox.width) || !Number.isFinite(bbox.height)) {
    throw new Error('BoundingBox width and height must be finite numbers');
  }
  
  if (bbox.width <= 0 || bbox.height <= 0) {
    throw new Error('BoundingBox width and height must be positive');
  }
}
```

---

## Entity Relationships

```
Node[] (React Flow)
  ↓ (getNodesBounds)
BoundingBox
  ↓ (used by)
  ├─→ exportToPng() → PNG file download
  └─→ copyImageToClipboard() → ClipboardResult
      ↓
      User Feedback (ExportButton)
```

**Data Flow**:
1. User triggers export/copy action
2. React Flow nodes extracted from state
3. BoundingBox calculated from nodes + padding
4. BoundingBox passed to html-to-image with transform
5. Image generated and either:
   - Downloaded as PNG file (export), or
   - Copied to clipboard (copy) → ClipboardResult returned
6. ExportButton displays success/error feedback

---

## Performance Considerations

### BoundingBox Calculation
- **Complexity**: O(n) where n = number of nodes
- **Target**: <100ms for diagrams with up to 100 nodes
- **Optimization**: React Flow's `getNodesBounds()` is highly optimized (C++ implementation via WASM)

### Image Generation
- **Complexity**: O(pixels) - depends on output dimensions
- **Target**: <2s for typical diagrams (800x600 pixels)
- **Memory**: ~4 bytes per pixel (RGBA) + overhead
- **Risk**: Very large diagrams (>5000x5000 pixels) may exceed browser memory limits

### Clipboard Copy
- **Complexity**: O(pixels) for blob conversion
- **Target**: <2s total (includes image generation)
- **Browser limits**: Clipboard size limits vary by browser (typically 10-100MB)

---

## Edge Cases

### Empty Diagram
- **Scenario**: No nodes in diagram
- **Behavior**: `getNodesBounds()` returns empty bounds, validation fails
- **Handling**: Check nodes.length > 0 before export, show user error "No content to export"

### Single Node
- **Scenario**: Diagram with only 1 node
- **Behavior**: BoundingBox wraps single node with padding
- **Expected**: Small image (node size + 2*padding)

### Negative Coordinates
- **Scenario**: Nodes positioned at negative x/y coordinates
- **Behavior**: BoundingBox x/y can be negative, transform applied correctly
- **Expected**: Image crops correctly regardless of node positions

### Very Large Diagrams
- **Scenario**: 100+ nodes, output image >10MB
- **Behavior**: May exceed browser memory limits or clipboard size limits
- **Handling**: Show warning for large diagrams, suggest reducing entity count

### Overlapping Nodes
- **Scenario**: Multiple nodes at same position
- **Behavior**: BoundingBox calculation unaffected (uses outermost bounds)
- **Expected**: All nodes included in export

---

## Migration Notes

**Breaking Changes**: None - this is an enhancement to existing export functionality

**Backward Compatibility**:
- Existing `exportToPng()` function signature remains compatible (options are optional)
- `ExportOptions.width` and `ExportOptions.height` deprecated but not removed (ignored if provided)
- Users may notice different (smaller, better) exported image sizes - this is intended improvement

**Data Migration**: N/A (no persisted data)

---

## Future Considerations

### Potential Enhancements (Out of Scope)
- Custom padding per side (top, right, bottom, left) instead of uniform padding
- Zoom level support (export at different scales)
- Selective export (only selected nodes)
- Custom image formats (JPEG, WebP)
- SVG export (properly implemented)

### Type Extensions
If zoom support is added, extend `ImageDimensions`:
```typescript
interface ImageDimensions {
  // ... existing fields
  scale: number; // Currently always 1.0, would support 0.5, 2.0, etc.
  originalWidth: number; // Unscaled width for reference
  originalHeight: number; // Unscaled height for reference
}
```
