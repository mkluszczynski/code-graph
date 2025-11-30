/**
 * ParserRegistry - Central registry for language parsers
 * 
 * Manages parser instances and routes files to the correct parser
 * based on file extension. Handles async parser initialization.
 */

import type { ParseResult, SupportedLanguage } from '../shared/types';
import type { LanguageParser } from './LanguageParser';

/**
 * Registry for language parsers.
 * 
 * Provides centralized access to all registered parsers and handles
 * routing files to the appropriate parser based on extension.
 */
export class ParserRegistry {
    /** Map of language to parser instance */
    private parsers: Map<SupportedLanguage, LanguageParser> = new Map();

    /** Map of extension to parser instance for fast lookup */
    private extensionMap: Map<string, LanguageParser> = new Map();

    /** Track which parsers have been initialized */
    private initializedParsers: Set<SupportedLanguage> = new Set();

    /**
     * Registers a parser instance.
     * 
     * @param parser - Parser instance to register
     */
    register(parser: LanguageParser): void {
        this.parsers.set(parser.language, parser);

        // Map all extensions to this parser
        for (const ext of parser.extensions) {
            this.extensionMap.set(ext.toLowerCase(), parser);
        }
    }

    /**
     * Gets the parser for a specific language.
     * 
     * @param language - Language identifier
     * @returns Parser instance or undefined if not registered
     */
    getParser(language: SupportedLanguage): LanguageParser | undefined {
        return this.parsers.get(language);
    }

    /**
     * Gets the parser that can handle a file based on its extension.
     * 
     * @param fileName - Name of the file including extension
     * @returns Parser instance or undefined if no parser handles this extension
     */
    getParserForFile(fileName: string): LanguageParser | undefined {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ext ? this.extensionMap.get(ext) : undefined;
    }

    /**
     * Parses a file using the appropriate parser.
     * Handles async initialization for parsers that require it.
     * 
     * @param sourceCode - Source code to parse
     * @param fileName - File name for parser selection and error reporting
     * @param fileId - Optional file identifier
     * @returns ParseResult or null if no parser handles this file type
     */
    async parse(
        sourceCode: string,
        fileName: string,
        fileId?: string
    ): Promise<ParseResult | null> {
        const parser = this.getParserForFile(fileName);
        if (!parser) {
            return null;
        }

        // Initialize parser if needed and not already initialized
        if (parser.requiresInitialization && !this.initializedParsers.has(parser.language)) {
            await parser.initialize();
            this.initializedParsers.add(parser.language);
        }

        return parser.parse(sourceCode, fileName, fileId);
    }

    /**
     * Checks if any registered parser can handle a file.
     * 
     * @param fileName - Name of the file including extension
     * @returns true if a parser exists for this file type
     */
    canParse(fileName: string): boolean {
        return this.getParserForFile(fileName) !== undefined;
    }

    /**
     * Gets all registered parsers.
     */
    getAllParsers(): LanguageParser[] {
        return Array.from(this.parsers.values());
    }

    /**
     * Gets all supported file extensions.
     */
    getSupportedExtensions(): string[] {
        return Array.from(this.extensionMap.keys());
    }

    /**
     * Clears initialization state for a parser (useful for testing).
     * 
     * @param language - Language to clear initialization for
     */
    clearInitialization(language: SupportedLanguage): void {
        this.initializedParsers.delete(language);
    }
}
