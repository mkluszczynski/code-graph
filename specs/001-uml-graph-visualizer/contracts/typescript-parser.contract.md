# TypeScript Parser API Contract

**Module**: `typescript-parser`  
**Purpose**: Parse TypeScript source code and extract class/interface definitions  
**Type**: Internal module contract (not REST API)

---

## Interface: TypeScriptParser

### `parse(sourceCode: string, fileName: string): ParseResult`

Parses TypeScript source code and extracts class and interface definitions.

**Parameters**:

- `sourceCode: string` - TypeScript source code to parse
- `fileName: string` - Name of the file (for error reporting)

**Returns**: `ParseResult`

```typescript
interface ParseResult {
  classes: ClassDefinition[];
  interfaces: InterfaceDefinition[];
  errors: ParseError[];
  success: boolean;
}
```

**Behavior**:

- MUST parse valid TypeScript syntax
- MUST NOT throw exceptions for syntax errors; return errors in `ParseError[]` array
- MUST return empty arrays if source contains no classes/interfaces
- MUST extract access modifiers (public, private, protected)
- MUST extract static, abstract, readonly modifiers
- MUST extract method parameters and return types
- MUST extract inheritance (`extends`) and implementation (`implements`) relationships
- MUST handle generic type parameters

**Error Handling**:

- Syntax errors → `success: false`, populate `errors` array
- Empty source → `success: true`, empty `classes` and `interfaces` arrays
- Invalid fileName → proceed with parsing, use fileName as-is for error reporting

**Performance Contract**:

- MUST complete in <500ms for files up to 1000 lines
- SHOULD use incremental parsing for repeated calls with similar source

**Examples**:

