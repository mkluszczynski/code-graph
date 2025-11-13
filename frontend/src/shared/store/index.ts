/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Zustand Store - Application State Management
 *
 * Centralized state management using Zustand with slices for different concerns
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  ClassDefinition,
  DiagramEdge,
  DiagramNode,
  InterfaceDefinition,
  ParseError,
  Position,
  ProjectFile,
} from "../types";

// ============================================================================
// File Management Slice
// ============================================================================

interface FileSlice {
  files: ProjectFile[];
  activeFileId: string | null;
  isLoadingFiles: boolean;
  isCreatingFile: boolean;

  setFiles: (files: ProjectFile[]) => void;
  addFile: (file: ProjectFile) => void;
  updateFile: (fileId: string, updates: Partial<ProjectFile>) => void;
  removeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  getFileById: (fileId: string) => ProjectFile | undefined;
  setLoadingFiles: (isLoading: boolean) => void;
  setCreatingFile: (isCreating: boolean) => void;
}

const createFileSlice = (set: any, get: any): FileSlice => ({
  files: [],
  activeFileId: null,
  isLoadingFiles: false,
  isCreatingFile: false,

  setFiles: (files: ProjectFile[]) => set({ files }),

  addFile: (file: ProjectFile) =>
    set((state: any) => ({
      files: [...state.files, file],
    })),

  updateFile: (fileId: string, updates: Partial<ProjectFile>) =>
    set((state: any) => ({
      files: state.files.map((file: ProjectFile) =>
        file.id === fileId ? { ...file, ...updates } : file
      ),
    })),

  removeFile: (fileId: string) =>
    set((state: any) => ({
      files: state.files.filter((file: ProjectFile) => file.id !== fileId),
      activeFileId: state.activeFileId === fileId ? null : state.activeFileId,
    })),

  setActiveFile: (fileId: string | null) => set({ activeFileId: fileId }),

  getFileById: (fileId: string) => {
    const state = get();
    return state.files.find((file: ProjectFile) => file.id === fileId);
  },

  setLoadingFiles: (isLoading: boolean) => set({ isLoadingFiles: isLoading }),

  setCreatingFile: (isCreating: boolean) =>
    set({ isCreatingFile: isCreating }),
});

// ============================================================================
// Editor Slice
// ============================================================================

interface EditorSlice {
  editorContent: string;
  isDirty: boolean;
  cursorPosition: Position;
  selectedRange: { start: Position; end: Position } | null;

  setEditorContent: (content: string) => void;
  setIsDirty: (isDirty: boolean) => void;
  setCursorPosition: (position: Position) => void;
  setSelectedRange: (range: { start: Position; end: Position } | null) => void;
}

const createEditorSlice = (set: any): EditorSlice => ({
  editorContent: "",
  isDirty: false,
  cursorPosition: { line: 1, column: 1 },
  selectedRange: null,

  setEditorContent: (content: string) => set({ editorContent: content }),
  setIsDirty: (isDirty: boolean) => set({ isDirty }),
  setCursorPosition: (position: Position) => set({ cursorPosition: position }),
  setSelectedRange: (range: { start: Position; end: Position } | null) =>
    set({ selectedRange: range }),
});

// ============================================================================
// Diagram Slice
// ============================================================================

interface DiagramSlice {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: { x: number; y: number; zoom: number };
  selectedNodeId: string | null;
  isLayoutLocked: boolean;
  isGeneratingDiagram: boolean;
  lastUpdated: number;

  setNodes: (nodes: DiagramNode[]) => void;
  setEdges: (edges: DiagramEdge[]) => void;
  updateNode: (nodeId: string, updates: Partial<DiagramNode>) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setLayoutLocked: (locked: boolean) => void;
  setGeneratingDiagram: (isGenerating: boolean) => void;
  updateDiagram: (nodes: DiagramNode[], edges: DiagramEdge[]) => void;
}

const createDiagramSlice = (set: any): DiagramSlice => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
  isLayoutLocked: false,
  isGeneratingDiagram: false,
  lastUpdated: Date.now(),

  setNodes: (nodes: DiagramNode[]) =>
    set({
      nodes,
      lastUpdated: Date.now(),
    }),

  setEdges: (edges: DiagramEdge[]) =>
    set({
      edges,
      lastUpdated: Date.now(),
    }),

  updateNode: (nodeId: string, updates: Partial<DiagramNode>) =>
    set((state: any) => ({
      nodes: state.nodes.map((node: DiagramNode) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      lastUpdated: Date.now(),
    })),

  setViewport: (viewport: { x: number; y: number; zoom: number }) =>
    set({ viewport }),

  setSelectedNode: (nodeId: string | null) => set({ selectedNodeId: nodeId }),

  setLayoutLocked: (locked: boolean) => set({ isLayoutLocked: locked }),

  setGeneratingDiagram: (isGenerating: boolean) =>
    set({ isGeneratingDiagram: isGenerating }),

  updateDiagram: (nodes: DiagramNode[], edges: DiagramEdge[]) =>
    set({
      nodes,
      edges,
      lastUpdated: Date.now(),
    }),
});

