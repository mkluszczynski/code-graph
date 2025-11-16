# API Contract: EntityFilter

**Module**: `frontend/src/diagram-visualization/EntityFilter.ts`  
**Purpose**: Filter parsed entities based on diagram scope (file view vs project view)

## Public API

### Function: `filterEntitiesByScope`

Filters entities based on the current diagram scope configuration.

```typescript
function filterEntitiesByScope(
  allEntities: Map<string, Array<ClassDefinition | InterfaceDefinition>>,
  scope: DiagramScope,
  dependencyGraph?: Map<string, DependencyNode>
): FilteredEntitySet
```

**Parameters**:
- `allEntities`: Map of `fileId → entities` for all parsed files in project
- `scope`: Diagram scope configuration (mode, activeFileId, importGraph)
- `dependencyGraph`: Optional dependency graph for import resolution (required for file mode)

**Returns**: `FilteredEntitySet` with filtered entities and metadata

**Contract**:

**Project View Mode** (`scope.mode === 'project'`):
- MUST return ALL entities from ALL files
- MUST NOT require `dependencyGraph` parameter
- MUST mark all entities with `inclusionReason: { type: 'project-view' }`
- MUST complete in <100ms for 200 entities

**File View Mode** (`scope.mode === 'file'`):
- MUST require `scope.activeFileId` to be non-null
- MUST require `dependencyGraph` parameter
- MUST include all entities from active file
- MUST include imported entities that have relationships with local entities
- MUST NOT include imported entities with no relationships
- MUST include transitively imported entities (if they have relationships)
- MUST handle circular dependencies without infinite loops
- MUST complete in <50ms for 50 entities

**No Active File**:
- If `scope.activeFileId` is null, MUST return empty FilteredEntitySet
- MUST NOT throw error (defensive programming)

**Performance Tracking**:
- MUST populate `filterTimeMs` with actual execution time
- MUST populate `totalEntitiesBeforeFilter` with input entity count
- MUST log warning if filter time exceeds 100ms (development mode)

---

### Examples

#### Example 1: Project View Mode

```typescript
const allEntities = new Map([
  ['file-1', [personClass, addressClass]],
  ['file-2', [employeeClass]],
  ['file-3', [managerClass]]
]);

const scope: DiagramScope = {
  mode: 'project',
  activeFileId: null,
  importGraph: undefined
};

const result = filterEntitiesByScope(allEntities, scope);

// Expected result:
result === {
  entities: [personClass, addressClass, employeeClass, managerClass],
  inclusionReasons: new Map([
    ['Person', { type: 'project-view' }],
    ['Address', { type: 'project-view' }],
    ['Employee', { type: 'project-view' }],
    ['Manager', { type: 'project-view' }]
  ]),
  totalEntitiesBeforeFilter: 4,
  filterTimeMs: 5  // Actual measurement
};
```

#### Example 2: File View Mode - No Imports

```typescript
const allEntities = new Map([
  ['file-1', [personClass]],  // Active file
  ['file-2', [employeeClass]]
]);

const scope: DiagramScope = {
  mode: 'file',
  activeFileId: 'file-1',
  importGraph: new Map([
    ['file-1', { fileId: 'file-1', entities: [personClass], importedFileIds: new Set(), ... }],
    ['file-2', { fileId: 'file-2', entities: [employeeClass], importedFileIds: new Set(), ... }]
  ])
};

const result = filterEntitiesByScope(allEntities, scope, scope.importGraph);

// Expected result:
result === {
  entities: [personClass],  // Only active file, no imports
  inclusionReasons: new Map([
    ['Person', { type: 'local', fileId: 'file-1' }]
  ]),
  totalEntitiesBeforeFilter: 2,
  filterTimeMs: 3
};
```

#### Example 3: File View Mode - With Imports and Relationships

```typescript
// Setup:
// - file-1: Employee extends Person (imports from file-2)
// - file-2: Person class
// - file-3: Unrelated class

const employeeClass: ClassDefinition = {
  kind: 'class',
  name: 'Employee',
  extendsClass: 'Person',  // Relationship!
  ...
};

const personClass: ClassDefinition = {
  kind: 'class',
  name: 'Person',
  ...
};

const unrelatedClass: ClassDefinition = {
  kind: 'class',
  name: 'Unrelated',
  ...
};

const allEntities = new Map([
  ['file-1', [employeeClass]],
  ['file-2', [personClass]],
  ['file-3', [unrelatedClass]]
]);

const graph = new Map([
  ['file-1', { 
    fileId: 'file-1', 
    entities: [employeeClass], 
    importedFileIds: new Set(['file-2']),  // Imports Person
    ... 
  }],
  ['file-2', { 
    fileId: 'file-2', 
    entities: [personClass], 
    importedFileIds: new Set(), 
    ... 
  }],
  ['file-3', { 
    fileId: 'file-3', 
    entities: [unrelatedClass], 
    importedFileIds: new Set(), 
    ... 
  }]
]);

const scope: DiagramScope = {
  mode: 'file',
  activeFileId: 'file-1',
  importGraph: graph
};

const result = filterEntitiesByScope(allEntities, scope, graph);

// Expected result:
result === {
  entities: [employeeClass, personClass],  // Employee + Person (due to inheritance)
  inclusionReasons: new Map([
    ['Employee', { type: 'local', fileId: 'file-1' }],
    ['Person', { type: 'imported', importedBy: 'file-1', hasRelationship: true }]
  ]),
  totalEntitiesBeforeFilter: 3,
  filterTimeMs: 8
};

// Unrelated class NOT included (no import, no relationship)
```

