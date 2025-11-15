# Data Model: UML Diagram Scope Control & Cross-File Import Resolution

**Date**: 2025-11-16  
**Feature**: 004-diagram-scope

## Entity Schemas

### 1. DiagramScope

Represents the viewing scope for diagram rendering (file-scoped or project-scoped).

```typescript
/**
 * Diagram scope configuration
 * Determines which entities should be visible in the current diagram view
 */
interface DiagramScope {
  /** Current view mode */
  mode: 'file' | 'project';
  
  /** Active file being viewed (null when no file selected) */
  activeFileId: string | null;
  
  /** Dependency graph for import resolution (built from all files) */
  importGraph?: Map<string, DependencyNode>;
}
```

**Validation Rules**:
- `mode` must be either 'file' or 'project'
- `activeFileId` must be null or a valid file ID from the project
- `importGraph` is optional, required only for file mode with imports

**State Transitions**:
- Initial: `{ mode: 'file', activeFileId: null, importGraph: undefined }`
- File selected: `activeFileId` set to file ID
- Toggle to project view: `mode` changes to 'project'
- Toggle to file view: `mode` changes back to 'file'

---

### 2. ImportInfo

Represents a parsed import statement from a TypeScript file.

```typescript
/**
 * Information about a single import statement
 */
interface ImportInfo {
  /** Import path as written in code (e.g., './Person', '../models/User') */
  importPath: string;
  
  /** Resolved absolute file path (e.g., 'src/models/Person.ts') */
  resolvedPath: string | null;
  
  /** Resolved file ID (null if import not found in project) */
  resolvedFileId: string | null;
  
  /** Names imported from the module */
  importedNames: string[];
  
  /** Whether this is a type-only import */
  isTypeOnly: boolean;
  
  /** Whether this is a namespace import (import * as X) */
  isNamespaceImport: boolean;
  
  /** Line number in source file (for debugging) */
  lineNumber: number;
}
```

**Validation Rules**:
- `importPath` must be non-empty string
- `resolvedPath` is null for external imports (non-relative paths)
- `resolvedFileId` is null when `resolvedPath` is null or file not found
- `importedNames` is empty array for side-effect imports (e.g., `import './styles.css'`)
- `isNamespaceImport` is true only when `importedNames` is empty and import has `as` clause
- `lineNumber` must be positive integer

**Derived Values**:
- `isExternal`: computed as `!importPath.startsWith('.')`
- `isResolved`: computed as `resolvedFileId !== null`

---

### 3. DependencyNode

Represents a file node in the dependency graph with its imports and entities.

```typescript
/**
 * Node in the cross-file dependency graph
 */
interface DependencyNode {
  /** File ID */
  fileId: string;
  
  /** File path for display/debugging */
  filePath: string;
  
  /** Parsed import statements from this file */
  imports: ImportInfo[];
  
  /** File IDs that this file imports from (resolved, non-null only) */
  importedFileIds: Set<string>;
  
  /** Parsed entities (classes and interfaces) from this file */
  entities: Array<ClassDefinition | InterfaceDefinition>;
  
  /** Whether this file has been visited during graph traversal */
  visited?: boolean;
}
```

**Validation Rules**:
- `fileId` must be unique across all nodes
- `filePath` must match the file's actual path in the project
- `imports` array can be empty (file with no imports)
- `importedFileIds` is derived from `imports` (only resolved, project-internal imports)
- `entities` array can be empty (file with no classes/interfaces)
- `visited` is optional, used during graph traversal algorithms

**Relationships**:
- One DependencyNode per ProjectFile
- DependencyNode.importedFileIds references other DependencyNode.fileId values
- Graph may contain cycles (circular dependencies)

---

### 4. FilteredEntitySet

Result of filtering entities based on diagram scope.

```typescript
/**
 * Set of entities after applying scope filtering rules
 */
interface FilteredEntitySet {
  /** Entities to display in the diagram */
  entities: Array<ClassDefinition | InterfaceDefinition>;
  
  /** Reason for inclusion for each entity (for debugging/testing) */
  inclusionReasons: Map<string, EntityInclusionReason>;
  
  /** Total entities before filtering */
  totalEntitiesBeforeFilter: number;
  
  /** Filter execution time in milliseconds */
  filterTimeMs: number;
}

/**
 * Reason why an entity was included in the filtered set
 */
type EntityInclusionReason =
  | { type: 'local'; fileId: string }                    // Entity defined in active file
  | { type: 'imported'; importedBy: string; hasRelationship: boolean }  // Imported and used
  | { type: 'project-view' }                             // Project view includes all
  | { type: 'transitive'; depth: number; via: string };  // Imported by an imported file
```

