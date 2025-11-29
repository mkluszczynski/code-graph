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
  DiagramScope,
  InterfaceDefinition,
  ParseError,
  Position,
  ProjectFile,
  ProjectFolder,
  StorageMetadata,
} from "../types";
import type { DragState, DropTarget } from "../../file-tree/types";

// ============================================================================
// Type Helpers
// ============================================================================

type StoreState = FileSlice & EditorSlice & DiagramSlice & ParserSlice & FileTreeSlice & PersistenceSlice & ViewModeSlice & ThemeSlice & DragDropSlice;
type StateSliceCreator<T> = StateCreator<StoreState, [], [], T>;

// ============================================================================
// File Management Slice
// ============================================================================

interface FileSlice {
  files: ProjectFile[];
  folders: ProjectFolder[];
  activeFileId: string | null;
  isLoadingFiles: boolean;
  isCreatingFile: boolean;

  setFiles: (files: ProjectFile[]) => void;
  setFolders: (folders: ProjectFolder[]) => void;
  addFile: (file: ProjectFile) => void;
  updateFile: (fileId: string, updates: Partial<ProjectFile>) => void;
  removeFile: (fileId: string) => void;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  duplicateFile: (fileId: string) => Promise<{ success: boolean; newFileId?: string; error?: string }>;
  createEmptyFile: (name: string, parentPath: string) => Promise<ProjectFile>;
  createFolder: (name: string, parentPath: string) => Promise<void>;
  deleteFolder: (folderPath: string) => Promise<{ success: boolean; affectedCount: number; error?: string }>;
  renameFolder: (oldPath: string, newPath: string) => Promise<{ success: boolean; affectedCount: number; newPath?: string; error?: string }>;
  duplicateFolder: (folderPath: string) => Promise<{ success: boolean; affectedCount: number; newPath?: string; error?: string }>;
  setActiveFile: (fileId: string | null) => void;
  getFileById: (fileId: string) => ProjectFile | undefined;
  setLoadingFiles: (isLoading: boolean) => void;
  setCreatingFile: (isCreating: boolean) => void;
  loadFolders: () => Promise<void>;
}

