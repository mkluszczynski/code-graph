/**
 * Zustand Store - Application State Management
 *
 * Centralized state management using Zustand with slices for different concerns
 * 
 * NOTE: This file is 345 lines. Justification:
 * - Central state management hub with 5 feature slices
 * - Slice pattern requires co-location for type safety
 * - Each slice is logically cohesive (FileSlice, EditorSlice, DiagramSlice, etc.)
 * - Splitting would break Zustand's slice composition pattern
 * Constitutional exception: Complexity justified in writing.
 */

import { create, type StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  ClassDefinition,
  DiagramEdge,
  DiagramNode,
  InterfaceDefinition,
  ParseError,
  Position,
  ProjectFile,
  StorageMetadata,
} from "../types";

// ============================================================================
// Type Helpers
// ============================================================================

type StoreState = FileSlice & EditorSlice & DiagramSlice & ParserSlice & FileTreeSlice & PersistenceSlice;
type StateSliceCreator<T> = StateCreator<StoreState, [], [], T>;

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
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  duplicateFile: (fileId: string) => Promise<{ success: boolean; newFileId?: string; error?: string }>;
  setActiveFile: (fileId: string | null) => void;
  getFileById: (fileId: string) => ProjectFile | undefined;
  setLoadingFiles: (isLoading: boolean) => void;
  setCreatingFile: (isCreating: boolean) => void;
}

