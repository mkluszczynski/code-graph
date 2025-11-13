# Data Model: TypeScript UML Graph Visualizer

**Feature**: 001-uml-graph-visualizer  
**Date**: 2025-11-13  
**Status**: Phase 1 Design

## Overview

This document defines the core entities, their properties, relationships, and state transitions for the TypeScript UML Graph Visualizer application. The data model supports creating, editing, and visualizing TypeScript classes and interfaces with real-time UML diagram generation.

---

## Core Entities

### 1. ProjectFile

Represents a TypeScript file in the project.

**Properties**:

- `id: string` - Unique identifier (UUID)
- `name: string` - File name (e.g., "MyClass.ts")
- `path: string` - Virtual file path (e.g., "/src/MyClass.ts")
- `content: string` - TypeScript source code
- `lastModified: number` - Timestamp (milliseconds since epoch)
- `isActive: boolean` - Whether this file is currently open in the editor

**Validation Rules**:

- `name` MUST end with `.ts` extension
- `path` MUST be unique within a project
- `path` MUST start with `/`
- `content` MUST be valid UTF-8 string (may contain syntax errors)
- `name` MUST NOT be empty
- `name` MUST NOT contain invalid filesystem characters: `/ \ : * ? " < > |`

**State Transitions**:

```
[New] --create--> [Saved]
[Saved] --edit--> [Modified]
[Modified] --save--> [Saved]
[Saved] --select--> [Active]
[Active] --close--> [Saved]
[Saved] --delete--> [Deleted]
```

**Persistence**: Stored in IndexedDB (`files` object store)

**Example**:

```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Person.ts",
  path: "/src/models/Person.ts",
  content: "export class Person { name: string; }",
  lastModified: 1699889234567,
  isActive: true
}
```

---

### 2. ClassDefinition

Represents a TypeScript class extracted from parsed code.

**Properties**:

- `id: string` - Unique identifier (derived from file path + class name)
- `name: string` - Class name
- `fileId: string` - Reference to ProjectFile.id
- `isAbstract: boolean` - Whether class is abstract
- `isExported: boolean` - Whether class is exported
- `properties: Property[]` - Array of class properties
- `methods: Method[]` - Array of class methods
- `typeParameters: string[]` - Generic type parameters (e.g., ["T", "K"])
- `extendsClass: string | null` - Name of parent class (if extends)
- `implementsInterfaces: string[]` - Names of implemented interfaces

**Validation Rules**:

- `name` MUST be a valid TypeScript identifier (alphanumeric + underscore, cannot start with digit)
- `fileId` MUST reference an existing ProjectFile
- `properties` and `methods` arrays MAY be empty
- If `isAbstract` is true, at least one method SHOULD be abstract (warning, not error)

**Relationships**:

- **Belongs to**: One ProjectFile (many-to-one)
- **Extends**: Zero or one ClassDefinition (inheritance)
- **Implements**: Zero or many InterfaceDefinition (realization)
- **Uses**: Zero or many ClassDefinition or InterfaceDefinition (via property types, method parameters)

**Example**:

```typescript
{
  id: "file1::Employee",
  name: "Employee",
  fileId: "550e8400-e29b-41d4-a716-446655440000",
  isAbstract: false,
  isExported: true,
  properties: [
    { name: "employeeId", type: "string", visibility: "private", isStatic: false, isReadonly: true }
  ],
  methods: [
    { name: "getSalary", returnType: "number", parameters: [], visibility: "public", isStatic: false, isAbstract: false }
  ],
  typeParameters: [],
  extendsClass: "Person",
  implementsInterfaces: ["IEmployee"]
}
```

---

### 3. InterfaceDefinition

Represents a TypeScript interface extracted from parsed code.

**Properties**:

- `id: string` - Unique identifier (derived from file path + interface name)
- `name: string` - Interface name
- `fileId: string` - Reference to ProjectFile.id
- `isExported: boolean` - Whether interface is exported
- `properties: PropertySignature[]` - Array of property signatures
- `methods: MethodSignature[]` - Array of method signatures
- `typeParameters: string[]` - Generic type parameters
- `extendsInterfaces: string[]` - Names of extended interfaces

