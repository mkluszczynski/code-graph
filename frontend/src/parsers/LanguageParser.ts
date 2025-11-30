/**
 * LanguageParser - Abstract base class for language-specific parsers
 * 
 * Implement this class to add support for a new programming language.
 * Each parser is responsible for:
 * 1. Parsing source code into an AST
 * 2. Extracting classes, interfaces, and their members
 * 3. Identifying relationships between entities
 * 4. Handling syntax errors gracefully
 * 
 * @example
 * class DartParser extends LanguageParser {
 *   readonly language = 'dart';
 *   readonly extensions = ['dart'];
 *   readonly displayName = 'Dart';
 *   
 *   parse(sourceCode: string, fileName: string, fileId?: string): ParseResult {
 *     // Dart-specific parsing logic
 *   }
 * }
 */

import type { ParseResult, SupportedLanguage } from '../shared/types';

/**
 * Abstract base class for language-specific parsers.
 * 
 * All language parsers must extend this class and implement the abstract methods.
 * The canParse() method is provided with a default implementation that checks
 * file extensions.
 */
export abstract class LanguageParser {
    /**
     * Unique language identifier.
     * Used for parser lookup and routing.
     */
    abstract readonly language: SupportedLanguage;

    /**
     * File extensions this parser handles (without dot, lowercase).
     * @example ['ts', 'tsx'] for TypeScript, ['dart'] for Dart
     */
    abstract readonly extensions: readonly string[];

    /**
     * Human-readable language name for UI display.
     * @example 'TypeScript', 'Dart'
     */
    abstract readonly displayName: string;

    /**
     * Parses source code and extracts UML entities.
     * 
     * @param sourceCode - The source code to parse
     * @param fileName - Name of the file (for error reporting and ID generation)
     * @param fileId - Optional unique file identifier (for entity references)
     * @returns ParseResult containing classes, interfaces, relationships, and errors
     */
    abstract parse(sourceCode: string, fileName: string, fileId?: string): ParseResult;

    /**
     * Checks if this parser can handle a file based on its extension.
     * 
     * @param fileName - Name of the file including extension
     * @returns true if this parser handles the file's language
     */
    canParse(fileName: string): boolean {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ext !== undefined && this.extensions.includes(ext);
    }

    /**
     * Optional: Initialize parser resources (e.g., load WASM modules).
     * Called before first parse. Default implementation does nothing.
     * 
     * @returns Promise that resolves when initialization is complete
     */
    async initialize(): Promise<void> {
        // Default: no initialization needed
    }

    /**
     * Whether the parser requires async initialization.
     * Override to return true if initialize() must be called before parse().
     */
    get requiresInitialization(): boolean {
        return false;
    }
}
