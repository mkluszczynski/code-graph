/**
 * File Operations Module
 *
 * Core utilities for file management operations (rename, duplicate, delete).
 * This module provides validation and naming utilities used by all file operations.
 */

import type { FileValidationResult, DuplicateNameOptions, CreateItemType } from "./types";

/**
 * Validates a file or folder name according to file system rules
 *
 * Rules:
 * - Cannot be empty
 * - Cannot contain invalid characters: / \ : * ? " < > |
 * - Cannot be just whitespace
 * - Cannot be reserved names (., ..)
 * - Should have reasonable length (1-255 characters)
 *
 * @param name - The name to validate
 * @param type - Type of item ("file" or "folder")
 * @returns Validation result with error message if invalid
 */
export function validateItemName(
  name: string,
  type: CreateItemType
): FileValidationResult {
  const itemLabel = type === "file" ? "File" : "Folder";

  // Check for empty or whitespace-only names
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: `${itemLabel} name cannot be empty`,
    };
  }

  // Check for reserved names
  if (name === "." || name === "..") {
    return {
      isValid: false,
      error: `${itemLabel} name cannot be '.' or '..'`,
    };
  }

  // Check for invalid characters (filesystem unsafe)
  const invalidChars = /[/\\:*?"<>|]/;
  if (invalidChars.test(name)) {
    return {
      isValid: false,
      error: `${itemLabel} name cannot contain: / \\ : * ? " < > |`,
    };
  }

  // Check length (most filesystems support up to 255 characters)
  if (name.length > 255) {
    return {
      isValid: false,
      error: `${itemLabel} name is too long (max 255 characters)`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates a filename according to file system rules
 *
 * Rules:
 * - Cannot be empty
 * - Cannot contain invalid characters: / \ : * ? " < > |
 * - Cannot be just whitespace
 * - Cannot be reserved names (., ..)
 * - Should have reasonable length (1-255 characters)
 *
 * @param fileName - The filename to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileName(fileName: string): FileValidationResult {
  return validateItemName(fileName, "file");
}

/**
 * Generates a unique duplicate filename by appending " copy" or " copy N"
 *
 * Examples:
 * - "file.ts" → "file copy.ts"
 * - "file copy.ts" → "file copy 2.ts"
 * - "file copy 2.ts" → "file copy 3.ts"
 *
 * @param originalName - The original filename to duplicate
 * @param options - Configuration with existing names and max attempts
 * @returns A unique filename that doesn't conflict with existing names
 * @throws Error if unable to generate unique name within maxAttempts
 */
export function generateDuplicateName(
  originalName: string,
  options: DuplicateNameOptions
): string {
  const { existingNames, maxAttempts = 1000 } = options;

  // Parse file name and extension
  const lastDotIndex = originalName.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < originalName.length - 1;

  const baseName = hasExtension
    ? originalName.substring(0, lastDotIndex)
    : originalName;
  const extension = hasExtension ? originalName.substring(lastDotIndex) : "";

  // Try "name copy.ext" first
  let candidateName = `${baseName} copy${extension}`;
  if (!existingNames.includes(candidateName)) {
    return candidateName;
  }

  // Try "name copy 2.ext", "name copy 3.ext", etc.
  for (let i = 2; i <= maxAttempts; i++) {
    candidateName = `${baseName} copy ${i}${extension}`;
    if (!existingNames.includes(candidateName)) {
      return candidateName;
    }
  }

  // If we exhausted all attempts, throw error
  throw new Error(
    `Unable to generate unique duplicate name for "${originalName}" after ${maxAttempts} attempts`
  );
}

/**
 * Normalizes a file name by adding .ts extension if missing
 *
 * @param name - The file name to normalize
 * @returns File name with .ts extension if it was missing
 */
export function normalizeFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed.includes(".")) {
    return `${trimmed}.ts`;
  }
  return trimmed;
}