// ============================================================================
// Parser Slice
// ============================================================================

interface ParserSlice {
  isParsing: boolean;
  parseErrors: Map<string, ParseError[]>;
  lastParseTime: number;
  parsedEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>;

  setIsParsing: (isParsing: boolean) => void;
  setParseErrors: (fileId: string, errors: ParseError[]) => void;
  clearParseErrors: (fileId: string) => void;
  setParsedEntities: (
    fileId: string,
    entities: (ClassDefinition | InterfaceDefinition)[]
  ) => void;
  clearParsedEntities: (fileId: string) => void;
}

const createParserSlice = (set: any): ParserSlice => ({
  isParsing: false,
  parseErrors: new Map(),
  lastParseTime: 0,
  parsedEntities: new Map(),

  setIsParsing: (isParsing: boolean) => set({ isParsing }),

  setParseErrors: (fileId: string, errors: ParseError[]) =>
    set((state: any) => {
      const newErrors = new Map(state.parseErrors);
      newErrors.set(fileId, errors);
      return { parseErrors: newErrors };
    }),

  clearParseErrors: (fileId: string) =>
    set((state: any) => {
      const newErrors = new Map(state.parseErrors);
      newErrors.delete(fileId);
      return { parseErrors: newErrors };
    }),

  setParsedEntities: (
    fileId: string,
    entities: (ClassDefinition | InterfaceDefinition)[]
  ) =>
    set((state: any) => {
      const newEntities = new Map(state.parsedEntities);
      newEntities.set(fileId, entities);
      return {
        parsedEntities: newEntities,
        lastParseTime: Date.now(),
      };
    }),

  clearParsedEntities: (fileId: string) =>
    set((state: any) => {
      const newEntities = new Map(state.parsedEntities);
      newEntities.delete(fileId);
      return { parsedEntities: newEntities };
    }),
});

// ============================================================================
// File Tree Slice
// ============================================================================

interface FileTreeSlice {
  expandedPaths: Set<string>;
  selectedFileId: string | null;
  sortOrder: "name" | "modified";

  toggleExpanded: (path: string) => void;
  setExpanded: (path: string, expanded: boolean) => void;
  setSelectedFile: (fileId: string | null) => void;
  setSortOrder: (order: "name" | "modified") => void;
}

const createFileTreeSlice = (set: any): FileTreeSlice => ({
  expandedPaths: new Set<string>(),
  selectedFileId: null,
  sortOrder: "name" as const,

  toggleExpanded: (path: string) =>
    set((state: any) => {
      const newExpanded = new Set(state.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedPaths: newExpanded };
    }),

  setExpanded: (path: string, expanded: boolean) =>
    set((state: any) => {
      const newExpanded = new Set(state.expandedPaths);
      if (expanded) {
        newExpanded.add(path);
      } else {
        newExpanded.delete(path);
      }
      return { expandedPaths: newExpanded };
    }),

  setSelectedFile: (fileId: string | null) => set({ selectedFileId: fileId }),

  setSortOrder: (order: "name" | "modified") => set({ sortOrder: order }),
});

// ============================================================================
// Combined Store
// ============================================================================

type StoreState = FileSlice &
  EditorSlice &
  DiagramSlice &
  ParserSlice &
  FileTreeSlice;

export const useStore = create<StoreState>()(
  devtools(
    (set, get) => ({
      ...createFileSlice(set, get),
      ...createEditorSlice(set),
      ...createDiagramSlice(set),
      ...createParserSlice(set),
      ...createFileTreeSlice(set),
    }),
    {
      name: "uml-graph-store",
    }
  )
);

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================

/**
 * Hook to get the active file
 */
export const useActiveFile = () =>
  useStore((state) => {
    if (!state.activeFileId) return null;
    return state.files.find((f) => f.id === state.activeFileId);
  });

/**
 * Hook to get all parsed entities across all files
 */
export const useAllParsedEntities = () =>
  useStore((state) => {
    const entities: (ClassDefinition | InterfaceDefinition)[] = [];
    state.parsedEntities.forEach((fileEntities) => {
      entities.push(...fileEntities);
    });
    return entities;
  });

/**
 * Hook to get parse errors for the active file
 */
export const useActiveFileErrors = () =>
  useStore((state) => {
    if (!state.activeFileId) return [];
    return state.parseErrors.get(state.activeFileId) || [];
  });
