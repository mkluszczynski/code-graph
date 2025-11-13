# Quickstart Guide: TypeScript UML Graph Visualizer

**Feature**: 001-uml-graph-visualizer  
**For**: Developers implementing the feature  
**Last Updated**: 2025-11-13

---

## Overview

This guide helps developers quickly set up the development environment and understand the architecture of the TypeScript UML Graph Visualizer. The application is a client-side web app that parses TypeScript code and generates real-time UML class diagrams.

---

## Prerequisites

- **Node.js**: 20+ LTS
- **pnpm**: 8.0+ (install via `npm install -g pnpm`)
- **Git**: For version control
- **Modern Browser**: Chrome 90+, Firefox 88+, or Safari 14+ for testing

---

## Initial Setup

### 1. Clone and Navigate to Project

```bash
git clone <repository-url>
cd code-graph
git checkout 001-uml-graph-visualizer
```

### 2. Install Dependencies

```bash
cd frontend
pnpm install
```

This installs:

- React 18+ and TypeScript
- Vite (build tool)
- Tailwind CSS (utility-first styling)
- shadcn/ui components (accessible UI primitives)
- Lucide React (icon library)
- Monaco Editor (code editor component)
- React Flow (diagram rendering)
- dagre (layout algorithm)
- Zustand (state management)
- idb (IndexedDB wrapper)
- Vitest (testing framework)
- Playwright (E2E testing)

### 3. Verify Installation

```bash
pnpm run dev
```

This starts the Vite dev server. Open http://localhost:5173 in your browser.

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── resizable.tsx
│   │       └── ...
│   ├── file-tree/              # Feature: File tree navigation
│   │   ├── FileTreeView.tsx
│   │   ├── FileTreeManager.ts
│   │   └── __tests__/
│   ├── code-editor/            # Feature: Code editing
│   │   ├── CodeEditor.tsx
│   │   ├── EditorController.ts
│   │   └── __tests__/
│   ├── typescript-parser/      # Feature: TS parsing
│   │   ├── TypeScriptParser.ts
│   │   ├── ClassExtractor.ts
│   │   ├── RelationshipAnalyzer.ts
│   │   └── __tests__/
│   ├── diagram-visualization/  # Feature: UML rendering
│   │   ├── DiagramRenderer.tsx
│   │   ├── LayoutEngine.ts
│   │   ├── NodeRenderer.tsx
│   │   ├── RelationshipRenderer.tsx
│   │   └── __tests__/
│   ├── project-management/     # Feature: File management
│   │   ├── ProjectManager.ts
│   │   ├── FileCreator.ts
│   │   └── __tests__/
│   ├── shared/                 # Shared utilities
│   │   ├── types/              # TypeScript definitions
│   │   ├── hooks/              # React hooks
│   │   └── utils/              # Common utilities
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
├── public/
│   └── index.html
├── tests/
│   ├── contract/               # Contract tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── components.json             # shadcn/ui config
├── tailwind.config.ts          # Tailwind CSS config
├── package.json
├── tsconfig.json
├── vite.config.ts              # Build configuration
└── vitest.config.ts            # Test configuration
```

---

## Development Workflow (TDD)

**IMPORTANT**: This project follows **Test-Driven Development (TDD)**. Tests MUST be written before implementation.

### Step 1: Write Contract Tests

Before implementing any feature, write contract tests based on the API contracts in `/specs/001-uml-graph-visualizer/contracts/`.

Example for TypeScript Parser:

```bash
# Create test file
touch src/typescript-parser/__tests__/TypeScriptParser.contract.test.ts
```

```typescript
// src/typescript-parser/__tests__/TypeScriptParser.contract.test.ts
import { describe, it, expect } from "vitest";
import { parse } from "../TypeScriptParser";