const createFileSlice: StateSliceCreator<FileSlice> = (set, get) => ({
  files: [],
  activeFileId: null,
  isLoadingFiles: false,
  isCreatingFile: false,

  setFiles: (files: ProjectFile[]) => set({ files }),

  addFile: (file: ProjectFile) =>
    set((state) => ({
      files: [...state.files, file],
    })),

  updateFile: (fileId: string, updates: Partial<ProjectFile>) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === fileId ? { ...file, ...updates } : file
      ),
    })),

  removeFile: (fileId: string) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== fileId),
      activeFileId: state.activeFileId === fileId ? null : state.activeFileId,
    })),

  deleteFile: async (fileId: string) => {
    // Import is lazy to avoid circular dependencies
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const projectManager = new ProjectManager();

    // Store original state for rollback
    const originalState = {
      files: get().files,
      activeFileId: get().activeFileId,
      editorContent: get().editorContent,
      isDirty: get().isDirty,
      parsedEntities: new Map(get().parsedEntities),
      parseErrors: new Map(get().parseErrors),
    };

    try {
      // Optimistic update: Update store state first
      set((state) => ({
        files: state.files.filter((file) => file.id !== fileId),
        // Close editor tab if deleted file was active
        activeFileId: state.activeFileId === fileId ? null : state.activeFileId,
        editorContent: state.activeFileId === fileId ? "" : state.editorContent,
        isDirty: state.activeFileId === fileId ? false : state.isDirty,
      }));

      // Clear parsed entities and errors for deleted file
      const state = get();
      state.clearParsedEntities(fileId);
      state.clearParseErrors(fileId);

      // Delete from IndexedDB
      await projectManager.deleteFile(fileId);
    } catch (error) {
      console.error("Failed to delete file:", error);

      // Rollback to original state on failure
      set({
        files: originalState.files,
        activeFileId: originalState.activeFileId,
        editorContent: originalState.editorContent,
        isDirty: originalState.isDirty,
        parsedEntities: originalState.parsedEntities,
        parseErrors: originalState.parseErrors,
      });

      // Provide user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("quota")) {
        throw new Error("Storage quota exceeded. Please free up space and try again.");
      } else if (errorMessage.includes("database")) {
        throw new Error("Database error. Please try again or refresh the page.");
      }
      throw new Error(`Failed to delete file: ${errorMessage}`);
    }
  },

  renameFile: async (fileId: string, newName: string) => {
    // Import is lazy to avoid circular dependencies
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const { validateFileName } = await import("../../file-tree/FileOperations");
    const projectManager = new ProjectManager();

    const file = get().getFileById(fileId);
    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    // Validate the new filename
    const validation = validateFileName(newName);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Check for duplicate names (excluding current file)
    const allFiles = get().files;
    const directory = file.path.substring(0, file.path.lastIndexOf("/"));
    const newPath = directory ? `${directory}/${newName}` : newName;

    const duplicateFile = allFiles.find(
      (f) => f.id !== fileId && f.path === newPath
    );
    if (duplicateFile) {
      throw new Error(`A file named "${newName}" already exists`);
    }

    // Store original state for rollback
    const originalFiles = get().files;

    try {
      // Update in IndexedDB first
      const updatedFile = await projectManager.updateFile(fileId, {
        name: newName,
        path: newPath,
      });

      // Update store state
      set((state) => ({
        files: state.files.map((f) =>
          f.id === fileId ? updatedFile : f
        ),
      }));
    } catch (error) {
      console.error("Failed to rename file:", error);

      // Rollback to original state on failure
      set({ files: originalFiles });

      // Provide user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("quota")) {
        throw new Error("Storage quota exceeded. Please free up space and try again.");
      } else if (errorMessage.includes("database") || errorMessage.includes("IndexedDB")) {
        throw new Error("Database error. Please try again or refresh the page.");
      }
      throw new Error(`Failed to rename file: ${errorMessage}`);
    }
  },

  duplicateFile: async (fileId: string) => {
    // Import is lazy to avoid circular dependencies
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const { generateDuplicateName } = await import("../../file-tree/FileOperations");
    const projectManager = new ProjectManager();

    const file = get().getFileById(fileId);
    if (!file) {
      return {
        success: false,
        error: `File with ID ${fileId} not found`,
      };
    }

    // Store original state for rollback
    const originalFiles = get().files;

    try {
      // Get all existing file names to avoid conflicts
      const allFiles = get().files;
      const existingNames = allFiles.map((f) => f.name);

      // Generate unique duplicate name
      const newName = generateDuplicateName(file.name, { existingNames });

      // Extract directory from path
      const directory = file.path.substring(0, file.path.lastIndexOf("/"));
      const newPath = directory ? `${directory}/${newName}` : newName;

      // Create new file with duplicated content
      const newFile: ProjectFile = {
        id: crypto.randomUUID(),
        name: newName,
        path: newPath,
        content: file.content,
        lastModified: Date.now(),
        isActive: false,
      };

      // Save to IndexedDB first
      await projectManager.saveFile(newFile);

      // Add to store after successful save
      get().addFile(newFile);

      return {
        success: true,
        newFileId: newFile.id,
      };
    } catch (error) {
      console.error("Failed to duplicate file:", error);

      // Rollback to original state on failure
      set({ files: originalFiles });

      // Provide user-friendly error messages
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("quota") || errorMessage.includes("QuotaExceededError")) {
        return {
          success: false,
          error: "Storage quota exceeded. Please delete some files to free up space.",
        };
      } else if (errorMessage.includes("database") || errorMessage.includes("IndexedDB")) {
        return {
          success: false,
          error: "Database error. Please try again or refresh the page.",
        };
      }
      return {
        success: false,
        error: `Failed to duplicate file: ${errorMessage}`,
      };
    }
  },

  setActiveFile: (fileId: string | null) => set({ activeFileId: fileId }),

  getFileById: (fileId: string) => {
    const state = get();
    return state.files.find((file) => file.id === fileId);
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

const createEditorSlice: StateSliceCreator<EditorSlice> = (set) => ({
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

const createDiagramSlice: StateSliceCreator<DiagramSlice> = (set) => ({
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
    set((state) => ({
      nodes: state.nodes.map((node) =>
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

const createParserSlice: StateSliceCreator<ParserSlice> = (set) => ({
  isParsing: false,
  parseErrors: new Map(),
  lastParseTime: 0,
  parsedEntities: new Map(),

  setIsParsing: (isParsing: boolean) => set({ isParsing }),

  setParseErrors: (fileId: string, errors: ParseError[]) =>
    set((state) => {
      const newErrors = new Map(state.parseErrors);
      newErrors.set(fileId, errors);
      return { parseErrors: newErrors };
    }),

  clearParseErrors: (fileId: string) =>
    set((state) => {
      const newErrors = new Map(state.parseErrors);
      newErrors.delete(fileId);
      return { parseErrors: newErrors };
    }),

  setParsedEntities: (
    fileId: string,
    entities: (ClassDefinition | InterfaceDefinition)[]
  ) =>
    set((state) => {
      const newEntities = new Map(state.parsedEntities);
      newEntities.set(fileId, entities);
      return {
        parsedEntities: newEntities,
        lastParseTime: Date.now(),
      };
    }),

  clearParsedEntities: (fileId: string) =>
    set((state) => {
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

const createFileTreeSlice: StateSliceCreator<FileTreeSlice> = (set) => ({
  expandedPaths: new Set<string>(),
  selectedFileId: null,
  sortOrder: "name" as const,

  toggleExpanded: (path: string) =>
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedPaths: newExpanded };
    }),

  setExpanded: (path: string, expanded: boolean) =>
    set((state) => {
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
// Persistence Slice (Feature 002)
// ============================================================================

/**
 * Persistence state management slice
 * 
 * Tracks auto-save status, pending saves, and storage metadata
 */
interface PersistenceSlice {
  /** Unix timestamp of last successful save */
  lastSavedTimestamp: number | null;
  /** Whether a save operation is currently in progress */
  isSaving: boolean;
  /** Error message if last save failed */
  saveError: string | null;
  /** Whether auto-save is enabled (can be disabled due to errors) */
  autoSaveEnabled: boolean;
  /** Map of file IDs to timestamps for pending save operations */
  pendingSaves: Map<string, number>;
  /** Current storage quota and usage information */
  storageMetadata: StorageMetadata | null;

  /** Set saving state */
  setSaving: (isSaving: boolean) => void;
  /** Set or clear save error */
  setSaveError: (error: string | null) => void;
  /** Update last saved timestamp */
  setLastSaved: (timestamp: number) => void;
  /** Add a file to pending saves queue */
  addPendingSave: (fileId: string, timestamp: number) => void;
  /** Remove a file from pending saves queue */
  removePendingSave: (fileId: string) => void;
  /** Enable or disable auto-save */
  setAutoSaveEnabled: (enabled: boolean) => void;
  /** Update storage metadata */
  updateStorageMetadata: (metadata: StorageMetadata) => void;
}

const createPersistenceSlice: StateSliceCreator<PersistenceSlice> = (set) => ({
  lastSavedTimestamp: null,
  isSaving: false,
  saveError: null,
  autoSaveEnabled: true,
  pendingSaves: new Map(),
  storageMetadata: null,

  setSaving: (isSaving: boolean) => set({ isSaving }),

  setSaveError: (error: string | null) => set({ saveError: error }),

  setLastSaved: (timestamp: number) =>
    set({ lastSavedTimestamp: timestamp, saveError: null }),

  addPendingSave: (fileId: string, timestamp: number) =>
    set((state) => {
      const newPending = new Map(state.pendingSaves);
      newPending.set(fileId, timestamp);
      return { pendingSaves: newPending };
    }),

  removePendingSave: (fileId: string) =>
    set((state) => {
      const newPending = new Map(state.pendingSaves);
      newPending.delete(fileId);
      return { pendingSaves: newPending };
    }),

  setAutoSaveEnabled: (enabled: boolean) => set({ autoSaveEnabled: enabled }),

  updateStorageMetadata: (metadata: StorageMetadata) =>
    set({ storageMetadata: metadata }),
});

// ============================================================================
// Combined Store
// ============================================================================

export const useStore = create<StoreState>()(
  devtools(
    (...args) => ({
      ...createFileSlice(...args),
      ...createEditorSlice(...args),
      ...createDiagramSlice(...args),
      ...createParserSlice(...args),
      ...createFileTreeSlice(...args),
      ...createPersistenceSlice(...args),
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
