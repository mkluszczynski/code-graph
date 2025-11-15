# code-graph Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-13

## Active Technologies
- TypeScript 5.x, Node.js 20+ LTS + React 18+ (frontend framework), TypeScript Compiler API (for code parsing), pnpm (package manager), React Flow + dagre (UML diagram rendering), Monaco Editor via @monaco-editor/react (code editor component), Zustand (state management), idb (IndexedDB wrapper), shadcn/ui (UI components), Lucide React (icons), Tailwind CSS (styling) (001-uml-graph-visualizer)
- IndexedDB (via idb library) for project files (client-side file system), localStorage for metadata (001-uml-graph-visualizer)
- TypeScript 5.x, Node.js 20+ LTS + React 18+, Zustand (state management), idb 8.0+ (IndexedDB wrapper), Monaco Editor, TypeScript Compiler API (002-persist-code-changes)
- IndexedDB (via idb library) for client-side file persistence (002-persist-code-changes)
- TypeScript 5.9.3, Node.js 20+ LTS + React 18+, Zustand 5.0 (state), idb 8.0 (IndexedDB), shadcn/ui (UI components), @radix-ui/react-context-menu (context menu primitive), Lucide React (icons) (003-file-tree-context-menu)
- IndexedDB via idb library for file persistence (003-file-tree-context-menu)

- TypeScript 5.x, Node.js 20+ LTS + React 18+ (frontend framework), TypeScript Compiler API (for code parsing), pnpm (package manager), React Flow + dagre (UML diagram rendering), Monaco Editor via @monaco-editor/react (code editor component), Zustand (state management), idb (IndexedDB wrapper) (001-uml-graph-visualizer)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 20+ LTS: Follow standard conventions

## Recent Changes
- 003-file-tree-context-menu: Added TypeScript 5.9.3, Node.js 20+ LTS + React 18+, Zustand 5.0 (state), idb 8.0 (IndexedDB), shadcn/ui (UI components), @radix-ui/react-context-menu (context menu primitive), Lucide React (icons)
- 002-persist-code-changes: Added TypeScript 5.x, Node.js 20+ LTS + React 18+, Zustand (state management), idb 8.0+ (IndexedDB wrapper), Monaco Editor, TypeScript Compiler API
- 001-uml-graph-visualizer: Added TypeScript 5.x, Node.js 20+ LTS + React 18+ (frontend framework), TypeScript Compiler API (for code parsing), pnpm (package manager), React Flow + dagre (UML diagram rendering), Monaco Editor via @monaco-editor/react (code editor component), Zustand (state management), idb (IndexedDB wrapper), shadcn/ui (UI components), Lucide React (icons), Tailwind CSS (styling)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
