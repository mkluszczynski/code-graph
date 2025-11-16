# Research: UML Diagram Scope Control & Cross-File Import Resolution

**Date**: 2025-11-16  
**Feature**: 004-diagram-scope

## Research Areas

### 1. TypeScript Import Statement Parsing

**Question**: How to reliably parse and resolve TypeScript import statements (relative paths, named imports, default imports, multiple imports)?

**Decision**: Use TypeScript Compiler API `ts.ImportDeclaration` AST nodes with manual path resolution

**Rationale**:
- TypeScript Compiler API already available (used in TypeScriptParser)
- AST approach is more reliable than regex parsing
- Provides structured access to import clauses, named bindings, and module specifiers
- Can distinguish between named imports (`import { A }`) and default imports (`import A`)
- Path resolution can be implemented using standard path manipulation (resolve relative paths against file tree)

**Implementation approach**:
```typescript
// Example AST traversal for imports
import * as ts from 'typescript';

function extractImports(sourceFile: ts.SourceFile): ImportInfo[] {
  const imports: ImportInfo[] = [];
  
  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        const importedNames = extractImportedNames(node);
        imports.push({ path: importPath, names: importedNames });
      }
    }
  });
  
  return imports;
}
```

**Alternatives considered**:
- Regex-based parsing: Too fragile, doesn't handle complex cases (multi-line imports, comments)
- Static analysis tools (e.g., dependency-cruiser): Overkill for our needs, adds external dependency
- Manual string parsing: Error-prone, difficult to maintain

**Edge cases handled**:
- Relative imports: `./Person`, `../models/User` → resolve against current file's directory
- Type-only imports: `import type { IUser }` → included in import resolution
- Side-effect imports: `import './styles.css'` → ignored (no named imports)
- External library imports: `import React from 'react'` → ignored (not in project files)
- Namespace imports: `import * as utils from './utils'` → track entire module import

---

### 2. Circular Import Detection and Handling

**Question**: How to prevent infinite loops when files have circular import dependencies (A imports B, B imports A)?

**Decision**: Use visited set during dependency graph traversal with depth-limited BFS

**Rationale**:
- Circular imports are valid in TypeScript (allowed by the language)
- Graph traversal with visited tracking prevents revisiting nodes
- Breadth-first search (BFS) ensures we capture all relevant entities without infinite recursion
- Depth limit (e.g., max 5 levels) prevents pathological cases from degrading performance
- React Flow handles cyclic graphs correctly for rendering (bidirectional arrows)

**Implementation approach**:
```typescript
interface DependencyGraph {
  fileId: string;
  imports: Set<string>; // File IDs
  entities: Entity[];
}

function collectRelatedEntities(
  startFileId: string,
  graph: Map<string, DependencyGraph>,
  maxDepth = 5
): Entity[] {
  const visited = new Set<string>();
  const queue: Array<{ fileId: string; depth: number }> = [
    { fileId: startFileId, depth: 0 }
  ];
  const entities: Entity[] = [];
  
  while (queue.length > 0) {
    const { fileId, depth } = queue.shift()!;
    
    if (visited.has(fileId) || depth > maxDepth) {
      continue;
    }
    
    visited.add(fileId);
    const node = graph.get(fileId);
    
    if (node) {
      entities.push(...node.entities);
      
      // Only traverse to imports that have relationships
      for (const importedFileId of node.imports) {
        if (!visited.has(importedFileId)) {
          queue.push({ fileId: importedFileId, depth: depth + 1 });
        }
      }
    }
  }
  
  return entities;
}
```

**Alternatives considered**:
- Depth-first search (DFS): Could hit stack limits with deep chains, BFS is safer
- No cycle detection: Would cause infinite loops and application freeze
- Prohibit circular imports: Too restrictive, TypeScript allows them for valid reasons
- Cycle breaking: Would show incomplete relationships, better to show all

**Testing strategy**:
- Create test cases with A→B→A circular dependency
- Verify both entities appear exactly once in diagram
- Verify bidirectional relationship arrows render correctly
- Performance test with complex multi-file cycles (A→B→C→A)

---

### 3. Import Path Resolution Strategy

**Question**: How to resolve relative import paths (./file, ../folder/file) to actual file IDs in the project?

**Decision**: Build file path lookup table and use path.resolve logic for relative path resolution

**Rationale**:
- File tree already stores `path` property for each ProjectFile
- Can build Map<string, fileId> for O(1) lookups
- Standard path manipulation (strip extensions, resolve relative paths) is well-understood
- No need for complex module resolution (no node_modules, no path aliases)

