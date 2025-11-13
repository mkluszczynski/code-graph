# Research Document: TypeScript UML Graph Visualizer

**Feature**: 001-uml-graph-visualizer  
**Date**: 2025-11-13  
**Status**: In Progress

## Research Tasks

This document consolidates research findings to resolve all "NEEDS CLARIFICATION" items from the Technical Context section of plan.md.

### 1. Frontend Framework Selection

**Unknown**: Which frontend framework is best for this IDE-like application?

**Options Evaluated**:

- React 18+ with TypeScript
- Vue 3 with TypeScript
- Svelte(Kit) with TypeScript
- Solid.js with TypeScript

**Research Criteria**:

- TypeScript integration quality
- Component ecosystem for IDE features (file tree, code editor integration)
- Performance for real-time updates (diagram re-rendering)
- Developer experience and learning curve
- Community support and available UI libraries
- Integration with Monaco Editor / CodeMirror
- State management capabilities for complex app state

**Decision**: **React 18+ with TypeScript**

**Rationale**:

- **Best editor integration**: Monaco Editor (VSCode's editor) has official React wrapper (@monaco-editor/react) with excellent TypeScript support
- **Rich ecosystem**: Extensive component libraries (React Flow for diagrams, react-arborist for file trees)
- **Performance**: React 18's concurrent rendering handles real-time updates efficiently; can batch diagram updates during typing
- **State management**: Multiple proven options (Zustand for simplicity, Redux Toolkit for complex state)
- **Developer familiarity**: Largest community, most documentation, extensive TypeScript patterns
- **Testing ecosystem**: Vitest + React Testing Library provide excellent DX
- **IDE-like apps precedent**: Many web-based IDEs use React (CodeSandbox, StackBlitz, Replit)

**Alternatives Considered**:

- **Vue 3**: Good TypeScript support but smaller ecosystem for specialized components (file trees, graph visualizations)
- **Svelte**: Excellent performance and DX, but less mature ecosystem for complex IDE components; fewer graph visualization libraries
- **Solid.js**: Best raw performance but smallest ecosystem; risky for specialized components like code editors

**Implementation Notes**:

- Use Vite as build tool for fast HMR
- Use Zustand for lightweight state management (file tree state, active file, diagram state)
- Component structure: functional components with hooks
- Use shadcn/ui for all UI components (buttons, dialogs, dropdowns, trees, etc.)
- Use Lucide React icons throughout the interface
- Tailwind CSS for styling and theming

---

### 2. UML Diagram Rendering Library

**Unknown**: Which library should render the UML diagrams with nodes and relationships?

**Options Evaluated**:

- React Flow (formerly ReactFlow)
- Cytoscape.js
- vis.js Network
- D3.js (custom implementation)
- Konva.js / fabric.js (canvas-based)
- mxGraph (now JGraph)

**Research Criteria**:

- Node/edge rendering capabilities
- Automatic layout algorithms (hierarchical, force-directed)
- Interactive features (zoom, pan, node dragging)
- React integration
- Performance with 30-50+ nodes
- UML-specific features or customizability
- Styling flexibility for UML notation
- Event handling for node clicks

**Decision**: **React Flow**

**Rationale**:

- **React-first design**: Built specifically for React, not an adapter; excellent TypeScript support
- **Interactive by default**: Built-in zoom, pan, minimap, node selection, edge routing
- **Automatic layouts**: Plugin ecosystem includes dagre (directed acyclic graph) layout perfect for UML class diagrams
- **Custom nodes**: Easy to create UML class box nodes with compartments (class name, properties, methods)
- **Custom edges**: Can style edges for UML relationships (inheritance solid line with triangle, implementation dashed line, associations)
- **Performance**: Uses HTML/SVG hybrid rendering; handles 50+ nodes smoothly
- **Active development**: Well-maintained, modern codebase, regular updates
- **Developer experience**: Excellent documentation, TypeScript examples, active community

**Alternatives Considered**:

- **Cytoscape.js**: Powerful but overkill for this use case; React wrapper is third-party; complex API for simple UML needs
- **vis.js**: Legacy library, not actively maintained; poor React integration
- **D3.js**: Too low-level; would require significant custom code for UML features; steeper learning curve
- **mxGraph**: Complex enterprise library, recently commercialized (JGraph); harder to customize

**Implementation Notes**:

- Use @xyflow/react (React Flow v12+)
- Use dagre layout algorithm via @dagrejs/dagre
- Create custom node component: `UMLClassNode.tsx` with compartments
- Create custom edge types: `InheritanceEdge`, `ImplementationEdge`, `AssociationEdge`
- Styling: Use UML standard notation (+ public, - private, # protected, stereotypes)

---

### 3. Code Editor Component

**Unknown**: Which code editor component should we use for TypeScript editing?

**Options Evaluated**:

- Monaco Editor (VSCode's editor)
- CodeMirror 6
- Ace Editor
- Plain textarea with syntax highlighting (Prism.js/highlight.js)

**Research Criteria**:

- TypeScript syntax highlighting quality
- IntelliSense / autocompletion support
- React integration
- Performance with medium files (500-1000 lines)
- API for programmatic content updates
- Customization (themes, keybindings)
- Bundle size impact
- TypeScript language services integration

**Decision**: **Monaco Editor** (via @monaco-editor/react)

**Rationale**:

- **Best TypeScript support**: Built by Microsoft for VSCode; native TypeScript language services integration
- **IntelliSense**: Full autocomplete, type checking, error squiggles out of the box
- **Feature-complete**: Find/replace, multi-cursor, minimap, diff view, command palette
- **React wrapper**: @monaco-editor/react provides excellent DX, lazy loading, TypeScript types
- **Familiar UX**: Users already know VSCode; zero learning curve
- **Configurable**: Can disable features we don't need (e.g., debug breakpoints) to simplify UI
- **Performance**: Handles large files efficiently; optimized for web

**Alternatives Considered**:

- **CodeMirror 6**: Excellent modern editor, smaller bundle size, but TypeScript language services integration requires more custom work; Monaco provides this out of the box
- **Ace Editor**: Older, legacy architecture; Monaco supersedes it in most aspects
- **Textarea + highlighting**: Insufficient for TypeScript; no autocomplete, no error detection

**Implementation Notes**:

- Use @monaco-editor/react package
- Configure TypeScript compiler options to match parsing needs
- Load only TypeScript language (exclude other languages to reduce bundle)
- Use lazy loading to defer Monaco until editor is needed
- Theme: Start with VSCode's default light/dark themes
- Disable unnecessary features: debugging UI, breadcrumbs (optional)

**Bundle Size Note**: Monaco is ~3-4MB (gzipped ~800KB). This is acceptable for a desktop-focused web app. Lazy loading mitigates initial load impact.

---

### 4. End-to-End Testing Framework

**Unknown**: Which E2E testing framework should we use?

**Options Evaluated**:

- Playwright
- Cypress
- Puppeteer
- Selenium WebDriver

**Research Criteria**:

- TypeScript support
- Speed and reliability
- Developer experience
- Cross-browser testing
- API for UI interactions (file tree clicks, editor typing, diagram node clicks)
- Debugging capabilities
- CI/CD integration
- Maintenance and community support

**Decision**: **Playwright**

**Rationale**:

- **Best TypeScript support**: First-class TypeScript API, strongly typed selectors and assertions
- **Speed**: Faster than Cypress; parallel execution out of the box
- **Reliability**: Auto-waiting, web-first assertions reduce flakiness
- **Multi-browser**: Tests Chrome, Firefox, WebKit (Safari) with single API
- **Modern API**: Cleaner than Selenium, more powerful than Cypress for complex interactions
- **Debugging**: Trace viewer, inspector, codegen for creating tests
- **Active development**: Microsoft-backed, rapid iteration, growing community
- **CI-friendly**: Excellent Docker support, parallelization, sharding

**Alternatives Considered**:

- **Cypress**: Popular but slower; limited to Chrome/Firefox/Edge (no Safari); more opinionated architecture
- **Puppeteer**: Lower-level, Chrome-only; more manual work for common scenarios
- **Selenium**: Legacy, verbose API, slow, more setup complexity

**Implementation Notes**:

- Install @playwright/test
- Configure for Chrome + Firefox (skip WebKit initially to save CI time)
- Test structure: One E2E test per User Story acceptance scenario
- Page Object Model pattern for maintainability
- Run in CI on pull requests

---

### 5. UI Component Library & Icons

**Unknown**: Which UI component library and icon set should we use?

**User Requirement**: Use shadcn/ui components with Lucide icons

**Decision**: **shadcn/ui + Lucide React + Tailwind CSS**

**Rationale**:

- **shadcn/ui benefits**:

  - Copy-paste component architecture - components live in your codebase, fully customizable
  - Built on Radix UI primitives - accessible, unstyled components that meet WCAG standards
  - TypeScript-first with excellent type definitions
  - Tailwind CSS integration - consistent styling system
  - No package bloat - only install what you use
  - Modern, professional design system out of the box
  - Perfect for IDE-like interfaces (tree views, panels, dialogs, dropdowns)

- **Lucide React benefits**:

  - 1000+ consistent, beautiful SVG icons
  - Tree-shakeable - only bundle icons you use
  - TypeScript support with proper types
  - Customizable size, color, stroke width
  - Matches shadcn/ui design aesthetic
  - Active development and community

- **Tailwind CSS benefits**:
  - Utility-first approach speeds up development
  - Small bundle size with PurgeCSS
  - Excellent VS Code IntelliSense support
  - Dark mode support built-in
  - Consistent spacing, colors, typography

**Why This Combination**:

- shadcn/ui is built on Tailwind CSS - perfect integration
- Lucide icons are the recommended icon set for shadcn/ui
- All three technologies are TypeScript-first
- Copy-paste architecture gives full control - no "fighting the framework"
- Radix UI primitives handle accessibility automatically

**Components We'll Use**:

- `Button` - Add Class/Interface button, toolbar actions
- `DropdownMenu` - Add button menu (select Class vs Interface)
- `Tree` - File tree navigation (or custom component using Collapsible)
- `Resizable` - Split panes (file tree | editor | diagram)
- `Tabs` - Switch between files (if multi-file editing in Phase 2)
- `Dialog` - File creation modals, settings
- `Tooltip` - Hover information on diagram nodes
- `ScrollArea` - Scrollable regions (file tree, properties list)
- `Separator` - Visual dividers between panels
- `Input` - File naming, search

**Icons We'll Use** (Lucide):

- `FilePlus` - Add new file
- `FileCode` - TypeScript file icon
- `FolderOpen` / `FolderClosed` - Directory expansion
- `Box` - Class representation
- `Component` - Interface representation
- `Play` - Run/test actions
- `Settings` - Settings/preferences
- `ZoomIn` / `ZoomOut` - Diagram zoom controls
- `Download` / `Upload` - Export/import project
- `Eye` / `EyeOff` - Toggle visibility

**Implementation Notes**:

```bash
# Initialize shadcn/ui in project
pnpx shadcn-ui@latest init

# Add components as needed
pnpx shadcn-ui@latest add button
pnpx shadcn-ui@latest add dropdown-menu
pnpx shadcn-ui@latest add dialog
pnpx shadcn-ui@latest add resizable
# etc.

# Install Lucide icons
pnpm add lucide-react
```

**Example Usage**:

```tsx
import { Button } from "@/components/ui/button";
import { FilePlus, Box, Component } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AddButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <FilePlus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => createFile("class")}>
          <Box className="mr-2 h-4 w-4" />
          New Class
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => createFile("interface")}>
          <Component className="mr-2 h-4 w-4" />
          New Interface
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Alternatives Considered**:

- **Material UI (MUI)**: Heavier bundle, opinionated styling, harder to customize
- **Ant Design**: Less modern aesthetic, harder TypeScript integration
- **Chakra UI**: Good but switching away from emotion to Panda CSS, ecosystem uncertainty
- **Radix UI directly**: Would require styling all components ourselves
- **Headless UI**: Good but less comprehensive than shadcn/ui, no Tailwind integration

---

## Technology Stack Summary

Based on research decisions, the confirmed technology stack is:

### Core Technologies

- **Language**: TypeScript 5.x
- **Runtime**: Node.js 20+ LTS
- **Package Manager**: pnpm (specified by user)

### Frontend Framework & Build

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5+
- **State Management**: Zustand (lightweight, TypeScript-first)
- **Styling**: Tailwind CSS 3+ (utility-first CSS)

### Key Libraries

- **Code Editor**: Monaco Editor via @monaco-editor/react
- **Diagram Rendering**: React Flow (@xyflow/react) + dagre layout
- **TypeScript Parsing**: TypeScript Compiler API (@typescript/compiler)
- **UI Components**: shadcn/ui (accessible, customizable React components)
- **Icons**: Lucide React (beautiful, consistent icon set)
- **File Tree UI**: Custom component built with shadcn/ui primitives

### Testing Stack

- **Unit/Integration**: Vitest
- **React Testing**: @testing-library/react
- **E2E**: Playwright
- **Coverage**: Vitest built-in coverage (v8 or istanbul)

### Storage

- **Client Storage**: IndexedDB (via idb library for TypeScript-friendly API)
- **Fallback**: localStorage for small metadata

### Development Tools

- **Linting**: ESLint + @typescript-eslint
- **Formatting**: Prettier
- **Pre-commit**: Husky + lint-staged

---

## Best Practices Research

### TypeScript Compiler API Best Practices

**Research Task**: How to efficiently parse TypeScript code for UML generation?

**Findings**:

- Use `ts.createSourceFile()` for parsing without full compiler setup
- Use `ts.forEachChild()` or `node.getChildren()` to traverse AST
- Extract class/interface nodes with `ts.SyntaxKind.ClassDeclaration` / `InterfaceDeclaration`
- Use `ts.TypeChecker` for type resolution (inheritance, property types) - requires full program
- Avoid full type checking for performance; use AST structure analysis where possible
- Cache parsed results; re-parse only changed files

**Implementation Pattern**:

```typescript
const sourceFile = ts.createSourceFile(
  filename,
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

function extractClasses(sourceFile: ts.SourceFile): ClassInfo[] {
  const classes: ClassInfo[] = [];

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      // Extract class info
      classes.push(extractClassInfo(node));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return classes;
}
```

### React Flow UML Layout Best Practices

**Research Task**: How to layout UML diagrams for readability?

**Findings**:

- Use dagre algorithm for hierarchical layout (top-down or left-right)
- Configure dagre with `rankdir: 'TB'` (top-to-bottom) for class hierarchies
- Set appropriate node spacing: `nodesep: 80, ranksep: 100` for UML boxes
- Use React Flow's `useNodesInitialized` hook to trigger layout after nodes load
- For user interactions: disable auto-layout after manual node dragging
- Consider force-directed layout (D3-force) for complex association networks

**Implementation Pattern**:

```typescript
import dagre from "@dagrejs/dagre";

function getLayoutedElements(nodes, edges, direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 150 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const position = dagreGraph.node(node.id);
      return { ...node, position };
    }),
    edges,
  };
}
```

### Performance Optimization Patterns

**Research Task**: How to ensure <2s diagram updates?

**Findings**:

- **Debounce editor changes**: Use 500ms debounce to avoid parsing every keystroke
- **Incremental parsing**: Track changed files, re-parse only those (not entire project)
- **Memoization**: Use React.memo for UML node components to prevent unnecessary re-renders
- **Virtual file system**: Keep in-memory representation of files to avoid IndexedDB round-trips during editing
- **Layout caching**: Store calculated positions; only re-layout when nodes/edges change
- **Web Workers**: Offload TypeScript parsing to worker thread to keep UI responsive

**Implementation Pattern**:

```typescript
// Debounced parsing
const debouncedParse = useMemo(
  () =>
    debounce((code: string) => {
      const parsed = parseTypeScript(code);
      updateDiagram(parsed);
    }, 500),
  []
);

// Change handler
const handleEditorChange = (value: string) => {
  setCurrentCode(value); // Immediate UI update
  debouncedParse(value); // Delayed parse & diagram update
};
```

### IndexedDB for Project Storage Best Practices

**Research Task**: How to store TypeScript project files client-side?

**Findings**:

- Use `idb` library (by Jake Archibald) for Promise-based API
- Schema: Store files as `{ id, name, path, content, lastModified }`
- Create indexes on `path` for fast lookup
- Transaction patterns: Use readonly for queries, readwrite for mutations
- Backup: Export/import as JSON for project save/load
- Limit: IndexedDB has ~50MB+ storage (varies by browser); sufficient for TS projects

**Implementation Pattern**:

```typescript
import { openDB } from "idb";

const db = await openDB("typescript-uml", 1, {
  upgrade(db) {
    const store = db.createObjectStore("files", { keyPath: "id" });
    store.createIndex("path", "path", { unique: true });
  },
});

// Add/update file
await db.put("files", {
  id: generateId(),
  name: "MyClass.ts",
  path: "/src/MyClass.ts",
  content: "export class MyClass {}",
  lastModified: Date.now(),
});

// Read file
const file = await db.getFromIndex("files", "path", "/src/MyClass.ts");
```

---

## Open Questions / Future Research

- **Diagram export**: SVG export for sharing/documentation (Phase 2+)
- **Multi-file type resolution**: How to resolve types across files without full TS program? (Phase 2+)
- **Diagram customization**: User-defined layout preferences, color schemes (Phase 3+)
- **Collaboration**: Real-time multi-user editing (out of scope for MVP)

---

## References

- React Flow Documentation: https://reactflow.dev/
- TypeScript Compiler API: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- Monaco Editor React: https://github.com/suren-atoyan/monaco-react
- Playwright Documentation: https://playwright.dev/
- dagre Layout Algorithm: https://github.com/dagrejs/dagre
- idb (IndexedDB wrapper): https://github.com/jakearchibald/idb
