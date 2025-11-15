/**
 * File Operations Module
 *
 * Core utilities for file management operations (rename, duplicate, delete).
 * This module provides validation and naming utilities used by all file operations.
 */

import type { FileValidationResult, DuplicateNameOptions } from "./types";

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
    // Check for empty or whitespace-only names
    if (!fileName || fileName.trim().length === 0) {
        return {
            isValid: false,
            error: "Filename cannot be empty",
        };
    }

    // Check for reserved names
    if (fileName === "." || fileName === "..") {
        return {
            isValid: false,
            error: "Filename cannot be '.' or '..'",
        };
    }

    // Check for invalid characters (filesystem unsafe)
    const invalidChars = /[/\\:*?"<>|]/;
    if (invalidChars.test(fileName)) {
        return {
            isValid: false,
            error: 'Filename cannot contain: / \\ : * ? " < > |',
        };
    }

    // Check length (most filesystems support up to 255 characters)
    if (fileName.length > 255) {
        return {
            isValid: false,
            error: "Filename is too long (max 255 characters)",
        };
    }

    return {
        isValid: true,
    };
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
