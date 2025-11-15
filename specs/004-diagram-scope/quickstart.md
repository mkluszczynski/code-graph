# Developer Quickstart: UML Diagram Scope Control & Cross-File Import Resolution

**Feature**: 004-diagram-scope  
**Last Updated**: 2025-11-16

## Overview

This feature adds diagram scope control to show isolated file views (default) or project-wide views, with cross-file import resolution to display dependencies.

**Key Components**:
- **ImportResolver**: Parses imports and builds dependency graph
- **EntityFilter**: Filters entities based on scope (file vs project view)
- **ViewModeToggle**: UI control to switch between file and project views
- **ViewModeSlice**: Zustand state management for view mode

## Quick Start

### 1. Understanding the Problem

**Before this feature**:
```typescript
// DiagramGenerator receives ALL entities from ALL files
const allEntities = useAllParsedEntities(); // Problem: shows everything
generateDiagram(allEntities);
```

**Result**: Diagram shows classes from all files simultaneously, even when viewing a single file. Confusing and cluttered.

**After this feature**:
```typescript
// EntityFilter provides scoped entities based on view mode
const scope = buildDiagramScope(viewMode, activeFileId);
const filtered = filterEntitiesByScope(allEntities, scope, graph);
generateDiagram(filtered.entities); // Only relevant entities shown
```

**Result**: Clean, focused diagrams showing only what matters for the current context.

---

### 2. Architecture Overview

```
User selects file in tree
    ↓
Store: activeFileId updated
    ↓
ImportResolver: Build dependency graph
    ↓
EntityFilter: Filter by scope rules
    ↓
DiagramGenerator: Render filtered entities (existing code)
    ↓
React Flow: Display diagram
```

**Data Flow**:
```
ProjectFile[] (stored files)
    ↓ parse imports
DependencyNode[] (graph)
    ↓ combine with ViewModeState
DiagramScope (scope config)
    ↓ filter entities
FilteredEntitySet (scoped entities)
    ↓ generate diagram
DiagramNode[] + DiagramEdge[] (React Flow)
```

---

### 3. Implementation Checklist

#### Phase 1: Types and Contracts (TDD Setup)

- [ ] Add new types to `frontend/src/shared/types/index.ts`:
  - `DiagramScope`
  - `ImportInfo`
  - `DependencyNode`
  - `FilteredEntitySet`
  - `EntityInclusionReason`

- [ ] Add ViewModeSlice to store (`frontend/src/shared/store/index.ts`):
  ```typescript
  interface ViewModeSlice {
    diagramViewMode: 'file' | 'project';
    setDiagramViewMode: (mode: 'file' | 'project') => void;
  }
  ```

#### Phase 2: ImportResolver (Test-First)

- [ ] Create contract tests: `frontend/src/diagram-visualization/__tests__/ImportResolver.contract.test.ts`
  - Test `parseImports()` for all import types
  - Test `resolveImportPaths()` for relative paths
  - Test `buildDependencyGraph()` for multi-file projects
  - Test `collectRelatedEntities()` for circular dependencies
  
- [ ] Verify tests FAIL (red) ✅

- [ ] Implement `ImportResolver.ts`:
  ```typescript
  export function parseImports(sourceCode: string, sourceFilePath: string): ImportInfo[]
  export function resolveImportPaths(imports: ImportInfo[], currentFilePath: string, filePathMap: Map<string, string>): ImportInfo[]
  export function buildDependencyGraph(files: ProjectFile[], parsedEntities: Map<string, Entity[]>): Map<string, DependencyNode>
  export function collectRelatedEntities(startFileId: string, graph: Map<string, DependencyNode>, maxDepth?: number): Entity[]
  ```

- [ ] Verify tests PASS (green) ✅

- [ ] Refactor for clean code ✅

#### Phase 3: EntityFilter (Test-First)

- [ ] Create contract tests: `frontend/src/diagram-visualization/__tests__/EntityFilter.unit.test.ts`
  - Test project view (all entities)
  - Test file view (local only, no imports)
  - Test file view with imports and relationships
  - Test circular dependency handling
  - Test performance (<50ms for 50 entities)

- [ ] Verify tests FAIL (red) ✅

- [ ] Implement `EntityFilter.ts`:
  ```typescript
  export function filterEntitiesByScope(
    allEntities: Map<string, Entity[]>,
    scope: DiagramScope,
    dependencyGraph?: Map<string, DependencyNode>
  ): FilteredEntitySet
  ```

- [ ] Verify tests PASS (green) ✅

- [ ] Refactor for clean code ✅

#### Phase 4: Store Integration

- [ ] Add ViewModeSlice to store:
  ```typescript
  const createViewModeSlice: StateSliceCreator<ViewModeSlice> = (set, get) => ({
    diagramViewMode: 'file',
    setDiagramViewMode: (mode) => set({ diagramViewMode: mode })
  });
  ```

