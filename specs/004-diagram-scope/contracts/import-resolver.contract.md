# API Contract: ImportResolver

**Module**: `frontend/src/diagram-visualization/ImportResolver.ts`  
**Purpose**: Parse TypeScript import statements and build cross-file dependency graph

## Public API

### Function: `parseImports`

Extracts import statements from TypeScript source code.

```typescript
function parseImports(
  sourceCode: string,
  sourceFilePath: string
): ImportInfo[]
```

**Parameters**:
- `sourceCode`: TypeScript source code as string
- `sourceFilePath`: File path for the source (used for error reporting)

**Returns**: Array of `ImportInfo` objects representing parsed imports

**Contract**:
- MUST parse all ES6 import statements (named, default, namespace, side-effect)
- MUST extract import path exactly as written in code
- MUST extract all imported names from named imports
- MUST handle type-only imports (`import type { T }`)
- MUST handle namespace imports (`import * as X`)
- MUST record line numbers for each import
- MUST NOT throw on syntax errors (return empty array instead)
- MUST NOT parse dynamic imports (`import()` expressions)
- MUST NOT parse CommonJS (`require()`) statements

**Examples**:

```typescript
// Input source code:
const code = `
import { Person } from './Person';
import type { IUser } from '../types';
import Employee from './Employee';
import * as utils from './utils';
`;

// Expected output:
parseImports(code, 'src/Manager.ts') === [
  {
    importPath: './Person',
    resolvedPath: null,        // Not resolved yet
    resolvedFileId: null,
    importedNames: ['Person'],
    isTypeOnly: false,
    isNamespaceImport: false,
    lineNumber: 2
  },
  {
    importPath: '../types',
    resolvedPath: null,
    resolvedFileId: null,
    importedNames: ['IUser'],
    isTypeOnly: true,
    isNamespaceImport: false,
    lineNumber: 3
  },
  {
    importPath: './Employee',
    resolvedPath: null,
    resolvedFileId: null,
    importedNames: ['Employee'],  // Default import treated as named
    isTypeOnly: false,
    isNamespaceImport: false,
    lineNumber: 4
  },
  {
    importPath: './utils',
    resolvedPath: null,
    resolvedFileId: null,
    importedNames: [],
    isTypeOnly: false,
    isNamespaceImport: true,
    lineNumber: 5
  }
];
```

**Edge Cases**:
- Multi-line imports: MUST parse correctly across line breaks
- Comments in imports: MUST ignore comments
- String concatenation in paths: MUST only handle string literals (no variables)
- Malformed syntax: MUST return empty array, not throw

---

### Function: `resolveImportPaths`

Resolves relative import paths to actual file IDs in the project.

```typescript
function resolveImportPaths(
  imports: ImportInfo[],
  currentFilePath: string,
  filePathMap: Map<string, string>
): ImportInfo[]
```

**Parameters**:
- `imports`: Array of unresolved imports from `parseImports()`
- `currentFilePath`: Path of the file containing these imports
- `filePathMap`: Lookup table of `filePath → fileId` for all project files

**Returns**: New array of `ImportInfo` with `resolvedPath` and `resolvedFileId` populated

**Contract**:
- MUST resolve relative imports (`./`, `../`) to absolute paths
- MUST return original import path unchanged in `importPath` field
- MUST set `resolvedPath` to null for external imports (non-relative paths)
- MUST set `resolvedFileId` to null when file not found in project
- MUST try both with and without `.ts` extension
- MUST handle parent directory navigation (`../../../file`)
- MUST NOT throw on unresolvable imports (set fields to null)
- MUST NOT modify original `imports` array (immutable)

**Examples**:

```typescript
// Input:
const imports: ImportInfo[] = [
  { importPath: './Person', resolvedPath: null, resolvedFileId: null, ... },
  { importPath: '../models/User', resolvedPath: null, resolvedFileId: null, ... },
  { importPath: 'react', resolvedPath: null, resolvedFileId: null, ... }
];

const currentFilePath = 'src/services/UserService.ts';

const filePathMap = new Map([
  ['src/models/Person.ts', 'file-123'],
  ['src/models/User.ts', 'file-456']
]);

// Expected output:
resolveImportPaths(imports, currentFilePath, filePathMap) === [
  {
    importPath: './Person',
    resolvedPath: 'src/services/Person.ts',
    resolvedFileId: null,  // Not found (wrong directory)
    ...
  },
  {
    importPath: '../models/User',
    resolvedPath: 'src/models/User.ts',
    resolvedFileId: 'file-456',  // Found!
    ...
  },
  {
    importPath: 'react',
    resolvedPath: null,  // External library
    resolvedFileId: null,
    ...
  }
];
```

---

### Function: `buildDependencyGraph`

Builds a complete dependency graph for all files in the project.

```typescript
function buildDependencyGraph(
  files: ProjectFile[],
  parsedEntities: Map<string, Array<ClassDefinition | InterfaceDefinition>>
): Map<string, DependencyNode>
```

**Parameters**:
- `files`: All project files with their content
- `parsedEntities`: Map of `fileId → parsed entities` from TypeScriptParser

**Returns**: Dependency graph as `Map<fileId, DependencyNode>`