const createFileSlice: StateSliceCreator<FileSlice> = (set, get) => ({
  files: [],
  folders: [],
  activeFileId: null,
  isLoadingFiles: false,
  isCreatingFile: false,

  setFiles: (files: ProjectFile[]) => set({ files }),

  setFolders: (folders: ProjectFolder[]) => set({ folders }),

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

  createEmptyFile: async (name: string, parentPath: string) => {
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const projectManager = new ProjectManager();

    try {
      set({ isCreatingFile: true });

      // Create file via ProjectManager
      const file = await projectManager.createEmptyFile(name, parentPath);

      // Add to store
      get().addFile(file);

      // Set as active file
      set({ activeFileId: file.id });

      return file;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("quota")) {
        throw new Error("Storage quota exceeded. Please delete some files to free up space.");
      } else if (errorMessage.includes("database") || errorMessage.includes("IndexedDB")) {
        throw new Error("Database error. Please try again or refresh the page.");
      }
      throw new Error(`Failed to create file: ${errorMessage}`);
    } finally {
      set({ isCreatingFile: false });
    }
  },

  createFolder: async (name: string, parentPath: string) => {
    const { validateItemName } = await import("../../file-tree/FileOperations");
    const { validateFolderDepth } = await import("../../file-tree/FolderOperations");
    const { ProjectManager } = await import("../../project-management/ProjectManager");

    // Validate folder name
    const nameValidation = validateItemName(name, "folder");
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    // Compute full folder path
    const folderPath = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;

    // Validate folder depth
    const depthValidation = validateFolderDepth(folderPath);
    if (!depthValidation.isValid) {
      throw new Error(depthValidation.error);
    }

    // Persist folder to IndexedDB
    const projectManager = new ProjectManager();
    const newFolder = await projectManager.createFolder(name, parentPath);

    // Update local state
    set((state) => ({
      folders: [...state.folders, newFolder],
    }));
  },

  loadFolders: async () => {
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const projectManager = new ProjectManager();
    const folders = await projectManager.getAllFolders();
    set({ folders });
  },

  deleteFolder: async (folderPath: string) => {
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const { getFilesInFolder } = await import("../../file-tree/FolderOperations");
    const projectManager = new ProjectManager();

    // Store original state for rollback
    const originalState = {
      files: get().files,
      folders: get().folders,
      activeFileId: get().activeFileId,
      editorContent: get().editorContent,
      isDirty: get().isDirty,
    };

    try {
      // Get all files in folder
      const filesToDelete = getFilesInFolder(get().files, folderPath);
      const affectedCount = filesToDelete.length;

      // Optimistic update: Remove files and folders from store immediately
      set((state) => ({
        files: state.files.filter((file) => !filesToDelete.some((f) => f.id === file.id)),
        folders: state.folders.filter((folder) =>
          folder.path !== folderPath && !folder.path.startsWith(folderPath + "/")
        ),
        // Close editor if active file is in deleted folder
        activeFileId: filesToDelete.some((f) => f.id === state.activeFileId)
          ? null
          : state.activeFileId,
        editorContent: filesToDelete.some((f) => f.id === state.activeFileId)
          ? ""
          : state.editorContent,
        isDirty: filesToDelete.some((f) => f.id === state.activeFileId)
          ? false
          : state.isDirty,
      }));

      // Delete from IndexedDB (files and folder entry)
      await projectManager.deleteFolderContents(folderPath);
      await projectManager.deleteFolder(folderPath);

      return {
        success: true,
        affectedCount,
      };
    } catch (error) {
      console.error("Failed to delete folder:", error);

      // Rollback to original state on failure
      set({
        files: originalState.files,
        folders: originalState.folders,
        activeFileId: originalState.activeFileId,
        editorContent: originalState.editorContent,
        isDirty: originalState.isDirty,
      });

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("quota")) {
        return {
          success: false,
          affectedCount: 0,
          error: "Storage quota exceeded. Please free up space and try again.",
        };
      } else if (errorMessage.includes("database") || errorMessage.includes("IndexedDB")) {
        return {
          success: false,
          affectedCount: 0,
          error: "Database error. Please try again or refresh the page.",
        };
      }
      return {
        success: false,
        affectedCount: 0,
        error: `Failed to delete folder: ${errorMessage}`,
      };
    }
  },

  renameFolder: async (oldPath: string, newPath: string) => {
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const { getFilesInFolder, updatePathForRename, getParentPath } = await import("../../file-tree/FolderOperations");
    const { validateItemName } = await import("../../file-tree/FileOperations");
    const projectManager = new ProjectManager();

    // Extract folder name from new path for validation
    const newFolderName = newPath.split("/").filter(Boolean).pop() || "";

    // Validate new folder name
    const nameValidation = validateItemName(newFolderName, "folder");
    if (!nameValidation.isValid) {
      return {
        success: false,
        affectedCount: 0,
        error: nameValidation.error,
      };
    }

    // Check for duplicate folder name at same level
    const parentPath = getParentPath(newPath);
    const allFiles = get().files;
    const existingFolders = new Set<string>();
    allFiles.forEach((file) => {
      if (file.parentPath.startsWith(parentPath) && file.parentPath !== oldPath) {
        const relativePath = file.parentPath.slice(parentPath.length);
        const firstFolder = relativePath.split("/").filter(Boolean)[0];
        if (firstFolder) {
          existingFolders.add(firstFolder);
        }
      }
    });

    if (existingFolders.has(newFolderName)) {
      return {
        success: false,
        affectedCount: 0,
        error: `A folder named "${newFolderName}" already exists`,
      };
    }

    // Store original state for rollback
    const originalState = {
      files: get().files,
      folders: get().folders,
      activeFileId: get().activeFileId,
    };

    // Get folders to rename (the folder itself and any nested folders)
    const foldersToRename = get().folders.filter(
      (folder) => folder.path === oldPath || folder.path.startsWith(`${oldPath}/`)
    );

    try {
      // Get all files in folder
      const filesToUpdate = getFilesInFolder(get().files, oldPath);
      const affectedCount = filesToUpdate.length;

      // Optimistic update: Update paths in store immediately
      set((state) => ({
        files: state.files.map((file) => {
          if (!filesToUpdate.some((f) => f.id === file.id)) {
            return file;
          }
          const newFilePath = updatePathForRename(file.path, oldPath, newPath);
          const newParentPath = updatePathForRename(file.parentPath, oldPath, newPath);
          return {
            ...file,
            path: newFilePath,
            parentPath: newParentPath,
          };
        }),
        folders: state.folders.map((folder) => {
          if (!foldersToRename.some((f) => f.id === folder.id)) {
            return folder;
          }
          const newFolderPath = updatePathForRename(folder.path, oldPath, newPath);
          const newFolderParentPath = updatePathForRename(folder.parentPath, oldPath, newPath);
          return {
            ...folder,
            name: folder.path === oldPath ? newFolderName : folder.name,
            path: newFolderPath,
            parentPath: newFolderParentPath,
          };
        }),
      }));

      // Update file paths in IndexedDB
      if (affectedCount > 0) {
        await projectManager.updateFolderPaths(oldPath, newPath);
      }

      // Update folder entries in IndexedDB
      if (foldersToRename.length > 0) {
        await projectManager.renameFolder(oldPath, newPath);
      }

      return {
        success: true,
        affectedCount,
        newPath,
      };
    } catch (error) {
      console.error("Failed to rename folder:", error);

      // Rollback to original state on failure
      set({
        files: originalState.files,
        folders: originalState.folders,
      });

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("quota")) {
        return {
          success: false,
          affectedCount: 0,
          error: "Storage quota exceeded. Please free up space and try again.",
        };
      } else if (errorMessage.includes("database") || errorMessage.includes("IndexedDB")) {
        return {
          success: false,
          affectedCount: 0,
          error: "Database error. Please try again or refresh the page.",
        };
      }
      return {
        success: false,
        affectedCount: 0,
        error: `Failed to rename folder: ${errorMessage}`,
      };
    }
  },

  duplicateFolder: async (folderPath: string) => {
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const { getFilesInFolder, generateDuplicateFolderName, getParentPath } = await import("../../file-tree/FolderOperations");
    const projectManager = new ProjectManager();

    // Store original state for rollback
    const originalFiles = get().files;
    const originalFolders = get().folders;

    try {
      // Get all files in source folder
      const sourceFiles = getFilesInFolder(get().files, folderPath);
      const affectedCount = sourceFiles.length;

      // Get all folder entries in source folder
      const sourceFolders = get().folders.filter(
        (folder) => folder.path === folderPath || folder.path.startsWith(`${folderPath}/`)
      );

      // Extract folder name and parent path
      const parentPath = getParentPath(folderPath);
      const folderName = folderPath.split("/").filter(Boolean).pop() || "folder";

      // Get existing folder names at same level (from both files and folders)
      const existingFolders = new Set<string>();
      originalFiles.forEach((file) => {
        if (file.parentPath.startsWith(parentPath)) {
          const relativePath = file.parentPath.slice(parentPath.length);
          const firstFolder = relativePath.split("/").filter(Boolean)[0];
          if (firstFolder) {
            existingFolders.add(firstFolder);
          }
        }
      });
      originalFolders.forEach((folder) => {
        if (folder.parentPath === parentPath) {
          existingFolders.add(folder.name);
        }
      });

      // Generate unique folder name
      const newFolderName = generateDuplicateFolderName(folderName, Array.from(existingFolders));
      const newFolderPath = parentPath === "/" ? `/${newFolderName}` : `${parentPath}/${newFolderName}`;

      // Generate new files with updated paths
      const newFiles: ProjectFile[] = sourceFiles.map((file) => {
        const relativePath = file.path.slice(folderPath.length);
        const newFilePath = newFolderPath + relativePath;
        const relativeParentPath = file.parentPath.slice(folderPath.length);
        const newParentPath = newFolderPath + relativeParentPath;

        return {
          ...file,
          id: crypto.randomUUID(),
          path: newFilePath,
          parentPath: newParentPath,
          lastModified: Date.now(),
          isActive: false,
        };
      });

      // Generate new folder entries with updated paths
      const newFolders: ProjectFolder[] = sourceFolders.map((folder) => {
        const relativePath = folder.path.slice(folderPath.length);
        const newPath = newFolderPath + relativePath;
        const relativeParentPath = folder.parentPath.slice(folderPath.length);
        const newParent = folder.path === folderPath ? parentPath : newFolderPath + relativeParentPath;

        return {
          ...folder,
          id: crypto.randomUUID(),
          name: folder.path === folderPath ? newFolderName : folder.name,
          path: newPath,
          parentPath: newParent,
          createdAt: Date.now(),
        };
      });

      // Persist files to IndexedDB
      if (newFiles.length > 0) {
        await projectManager.duplicateFolderContents(folderPath, newFolderPath);
      }

      // Persist folder entries to IndexedDB
      for (const folder of newFolders) {
        await projectManager.createFolder(folder);
      }

      // Add new files and folders to store
      set((state) => ({
        files: [...state.files, ...newFiles],
        folders: [...state.folders, ...newFolders],
      }));

      return {
        success: true,
        affectedCount,
        newPath: newFolderPath,
      };
    } catch (error) {
      console.error("Failed to duplicate folder:", error);

      // Rollback to original state on failure
      set({ files: originalFiles, folders: originalFolders });

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("quota") || errorMessage.includes("QuotaExceededError")) {
        return {
          success: false,
          affectedCount: 0,
          error: "Storage quota exceeded. Please delete some files to free up space.",
        };
      } else if (errorMessage.includes("database") || errorMessage.includes("IndexedDB")) {
        return {
          success: false,
          affectedCount: 0,
          error: "Database error. Please try again or refresh the page.",
        };
      }
      return {
        success: false,
        affectedCount: 0,
        error: `Failed to duplicate folder: ${errorMessage}`,
      };
    }
  },
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
// View Mode Slice (Feature 004)
// ============================================================================

