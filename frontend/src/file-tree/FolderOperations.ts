/**
 * Folder Operations Module
 *
 * Core utilities for folder management operations.
 * This module provides path utilities and validation for folder operations.
 */

import type { ProjectFile } from "../shared/types";
import type { FolderOperationResult } from "./types";

// Re-export types for convenience
export type { FolderOperationResult };

/**
 * Maximum allowed folder nesting depth
 */
export const MAX_FOLDER_DEPTH = 10;

/**
 * Get all files whose path starts with the given folder path
 *
 * @param files - All project files
 * @param folderPath - Folder path prefix to match
 * @returns Files within the folder (recursive)
 */
export function getFilesInFolder(
  files: ProjectFile[],
  folderPath: string
): ProjectFile[] {
  // Normalize folder path to ensure consistent matching
  const normalizedPath = folderPath.endsWith("/")
    ? folderPath
    : `${folderPath}/`;

  return files.filter((file) => file.path.startsWith(normalizedPath));
}

/**
 * Check if a folder path is valid (not too deeply nested)
 *
 * @param path - Full folder path
 * @param maxDepth - Maximum nesting depth (default: 10)
 * @returns Validation result with error message if invalid
 */
export function validateFolderDepth(
  path: string,
  maxDepth: number = MAX_FOLDER_DEPTH
): { isValid: boolean; error?: string } {
  // Count the depth by splitting on "/" and filtering empty parts
  const parts = path.split("/").filter((part) => part.length > 0);
  const depth = parts.length;

  if (depth > maxDepth) {
    return {
      isValid: false,
      error: `Maximum folder nesting depth (${maxDepth}) exceeded`,
    };
  }

  return { isValid: true };
}

/**
 * Compute the parent path from a full path
 *
 * @param path - Full path (file or folder)
 * @returns Parent folder path, or "/" for root-level items
 */
export function getParentPath(path: string): string {
  // Remove trailing slash if present
  const cleanPath = path.endsWith("/") ? path.slice(0, -1) : path;

  // Find the last slash
  const lastSlashIndex = cleanPath.lastIndexOf("/");

  // If no slash or only leading slash, parent is root
  if (lastSlashIndex <= 0) {
    return "/";
  }

  return cleanPath.substring(0, lastSlashIndex);
}

/**
 * Build new path after folder rename
 *
 * @param filePath - Original file path
 * @param oldFolderPath - Original folder path
 * @param newFolderPath - New folder path
 * @returns Updated file path
 */
export function updatePathForRename(
  filePath: string,
  oldFolderPath: string,
  newFolderPath: string
): string {
  // Ensure we're replacing the folder prefix correctly
  if (!filePath.startsWith(oldFolderPath)) {
    return filePath;
  }

  return newFolderPath + filePath.substring(oldFolderPath.length);
}

/**
 * Generate a unique folder name for duplication
 *
 * Follows the same pattern as file duplication:
 * - "folder" → "folder copy"
 * - "folder copy" → "folder copy 2"
 * - "folder copy 2" → "folder copy 3"
 *
 * @param baseName - Original folder name
 * @param existingNames - Existing folder names at same level
 * @returns Unique name like "folder copy" or "folder copy 2"
 */
export function generateDuplicateFolderName(
  baseName: string,
  existingNames: string[]
): string {
  // Try "name copy" first
  let candidateName = `${baseName} copy`;
  if (!existingNames.includes(candidateName)) {
    return candidateName;
  }

  // Try "name copy 2", "name copy 3", etc.
  const maxAttempts = 1000;
  for (let i = 2; i <= maxAttempts; i++) {
    candidateName = `${baseName} copy ${i}`;
    if (!existingNames.includes(candidateName)) {
      return candidateName;
    }
  }

  // Fallback (should never happen in practice)
  throw new Error(
    `Unable to generate unique duplicate name for "${baseName}" after ${maxAttempts} attempts`
  );
}
