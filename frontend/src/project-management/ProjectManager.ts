/**
 * Project Manager
 *
 * Manages TypeScript project files (create, read, update, delete, persist)
 * Based on: specs/001-uml-graph-visualizer/contracts/project-manager.contract.md
 */

import type { IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { ProjectFile } from "../shared/types";
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
      "by-name": string;
      "by-modified": number;
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
  private readonly dbVersion = 1;

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
        upgrade(db) {
          if (!db.objectStoreNames.contains("files")) {
            const fileStore = db.createObjectStore("files", { keyPath: "id" });
            fileStore.createIndex("by-path", "path", { unique: true });
            fileStore.createIndex("by-name", "name", { unique: false });
            fileStore.createIndex("by-modified", "lastModified", {
              unique: false,
            });
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