**Validation Rules**:

- `name` MUST be a valid TypeScript identifier
- `fileId` MUST reference an existing ProjectFile
- All property and method signatures MUST have types defined

**Relationships**:

- **Belongs to**: One ProjectFile (many-to-one)
- **Extends**: Zero or many InterfaceDefinition (interface inheritance)
- **Implemented by**: Zero or many ClassDefinition (realization relationship)

**Example**:

```typescript
{
  id: "file2::IEmployee",
  name: "IEmployee",
  fileId: "550e8400-e29b-41d4-a716-446655440001",
  isExported: true,
  properties: [
    { name: "employeeId", type: "string", isReadonly: true, isOptional: false }
  ],
  methods: [
    { name: "getSalary", returnType: "number", parameters: [] }
  ],
  typeParameters: [],
  extendsInterfaces: []
}
```

---

### 4. Property

Represents a class property.

**Properties**:

- `name: string` - Property name
- `type: string` - TypeScript type (e.g., "string", "number", "Person[]")
- `visibility: 'public' | 'private' | 'protected'` - Access modifier
- `isStatic: boolean` - Whether property is static
- `isReadonly: boolean` - Whether property is readonly
- `defaultValue?: string` - Optional default value (as source code string)

**Validation Rules**:

- `name` MUST be a valid TypeScript identifier
- `type` MUST be a non-empty string
- `visibility` defaults to 'public' if not specified in source

**UML Representation**:

- Public: `+ propertyName: Type`
- Private: `- propertyName: Type`
- Protected: `# propertyName: Type`
- Static: underlined
- Readonly: `{readOnly}` stereotype or different styling

---

### 5. Method

Represents a class method.

**Properties**:

- `name: string` - Method name
- `returnType: string` - Return type (e.g., "void", "Promise<User>")
- `parameters: Parameter[]` - Array of method parameters
- `visibility: 'public' | 'private' | 'protected'` - Access modifier
- `isStatic: boolean` - Whether method is static
- `isAbstract: boolean` - Whether method is abstract
- `isAsync: boolean` - Whether method is async

**Validation Rules**:

- `name` MUST be a valid TypeScript identifier
- `returnType` MUST be a non-empty string
- If `isAbstract` is true, the containing class MUST be abstract
- Constructor methods have special name "constructor"

**UML Representation**:

- Public: `+ methodName(param: Type): ReturnType`
- Private: `- methodName(param: Type): ReturnType`
- Protected: `# methodName(param: Type): ReturnType`
- Static: underlined
- Abstract: italicized

---

### 6. Parameter

Represents a method parameter.

**Properties**:

- `name: string` - Parameter name
- `type: string` - Parameter type
- `isOptional: boolean` - Whether parameter is optional (has `?`)
- `defaultValue?: string` - Default value if any

**Validation Rules**:

- `name` MUST be a valid TypeScript identifier
- `type` MUST be non-empty
- Optional parameters MUST come after required parameters (TypeScript rule)

**Example**:

```typescript
{ name: "id", type: "string", isOptional: false }
{ name: "age", type: "number", isOptional: true, defaultValue: "18" }
```

---

### 7. PropertySignature

Represents an interface property signature (similar to Property but simpler).

**Properties**:

- `name: string` - Property name
- `type: string` - Property type
- `isOptional: boolean` - Whether property is optional
- `isReadonly: boolean` - Whether property is readonly

**Validation Rules**:

- Same as Property, but no visibility (interfaces have no access modifiers)

---

### 8. MethodSignature

Represents an interface method signature (similar to Method but simpler).

**Properties**:

- `name: string` - Method name
- `returnType: string` - Return type
- `parameters: Parameter[]` - Method parameters

**Validation Rules**:

- Same as Method, but no visibility, static, or abstract (interfaces define contracts only)

---

### 9. Relationship

Represents a relationship between classes/interfaces in the UML diagram.

