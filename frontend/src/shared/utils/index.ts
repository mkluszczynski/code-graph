/**
 * Shared Utility Functions
 *
 * Common helper functions used across the application
 */

/**
 * Generates a unique identifier (UUID v4)
 * @returns A unique identifier string
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Validates a TypeScript file name
 *
 * Rules:
 * - Must end with .ts extension
 * - Must not be empty
 * - Must not contain invalid filesystem characters: / \ : * ? " < > |
 *
 * @param fileName - The file name to validate
 * @returns True if valid, false otherwise
 */
export function validateFileName(fileName: string): boolean {
  if (!fileName || fileName.trim() === "") {
    return false;
  }

  if (!fileName.endsWith(".ts")) {
    return false;
  }

  // Check for invalid filesystem characters
  const invalidChars = /[/\\:*?"<>|]/;
  if (invalidChars.test(fileName)) {
    return false;
  }

  return true;
}

/**
 * Validates a file path
 *
 * Rules:
 * - Must start with /
 * - Must be unique (checked by caller)
 * - Must end with .ts extension
 *
 * @param path - The file path to validate
 * @returns True if valid, false otherwise
 */
export function validateFilePath(path: string): boolean {
  if (!path || !path.startsWith("/")) {
    return false;
  }

  if (!path.endsWith(".ts")) {
    return false;
  }

  return true;
}

/**
 * Validates a TypeScript identifier
 *
 * Rules:
 * - Alphanumeric + underscore only
 * - Cannot start with a digit
 * - Cannot be empty
 *
 * @param identifier - The identifier to validate
 * @returns True if valid, false otherwise
 */
export function validateIdentifier(identifier: string): boolean {
  if (!identifier || identifier.trim() === "") {
    return false;
  }

  // Must be alphanumeric + underscore, cannot start with digit
  const validIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return validIdentifier.test(identifier);
}

/**
 * Extracts the file name from a path
 *
 * @param path - The file path
 * @returns The file name
 */
export function getFileNameFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

/**
 * Extracts the directory path from a file path
 *
 * @param path - The file path
 * @returns The directory path
 */
export function getDirectoryFromPath(path: string): string {
  const parts = path.split("/");
  parts.pop(); // Remove file name
  return parts.join("/") || "/";
}

/**
 * Normalizes a file path (removes duplicate slashes, etc.)
 *
 * @param path - The file path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
  // Remove duplicate slashes
  let normalized = path.replace(/\/+/g, "/");

  // Ensure it starts with /
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }

  return normalized;
}

/**
 * Debounces a function call
 *
 * @param func - The function to debounce
 * @param wait - The debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Formats a timestamp to a human-readable string
 *
 * @param timestamp - Milliseconds since epoch
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Deep clones an object
 *
 * @param obj - The object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