/**
 * View mode state management slice
 * 
 * Manages diagram view mode (file-scoped vs project-scoped)
 */
interface ViewModeSlice {
  /** Current diagram view mode */
  diagramViewMode: 'file' | 'project';

  /** Set the diagram view mode */
  setDiagramViewMode: (mode: 'file' | 'project') => void;

  /** Get current diagram scope (computed from view mode and active file) */
  getDiagramScope: () => DiagramScope;
}

const createViewModeSlice: StateSliceCreator<ViewModeSlice> = (set, get) => ({
  diagramViewMode: 'file', // Default to file view per FR-026

  setDiagramViewMode: (mode: 'file' | 'project') =>
    set({ diagramViewMode: mode }),

  getDiagramScope: () => {
    const state = get();
    return {
      mode: state.diagramViewMode,
      activeFileId: state.activeFileId,
      importGraph: undefined, // Will be populated by ImportResolver
    };
  },
});

// ============================================================================
// Drag-and-Drop Slice (Feature 007)
// ============================================================================

/**
 * Drag-and-drop state management slice
 * 
 * Manages drag state and drop target validation for file/folder reorganization
 */
interface DragDropSlice {
  /** Current drag state (null when not dragging) */
  dragState: DragState | null;
  /** Current drop target being hovered (null when not over a target) */
  dropTarget: DropTarget | null;