describe("TypeScriptParser - Contract Tests", () => {
  it("should parse a simple class with properties and methods", () => {
    const sourceCode = `
      export class Person {
        private name: string;
        public age: number;
        
        public getName(): string {
          return this.name;
        }
      }
    `;

    const result = parse(sourceCode, "Person.ts");

    expect(result.success).toBe(true);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe("Person");
    expect(result.classes[0].properties).toHaveLength(2);
    expect(result.classes[0].methods).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  // More contract tests...
});
```

### Step 2: Run Tests (Red)

```bash
pnpm test
```

Tests should FAIL because implementation doesn't exist yet.

### Step 3: Implement Feature (Green)

Implement the minimum code to make tests pass.

```typescript
// src/typescript-parser/TypeScriptParser.ts
import * as ts from "typescript";
import type { ParseResult, ClassDefinition } from "../shared/types";

export function parse(sourceCode: string, fileName: string): ParseResult {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  // Implementation to extract classes...

  return {
    classes: extractedClasses,
    interfaces: extractedInterfaces,
    errors: [],
    success: true,
  };
}
```

### Step 4: Run Tests Again (Green)

```bash
pnpm test
```

Tests should now PASS.

### Step 5: Refactor

Improve code quality while keeping tests green.

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode (interactive)
pnpm test:e2e:ui
```

---

## Key Technologies

### 1. TypeScript Compiler API

Used for parsing TypeScript code.

**Quick Example**:

```typescript
import * as ts from "typescript";

const sourceCode = `class Person { name: string; }`;
const sourceFile = ts.createSourceFile(
  "test.ts",
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

// Traverse AST
ts.forEachChild(sourceFile, (node) => {
  if (ts.isClassDeclaration(node)) {
    console.log("Found class:", node.name?.getText());
  }
});
```

**Resources**:

- [TypeScript Compiler API Wiki](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [AST Viewer](https://ts-ast-viewer.com/) - Visualize TypeScript AST

### 2. React Flow

Used for rendering interactive UML diagrams.

**Quick Example**:

```typescript
import ReactFlow, { Node, Edge } from "@xyflow/react";

const nodes: Node[] = [
  {
    id: "1",
    type: "umlClass",
    data: { name: "Person", properties: ["name: string"], methods: [] },
    position: { x: 100, y: 100 },
  },
];

const edges: Edge[] = [];

function DiagramView() {
  return <ReactFlow nodes={nodes} edges={edges} />;
}
```

**Resources**:

- [React Flow Documentation](https://reactflow.dev/)
- [Custom Nodes Guide](https://reactflow.dev/learn/customization/custom-nodes)

### 3. Monaco Editor

Used for the TypeScript code editor.

**Quick Example**:

```typescript
import Editor from "@monaco-editor/react";

function CodeEditorView() {
  const handleChange = (value: string | undefined) => {
    console.log("Code changed:", value);
  };

  return (
    <Editor
      height="600px"
      defaultLanguage="typescript"
      defaultValue="// Type your code here"
      onChange={handleChange}
    />
  );
}
```

**Resources**:

- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [Monaco API Documentation](https://microsoft.github.io/monaco-editor/api/index.html)

### 4. IndexedDB (via idb)

Used for client-side file storage.

**Quick Example**:

```typescript
import { openDB } from "idb";

const db = await openDB("typescript-uml", 1, {
  upgrade(db) {
    const store = db.createObjectStore("files", { keyPath: "id" });
    store.createIndex("path", "path", { unique: true });
  },
});

// Save file
await db.put("files", {
  id: "uuid-123",
  name: "Person.ts",
  path: "/src/Person.ts",
  content: "export class Person {}",
  lastModified: Date.now(),
  isActive: false,
});

// Retrieve file
const file = await db.get("files", "uuid-123");
```

**Resources**:

- [idb Library](https://github.com/jakearchibald/idb)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

### 5. Zustand

Used for lightweight state management.

**Quick Example**:

```typescript
import { create } from "zustand";

interface EditorState {
  activeFileId: string | null;
  setActiveFile: (id: string) => void;
}

const useEditorStore = create<EditorState>((set) => ({
  activeFileId: null,
  setActiveFile: (id) => set({ activeFileId: id }),
}));

// In component
function MyComponent() {
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const setActiveFile = useEditorStore((state) => state.setActiveFile);

  return <button onClick={() => setActiveFile("file-1")}>Open File</button>;
}
```

**Resources**:

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

### 6. shadcn/ui + Lucide Icons

Used for building the user interface with accessible, customizable components.

**Quick Example**:

```typescript
import { Button } from "@/components/ui/button";
import { FilePlus, Box, Component } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AddFileButton() {
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

**Setup**:

```bash
# Initialize shadcn/ui
pnpx shadcn-ui@latest init

# Add components as needed
pnpx shadcn-ui@latest add button
pnpx shadcn-ui@latest add dropdown-menu
pnpx shadcn-ui@latest add dialog
pnpx shadcn-ui@latest add resizable
```

**Resources**:

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/icons/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

---

## Common Development Tasks

### Add a New Feature Module

1. Create feature directory in `src/`:

   ```bash
   mkdir -p src/my-feature/__tests__
   ```

2. Create contract tests first
3. Implement feature following TDD
4. Export public API from index file

### Debug TypeScript Parsing

1. Use [TS AST Viewer](https://ts-ast-viewer.com/) to understand AST structure
2. Add logging to see node types:
   ```typescript
   ts.forEachChild(sourceFile, (node) => {
     console.log("Node kind:", ts.SyntaxKind[node.kind]);
   });
   ```

### Debug React Flow Layout

1. Enable React Flow DevTools:

   ```typescript
   <ReactFlow nodes={nodes} edges={edges} fitView />
   ```

2. Log dagre layout calculations:
   ```typescript
   console.log("Node positions:", dagreGraph.node(nodeId));
   ```

### Inspect IndexedDB

1. Open browser DevTools
2. Go to Application tab → Storage → IndexedDB
3. Expand `typescript-uml` database → `files` object store

---

## Performance Optimization Tips

### Debounce Code Parsing

```typescript
import { useMemo } from "react";
import { debounce } from "lodash-es";

const debouncedParse = useMemo(
  () =>
    debounce((code: string) => {
      const result = parse(code, fileName);
      updateDiagram(result);
    }, 500),
  [fileName]
);
```

### Memoize React Components

```typescript
import { memo } from "react";

const UMLClassNode = memo(({ data }: { data: DiagramNodeData }) => {
  return <div>{/* render node */}</div>;
});
```

### Use Web Workers for Parsing

```typescript
// parser.worker.ts
import * as ts from "typescript";

self.addEventListener("message", (e) => {
  const { sourceCode, fileName } = e.data;
  const result = parse(sourceCode, fileName);
  self.postMessage(result);
});

// In main thread
const worker = new Worker(new URL("./parser.worker.ts", import.meta.url));
worker.postMessage({ sourceCode, fileName });
worker.addEventListener("message", (e) => {
  const result = e.data;
  updateDiagram(result);
});
```

---

## Troubleshooting

### Issue: Monaco Editor not loading

**Solution**: Ensure Monaco assets are loaded from CDN or bundled correctly. Check `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@monaco-editor/react"],
  },
});
```

### Issue: React Flow nodes overlapping

**Solution**: Verify dagre layout configuration:

```typescript
dagreGraph.setGraph({
  rankdir: "TB",
  nodesep: 80, // Horizontal spacing
  ranksep: 100, // Vertical spacing
});
```

### Issue: IndexedDB quota exceeded

**Solution**: Check browser storage quota and clear old data:

```typescript
if ("storage" in navigator && "estimate" in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
}
```

---

## Coding Standards

### TypeScript

- Use strict mode (`"strict": true` in tsconfig.json)
- Avoid `any` type; use `unknown` if type is truly unknown
- Prefer interfaces over type aliases for object shapes
- Use descriptive names (no abbreviations except `id`, `url`, `api`)

### React

- Use functional components with hooks
- Keep components under 150 lines; extract subcomponents
- Use `memo()` for expensive components
- Prefer composition over prop drilling

### Testing

- Test file names: `*.test.ts` or `*.test.tsx`
- One `describe` block per function/component
- Use `it('should ...')` format for test names
- Arrange-Act-Assert pattern

### Commit Messages

- Format: `<type>: <description>`
- Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`
- Example: `feat: add TypeScript parser for class extraction`

---

## Next Steps

1. **Read the spec**: Review `/specs/001-uml-graph-visualizer/spec.md` for user scenarios
2. **Review contracts**: Study `/specs/001-uml-graph-visualizer/contracts/` for API contracts
3. **Review data model**: Study `/specs/001-uml-graph-visualizer/data-model.md` for entity definitions
4. **Start with tests**: Begin with `typescript-parser` module contract tests
5. **Implement incrementally**: Follow TDD cycle (Red → Green → Refactor)

---

## Resources

- **Spec**: `specs/001-uml-graph-visualizer/spec.md`
- **Plan**: `specs/001-uml-graph-visualizer/plan.md`
- **Research**: `specs/001-uml-graph-visualizer/research.md`
- **Data Model**: `specs/001-uml-graph-visualizer/data-model.md`
- **Contracts**: `specs/001-uml-graph-visualizer/contracts/`
- **Constitution**: `.specify/memory/constitution.md` (coding principles)

---

## Getting Help

- Check browser console for errors
- Use React DevTools to inspect component state
- Use TypeScript AST Viewer to debug parsing issues
- Review contract tests for expected behavior
- Consult research.md for technology best practices

---

**Ready to start?** Begin with the TypeScript Parser module following the TDD workflow described above. Good luck! 🚀