#### Example 4: Circular Dependency

```typescript
// Setup:
// - file-A: ClassA imports ClassB
// - file-B: ClassB imports ClassA (circular!)

const graph = new Map([
  ['file-A', { 
    fileId: 'file-A', 
    entities: [classA], 
    importedFileIds: new Set(['file-B']),
    ... 
  }],
  ['file-B', { 
    fileId: 'file-B', 
    entities: [classB], 
    importedFileIds: new Set(['file-A']),  // Circular!
    ... 
  }]
]);

const scope: DiagramScope = {
  mode: 'file',
  activeFileId: 'file-A',
  importGraph: graph
};

const result = filterEntitiesByScope(allEntities, scope, graph);

// Expected: Both classes included, no infinite loop
result.entities === [classA, classB];

// Filter completes in <50ms despite circular dependency
```

---

## Relationship Detection Logic

To determine if an imported entity should be included, check for these relationship types:

### 1. Inheritance Relationship

```typescript
// Entity has extendsClass that matches an imported entity name
localEntity.extendsClass === importedEntity.name
→ Include importedEntity
```

### 2. Realization Relationship (Interface Implementation)

```typescript
// Entity implements interface that matches an imported entity name
localEntity.implements.includes(importedEntity.name)
→ Include importedEntity
```

### 3. Association Relationship (Property Type)

```typescript
// Entity has property whose type matches an imported entity name
localEntity.properties.some(prop => prop.type === importedEntity.name)
→ Include importedEntity
```

### 4. Transitive Relationships

If imported entity A has relationship with B, and B is imported:
```
file-1 (active): ClassX extends ClassA
file-2: ClassA extends ClassB
file-3: ClassB

→ Include ClassA (direct relationship)
→ Include ClassB (transitive relationship via ClassA)
```

**Implementation**: Use BFS traversal from `collectRelatedEntities()` in ImportResolver

---

## Algorithm Pseudocode

```
function filterEntitiesByScope(allEntities, scope, dependencyGraph):
  startTime = performance.now()
  
  // Project view: include everything
  if scope.mode === 'project':
    entities = flatten all values from allEntities
    reasons = mark all as 'project-view'
    return FilteredEntitySet(entities, reasons, ...)
  
  // File view: filter by scope
  if scope.mode === 'file':
    if scope.activeFileId is null:
      return empty FilteredEntitySet
    
    if dependencyGraph is null:
      throw error "Dependency graph required for file view"
    
    // Get entities from active file
    localEntities = allEntities.get(scope.activeFileId)
    reasons = mark localEntities as 'local'
    
    // Get related entities from imports (via ImportResolver)
    relatedEntities = collectRelatedEntities(
      scope.activeFileId, 
      dependencyGraph
    )
    
    // Filter related entities: only include those with relationships
    importedEntities = []
    for entity in relatedEntities:
      if entity not in localEntities:
        if hasRelationshipWithLocalEntities(entity, localEntities):
          importedEntities.add(entity)
          reasons[entity] = 'imported'
    
    finalEntities = localEntities + importedEntities
    
    endTime = performance.now()
    filterTimeMs = endTime - startTime
    
    return FilteredEntitySet(finalEntities, reasons, filterTimeMs, ...)
```

---

## Error Handling

**Defensive Programming**:
- MUST handle null/undefined inputs gracefully (return empty set)
- MUST handle missing keys in maps (defensive access with `.get()`)
- MUST handle circular dependencies without stack overflow
- MUST NOT throw exceptions in normal operation

**Validation**:
- MAY validate scope object structure (development mode)
- MAY log warnings for unexpected conditions (console.warn)
- MUST log error if filter time exceeds 100ms

**Edge Cases**:
- Empty `allEntities` map → Return empty FilteredEntitySet
- No entities in active file → Return empty FilteredEntitySet
- Active file not in dependency graph → Return empty FilteredEntitySet
- Malformed entity definitions → Skip entity, continue filtering

---

## Testing Requirements

**Contract Tests** (must pass before implementation accepted):

1. **Project View Tests**:
   - Returns all entities from all files
   - Marks all with 'project-view' reason
   - Handles empty entity set
   - Completes in <100ms for 200 entities

2. **File View Tests - No Imports**:
   - Returns only local entities
   - Marks all with 'local' reason
   - Excludes entities from other files

3. **File View Tests - With Imports**:
   - Includes imported entity with inheritance relationship
   - Includes imported entity with interface implementation
   - Includes imported entity with property type relationship
   - Excludes imported entity with no relationships
   - Handles transitive imports (multi-level)

4. **Circular Dependency Tests**:
   - Handles A→B→A circular reference
   - Handles A→B→C→A longer cycle
   - Completes in <50ms despite cycles
   - Returns each entity exactly once

5. **Performance Tests**:
   - 50 entities in <50ms (file view)
   - 200 entities in <100ms (project view)
   - Measures and records actual filter time
   - Logs warning if exceeds threshold

6. **Edge Case Tests**:
   - Null active file ID → empty result
   - Missing dependency graph → empty result (or error)
   - Empty entity map → empty result
   - Active file with no entities → empty result

---

## Dependencies

**Required**:
- ImportResolver (`collectRelatedEntities` function)
- DiagramScope type from `shared/types`
- DependencyNode type from `shared/types`
- ClassDefinition, InterfaceDefinition types from `shared/types`
- FilteredEntitySet type from `shared/types`

**Performance Monitoring**:
- `performance.now()` for timing measurements
- Console API for warnings/errors

**No External Dependencies**: Uses only browser APIs and project types