  /** Start a drag operation */
  startDrag: (item: { type: 'file' | 'folder'; id: string; path: string; parentPath: string; name: string }) => void;
  /** End the current drag operation */
  endDrag: () => void;
  /** Set or clear the current drop target */
  setDropTarget: (target: DropTarget | null) => void;
  /** Cancel the current drag operation (e.g., on Escape key) */
  cancelDrag: () => void;
  /** Move a file to a new folder */
  moveFile: (fileId: string, targetFolderPath: string) => Promise<{ success: boolean; error?: string }>;
  /** Move a folder to a new parent folder */
  moveFolder: (sourceFolderPath: string, targetFolderPath: string) => Promise<{ success: boolean; error?: string }>;
}

const createDragDropSlice: StateSliceCreator<DragDropSlice> = (set, get) => ({
  dragState: null,
  dropTarget: null,

  startDrag: (item) => {
    set({
      dragState: {
        itemType: item.type,
        itemId: item.id,
        sourcePath: item.path,
        sourceParentPath: item.parentPath,
        name: item.name,
        dragStartTime: performance.now(),
      },
      dropTarget: null,
    });
  },

  endDrag: () => {
    set({
      dragState: null,
      dropTarget: null,
    });
  },

  setDropTarget: (target) => {
    set({ dropTarget: target });
  },

  cancelDrag: () => {
    set({
      dragState: null,
      dropTarget: null,
    });
  },

  moveFile: async (fileId: string, targetFolderPath: string) => {
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const projectManager = new ProjectManager();

    // Store original state for rollback
    const originalFiles = get().files;

    try {
      // Execute the move in IndexedDB
      const movedFile = await projectManager.moveFile(fileId, targetFolderPath);

      // Update store state
      set((state) => ({
        files: state.files.map((file) =>
          file.id === fileId ? movedFile : file
        ),
      }));

      return { success: true };
    } catch (error) {
      // Rollback to original state on failure
      set({ files: originalFiles });

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage.includes("exists")
          ? `A file with that name already exists in the target folder`
          : `Failed to move file: ${errorMessage}`,
      };
    }
  },

  moveFolder: async (sourceFolderPath: string, targetFolderPath: string) => {
    const { ProjectManager } = await import("../../project-management/ProjectManager");
    const projectManager = new ProjectManager();

    // Store original state for rollback
    const originalFiles = get().files;
    const originalFolders = get().folders;

    try {
      // Execute the move in IndexedDB
      await projectManager.moveFolder(sourceFolderPath, targetFolderPath);

      // Reload files and folders from storage
      const updatedFiles = await projectManager.getAllFiles();
      const updatedFolders = await projectManager.getAllFolders();

      // Update store state
      set({
        files: updatedFiles,
        folders: updatedFolders,
      });

      // If active file was moved, its ID stays the same (unchanged)
      // so the editor should continue working

      return { success: true };
    } catch (error) {
      // Rollback to original state on failure
      set({
        files: originalFiles,
        folders: originalFolders,
      });

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage.includes("exists")
          ? `A folder with that name already exists in the target folder`
          : `Failed to move folder: ${errorMessage}`,
      };
    }
  },
});