```typescript
// Valid class parsing
const result = parse(`
export class Person {
  private name: string;
  public age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  public getName(): string {
    return this.name;
  }
}
`, "Person.ts");

// Expected result:
{
  success: true,
  classes: [{
    id: "Person.ts::Person",
    name: "Person",
    fileId: "Person.ts",
    isAbstract: false,
    isExported: true,
    properties: [
      { name: "name", type: "string", visibility: "private", isStatic: false, isReadonly: false },
      { name: "age", type: "number", visibility: "public", isStatic: false, isReadonly: false }
    ],
    methods: [
      {
        name: "constructor",
        returnType: "void",
        parameters: [
          { name: "name", type: "string", isOptional: false },
          { name: "age", type: "number", isOptional: false }
        ],
        visibility: "public",
        isStatic: false,
        isAbstract: false,
        isAsync: false
      },
      {
        name: "getName",
        returnType: "string",
        parameters: [],
        visibility: "public",
        isStatic: false,
        isAbstract: false,
        isAsync: false
      }
    ],
    typeParameters: [],
    extendsClass: null,
    implementsInterfaces: []
  }],
  interfaces: [],
  errors: []
}

// Syntax error handling
const errorResult = parse(`
class Broken {
  method() { // missing return type
`, "Broken.ts");

// Expected result:
{
  success: false,
  classes: [],
  interfaces: [],
  errors: [
    {
      line: 3,
      column: 13,
      message: "'}' expected.",
      severity: "error"
    }
  ]
}
```

---

### `extractRelationships(classes: ClassDefinition[], interfaces: InterfaceDefinition[]): Relationship[]`

Extracts relationships between classes and interfaces.

**Parameters**:

- `classes: ClassDefinition[]` - Array of parsed classes
- `interfaces: InterfaceDefinition[]` - Array of parsed interfaces

**Returns**: `Relationship[]`

**Behavior**:

- MUST detect inheritance relationships from `extendsClass`
- MUST detect realization relationships from `implementsInterfaces`
- MUST detect interface extension from `extendsInterfaces`
- SHOULD detect association relationships from property types (Phase 2)
- MUST assign unique IDs to relationships
- MUST handle cases where target class/interface is not in the provided arrays (external references)

**Error Handling**:

- Unknown class/interface references → create relationship anyway, mark target as external (Phase 2)
- Empty input arrays → return empty array
- Circular inheritance → include in results, validation happens elsewhere

**Examples**:

```typescript
const classes = [
  { name: "Employee", extendsClass: "Person", implementsInterfaces: ["IWorker"], ... },
  { name: "Person", extendsClass: null, implementsInterfaces: [], ... }
];
const interfaces = [
  { name: "IWorker", extendsInterfaces: [], ... }
];

const relationships = extractRelationships(classes, interfaces);

// Expected result:
[
  {
    id: "rel_Employee_Person_inheritance",
    type: "inheritance",
    sourceId: "file::Employee",
    targetId: "file::Person",
    label: null,
    multiplicity: null
  },
  {
    id: "rel_Employee_IWorker_realization",
    type: "realization",
    sourceId: "file::Employee",
    targetId: "file::IWorker",
    label: null,
    multiplicity: null
  }
]
```

---

## Interface: ClassExtractor

Internal utility for extracting class information from TypeScript AST.

### `extractClassInfo(node: ts.ClassDeclaration, fileId: string): ClassDefinition`

Extracts class information from a TypeScript AST class declaration node.

**Parameters**:

- `node: ts.ClassDeclaration` - TypeScript AST node
- `fileId: string` - File identifier

**Returns**: `ClassDefinition`

**Behavior**:

- MUST extract class name from `node.name`
- MUST detect `abstract` keyword
- MUST detect `export` keyword
- MUST extract all properties using `extractProperties()`
- MUST extract all methods using `extractMethods()`
- MUST extract heritage clauses (extends, implements)
- MUST extract type parameters

**Contract Tests Required**:

- ✅ Extracts simple class with properties and methods
- ✅ Detects abstract classes
- ✅ Detects exported classes
- ✅ Extracts generic type parameters
- ✅ Extracts extends clause
- ✅ Extracts implements clause
- ✅ Handles classes with no members

---

## Interface: RelationshipAnalyzer

Internal utility for analyzing type relationships.

### `analyzePropertyTypes(classes: ClassDefinition[], interfaces: InterfaceDefinition[]): Relationship[]`

Analyzes property types to detect association, composition, and aggregation relationships (Phase 2).

**Parameters**:

- `classes: ClassDefinition[]` - Parsed classes
- `interfaces: InterfaceDefinition[]` - Parsed interfaces

**Returns**: `Relationship[]`

**Behavior** (Phase 2):

- MUST detect when a property type references another class → association
- SHOULD detect array types → aggregation
- SHOULD detect composition based on lifecycle hints (constructor initialization)

**Note**: This is a Phase 2 feature. For MVP (Phase 1), only inheritance and realization relationships are extracted.

---

## Error Codes

| Code     | Message                               | Severity | Resolution                                        |
| -------- | ------------------------------------- | -------- | ------------------------------------------------- |
| `TS1001` | Invalid syntax at line X              | error    | Fix TypeScript syntax                             |
| `TS1002` | Unexpected token                      | error    | Fix TypeScript syntax                             |
| `TS2000` | Type annotation expected              | warning  | Add type annotation                               |
| `TS2001` | Abstract method in non-abstract class | error    | Mark class as abstract or remove abstract methods |

---

## Test Requirements

### Contract Tests (MUST implement before parser code)

1. **Valid class parsing**

   - Given: Simple class with properties and methods
   - When: `parse()` called
   - Then: Returns `ClassDefinition` with correct structure

2. **Valid interface parsing**

   - Given: Interface with properties and method signatures
   - When: `parse()` called
   - Then: Returns `InterfaceDefinition` with correct structure

3. **Syntax error handling**

   - Given: TypeScript code with syntax errors
   - When: `parse()` called
   - Then: Returns `success: false` with errors array populated

4. **Inheritance detection**

   - Given: Class that extends another class
   - When: `parse()` called
   - Then: `extendsClass` field is populated correctly

5. **Interface implementation detection**

   - Given: Class that implements interfaces
   - When: `parse()` called
   - Then: `implementsInterfaces` array is populated

6. **Generic type parameters**

   - Given: Class with generic type parameters `<T, K>`
   - When: `parse()` called
   - Then: `typeParameters` array contains ["T", "K"]

7. **Access modifiers**

   - Given: Class with public, private, protected members
   - When: `parse()` called
   - Then: Each property/method has correct visibility

8. **Static and readonly modifiers**

   - Given: Class with static and readonly members
   - When: `parse()` called
   - Then: `isStatic` and `isReadonly` flags are correct

9. **Relationship extraction - inheritance**

   - Given: Classes with inheritance chain
   - When: `extractRelationships()` called
   - Then: Returns relationship with type "inheritance"

10. **Relationship extraction - realization**

    - Given: Class implementing interface
    - When: `extractRelationships()` called
    - Then: Returns relationship with type "realization"

11. **Performance test**

    - Given: TypeScript file with 50 classes (800 lines)
    - When: `parse()` called
    - Then: Completes in <500ms

12. **Empty source handling**
    - Given: Empty string or whitespace-only source
    - When: `parse()` called
    - Then: Returns `success: true` with empty arrays

---

## Dependencies

- `typescript` package (TypeScript Compiler API)
- `uuid` package (for generating unique IDs)

---

## Notes

- This is an **internal module contract**, not a REST/HTTP API
- Parser should be **stateless** - no internal caching (caching happens at higher level)
- All types reference the `data-model.md` definitions
- Contract tests MUST pass before implementation begins (TDD)