- [ ] Update combined store:
  ```typescript
  export const useStore = create<StoreState>()(
    devtools((...args) => ({
      ...createFileSlice(...args),
      ...createEditorSlice(...args),
      ...createDiagramSlice(...args),
      ...createParserSlice(...args),
      ...createFileTreeSlice(...args),
      ...createPersistenceSlice(...args),
      ...createViewModeSlice(...args),  // NEW
    }))
  );
  ```

- [ ] Test store slice in isolation

#### Phase 5: Diagram Integration

- [ ] Modify `useEditorController.ts`:
  ```typescript
  // Get view mode from store
  const diagramViewMode = useStore(state => state.diagramViewMode);
  
  // Build dependency graph
  const graph = useMemo(() => 
    buildDependencyGraph(files, parsedEntities),
    [files, parsedEntities]
  );
  
  // Create diagram scope
  const scope: DiagramScope = {
    mode: diagramViewMode,
    activeFileId: activeFileId,
    importGraph: graph
  };
  
  // Filter entities by scope
  const filteredEntities = filterEntitiesByScope(
    parsedEntities, 
    scope, 
    graph
  );
  
  // Generate diagram (existing code)
  const diagram = generateDiagram(filteredEntities.entities);
  ```

- [ ] Update debounce to trigger on view mode change:
  ```typescript
  useEffect(() => {
    debouncedUpdate(diagramViewMode, activeFileId, parsedEntities);
  }, [diagramViewMode, activeFileId, parsedEntities]);
  ```

- [ ] Test integration with manual file switching

#### Phase 6: View Mode Toggle UI

- [ ] Create `ViewModeToggle.tsx` component:
  ```typescript
  export function ViewModeToggle() {
    const { diagramViewMode, setDiagramViewMode } = useStore(
      state => ({
        diagramViewMode: state.diagramViewMode,
        setDiagramViewMode: state.setDiagramViewMode
      })
    );
    
    return (
      <div className="view-mode-toggle">
        <button 
          onClick={() => setDiagramViewMode('file')}
          className={diagramViewMode === 'file' ? 'active' : ''}
        >
          File View
        </button>
        <button 
          onClick={() => setDiagramViewMode('project')}
          className={diagramViewMode === 'project' ? 'active' : ''}
        >
          Project View
        </button>
      </div>
    );
  }
  ```

- [ ] Add toggle to diagram visualization area (near export button)

- [ ] Test toggle switches view mode correctly

#### Phase 7: Layout Adjustments

- [ ] Update `LayoutEngine.ts` to adjust spacing based on view mode:
  ```typescript
  export function getLayoutConfig(viewMode: 'file' | 'project') {
    return viewMode === 'project'
      ? { nodesep: 100, ranksep: 120, marginx: 40, marginy: 40 } // Spacious
      : { nodesep: 60, ranksep: 80, marginx: 20, marginy: 20 };   // Compact
  }
  ```

- [ ] Pass view mode to layout engine in diagram generation

#### Phase 8: Integration Tests

- [ ] Create integration tests:
  - `frontend/tests/integration/diagram-scope/FileView.test.tsx`
  - `frontend/tests/integration/diagram-scope/CrossFileImports.test.tsx`
  - `frontend/tests/integration/diagram-scope/ProjectView.test.tsx`

- [ ] Test scenarios from spec:
  - User Story 1: Isolated file view
  - User Story 2: Cross-file imports
  - User Story 3: Project-wide view toggle

#### Phase 9: E2E Tests

- [ ] Create E2E test: `frontend/tests/e2e/diagram-scope.spec.ts`

- [ ] Test complete user workflows:
  - Create two files, switch between them, verify isolation
  - Create file with import, verify imported entity appears
  - Toggle to project view, verify all entities shown
  - Toggle back to file view, verify scoped view restored

#### Phase 10: Performance Validation

- [ ] Measure and validate:
  - File view update: <200ms (SC-003)
  - Project view toggle: <300ms (SC-005)
  - Import resolution: <100ms per file
  - Build graph for 100 files: <100ms

- [ ] Add performance monitoring:
  ```typescript
  const startTime = performance.now();
  const graph = buildDependencyGraph(files, parsedEntities);
  const endTime = performance.now();
  if (endTime - startTime > 100) {
    console.warn(`Graph build took ${endTime - startTime}ms`);
  }
  ```

---

### 4. Testing Strategy

**Test Pyramid**:
```
E2E Tests (5 tests)
    ↓ Complete user workflows
Integration Tests (15 tests)
    ↓ Cross-component interactions
Contract Tests (25 tests)
    ↓ ImportResolver + EntityFilter
Unit Tests (30 tests)
    ↓ Individual functions
```

**Coverage Targets**:
- ImportResolver: >85% (complex logic)
- EntityFilter: >85% (complex logic)
- ViewModeSlice: 100% (simple state)
- Integration: Key user scenarios
- E2E: P1 + P2 user stories

**Run Tests**:
```bash
# Unit + Integration
cd frontend
pnpm test

# Contract tests only
pnpm test ImportResolver.contract.test
pnpm test EntityFilter.unit.test

# E2E
pnpm test:e2e diagram-scope
```

---

### 5. Common Pitfalls

#### Pitfall 1: Forgetting to Pass Dependency Graph