**Properties**:

- `id: string` - Unique identifier
- `type: RelationshipType` - Type of relationship
- `sourceId: string` - Source entity ID (ClassDefinition.id or InterfaceDefinition.id)
- `targetId: string` - Target entity ID
- `label?: string` - Optional relationship label (e.g., "manages", "uses")
- `multiplicity?: string` - Optional multiplicity (e.g., "1", "0.._", "1.._")

**RelationshipType Enum**:

- `inheritance` - Class extends another class (solid line with hollow triangle)
- `realization` - Class implements interface (dashed line with hollow triangle)
- `association` - Class has property of another class type (solid line with arrow)
- `composition` - Strong ownership (solid line with filled diamond)
- `aggregation` - Weak ownership (solid line with hollow diamond)
- `dependency` - Uses in method signature (dashed line with arrow)

**Validation Rules**:

- `sourceId` and `targetId` MUST reference existing ClassDefinition or InterfaceDefinition
- `sourceId` and `targetId` MUST NOT be the same (no self-relationships for MVP)
- For `inheritance`: source and target MUST both be classes
- For `realization`: source MUST be class, target MUST be interface
- Interface-to-interface relationships use `inheritance` type

**Derived From**:

- **Inheritance**: Detected from `ClassDefinition.extendsClass`
- **Realization**: Detected from `ClassDefinition.implementsInterfaces`
- **Association**: Detected from property types and method parameter types (Phase 2+)

**UML Representation**:

- Inheritance: Solid line, hollow triangle pointing to parent
- Realization: Dashed line, hollow triangle pointing to interface
- Association: Solid line with arrow pointing to associated class
- Composition: Solid line with filled diamond on owner side
- Aggregation: Solid line with hollow diamond on owner side

**Example**:

```typescript
{
  id: "rel1",
  type: "inheritance",
  sourceId: "file1::Employee",
  targetId: "file0::Person",
  label: null,
  multiplicity: null
}
```

---

### 10. DiagramNode

Represents a visual node in the UML diagram (React Flow node).

**Properties**:

- `id: string` - Same as ClassDefinition.id or InterfaceDefinition.id
- `type: 'class' | 'interface'` - Node type
- `data: DiagramNodeData` - Node display data
- `position: { x: number; y: number }` - Node position on canvas
- `width: number` - Calculated width based on content
- `height: number` - Calculated height based on content

**DiagramNodeData**:

- `name: string` - Class/interface name
- `properties: string[]` - Formatted property strings (e.g., "+ name: string")
- `methods: string[]` - Formatted method strings (e.g., "+ getName(): string")
- `stereotype?: string` - Optional stereotype (e.g., "<<interface>>", "<<abstract>>")
- `fileId: string` - Link back to source file

**Validation Rules**:

- `position` coordinates MUST be non-negative
- `width` and `height` MUST be positive numbers
- `data.name` MUST match source ClassDefinition or InterfaceDefinition name

**State Transitions**:

```
[Created] --layout--> [Positioned]
[Positioned] --user-drag--> [UserPositioned]
[UserPositioned] --reset-layout--> [Positioned]
[Positioned] --source-change--> [Updated]
```

---

### 11. DiagramEdge

Represents a visual edge in the UML diagram (React Flow edge).

**Properties**:

- `id: string` - Same as Relationship.id
- `source: string` - Source node ID
- `target: string` - Target node ID
- `type: string` - Edge rendering type (maps to custom edge components)
- `label?: string` - Optional edge label
- `animated: boolean` - Whether edge is animated (for emphasis)
- `style: object` - CSS styles for edge appearance

**Edge Types**:

- `inheritance` - Solid line with triangle marker
- `realization` - Dashed line with triangle marker
- `association` - Solid line with arrow marker
- `composition` - Solid line with diamond marker
- `aggregation` - Dashed line with diamond marker

**Validation Rules**:

- `source` and `target` MUST reference existing DiagramNode IDs
- `type` MUST be one of the defined edge types

---

## Application State

### 12. EditorState

Manages the current state of the code editor.