**Implementation approach**:
```typescript
interface PathResolver {
  filePathMap: Map<string, string>; // path → fileId
  
  resolveImport(
    currentFilePath: string,
    importPath: string
  ): string | null {
    // Ignore external imports
    if (!importPath.startsWith('.')) {
      return null;
    }
    
    // Extract directory of current file
    const currentDir = currentFilePath.substring(
      0,
      currentFilePath.lastIndexOf('/')
    );
    
    // Resolve relative path
    const resolvedPath = resolvePath(currentDir, importPath);
    
    // Try with .ts extension
    const tsPath = `${resolvedPath}.ts`;
    if (this.filePathMap.has(tsPath)) {
      return this.filePathMap.get(tsPath)!;
    }
    
    // Try without extension (already has .ts)
    if (this.filePathMap.has(resolvedPath)) {
      return this.filePathMap.get(resolvedPath)!;
    }
    
    return null; // Import not found in project
  }
}

function resolvePath(baseDir: string, relativePath: string): string {
  // Simple implementation (can use path library for robustness)
  const parts = baseDir.split('/').filter(Boolean);
  const importParts = relativePath.split('/').filter(Boolean);
  
  for (const part of importParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }
  
  return parts.join('/');
}
```

**Alternatives considered**:
- Use Node.js path.resolve: Not available in browser environment, would need polyfill
- Full module resolution algorithm: Overkill (no index files, no package.json, no aliases)
- Regex-based path parsing: Error-prone with edge cases (multiple .., mixed . and ..)
- Server-side resolution: Not applicable (client-side only application)

**Edge cases handled**:
- Import with extension: `./Person.ts` → strip extension for lookup
- Import without extension: `./Person` → add .ts extension for lookup
- Parent directory: `../models/User` → resolve upward navigation
- Current directory: `./utils/helpers` → resolve from current file's directory
- Non-existent file: Return null, silently ignore (per spec requirement FR-027)

---

### 4. Relationship Detection Across File Boundaries

**Question**: How to detect inheritance, realization, and association relationships when entities are in different files?

**Decision**: Extend existing relationship detection in DiagramGenerator to work with cross-file entity sets

**Rationale**:
- DiagramGenerator already has logic to detect relationships (extends, implements, property types)
- Current limitation: only receives entities from one file at a time
- Solution: Pass ALL relevant entities (local + imported) to DiagramGenerator
- ImportResolver provides the entity set, DiagramGenerator detects relationships as before
- No changes needed to core relationship detection algorithm

**Implementation approach**:
```typescript
// Current: DiagramGenerator receives entities from single file
const entities = parsedEntities.get(activeFileId) || [];
const diagram = generateDiagram(entities);

// New: DiagramGenerator receives filtered entity set based on scope
const scope: DiagramScope = {
  mode: viewMode, // 'file' or 'project'
  activeFileId: activeFileId,
  importGraph: importResolver.buildGraph(allFiles)
};

const filteredEntities = entityFilter.filter(
  allParsedEntities,
  scope
);

const diagram = generateDiagram(filteredEntities); // Same function, different input
```

**Key insight**: Relationship detection doesn't need to know about file boundaries. It only needs:
1. Class/interface definitions with their extends/implements/properties
2. All entities that might be referenced (imported entities)

The filtering happens BEFORE DiagramGenerator, not inside it. This keeps DiagramGenerator simple and focused.

**Alternatives considered**:
- Modify DiagramGenerator to understand file boundaries: Increases complexity, violates SRP
- Create separate cross-file relationship detector: Code duplication with existing logic
- Post-process diagram to add cross-file edges: More complex, harder to maintain

---

### 5. View Mode State Management

**Question**: How to persist view mode (File/Project) across file navigation and maintain sticky state?

**Decision**: Add ViewModeSlice to Zustand store with persistent view mode state

**Rationale**:
- Zustand already used for all application state (files, editor, diagram, parser)
- Adding new slice follows established pattern (clean, type-safe)
- State automatically persists across component re-renders
- React components can subscribe to view mode changes
- Testable in isolation (can mock store in tests)

**Implementation approach**:
```typescript
interface ViewModeSlice {
  diagramViewMode: 'file' | 'project';
  setDiagramViewMode: (mode: 'file' | 'project') => void;
}

const createViewModeSlice: StateSliceCreator<ViewModeSlice> = (set) => ({
  diagramViewMode: 'file', // Default to file view per FR-026
  
  setDiagramViewMode: (mode: 'file' | 'project') => 
    set({ diagramViewMode: mode })
});

// Usage in components
const { diagramViewMode, setDiagramViewMode } = useStore(
  state => ({ 
    diagramViewMode: state.diagramViewMode,
    setDiagramViewMode: state.setDiagramViewMode 
  })
);
```

**Alternatives considered**:
- React useState in parent component: State lost on component unmount, harder to test
- localStorage directly: Requires manual serialization/deserialization, not reactive
- URL query parameter: Unnecessary complexity, view mode is ephemeral session state
- Context API: Zustand already provides equivalent functionality with less boilerplate