```typescript
// ❌ Wrong: Missing dependency graph in file view
const filtered = filterEntitiesByScope(allEntities, scope);

// ✅ Correct: Pass graph for import resolution
const filtered = filterEntitiesByScope(allEntities, scope, graph);
```

#### Pitfall 2: Not Handling Circular Dependencies

```typescript
// ❌ Wrong: Infinite loop on circular imports
function traverse(fileId) {
  const node = graph.get(fileId);
  for (const importId of node.importedFileIds) {
    traverse(importId); // Circular: A→B→A causes stack overflow
  }
}

// ✅ Correct: Use visited set
function traverse(fileId, visited = new Set()) {
  if (visited.has(fileId)) return;
  visited.add(fileId);
  const node = graph.get(fileId);
  for (const importId of node.importedFileIds) {
    traverse(importId, visited);
  }
}
```

#### Pitfall 3: Mutable Data Structures

```typescript
// ❌ Wrong: Mutating input array
function resolveImportPaths(imports: ImportInfo[], ...) {
  imports.forEach(imp => {
    imp.resolvedPath = resolvePath(...); // Mutation!
  });
  return imports;
}

// ✅ Correct: Return new array
function resolveImportPaths(imports: ImportInfo[], ...) {
  return imports.map(imp => ({
    ...imp,
    resolvedPath: resolvePath(...)
  }));
}
```

#### Pitfall 4: Performance - Rebuilding Graph on Every Render

```typescript
// ❌ Wrong: Graph rebuilt on every render
function useEditorController() {
  const graph = buildDependencyGraph(files, parsedEntities); // Expensive!
  // ...
}

// ✅ Correct: Memoize graph
function useEditorController() {
  const graph = useMemo(() => 
    buildDependencyGraph(files, parsedEntities),
    [files, parsedEntities] // Only rebuild when files change
  );
  // ...
}
```

---

### 6. Debugging Tips

**Check Dependency Graph**:
```typescript
// Add temporary logging
const graph = buildDependencyGraph(files, parsedEntities);
console.log('Dependency Graph:', 
  Array.from(graph.entries()).map(([fileId, node]) => ({
    fileId,
    imports: node.imports.map(i => i.importPath),
    resolved: Array.from(node.importedFileIds)
  }))
);
```

**Check Filtered Entities**:
```typescript
const filtered = filterEntitiesByScope(allEntities, scope, graph);
console.log('Filtered Entities:', {
  total: filtered.totalEntitiesBeforeFilter,
  filtered: filtered.entities.length,
  reasons: Array.from(filtered.inclusionReasons.entries()),
  timeMs: filtered.filterTimeMs
});
```

**Check Import Resolution**:
```typescript
const imports = parseImports(sourceCode, filePath);
console.log('Parsed Imports:', imports.map(i => ({
  path: i.importPath,
  resolved: i.resolvedFileId,
  names: i.importedNames
})));
```

**Performance Profiling**:
```typescript
performance.mark('graph-start');
const graph = buildDependencyGraph(files, parsedEntities);
performance.mark('graph-end');
performance.measure('graph-build', 'graph-start', 'graph-end');
console.log(performance.getEntriesByName('graph-build')[0].duration);
```

---

### 7. Acceptance Criteria Checklist

From spec.md, verify these success criteria:

- [ ] SC-001: File with 3 local classes shows exactly 3 nodes (0 from other files)
- [ ] SC-002: File importing 2 classes, extending 1, shows 3 nodes + 1 inheritance edge
- [ ] SC-003: File selection updates diagram in <200ms (10 entities)
- [ ] SC-004: Project view shows 100% of entities (tested with 20-file project)
- [ ] SC-005: View mode toggle completes in <300ms (50 entities)
- [ ] SC-006: Import resolution handles 95%+ of standard patterns
- [ ] SC-007: Circular imports render without errors (100% of test cases)
- [ ] SC-008: All E2E file management tests pass
- [ ] SC-009: Users can understand dependencies via imported entities in file view
- [ ] SC-010: Users can understand architecture via project view
- [ ] SC-011: Auto-layout produces zero overlapping nodes (30 entities)

---

### 8. Next Steps After Implementation

**Phase 2 (from plan.md)**: Break into tasks using `/speckit.tasks` command

**Documentation**:
- Update user-guide.md with view mode toggle instructions
- Add diagrams showing file view vs project view
- Document keyboard shortcuts (if added)

**Future Enhancements** (not in scope):
- Persist view mode preference to localStorage
- Add "Focus Mode" to highlight only selected node + dependencies
- Add file grouping/clustering in project view
- Add search/filter in project view

---

## Questions?

Refer to:
- **Spec**: `specs/004-diagram-scope/spec.md` - User scenarios and requirements
- **Contracts**: `specs/004-diagram-scope/contracts/` - API specifications
- **Data Model**: `specs/004-diagram-scope/data-model.md` - Entity schemas
- **Research**: `specs/004-diagram-scope/research.md` - Technical decisions

**Constitution**: `.specify/memory/constitution.md` - Development principles