**Properties**:

- `activeFileId: string | null` - Currently open file ID
- `activeFileContent: string` - Current editor content (may be unsaved)
- `isDirty: boolean` - Whether content differs from saved version
- `cursorPosition: { line: number; column: number }` - Current cursor position
- `selectedRange: { start: Position; end: Position } | null` - Current selection

**State Transitions**:

```
[NoFileOpen] --open-file--> [FileOpen]
[FileOpen] --edit--> [Modified]
[Modified] --save--> [Saved]
[Saved] --close--> [NoFileOpen]
```

---

### 13. DiagramState

Manages the UML diagram visualization state.

**Properties**:

- `nodes: DiagramNode[]` - All diagram nodes
- `edges: DiagramEdge[]` - All diagram edges
- `viewport: { x: number; y: number; zoom: number }` - Current viewport position and zoom
- `selectedNodeId: string | null` - Currently selected node
- `isLayoutLocked: boolean` - Whether auto-layout is disabled (user has manually positioned nodes)
- `lastUpdated: number` - Timestamp of last diagram update

**Validation Rules**:

- `zoom` MUST be between 0.1 and 3.0
- `nodes` and `edges` MUST be consistent with parsed ClassDefinitions and InterfaceDefinitions

---

### 14. FileTreeState

Manages the file tree UI state.

**Properties**:

- `files: ProjectFile[]` - All files in the project
- `expandedPaths: Set<string>` - Paths of expanded directories
- `selectedFileId: string | null` - Currently selected file in tree
- `sortOrder: 'name' | 'modified'` - File sorting order

---

### 15. ParserState

Manages TypeScript parsing state.

**Properties**:

- `isParsing: boolean` - Whether parsing is in progress
- `parseErrors: Map<string, ParseError[]>` - Errors by file ID
- `lastParseTime: number` - Timestamp of last successful parse
- `parsedEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>` - Parsed entities by file ID

**ParseError**:

- `line: number` - Error line number
- `column: number` - Error column number
- `message: string` - Error message
- `severity: 'error' | 'warning'` - Error severity

---

## Relationships Summary

```
ProjectFile (1) ←--→ (0..*) ClassDefinition
ProjectFile (1) ←--→ (0..*) InterfaceDefinition

ClassDefinition (0..*) ──extends──→ (0..1) ClassDefinition
ClassDefinition (0..*) ──implements──→ (0..*) InterfaceDefinition
InterfaceDefinition (0..*) ──extends──→ (0..*) InterfaceDefinition

ClassDefinition (1) ←--→ (0..*) Property
ClassDefinition (1) ←--→ (0..*) Method
InterfaceDefinition (1) ←--→ (0..*) PropertySignature
InterfaceDefinition (1) ←--→ (0..*) MethodSignature

Method (1) ←--→ (0..*) Parameter
MethodSignature (1) ←--→ (0..*) Parameter

ClassDefinition | InterfaceDefinition ←--→ (1) DiagramNode
Relationship ←--→ (1) DiagramEdge
```

---

## Validation Summary

### Critical Validations (MUST enforce)

1. File names MUST be unique within project
2. File paths MUST be unique
3. Class/interface names MUST be valid TypeScript identifiers
4. Type references MUST be non-empty strings
5. Abstract methods MUST only exist in abstract classes
6. Relationship source/target IDs MUST reference existing entities

### Warning Validations (SHOULD warn)

1. Unused classes/interfaces (no relationships, not exported)
2. Circular inheritance chains
3. Very large classes (>20 properties or methods) - code smell
4. Duplicate method names within a class (overloads OK if parameters differ)

### Performance Validations

