/**
 * Parsers Module - Unified entry point for language parsers
 * 
 * This module provides a centralized interface for parsing source code
 * across multiple programming languages. Each language parser implements
 * the LanguageParser abstract class and is registered with the ParserRegistry.
 * 
 * Usage:
 * ```typescript
 * import { parserRegistry } from '../parsers';
 * 
 * // Check if a file can be parsed
 * if (parserRegistry.canParse('Person.ts')) {
 *   const result = await parserRegistry.parse(sourceCode, 'Person.ts');
 * }
 * ```
 */

// Abstract base class for all parsers
export { LanguageParser } from './LanguageParser';

// Parser registry for centralized parser management
export { ParserRegistry } from './ParserRegistry';

// Language detection utilities
export { detectLanguage, isSupportedLanguage } from './utils';

// TypeScript parser
export { TypeScriptParser } from './typescript/TypeScriptParser';
export { parse as parseTypeScript } from './typescript/TypeScriptParser';

// Dart parser
export { DartParser } from './dart/DartParser';
export { parse as parseDart } from './dart/DartParser';

// Create and configure the global parser registry instance
import { ParserRegistry } from './ParserRegistry';
import { TypeScriptParser } from './typescript/TypeScriptParser';
import { DartParser } from './dart/DartParser';

/**
 * Global parser registry instance.
 * Pre-configured with all supported language parsers.
 */
export const parserRegistry = new ParserRegistry();

// Register TypeScript parser
parserRegistry.register(new TypeScriptParser());

// Register Dart parser
parserRegistry.register(new DartParser());