**Validation Rules**:
- `entities` must not contain duplicates (based on entity name + file ID)
- `inclusionReasons` must have entry for every entity in `entities`
- `totalEntitiesBeforeFilter` must be >= `entities.length`
- `filterTimeMs` must be non-negative

**Performance Constraints**:
- Filter execution should complete in <100ms for 50 entities
- Memory overhead should be minimal (no entity duplication)

---

### 5. ViewModeState (Store Slice)

Zustand state slice for managing diagram view mode.

```typescript
/**
 * View mode state slice in Zustand store
 */
interface ViewModeSlice {
  /** Current diagram view mode */
  diagramViewMode: 'file' | 'project';
  
  /** Set the diagram view mode */
  setDiagramViewMode: (mode: 'file' | 'project') => void;
  
  /** Get current diagram scope (computed) */
  getDiagramScope: () => DiagramScope;
}
```

**State Transitions**:
```
Initial State: { diagramViewMode: 'file' }

Actions:
  setDiagramViewMode('project') → { diagramViewMode: 'project' }
  setDiagramViewMode('file')    → { diagramViewMode: 'file' }
  
Computed:
  getDiagramScope() → DiagramScope based on current mode and activeFileId
```

**Integration with Existing Store**:
- ViewModeSlice is added to the combined StoreState
- Composed using Zustand's slice pattern (same as FileSlice, EditorSlice, etc.)
- Accessed via `useStore()` hook or selectors

---

## Relationships Between Entities

```
ProjectFile (existing)
    ↓
  parses to
    ↓
DependencyNode (has ImportInfo[], entities[])
    ↓
  used by ImportResolver to build
    ↓
Dependency Graph (Map<fileId, DependencyNode>)
    ↓
  combined with ViewModeState to create
    ↓
DiagramScope
    ↓
  passed to EntityFilter to produce
    ↓
FilteredEntitySet
    ↓
  passed to DiagramGenerator (existing) to produce
    ↓
DiagramNode[] + DiagramEdge[] (existing)
```

---

## Data Flow

### File View Mode (Default)

1. User selects file in file tree
2. Store updates `activeFileId`
3. ImportResolver builds DependencyNode for active file
4. ImportResolver traverses dependency graph to find imported entities
5. EntityFilter includes:
   - All entities from active file
   - Imported entities that have relationships with local entities
6. DiagramGenerator renders filtered entities

### Project View Mode

1. User clicks "Project View" toggle
2. Store updates `diagramViewMode` to 'project'
3. EntityFilter includes ALL entities from ALL files
4. DiagramGenerator renders all entities with all relationships

### View Mode Toggle

```
File View → Project View:
  - Expand entity set to include all files
  - Maintain viewport position
  - Apply spacious layout configuration

Project View → File View:
  - Contract entity set to active file + imports
  - Re-center viewport on filtered entities
  - Apply compact layout configuration
```

---

## Storage Considerations

**Not Persisted** (ephemeral session state):
- `diagramViewMode` (resets to 'file' on page reload)
- `DiagramScope` (recomputed on demand)
- `FilteredEntitySet` (recomputed when scope changes)
- Dependency graph (rebuilt from file content on load)

**Persisted in IndexedDB** (via existing ProjectManager):
- ProjectFile with content (contains import statements)
- Parsed entities (ClassDefinition, InterfaceDefinition) stored in ParserSlice

**Reasoning**: View mode is a temporary UI preference. Import relationships are derived from file content and can be recomputed quickly (<100ms). Persisting would add complexity without significant benefit.

---

## Performance Characteristics

| Operation | Expected Time | Max Entities |
|-----------|---------------|--------------|
| Build dependency graph | <100ms | 100 files |
| Filter entities (file view) | <50ms | 50 entities |
| Filter entities (project view) | <100ms | 200 entities |
| Resolve single import | <10ms | N/A |
| Traverse circular dependency | <50ms | 10-file cycle |

**Memory Usage**:
- DependencyNode: ~500 bytes per file (imports + metadata)
- ImportInfo: ~200 bytes per import statement
- Dependency graph for 100 files with avg 5 imports: ~70KB
- Acceptable overhead given client-side constraints

---

## Migration Notes

**Existing Data**:
- No migration needed for stored data (file content unchanged)
- Existing parsed entities remain compatible (no schema changes)
- Store structure extended (new ViewModeSlice added), existing slices unchanged

**Backward Compatibility**:
- Feature is additive (no breaking changes to existing types)
- Default view mode is 'file' (preserves existing behavior once fixed)
- Existing diagram generation code reused (no API changes)