**Contract**:
- MUST create one DependencyNode per file
- MUST parse imports for each file
- MUST resolve all import paths
- MUST populate `importedFileIds` set with only resolved imports
- MUST include entities from `parsedEntities` map
- MUST handle files with no imports (empty `imports` array)
- MUST handle files with no entities (empty `entities` array)
- MUST NOT fail if a file cannot be parsed (create node with empty imports)
- MUST complete in <100ms for 100 files (performance requirement)

**Example**:

```typescript
const files: ProjectFile[] = [
  { id: 'file-1', path: 'Person.ts', content: 'class Person {}', ... },
  { id: 'file-2', path: 'Employee.ts', content: `import { Person } from './Person'; class Employee extends Person {}`, ... }
];

const parsedEntities = new Map([
  ['file-1', [{ kind: 'class', name: 'Person', ... }]],
  ['file-2', [{ kind: 'class', name: 'Employee', extendsClass: 'Person', ... }]]
]);

const graph = buildDependencyGraph(files, parsedEntities);

// Expected structure:
graph.get('file-1') === {
  fileId: 'file-1',
  filePath: 'Person.ts',
  imports: [],
  importedFileIds: new Set(),
  entities: [{ kind: 'class', name: 'Person', ... }]
};

graph.get('file-2') === {
  fileId: 'file-2',
  filePath: 'Employee.ts',
  imports: [{ importPath: './Person', resolvedFileId: 'file-1', ... }],
  importedFileIds: new Set(['file-1']),
  entities: [{ kind: 'class', name: 'Employee', ... }]
};
```

---

### Function: `collectRelatedEntities`

Collects entities from the active file and all transitively imported files.

```typescript
function collectRelatedEntities(
  startFileId: string,
  graph: Map<string, DependencyNode>,
  maxDepth?: number
): Array<ClassDefinition | InterfaceDefinition>
```

**Parameters**:
- `startFileId`: File ID to start traversal from
- `graph`: Dependency graph from `buildDependencyGraph()`
- `maxDepth`: Maximum traversal depth (default: 5)

**Returns**: Flat array of all entities from start file and its imports (transitive)

**Contract**:
- MUST include all entities from `startFileId`
- MUST include entities from directly imported files
- MUST include entities from transitively imported files (up to `maxDepth`)
- MUST NOT include duplicates (same entity from multiple paths)
- MUST handle circular dependencies without infinite loops
- MUST use breadth-first search (BFS) for traversal
- MUST stop at `maxDepth` levels to prevent pathological cases
- MUST NOT throw if `startFileId` not in graph (return empty array)
- MUST complete in <50ms for typical project (10 files, 3 levels deep)

**Examples**:

```typescript
// Dependency structure: A imports B, B imports C, C imports A (circular)
const graph = new Map([
  ['A', { fileId: 'A', entities: [entityA], importedFileIds: new Set(['B']), ... }],
  ['B', { fileId: 'B', entities: [entityB], importedFileIds: new Set(['C']), ... }],
  ['C', { fileId: 'C', entities: [entityC], importedFileIds: new Set(['A']), ... }]
]);

// When starting from A:
collectRelatedEntities('A', graph, 5) === [entityA, entityB, entityC];

// Entities appear exactly once despite circular reference
// BFS ensures all reachable entities are found
```

**Performance**:
- Time complexity: O(V + E) where V = files, E = import statements
- Space complexity: O(V) for visited set
- Depth limit prevents exponential blowup in pathological cases

---

## Error Handling

**No Exceptions**: All functions MUST handle errors gracefully without throwing

**Error Scenarios**:
- Malformed TypeScript syntax → Return empty imports array
- Unresolvable import path → Set `resolvedFileId` to null
- Missing file in graph → Return empty array
- Circular dependencies → Detect with visited set, terminate cleanly
- Null/undefined inputs → Treat as empty (defensive programming)

**Logging**:
- MAY log warnings for unresolved imports (development mode only)
- MAY log errors for unexpected failures (console.error)
- MUST NOT spam console in production

---

## Testing Requirements

**Contract Tests** (must pass before implementation accepted):
1. Parse named imports: `import { A, B } from './file'`
2. Parse default imports: `import A from './file'`
3. Parse namespace imports: `import * as A from './file'`
4. Parse type-only imports: `import type { T } from './file'`
5. Ignore external imports: `import React from 'react'`
6. Resolve relative paths: `./file`, `../folder/file`
7. Handle .ts extension: `./file` resolves to `./file.ts`
8. Build graph for multi-file project
9. Collect entities with circular dependencies
10. Performance: Parse 100 imports in <50ms
11. Performance: Build graph for 100 files in <100ms
12. Performance: Collect entities in <50ms (10 files, 3 levels)

**Edge Case Tests**:
- Multi-line import statements
- Import with trailing comma
- Import with comments
- Deeply nested relative paths (`../../../file`)
- Non-existent file in import
- Empty source code
- Source code with only comments

---

## Dependencies

**Required**:
- TypeScript Compiler API (`typescript` package) - already in project
- ProjectFile type from `shared/types`
- ClassDefinition, InterfaceDefinition types from `shared/types`

**No External Dependencies**: Implementation uses only TypeScript stdlib and existing project types