**Persistence considerations**:
- View mode persists during session (in-memory Zustand store)
- View mode NOT persisted to IndexedDB (reset on page reload)
- Reasoning: View mode is a temporary preference, not critical user data
- If persistence needed later, can add to PersistenceSlice (future enhancement)

---

### 6. Auto-Layout for Project View

**Question**: How to ensure readable layout when displaying 50+ entities in Project View mode?

**Decision**: Continue using existing dagre + React Flow layout engine, increase spacing for larger graphs

**Rationale**:
- dagre already used for automatic layout (hierarchical, handles complex graphs)
- React Flow provides zoom/pan controls (users can navigate large diagrams)
- Increasing node spacing for project view prevents overlap
- Performance is acceptable: dagre handles 100+ nodes efficiently (<300ms layout time)
- No need to switch layout algorithms or add complexity

**Configuration adjustments**:
```typescript
// File view: compact layout
const fileViewConfig = {
  rankdir: 'TB',
  nodesep: 60,  // Horizontal spacing
  ranksep: 80,  // Vertical spacing
  marginx: 20,
  marginy: 20
};

// Project view: spacious layout
const projectViewConfig = {
  rankdir: 'TB',
  nodesep: 100, // Increased spacing
  ranksep: 120, // Increased spacing
  marginx: 40,
  marginy: 40
};
```

**Performance monitoring**:
- Measure layout time with performance.mark/measure API
- Log warning if layout exceeds 300ms (per success criteria SC-005)
- Consider virtualizing node rendering if project grows beyond 100 entities (future optimization)

**Alternatives considered**:
- Force-directed layout (d3-force): Better for large graphs but harder to read (no hierarchy)
- Grid layout: Simple but doesn't show relationships clearly
- Manual layout: Users position nodes themselves (too much effort, not automatic)
- Clustered layout: Group by file/module (adds complexity, may not be clearer)

---

### 7. Debouncing and Performance Optimization

**Question**: How to prevent performance issues when rapidly switching files or toggling view modes?

**Decision**: Reuse existing 300ms debounce in useEditorController, add debounce to view mode toggle

**Rationale**:
- useEditorController already debounces parsing and diagram updates (300ms)
- Proven to work well for file content changes (prevents flickering)
- Apply same pattern to view mode changes and file selection
- Debounced updates prevent intermediate renders during rapid interactions
- "Latest wins" strategy ensures final state is always rendered

**Implementation approach**:
```typescript
// In useEditorController or custom hook
const debouncedUpdateDiagram = useMemo(
  () =>
    debounce((
      viewMode: 'file' | 'project',
      activeFileId: string | null,
      parsedEntities: Map<string, Entity[]>
    ) => {
      // Update diagram based on current view mode and active file
      const scope = buildDiagramScope(viewMode, activeFileId);
      const filteredEntities = entityFilter.filter(parsedEntities, scope);
      const diagram = generateDiagram(filteredEntities);
      setNodes(diagram.nodes);
      setEdges(diagram.edges);
    }, 300),
  []
);

// Trigger on view mode change
useEffect(() => {
  debouncedUpdateDiagram(diagramViewMode, activeFileId, parsedEntities);
}, [diagramViewMode, activeFileId, parsedEntities]);
```

**Alternatives considered**:
- No debouncing: Would cause flickering and wasted renders during rapid interactions
- Longer debounce (500ms+): Feels sluggish, 300ms is good balance (proven in existing code)
- Throttling instead of debouncing: Would show intermediate states unnecessarily
- requestAnimationFrame: Overkill for diagram updates (not animation-heavy)

**Performance targets** (from success criteria):
- File view update: <200ms (SC-003)
- Project view toggle: <300ms (SC-005)
- Import resolution: <100ms per file (performance goal)

---

## Summary of Technical Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Import parsing | TypeScript Compiler API AST traversal | Already available, reliable, structured access |
| Circular imports | BFS with visited set + depth limit | Prevents infinite loops, shows complete graph |
| Path resolution | Custom path resolver with file path lookup table | Simple, fits client-side constraints, no external deps |
| Relationship detection | Extend existing DiagramGenerator (no changes) | Reuse working code, separation of concerns |
| View mode state | Zustand ViewModeSlice | Follows existing patterns, type-safe, testable |
| Layout algorithm | Existing dagre with adjusted spacing | Proven to work, handles scale requirements |
| Performance | Reuse 300ms debounce pattern | Proven effective in existing code |

## Open Questions

None. All technical uncertainties have been resolved through this research phase.

## Next Steps (Phase 1)

1. Create data-model.md defining entity schemas (DiagramScope, ImportInfo, DependencyGraph)
2. Create contracts/ directory with API contracts for ImportResolver and EntityFilter
3. Create quickstart.md with developer guide for diagram scope feature
4. Update agent context files with new technologies and patterns
