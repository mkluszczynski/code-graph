/**
 * Custom Error Classes
 *
 * Application-specific error types for better error handling
 */

/**
 * Error thrown when attempting to create a file that already exists
 */
export class FileExistsError extends Error {
  constructor(fileName: string) {
    super(`File already exists: ${fileName}`);
    this.name = "FileExistsError";
  }
}

/**
 * Error thrown when file name is invalid
 */
export class InvalidFileNameError extends Error {
  constructor(fileName: string, reason?: string) {
    const message = reason
      ? `Invalid file name "${fileName}": ${reason}`
      : `Invalid file name: ${fileName}`;
    super(message);
    this.name = "InvalidFileNameError";
  }
}

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends Error {
  constructor(operation: string, reason?: string) {
    const message = reason
      ? `Storage operation failed (${operation}): ${reason}`
      : `Storage operation failed: ${operation}`;
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Error thrown when TypeScript parsing fails
 */
export class ParseError extends Error {
  public readonly line: number;
  public readonly column: number;
  public readonly severity: "error" | "warning";

  constructor(
    message: string,
    line: number,
    column: number,
    severity: "error" | "warning" = "error"
  ) {
    super(message);
    this.name = "ParseError";
    this.line = line;
    this.column = column;
    this.severity = severity;
  }

  /**
   * Returns a formatted error message with location
   */
  toFormattedString(): string {
    return `[${this.severity.toUpperCase()}] Line ${this.line}, Column ${this.column
      }: ${this.message}`;
  }
}

/**
 * Error thrown when a file is not found
 */
export class FileNotFoundError extends Error {
  constructor(fileId: string) {
    super(`File not found: ${fileId}`);
    this.name = "FileNotFoundError";
  }
}

/**
 * Error thrown when a relationship is invalid
 */
export class InvalidRelationshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRelationshipError";
  }
}

/**
 * Error thrown when diagram generation fails
 */
export class DiagramGenerationError extends Error {
  constructor(reason: string) {
    super(`Diagram generation failed: ${reason}`);
    this.name = "DiagramGenerationError";
  }
}

/**
 * Error thrown when storage quota is exceeded
 */
export class QuotaExceededError extends Error {
  constructor(message: string = "Storage quota exceeded. Try deleting unused files.") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

/**
 * Error thrown when storage is unavailable
 */
export class StorageUnavailableError extends Error {
  constructor(message: string = "Browser storage is unavailable. Changes will not persist after refresh.") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}