// ============================================================================
// Theme Slice
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

/**
 * Get system theme preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Get stored theme preference or default to system
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem('uml-visualizer-theme') as Theme | null;
  return stored || 'system';
}

/**
 * Resolve theme to actual light/dark value
 */
function resolveThemeValue(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to document
 */
function applyThemeToDocument(theme: 'light' | 'dark') {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Theme state management slice
 * 
 * Manages application theme (light/dark mode) using Tailwind CSS dark: classes
 */
interface ThemeSlice {
  /** Current theme setting (light, dark, or system) */
  theme: Theme;
  /** Resolved theme (actual light or dark, after system preference is applied) */
  resolvedTheme: 'light' | 'dark';

  /** Set theme and persist to localStorage */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark (ignoring system) */
  toggleTheme: () => void;
  /** Update resolved theme when system preference changes */
  updateResolvedTheme: () => void;
}

const createThemeSlice: StateSliceCreator<ThemeSlice> = (set, get) => {
  // Initialize theme on store creation
  const initialTheme = getStoredTheme();
  const initialResolved = resolveThemeValue(initialTheme);
  applyThemeToDocument(initialResolved);

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const state = get();
      if (state.theme === 'system') {
        state.updateResolvedTheme();
      }
    });
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,

    setTheme: (newTheme: Theme) => {
      localStorage.setItem('uml-visualizer-theme', newTheme);
      const resolved = resolveThemeValue(newTheme);
      applyThemeToDocument(resolved);
      set({ theme: newTheme, resolvedTheme: resolved });
    },

    toggleTheme: () => {
      const state = get();
      const newTheme = state.resolvedTheme === 'light' ? 'dark' : 'light';
      state.setTheme(newTheme);
    },

    updateResolvedTheme: () => {
      const state = get();
      const resolved = resolveThemeValue(state.theme);
      applyThemeToDocument(resolved);
      set({ resolvedTheme: resolved });
    },
  };
};

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
      ...createViewModeSlice(...args),
      ...createDragDropSlice(...args),
      ...createThemeSlice(...args),
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
