/**
 * IndexedDB Database Schema and Initialization
 *
 * Provides client-side storage for project files using IndexedDB via idb library
 */

import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { ProjectFile } from "../types";

/**
 * Database schema definition
 */
interface UMLGraphDB extends DBSchema {
  files: {
    key: string; // file.id
    value: ProjectFile;
    indexes: {
      "by-path": string; // file.path
      "by-name": string; // file.name
      "by-modified": number; // file.lastModified
    };
  };
}

/**
 * Database name and version
 */
const DB_NAME = "uml-graph-visualizer";
const DB_VERSION = 1;

/**
 * Singleton database instance
 */
let dbInstance: IDBPDatabase<UMLGraphDB> | null = null;

/**
 * Initializes and returns the IndexedDB database instance
 *
 * @returns Promise resolving to the database instance
 */
export async function initDB(): Promise<IDBPDatabase<UMLGraphDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<UMLGraphDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create files object store if it doesn't exist
      if (!db.objectStoreNames.contains("files")) {
        const fileStore = db.createObjectStore("files", { keyPath: "id" });

        // Create indexes for efficient querying
        fileStore.createIndex("by-path", "path", { unique: true });
        fileStore.createIndex("by-name", "name", { unique: false });
        fileStore.createIndex("by-modified", "lastModified", { unique: false });
      }
    },
  });

  return dbInstance;
}

/**
 * Gets the database instance (initializes if not already initialized)
 *
 * @returns Promise resolving to the database instance
 */
export async function getDB(): Promise<IDBPDatabase<UMLGraphDB>> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

/**
 * Saves a file to the database
 *
 * @param file - The file to save
 * @returns Promise resolving when save is complete
 */
export async function saveFile(file: ProjectFile): Promise<void> {
  const db = await getDB();
  await db.put("files", file);
}

/**
 * Gets a file by ID
 *
 * @param fileId - The file ID
 * @returns Promise resolving to the file, or undefined if not found
 */
export async function getFile(
  fileId: string
): Promise<ProjectFile | undefined> {
  const db = await getDB();
  return db.get("files", fileId);
}

/**
 * Gets a file by path
 *
 * @param path - The file path
 * @returns Promise resolving to the file, or undefined if not found
 */
export async function getFileByPath(
  path: string
): Promise<ProjectFile | undefined> {
  const db = await getDB();
  return db.getFromIndex("files", "by-path", path);
}

/**
 * Gets all files in the database
 *
 * @returns Promise resolving to array of all files
 */
export async function getAllFiles(): Promise<ProjectFile[]> {
  const db = await getDB();
  return db.getAll("files");
}

/**
 * Gets all files sorted by last modified timestamp (newest first)
 *
 * @returns Promise resolving to array of files sorted by modification time
 */
export async function getFilesByModified(): Promise<ProjectFile[]> {
  const db = await getDB();
  const files = await db.getAllFromIndex("files", "by-modified");
  return files.reverse(); // IndexedDB returns in ascending order, we want descending
}

/**
 * Deletes a file by ID
 *
 * @param fileId - The file ID to delete
 * @returns Promise resolving when delete is complete
 */
export async function deleteFile(fileId: string): Promise<void> {
  const db = await getDB();
  await db.delete("files", fileId);
}

/**
 * Updates a file's content
 *
 * @param fileId - The file ID
 * @param content - The new content
 * @returns Promise resolving when update is complete
 */
export async function updateFileContent(
  fileId: string,
  content: string
): Promise<void> {
  const db = await getDB();
  const file = await db.get("files", fileId);

  if (!file) {
    throw new Error(`File not found: ${fileId}`);
  }

  file.content = content;
  file.lastModified = Date.now();

  await db.put("files", file);
}

/**
 * Checks if a file exists by path
 *
 * @param path - The file path
 * @returns Promise resolving to true if file exists, false otherwise
 */
export async function fileExists(path: string): Promise<boolean> {
  const file = await getFileByPath(path);
  return file !== undefined;
}

/**
 * Clears all files from the database (use with caution!)
 *
 * @returns Promise resolving when all files are deleted
 */
export async function clearAllFiles(): Promise<void> {
  const db = await getDB();
  await db.clear("files");
}

/**
 * Gets the total count of files in the database
 *
 * @returns Promise resolving to the number of files
 */
export async function getFileCount(): Promise<number> {
  const db = await getDB();
  return db.count("files");
}

/**
 * Closes the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