1. Max 100 files per project (prevent IndexedDB bloat)
2. Max 1000 lines per file (warn user, doesn't block)
3. Max 100 nodes in diagram (layout performance threshold)

---

## Data Flow

### File Creation Flow

```
User clicks "Add Class"
  → ProjectManager.createFile()
  → Generate default template
  → Save to IndexedDB
  → Update FileTreeState
  → Parse new file
  → Update DiagramState
  → Render diagram
```

### Code Edit Flow

```
User types in editor
  → Update EditorState.activeFileContent
  → Debounce 500ms
  → TypeScriptParser.parse()
  → Extract ClassDefinitions & InterfaceDefinitions
  → Update ParserState
  → DiagramGenerator.generate()
  → Update DiagramState
  → React Flow re-renders diagram
```

### Diagram Node Click Flow

```
User clicks diagram node
  → Get node.data.fileId
  → FileTreeManager.selectFile(fileId)
  → EditorController.openFile(fileId)
  → Load file from IndexedDB
  → Update EditorState
  → Monaco Editor displays content
  → FileTreeState highlights file
```

---

## TypeScript Type Definitions

```typescript
// Core entities
interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  lastModified: number;
  isActive: boolean;
}

interface ClassDefinition {
  id: string;
  name: string;
  fileId: string;
  isAbstract: boolean;
  isExported: boolean;
  properties: Property[];
  methods: Method[];
  typeParameters: string[];
  extendsClass: string | null;
  implementsInterfaces: string[];
}

interface InterfaceDefinition {
  id: string;
  name: string;
  fileId: string;
  isExported: boolean;
  properties: PropertySignature[];
  methods: MethodSignature[];
  typeParameters: string[];
  extendsInterfaces: string[];
}

interface Property {
  name: string;
  type: string;
  visibility: "public" | "private" | "protected";
  isStatic: boolean;
  isReadonly: boolean;
  defaultValue?: string;
}

interface Method {
  name: string;
  returnType: string;
  parameters: Parameter[];
  visibility: "public" | "private" | "protected";
  isStatic: boolean;
  isAbstract: boolean;
  isAsync: boolean;
}

interface Parameter {
  name: string;
  type: string;
  isOptional: boolean;
  defaultValue?: string;
}

interface PropertySignature {
  name: string;
  type: string;
  isOptional: boolean;
  isReadonly: boolean;
}

interface MethodSignature {
  name: string;
  returnType: string;
  parameters: Parameter[];
}

type RelationshipType =
  | "inheritance"
  | "realization"
  | "association"
  | "composition"
  | "aggregation"
  | "dependency";

interface Relationship {
  id: string;
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  label?: string;
  multiplicity?: string;
}

// Diagram entities
interface DiagramNode {
  id: string;
  type: "class" | "interface";
  data: DiagramNodeData;
  position: { x: number; y: number };
  width: number;
  height: number;
}

interface DiagramNodeData {
  name: string;
  properties: string[];
  methods: string[];
  stereotype?: string;
  fileId: string;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  animated: boolean;
  style: object;
}

// Application state
interface EditorState {
  activeFileId: string | null;
  activeFileContent: string;
  isDirty: boolean;
  cursorPosition: { line: number; column: number };
  selectedRange: { start: Position; end: Position } | null;
}

interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: { x: number; y: number; zoom: number };
  selectedNodeId: string | null;
  isLayoutLocked: boolean;
  lastUpdated: number;
}

interface FileTreeState {
  files: ProjectFile[];
  expandedPaths: Set<string>;
  selectedFileId: string | null;
  sortOrder: "name" | "modified";
}

interface ParseError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

interface ParserState {
  isParsing: boolean;
  parseErrors: Map<string, ParseError[]>;
  lastParseTime: number;
  parsedEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>;
}
```

---

## Notes

- **Phase 1 Scope**: This data model covers P1 requirements (US1-4). Advanced relationships (composition, aggregation) are defined but may be implemented in Phase 2.
- **Type Resolution**: For MVP, type references are stored as strings. Cross-file type resolution (e.g., detecting that `Person` in file A refers to class in file B) is deferred to Phase 2.
- **Generic Types**: Basic support for type parameters (`<T>`) is included but complex constraint handling is Phase 2+.
- **Persistence**: Only `ProjectFile` entities persist to IndexedDB. Parsed entities (`ClassDefinition`, `InterfaceDefinition`) are derived and cached in memory.
