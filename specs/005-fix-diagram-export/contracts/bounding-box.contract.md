# Contract: Bounding Box Calculation

**Feature**: 005-fix-diagram-export  
**Module**: DiagramExporter  
**Function**: `calculateBoundingBox()`

## Contract Signature

```typescript
/**
 * Calculate the bounding box for a set of React Flow nodes with padding
 * 
 * @param nodes - Array of React Flow nodes
 * @param padding - Padding around content in pixels (default: 30)
 * @returns BoundingBox containing all nodes plus padding
 * @throws Error if nodes array is empty or invalid
 */
function calculateBoundingBox(
  nodes: Node[], 
  padding?: number
): BoundingBox
```

## Preconditions

1. `nodes` must be a non-empty array of valid React Flow nodes
2. Each node must have valid `position: { x, y }` and `width`/`height` (or measured dimensions)
3. `padding` if provided must be >= 0 and <= 200
4. At least one node must have finite coordinates

## Postconditions

1. Returns a valid `BoundingBox` object with all properties finite and positive (width/height)
2. `bbox.x === min(node.position.x) - padding` (leftmost node minus padding)
3. `bbox.y === min(node.position.y) - padding` (topmost node minus padding)
4. `bbox.width === (max(node.position.x + node.width) - min(node.position.x)) + (2 * padding)`
5. `bbox.height === (max(node.position.y + node.height) - min(node.position.y)) + (2 * padding)`
6. Result is idempotent (calling twice with same inputs produces identical output)

## Test Cases

### TC-001: Single node with default padding

**Input**:
```typescript
nodes = [
  { id: '1', position: { x: 100, y: 100 }, width: 200, height: 150 }
];
padding = 30; // default
```

**Expected Output**:
```typescript
{
  x: 70,      // 100 - 30
  y: 70,      // 100 - 30
  width: 260, // 200 + (2 * 30)
  height: 210 // 150 + (2 * 30)
}
```

**Rationale**: Single node should be wrapped with padding on all sides

---

### TC-002: Multiple nodes aligned horizontally

**Input**:
```typescript
nodes = [
  { id: '1', position: { x: 0, y: 0 }, width: 100, height: 100 },
  { id: '2', position: { x: 150, y: 0 }, width: 100, height: 100 }
];
padding = 30;
```

**Expected Output**:
```typescript
{
  x: -30,     // 0 - 30
  y: -30,     // 0 - 30
  width: 310, // (250 - 0) + 60
  height: 160 // (100 - 0) + 60
}
```

**Rationale**: Bounding box should span from leftmost to rightmost node edge plus padding

---

### TC-003: Nodes at negative coordinates

**Input**:
```typescript
nodes = [
  { id: '1', position: { x: -100, y: -50 }, width: 80, height: 80 },
  { id: '2', position: { x: 50, y: 50 }, width: 80, height: 80 }
];
padding = 20;
```

**Expected Output**:
```typescript
{
  x: -120,    // -100 - 20
  y: -70,     // -50 - 20
  width: 290, // (130 - (-100)) + 40
  height: 240 // (130 - (-50)) + 40
}
```

**Rationale**: Negative coordinates are valid (nodes can be positioned anywhere)

---

### TC-004: Custom padding (zero)

**Input**:
```typescript
nodes = [
  { id: '1', position: { x: 10, y: 20 }, width: 100, height: 50 }
];
padding = 0;
```

**Expected Output**:
```typescript
{
  x: 10,
  y: 20,
  width: 100,
  height: 50
}
```

**Rationale**: Zero padding should produce exact bounding rectangle of content

---

### TC-005: Custom padding (large)

**Input**:
```typescript
nodes = [
  { id: '1', position: { x: 0, y: 0 }, width: 100, height: 100 }
];
padding = 100;
```

**Expected Output**:
```typescript
{
  x: -100,
  y: -100,
  width: 300,  // 100 + 200
  height: 300  // 100 + 200
}
```

**Rationale**: Large padding creates significant border around content

---

### TC-006: Overlapping nodes

**Input**:
```typescript
nodes = [
  { id: '1', position: { x: 0, y: 0 }, width: 100, height: 100 },
  { id: '2', position: { x: 50, y: 50 }, width: 100, height: 100 }
];
padding = 10;
```

**Expected Output**:
```typescript
{
  x: -10,
  y: -10,
  width: 170, // (150 - 0) + 20
  height: 170 // (150 - 0) + 20
}
```

**Rationale**: Overlapping nodes don't affect bounding box calculation (use outermost edges)

---

## Error Cases

### EC-001: Empty nodes array

**Input**:
```typescript
nodes = [];
padding = 30;
```

**Expected Behavior**: Throws `Error` with message "Cannot calculate bounding box: no nodes provided"

---

### EC-002: Invalid padding (negative)

**Input**:
```typescript
nodes = [{ id: '1', position: { x: 0, y: 0 }, width: 100, height: 100 }];
padding = -10;
```

**Expected Behavior**: Throws `Error` with message "Padding must be between 0 and 200 pixels"

---

### EC-003: Invalid padding (too large)

**Input**:
```typescript
nodes = [{ id: '1', position: { x: 0, y: 0 }, width: 100, height: 100 }];
padding = 300;
```

**Expected Behavior**: Throws `Error` with message "Padding must be between 0 and 200 pixels"

---

### EC-004: Nodes with infinite coordinates

**Input**:
```typescript
nodes = [{ id: '1', position: { x: Infinity, y: 0 }, width: 100, height: 100 }];
padding = 30;
```

**Expected Behavior**: Throws `Error` with message "Invalid node coordinates: all positions must be finite"

---

### EC-005: Nodes with NaN coordinates

**Input**:
```typescript
nodes = [{ id: '1', position: { x: NaN, y: 0 }, width: 100, height: 100 }];
padding = 30;
```

**Expected Behavior**: Throws `Error` with message "Invalid node coordinates: all positions must be finite"

---

## Performance Requirements

- **Time Complexity**: O(n) where n is the number of nodes
- **Target**: Complete in <100ms for up to 100 nodes
- **Memory**: O(1) additional memory (constant space)

## Dependencies

- `@xyflow/react`: Uses `getNodesBounds()` utility function
- React Flow `Node` type for input validation

## Notes

- Implementation uses React Flow's optimized `getNodesBounds()` internally
- Padding is applied uniformly on all sides (no per-side customization in this version)
- Nodes with zero width or height are included (use default dimensions or measure from DOM)
- Bounding box coordinates are in the same coordinate system as React Flow viewport
