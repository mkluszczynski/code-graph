# Diagram Generator API Contract

**Module**: `diagram-visualization`  
**Purpose**: Generate React Flow diagram nodes and edges from parsed TypeScript entities  
**Type**: Internal module contract

---

## Interface: DiagramGenerator

### `generateDiagram(classes: ClassDefinition[], interfaces: InterfaceDefinition[], relationships: Relationship[]): DiagramData`

Generates diagram nodes and edges from parsed TypeScript entities.

**Parameters**:

- `classes: ClassDefinition[]` - Array of parsed classes
- `interfaces: InterfaceDefinition[]` - Array of parsed interfaces
- `relationships: Relationship[]` - Array of relationships between entities

**Returns**: `DiagramData`

```typescript
interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layoutDirection: "TB" | "LR";
}
```

**Behavior**:

- MUST create one DiagramNode per ClassDefinition or InterfaceDefinition
- MUST create one DiagramEdge per Relationship
- MUST format properties and methods according to UML notation
- MUST apply automatic layout using dagre algorithm
- MUST assign unique positions to avoid overlapping
- MUST calculate node dimensions based on content
- SHOULD prioritize readability over compact layout

**UML Formatting Rules**:

- Public members: `+ name: Type`
- Private members: `- name: Type`
- Protected members: `# name: Type`
- Static members: underlined (or `{static}` tag)
- Abstract members: italicized (or `{abstract}` tag)
- Interface stereotype: `<<interface>>`
- Abstract class stereotype: `<<abstract>>`

**Error Handling**:

- Empty input arrays → return empty nodes and edges arrays
- Relationships with missing source/target → skip that relationship, log warning
- Invalid relationship types → default to 'association' style

**Performance Contract**:

- MUST complete in <1s for 50 nodes and 100 edges
- SHOULD use memoization for repeated calls with same input

**Examples**:

```typescript
const classes = [{
  id: "file1::Person",
  name: "Person",
  fileId: "file1",
  isAbstract: false,
  isExported: true,
  properties: [
    { name: "name", type: "string", visibility: "private", isStatic: false, isReadonly: false }
  ],
  methods: [
    { name: "getName", returnType: "string", parameters: [], visibility: "public", isStatic: false, isAbstract: false, isAsync: false }
  ],
  typeParameters: [],
  extendsClass: null,
  implementsInterfaces: []
}];

const interfaces = [{
  id: "file2::IPerson",
  name: "IPerson",
  fileId: "file2",
  isExported: true,
  properties: [
    { name: "name", type: "string", isOptional: false, isReadonly: true }
  ],
  methods: [
    { name: "getName", returnType: "string", parameters: [] }
  ],
  typeParameters: [],
  extendsInterfaces: []
}];

const relationships = [];

const diagram = generateDiagram(classes, interfaces, relationships);

// Expected result:
{
  nodes: [
    {
      id: "file1::Person",
      type: "class",
      data: {
        name: "Person",
        properties: ["- name: string"],
        methods: ["+ getName(): string"],
        stereotype: undefined,
        fileId: "file1"
      },
      position: { x: 100, y: 50 },
      width: 200,
      height: 120
    },
    {
      id: "file2::IPerson",
      type: "interface",
      data: {
        name: "IPerson",
        properties: ["name: string {readOnly}"],
        methods: ["getName(): string"],
        stereotype: "<<interface>>",
        fileId: "file2"
      },
      position: { x: 350, y: 50 },
      width: 220,
      height: 110
    }
  ],
  edges: [],
  layoutDirection: "TB"
}
```

---

### `applyLayout(nodes: DiagramNode[], edges: DiagramEdge[], direction: 'TB' | 'LR'): { nodes: DiagramNode[]; edges: DiagramEdge[] }`

Applies automatic layout to diagram nodes using dagre algorithm.

**Parameters**:

- `nodes: DiagramNode[]` - Diagram nodes (positions may be initial/undefined)
- `edges: DiagramEdge[]` - Diagram edges
- `direction: 'TB' | 'LR'` - Layout direction (Top-to-Bottom or Left-to-Right)

