/**
 * Language Detection Utilities
 * 
 * Functions for detecting programming language from file extensions
 * and checking if a language is supported for diagram visualization.
 */

import type { SupportedLanguage } from '../shared/types';

/**
 * Map of file extensions to supported languages.
 * Extensions are lowercase without the leading dot.
 */
const EXTENSION_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'dart': 'dart',
};

/**
 * Detects the programming language from a filename.
 *
 * @param fileName - Name of the file including extension
 * @returns SupportedLanguage enum value ('typescript', 'dart', or 'unsupported')
 * 
 * @example
 * detectLanguage('Person.ts')     // 'typescript'
 * detectLanguage('Person.dart')   // 'dart'
 * detectLanguage('script.py')     // 'unsupported'
 */
export function detectLanguage(fileName: string): SupportedLanguage {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (!ext) {
        return 'unsupported';
    }

    return EXTENSION_LANGUAGE_MAP[ext] ?? 'unsupported';
}

/**
 * Checks if a file's language is supported for diagram visualization.
 *
 * @param fileName - Name of the file including extension
 * @returns true if language is supported, false otherwise
 * 
 * @example
 * isSupportedLanguage('Person.ts')   // true
 * isSupportedLanguage('Person.dart') // true
 * isSupportedLanguage('script.py')   // false
 */
export function isSupportedLanguage(fileName: string): boolean {
    return detectLanguage(fileName) !== 'unsupported';
}

/**
 * Gets all supported file extensions.
 * 
 * @returns Array of supported extensions without leading dot
 */
export function getSupportedExtensions(): string[] {
    return Object.keys(EXTENSION_LANGUAGE_MAP);
}
