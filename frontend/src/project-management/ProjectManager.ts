/**
 * Project Manager
 *
 * Manages TypeScript project files (create, read, update, delete, persist)
 * Based on: specs/001-uml-graph-visualizer/contracts/project-manager.contract.md
 */

import type { IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { ProjectFile, ProjectFolder } from "../shared/types";
import {
  FileExistsError,
  InvalidFileNameError,
  StorageError,
} from "../shared/types/errors";
import { generateId } from "../shared/utils";
import { createClassTemplate, createInterfaceTemplate } from "./FileCreator";

/**
 * Database schema definition
 */
interface UMLGraphDB {
  files: {
    key: string;
    value: ProjectFile;
    indexes: {
      "by-path": string;
      "by-parent-path": string;
      "by-name": string;
      "by-modified": number;
    };
  };
  folders: {
    key: string;
    value: ProjectFolder;
    indexes: {
      "by-path": string;
      "by-parent-path": string;
    };
  };
}

/**
 * Invalid file name characters
 */
const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/;

/**
 * ProjectManager class
 *
 * Handles all file management operations with IndexedDB persistence
 */
export class ProjectManager {
  private db: IDBPDatabase<UMLGraphDB> | null = null;
  private readonly dbName: string;
  private readonly dbVersion = 3; // Bumped for folders store

  constructor(dbName = "uml-graph-visualizer") {
    this.dbName = dbName;
  }

  /**
   * Initialize the database connection
   */
  async initialize(): Promise<void> {
    if (this.db) {
      return;
    }

    try {
      this.db = await openDB<UMLGraphDB>(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion) {
          // Create files store if it doesn't exist
          if (!db.objectStoreNames.contains("files")) {
            const fileStore = db.createObjectStore("files", { keyPath: "id" });
            fileStore.createIndex("by-path", "path", { unique: true });
            fileStore.createIndex("by-parent-path", "parentPath", { unique: false });
            fileStore.createIndex("by-name", "name", { unique: false });
            fileStore.createIndex("by-modified", "lastModified", {
              unique: false,
            });
          } else if (oldVersion < 2) {
            // Migration: Add by-parent-path index for v2
            const tx = db.transaction as unknown as { objectStore: (name: string) => IDBObjectStore };
            const store = tx.objectStore("files");
            if (!store.indexNames.contains("by-parent-path")) {
              store.createIndex("by-parent-path", "parentPath", { unique: false });
            }
          }

          // Create folders store (v3)
          if (!db.objectStoreNames.contains("folders")) {
            const folderStore = db.createObjectStore("folders", { keyPath: "id" });
            folderStore.createIndex("by-path", "path", { unique: true });
            folderStore.createIndex("by-parent-path", "parentPath", { unique: false });
          }
        },
      });
    } catch (error) {
      throw new StorageError(
        "initialize",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Validates a file name
   *
   * @param name - File name to validate
   * @throws InvalidFileNameError if name is invalid
   */
  private validateFileName(name: string): void {
    if (!name || name.trim() === "") {
      throw new InvalidFileNameError(name, "File name cannot be empty");
    }

    if (INVALID_FILENAME_CHARS.test(name)) {
      throw new InvalidFileNameError(
        name,
        'File name contains invalid characters: / \\ : * ? " < > |'
      );
    }
  }

  /**
   * Ensures file name has .ts extension
   *
   * @param name - File name
   * @returns File name with .ts extension
   */
  private ensureTsExtension(name: string): string {
    return name.endsWith(".ts") ? name : `${name}.ts`;
  }

  /**
   * Creates a new TypeScript file with default template
   *
   * @param name - File name (without .ts extension)
   * @param type - Type of file to create ('class' or 'interface')
   * @returns Created file
   * @throws FileExistsError if file already exists
   * @throws InvalidFileNameError if file name is invalid
   * @throws StorageError if IndexedDB operation fails
   */
  async createFile(
    name: string,
    type: "class" | "interface"
  ): Promise<ProjectFile> {
    await this.ensureDB();

    // Validate file name
    this.validateFileName(name);

    // Ensure .ts extension
    const fileName = this.ensureTsExtension(name);

    // Extract base name (without extension) for template generation
    const baseName = fileName.replace(/\.ts$/, "");

    // Generate file path
    const path = `/src/${fileName}`;

    // Check if file already exists
    const existing = await this.getFileByPath(path);
    if (existing) {
      throw new FileExistsError(fileName);
    }

    // Generate template content
    const content =
      type === "class"
        ? createClassTemplate(baseName)
        : createInterfaceTemplate(baseName);

    // Create file object
    const file: ProjectFile = {
      id: generateId(),
      name: fileName,
      path,
      parentPath: "/src",
      content,
      lastModified: Date.now(),
      isActive: false,
    };

    // Persist to IndexedDB
    try {
      await this.db!.put("files", file);
    } catch (error) {
      throw new StorageError(
        "createFile",
        error instanceof Error ? error.message : String(error)
      );
    }

    return file;
  }

  /**
   * Creates an empty TypeScript file in the specified folder
   *
   * @param name - File name (with or without extension)
   * @param parentPath - Parent folder path (e.g., "/src" or "/src/components")
   * @returns Created file
   * @throws FileExistsError if file already exists
   * @throws InvalidFileNameError if file name is invalid
   * @throws StorageError if IndexedDB operation fails
   */
  async createEmptyFile(name: string, parentPath: string): Promise<ProjectFile> {
    await this.ensureDB();

    // Validate file name
    this.validateFileName(name);

    // Generate file path
    const path = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;

    // Check if file already exists
    const existing = await this.getFileByPath(path);
    if (existing) {
      throw new FileExistsError(name);
    }

    // Create file object with empty content
    const file: ProjectFile = {
      id: generateId(),
      name,
      path,
      parentPath,
      content: "",
      lastModified: Date.now(),
      isActive: false,
    };

    // Persist to IndexedDB
    try {
      await this.db!.put("files", file);
    } catch (error) {
      throw new StorageError(
        "createEmptyFile",
        error instanceof Error ? error.message : String(error)
      );
    }

    return file;
  }

  /**
   * Retrieves a file by ID from storage
   *
   * @param id - File ID
   * @returns File if found, null otherwise
   * @throws StorageError if IndexedDB operation fails
   */
  async getFile(id: string): Promise<ProjectFile | null> {
    await this.ensureDB();

    try {
      const file = await this.db!.get("files", id);
      return file || null;
    } catch (error) {
      throw new StorageError(
        "getFile",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Retrieves a file by path from storage
   *
   * @param path - File path
   * @returns File if found, null otherwise
   * @throws StorageError if IndexedDB operation fails
   */
  async getFileByPath(path: string): Promise<ProjectFile | null> {
    await this.ensureDB();

    try {
      const index = this.db!.transaction("files").store.index("by-path");
      const file = await index.get(path);
      return file || null;
    } catch (error) {
      throw new StorageError(
        "getFileByPath",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Retrieves all files in the project
   *
   * @returns Array of all files, sorted by path alphabetically
   * @throws StorageError if IndexedDB operation fails
   */
  async getAllFiles(): Promise<ProjectFile[]> {
    await this.ensureDB();

    try {
      const files = await this.db!.getAll("files");
      // Sort by path alphabetically
      return files.sort((a, b) => a.path.localeCompare(b.path));
    } catch (error) {
      throw new StorageError(
        "getAllFiles",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Updates an existing file's content and persists to IndexedDB
   *
   * @param id - File ID
   * @param updates - Partial file updates
   * @returns Updated file
   * @throws StorageError if file doesn't exist or IndexedDB operation fails
   */
  async updateFile(
    id: string,
    updates: Partial<ProjectFile>
  ): Promise<ProjectFile> {
    await this.ensureDB();

    try {
      // Get existing file
      const existingFile = await this.db!.get("files", id);
      if (!existingFile) {
        throw new StorageError("updateFile", `File with ID ${id} not found`);
      }

      // Merge updates with existing file
      const updatedFile: ProjectFile = {
        ...existingFile,
        ...updates,
        id, // Ensure ID doesn't change
        lastModified: Date.now(), // Update timestamp
      };

      // If name changed, validate it
      if (updates.name && updates.name !== existingFile.name) {
        this.validateFileName(updates.name);
      }

      // Persist to IndexedDB
      await this.db!.put("files", updatedFile);

      return updatedFile;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        "updateFile",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Saves a file to storage (creates or updates)
   *
   * @param file - File to save
   * @throws StorageError if IndexedDB operation fails
   */
  async saveFile(file: ProjectFile): Promise<void> {
    await this.ensureDB();

    try {
      // Validate file name
      this.validateFileName(file.name);

      // Persist to IndexedDB (put creates or updates)
      await this.db!.put("files", file);
    } catch (error) {
      throw new StorageError(
        "saveFile",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Deletes a file from storage
   *
   * @param id - File ID to delete
   * @throws StorageError if file doesn't exist or IndexedDB operation fails
   */
  async deleteFile(id: string): Promise<void> {
    await this.ensureDB();

    try {
      // Check if file exists
      const existingFile = await this.db!.get("files", id);
      if (!existingFile) {
        throw new StorageError("deleteFile", `File with ID ${id} not found`);
      }

      // Delete from IndexedDB
      await this.db!.delete("files", id);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        "deleteFile",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Delete all files within a folder (recursive)
   * Uses single transaction for atomicity
   *
   * @param folderPath - Path of folder to delete (e.g., "/src/models")
   * @returns Number of files deleted
   * @throws StorageError if IndexedDB operation fails
   */
  async deleteFolderContents(folderPath: string): Promise<number> {
    await this.ensureDB();

    try {
      // Normalize folder path to ensure consistent matching
      const normalizedPath = folderPath.endsWith("/")
        ? folderPath
        : `${folderPath}/`;

      // Get all files in the folder
      const allFiles = await this.db!.getAll("files");
      const filesToDelete = allFiles.filter((file) =>
        file.path.startsWith(normalizedPath)
      );

      // Delete all files in a single transaction
      const tx = this.db!.transaction("files", "readwrite");
      const store = tx.objectStore("files");

      for (const file of filesToDelete) {
        await store.delete(file.id);
      }

      await tx.done;

      return filesToDelete.length;
    } catch (error) {
      throw new StorageError(
        "deleteFolderContents",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Update paths for all files within a renamed folder
   * Uses single transaction for atomicity
   *
   * @param oldPath - Original folder path (e.g., "/src/models")
   * @param newPath - New folder path (e.g., "/src/entities")
   * @returns Number of files updated
   * @throws StorageError if IndexedDB operation fails
   */
  async updateFolderPaths(oldPath: string, newPath: string): Promise<number> {
    await this.ensureDB();

    try {
      // Normalize folder path to ensure consistent matching
      const normalizedOldPath = oldPath.endsWith("/")
        ? oldPath
        : `${oldPath}/`;

      // Get all files in the folder
      const allFiles = await this.db!.getAll("files");
      const filesToUpdate = allFiles.filter((file) =>
        file.path.startsWith(normalizedOldPath)
      );

      if (filesToUpdate.length === 0) {
        return 0;
      }

      // Update all files in a single transaction
      const tx = this.db!.transaction("files", "readwrite");
      const store = tx.objectStore("files");

      for (const file of filesToUpdate) {
        // Update path by replacing old folder prefix with new
        const newFilePath = newPath + file.path.slice(oldPath.length);
        const newParentPath = newPath + file.parentPath.slice(oldPath.length);

        const updatedFile: ProjectFile = {
          ...file,
          path: newFilePath,
          parentPath: newParentPath,
          lastModified: Date.now(),
        };

        await store.put(updatedFile);
      }

      await tx.done;

      return filesToUpdate.length;
    } catch (error) {
      throw new StorageError(
        "updateFolderPaths",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Duplicate all files within a folder to a new location
   * Uses single transaction for atomicity
   *
   * @param sourcePath - Source folder path (e.g., "/src/models")
   * @param targetPath - Target folder path (e.g., "/src/models copy")
   * @returns Array of newly created file IDs
   * @throws StorageError if IndexedDB operation fails
   */
  async duplicateFolderContents(
    sourcePath: string,
    targetPath: string
  ): Promise<string[]> {
    await this.ensureDB();

    try {
      // Normalize folder path to ensure consistent matching
      const normalizedSourcePath = sourcePath.endsWith("/")
        ? sourcePath
        : `${sourcePath}/`;

      // Get all files in the source folder
      const allFiles = await this.db!.getAll("files");
      const filesToDuplicate = allFiles.filter((file) =>
        file.path.startsWith(normalizedSourcePath)
      );

      if (filesToDuplicate.length === 0) {
        return [];
      }

      // Create new files in a single transaction
      const tx = this.db!.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      const newFileIds: string[] = [];

      for (const file of filesToDuplicate) {
        // Create new path by replacing source folder with target
        const relativePath = file.path.slice(sourcePath.length);
        const newFilePath = targetPath + relativePath;
        const relativeParentPath = file.parentPath.slice(sourcePath.length);
        const newParentPath = targetPath + relativeParentPath;

        const newFile: ProjectFile = {
          ...file,
          id: generateId(),
          path: newFilePath,
          parentPath: newParentPath,
          lastModified: Date.now(),
          isActive: false,
        };

        await store.put(newFile);
        newFileIds.push(newFile.id);
      }

      await tx.done;

      return newFileIds;
    } catch (error) {
      throw new StorageError(
        "duplicateFolderContents",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // ============================================================================
  // Folder Operations
  // ============================================================================

  /**
   * Creates a new folder
   *
   * @param name - Folder name
   * @param parentPath - Parent folder path
   * @returns The created folder
   */
  async createFolder(name: string, parentPath: string): Promise<ProjectFolder> {
    await this.ensureDB();

    const folderPath = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;

    // Check if folder already exists
    const existingFolder = await this.db!.getFromIndex("folders", "by-path", folderPath);
    if (existingFolder) {
      throw new FileExistsError(folderPath);
    }

    const folder: ProjectFolder = {
      id: generateId(),
      name,
      path: folderPath,
      parentPath,
      createdAt: Date.now(),
    };

    await this.db!.put("folders", folder);
    return folder;
  }

  /**
   * Gets all folders
   *
   * @returns Array of all folders
   */
  async getAllFolders(): Promise<ProjectFolder[]> {
    await this.ensureDB();
    return this.db!.getAll("folders");
  }

  /**
   * Gets a folder by path
   *
   * @param path - Folder path
   * @returns The folder or undefined
   */
  async getFolderByPath(path: string): Promise<ProjectFolder | undefined> {
    await this.ensureDB();
    return this.db!.getFromIndex("folders", "by-path", path);
  }

  /**
   * Deletes a folder
   *
   * @param path - Folder path to delete
   */
  async deleteFolder(path: string): Promise<void> {
    await this.ensureDB();

    const folder = await this.db!.getFromIndex("folders", "by-path", path);
    if (folder) {
      await this.db!.delete("folders", folder.id);
    }

    // Also delete any child folders
    const allFolders = await this.db!.getAll("folders");
    const childFolders = allFolders.filter(f => f.path.startsWith(path + "/"));
    for (const childFolder of childFolders) {
      await this.db!.delete("folders", childFolder.id);
    }
  }

  /**
   * Renames a folder and updates all child folder paths
   *
   * @param oldPath - Current folder path
   * @param newPath - New folder path
   */
  async renameFolder(oldPath: string, newPath: string): Promise<void> {
    await this.ensureDB();

    const folder = await this.db!.getFromIndex("folders", "by-path", oldPath);
    if (folder) {
      const newName = newPath.split("/").pop() || "";
      const newParentPath = newPath.substring(0, newPath.lastIndexOf("/")) || "/";

      folder.name = newName;
      folder.path = newPath;
      folder.parentPath = newParentPath;
      await this.db!.put("folders", folder);
    }

    // Update child folders
    const allFolders = await this.db!.getAll("folders");
    const childFolders = allFolders.filter(f => f.path.startsWith(oldPath + "/"));
    for (const childFolder of childFolders) {
      childFolder.path = childFolder.path.replace(oldPath, newPath);
      childFolder.parentPath = childFolder.parentPath.replace(oldPath, newPath);
      await this.db!.put("folders", childFolder);
    }
  }

  /**
   * Duplicates a folder (just the folder entry, not contents)
   *
   * @param sourcePath - Source folder path
   * @param targetPath - Target folder path
   */
  async duplicateFolder(sourcePath: string, targetPath: string): Promise<ProjectFolder | undefined> {
    await this.ensureDB();

    const sourceFolder = await this.db!.getFromIndex("folders", "by-path", sourcePath);
    if (!sourceFolder) {
      return undefined;
    }

    const newName = targetPath.split("/").pop() || "";
    const newParentPath = targetPath.substring(0, targetPath.lastIndexOf("/")) || "/";

    const newFolder: ProjectFolder = {
      id: generateId(),
      name: newName,
      path: targetPath,
      parentPath: newParentPath,
      createdAt: Date.now(),
    };

    await this.db!.put("folders", newFolder);
    return newFolder;
  }

  // ============================================================================
  // Move Operations (Feature 007)
  // ============================================================================

  /**
   * Move a file to a new folder location
   *
   * @param fileId - ID of the file to move
   * @param targetFolderPath - Path of the destination folder
   * @returns The updated file with new path
   * @throws FileExistsError if a file with the same name exists at target
   * @throws StorageError if file not found or database operation fails
   */
  async moveFile(fileId: string, targetFolderPath: string): Promise<ProjectFile> {
    await this.ensureDB();

    try {
      // Get existing file
      const file = await this.db!.get("files", fileId);
      if (!file) {
        throw new StorageError("moveFile", `File with ID ${fileId} not found`);
      }

      // Compute new path
      const newPath = targetFolderPath === "/"
        ? `/${file.name}`
        : `${targetFolderPath}/${file.name}`;

      // Check for duplicate at target
      const existingFile = await this.getFileByPath(newPath);
      if (existingFile) {
        throw new FileExistsError(file.name);
      }

      // Update file with new paths
      const updatedFile: ProjectFile = {
        ...file,
        path: newPath,
        parentPath: targetFolderPath,
        lastModified: Date.now(),
      };

      await this.db!.put("files", updatedFile);
      return updatedFile;
    } catch (error) {
      if (error instanceof FileExistsError || error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        "moveFile",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Move a folder and all its contents to a new parent folder
   * Uses a single IndexedDB transaction for atomicity
   *
   * @param sourceFolderPath - Path of the folder to move
   * @param targetFolderPath - Path of the destination parent folder
   * @returns Object with new path and count of affected items
   * @throws FileExistsError if a folder with the same name exists at target
   * @throws StorageError if folder not found or database operation fails
   */
  async moveFolder(
    sourceFolderPath: string,
    targetFolderPath: string
  ): Promise<{ newPath: string; affectedFileCount: number; affectedFolderCount: number }> {
    await this.ensureDB();

    try {
      // Extract folder name from source path
      const folderName = sourceFolderPath.split("/").filter(Boolean).pop() || "";
      const newFolderPath = targetFolderPath === "/"
        ? `/${folderName}`
        : `${targetFolderPath}/${folderName}`;

      // Check if folder with same name exists at target
      const existingFolder = await this.getFolderByPath(newFolderPath);
      if (existingFolder) {
        throw new FileExistsError(folderName);
      }

      // Also check if a file exists with the same name at target
      const existingFile = await this.getFileByPath(newFolderPath);
      if (existingFile) {
        throw new FileExistsError(folderName);
      }

      // Get all files in the folder
      const allFiles = await this.db!.getAll("files");
      const filesToUpdate = allFiles.filter((file) =>
        file.path.startsWith(sourceFolderPath + "/") || file.parentPath === sourceFolderPath
      );

      // Get all folders in the folder (including the source folder itself)
      const allFolders = await this.db!.getAll("folders");
      const foldersToUpdate = allFolders.filter((folder) =>
        folder.path === sourceFolderPath || folder.path.startsWith(sourceFolderPath + "/")
      );

      // Use a single transaction for atomicity
      const tx = this.db!.transaction(["files", "folders"], "readwrite");
      const fileStore = tx.objectStore("files");
      const folderStore = tx.objectStore("folders");

      // Update all files
      for (const file of filesToUpdate) {
        const newFilePath = newFolderPath + file.path.slice(sourceFolderPath.length);
        const newParentPath = newFolderPath + file.parentPath.slice(sourceFolderPath.length);

        const updatedFile: ProjectFile = {
          ...file,
          path: newFilePath,
          parentPath: newParentPath,
          lastModified: Date.now(),
        };

        await fileStore.put(updatedFile);
      }

      // Update all folders
      for (const folder of foldersToUpdate) {
        const newPath = newFolderPath + folder.path.slice(sourceFolderPath.length);
        const newParentPath = folder.path === sourceFolderPath
          ? targetFolderPath
          : newFolderPath + folder.parentPath.slice(sourceFolderPath.length);
        const newName = folder.path === sourceFolderPath
          ? folderName
          : folder.name;

        const updatedFolder: ProjectFolder = {
          ...folder,
          name: newName,
          path: newPath,
          parentPath: newParentPath,
        };

        await folderStore.put(updatedFolder);
      }

      await tx.done;

      return {
        newPath: newFolderPath,
        affectedFileCount: filesToUpdate.length,
        affectedFolderCount: foldersToUpdate.length,
      };
    } catch (error) {
      if (error instanceof FileExistsError) {
        throw error;
      }
      throw new StorageError(
        "moveFolder",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Check if a name exists at a given folder path
   * Checks both files and folders
   *
   * @param name - Name to check for
   * @param parentPath - Folder path to check in
   * @returns true if name exists, false otherwise
   */
  async nameExistsInFolder(name: string, parentPath: string): Promise<boolean> {
    await this.ensureDB();

    // Check files
    const filePath = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;
    const existingFile = await this.getFileByPath(filePath);
    if (existingFile) {
      return true;
    }

    // Check folders
    const existingFolder = await this.getFolderByPath(filePath);
    if (existingFolder) {
      return true;
    }

    return false;
  }

  /**
   * Get all items (files and folders) in a folder
   * Used for duplicate name checking
   *
   * @param folderPath - Folder path to list
   * @returns Array of names in the folder
   */
  async getItemNamesInFolder(folderPath: string): Promise<string[]> {
    await this.ensureDB();

    const names: string[] = [];

    // Get files in folder
    const allFiles = await this.db!.getAll("files");
    const filesInFolder = allFiles.filter((file) => file.parentPath === folderPath);
    for (const file of filesInFolder) {
      names.push(file.name);
    }

    // Get folders in folder
    const allFolders = await this.db!.getAll("folders");
    const foldersInFolder = allFolders.filter((folder) => folder.parentPath === folderPath);
    for (const folder of foldersInFolder) {
      names.push(folder.name);
    }

    return names;
  }

  /**
   * Ensures database is initialized
   *
   * @throws StorageError if database is not initialized
   */
  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new StorageError("ensureDB", "Database not initialized");
    }
  }
}