**Returns**: `{ nodes: DiagramNode[]; edges: DiagramEdge[] }` with updated positions

**Behavior**:

- MUST use dagre graph layout algorithm
- MUST respect node dimensions (width, height)
- MUST configure appropriate spacing (`nodesep: 80`, `ranksep: 100`)
- MUST handle disconnected subgraphs
- MUST position nodes to minimize edge crossings
- SHOULD center the layout in the viewport

**Error Handling**:

- Empty nodes array → return as-is
- Edges with invalid source/target → skip those edges in layout
- Layout failure → fall back to grid layout

**Performance Contract**:

- MUST complete in <500ms for 50 nodes
- SHOULD handle up to 100 nodes without noticeable lag

---

### `formatProperty(property: Property | PropertySignature, isInterface: boolean): string`

Formats a property for UML display.

**Parameters**:

- `property: Property | PropertySignature` - Property to format
- `isInterface: boolean` - Whether this is an interface property

**Returns**: `string` - UML-formatted property string

**Behavior**:

- MUST include visibility symbol for classes (+ - #)
- MUST NOT include visibility for interfaces (interfaces don't have access modifiers)
- MUST include name and type
- SHOULD include modifiers (static, readonly) as tags or styling hints
- Format: `[visibility] propertyName: Type [modifiers]`

**Examples**:

```typescript
// Class property
formatProperty(
  {
    name: "age",
    type: "number",
    visibility: "public",
    isStatic: false,
    isReadonly: false,
  },
  false
);
// Returns: "+ age: number"

// Private static property
formatProperty(
  {
    name: "count",
    type: "number",
    visibility: "private",
    isStatic: true,
    isReadonly: false,
  },
  false
);
// Returns: "- count: number {static}" or underlined

// Interface property
formatProperty(
  { name: "id", type: "string", isOptional: false, isReadonly: true },
  true
);
// Returns: "id: string {readOnly}"
```

---

### `formatMethod(method: Method | MethodSignature, isInterface: boolean): string`

Formats a method for UML display.

**Parameters**:

- `method: Method | MethodSignature` - Method to format
- `isInterface: boolean` - Whether this is an interface method

**Returns**: `string` - UML-formatted method string

**Behavior**:

- MUST include visibility symbol for classes
- MUST NOT include visibility for interfaces
- MUST include method name, parameters, and return type
- SHOULD include modifiers (static, abstract) as tags or styling hints
- Format: `[visibility] methodName(param1: Type, param2: Type): ReturnType [modifiers]`

**Examples**:

```typescript
// Public method
formatMethod(
  {
    name: "getName",
    returnType: "string",
    parameters: [],
    visibility: "public",
    isStatic: false,
    isAbstract: false,
    isAsync: false,
  },
  false
);
// Returns: "+ getName(): string"

// Private method with parameters
formatMethod(
  {
    name: "calculate",
    returnType: "number",
    parameters: [
      { name: "x", type: "number", isOptional: false },
      { name: "y", type: "number", isOptional: true, defaultValue: "0" },
    ],
    visibility: "private",
    isStatic: false,
    isAbstract: false,
    isAsync: false,
  },
  false
);
// Returns: "- calculate(x: number, y?: number): number"

// Abstract method
formatMethod(
  {
    name: "process",
    returnType: "void",
    parameters: [],
    visibility: "public",
    isStatic: false,
    isAbstract: true,
    isAsync: false,
  },
  false
);
// Returns: "+ process(): void {abstract}" or italicized
```

---

## Interface: EdgeStyler

### `getEdgeStyle(relationshipType: RelationshipType): EdgeStyle`

Returns React Flow edge style configuration for a relationship type.

**Parameters**:

- `relationshipType: RelationshipType` - Type of relationship

**Returns**: `EdgeStyle`

```typescript
interface EdgeStyle {
  type: string; // Custom edge component name
  markerEnd: MarkerType; // Arrow/triangle/diamond marker
  strokeDasharray?: string; // Dashed line pattern (e.g., "5 5")
  strokeWidth: number; // Line width
  animated: boolean; // Whether to animate the edge
  style: object; // Additional CSS styles
}
```

**Behavior**:

- MUST return appropriate styles for each UML relationship type
- MUST follow standard UML notation conventions

**UML Relationship Styles**:

| Relationship Type | Line Style | Marker End      | Notes                      |
| ----------------- | ---------- | --------------- | -------------------------- |
| `inheritance`     | Solid      | Hollow triangle | Class extends class        |
| `realization`     | Dashed     | Hollow triangle | Class implements interface |
| `association`     | Solid      | Arrow           | Class uses another class   |
| `composition`     | Solid      | Filled diamond  | Strong ownership           |
| `aggregation`     | Solid      | Hollow diamond  | Weak ownership             |
| `dependency`      | Dashed     | Arrow           | Weak coupling              |

**Examples**:

```typescript
getEdgeStyle('inheritance')
// Returns:
{
  type: 'inheritanceEdge',
  markerEnd: { type: 'arrowclosed', color: '#000' },
  strokeDasharray: undefined,
  strokeWidth: 2,
  animated: false,
  style: { stroke: '#000' }
}

getEdgeStyle('realization')
// Returns:
{
  type: 'realizationEdge',
  markerEnd: { type: 'arrowclosed', color: '#000' },
  strokeDasharray: '5 5',
  strokeWidth: 2,
  animated: false,
  style: { stroke: '#000' }
}
```

---

## Test Requirements

### Contract Tests (MUST implement before diagram generator code)

1. **Basic diagram generation**

   - Given: One class, one interface, no relationships
   - When: `generateDiagram()` called
   - Then: Returns 2 nodes with correct structure

2. **UML property formatting - class**

   - Given: Class property with public visibility
   - When: `formatProperty()` called
   - Then: Returns "+ name: Type"

3. **UML property formatting - interface**

   - Given: Interface property
   - When: `formatProperty()` called
   - Then: Returns "name: Type" (no visibility symbol)

4. **UML method formatting - with parameters**

   - Given: Method with multiple parameters
   - When: `formatMethod()` called
   - Then: Returns "+ methodName(param1: Type1, param2: Type2): ReturnType"

5. **UML method formatting - optional parameters**

   - Given: Method with optional parameter
   - When: `formatMethod()` called
   - Then: Returns "+ methodName(required: Type, optional?: Type): ReturnType"

6. **Layout application**

   - Given: 3 nodes with inheritance relationships
   - When: `applyLayout()` called with direction 'TB'
   - Then: Parent class positioned above child classes

7. **Edge style - inheritance**

   - Given: Relationship type 'inheritance'
   - When: `getEdgeStyle()` called
   - Then: Returns solid line with hollow triangle marker

8. **Edge style - realization**

   - Given: Relationship type 'realization'
   - When: `getEdgeStyle()` called
   - Then: Returns dashed line with hollow triangle marker

9. **Stereotype display - interface**

   - Given: InterfaceDefinition
   - When: `generateDiagram()` called
   - Then: Node data includes `stereotype: "<<interface>>"`

10. **Stereotype display - abstract class**

    - Given: ClassDefinition with `isAbstract: true`
    - When: `generateDiagram()` called
    - Then: Node data includes `stereotype: "<<abstract>>"`

11. **Performance test - large diagram**

    - Given: 50 classes with 100 relationships
    - When: `generateDiagram()` called
    - Then: Completes in <1s

12. **Empty input handling**
    - Given: Empty arrays for classes, interfaces, relationships
    - When: `generateDiagram()` called
    - Then: Returns empty nodes and edges arrays

---

## Dependencies

- `@xyflow/react` (React Flow)
- `@dagrejs/dagre` (Dagre layout algorithm)

---

## Notes

- This is an **internal module contract**, not a REST/HTTP API
- Generator should be **pure function** - no side effects, no state
- Layout calculation is deterministic for same input
- Custom edge components (InheritanceEdge, RealizationEdge, etc.) are defined separately
- All types reference the `data-model.md` definitions
