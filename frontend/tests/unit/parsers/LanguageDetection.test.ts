/**
 * Contract Tests: Language Detection Utilities
 *
 * Tests for detectLanguage() and isSupportedLanguage() functions.
 * From contracts: LD-001 to LD-008, SL-001 to SL-004
 */

import { describe, it, expect } from 'vitest';
import { detectLanguage, isSupportedLanguage, getSupportedExtensions } from '../../../src/parsers/utils';

describe('detectLanguage', () => {
    describe('TypeScript detection', () => {
        it('LD-001: should detect .ts files as typescript', () => {
            expect(detectLanguage('Person.ts')).toBe('typescript');
        });

        it('LD-002: should detect .tsx files as typescript', () => {
            expect(detectLanguage('Component.tsx')).toBe('typescript');
        });

        it('LD-007: should handle uppercase .TS extension (case insensitive)', () => {
            expect(detectLanguage('Person.TS')).toBe('typescript');
        });

        it('should handle mixed case .Tsx extension', () => {
            expect(detectLanguage('Component.TsX')).toBe('typescript');
        });
    });

    describe('Dart detection', () => {
        it('LD-003: should detect .dart files as dart', () => {
            expect(detectLanguage('Person.dart')).toBe('dart');
        });

        it('LD-008: should handle uppercase .DART extension (case insensitive)', () => {
            expect(detectLanguage('Person.DART')).toBe('dart');
        });
    });

    describe('Unsupported languages', () => {
        it('LD-004: should return unsupported for .py files', () => {
            expect(detectLanguage('script.py')).toBe('unsupported');
        });

        it('LD-005: should return unsupported for .js files', () => {
            expect(detectLanguage('script.js')).toBe('unsupported');
        });

        it('LD-006: should return unsupported for files without extension', () => {
            expect(detectLanguage('Makefile')).toBe('unsupported');
        });

        it('should return unsupported for .json files', () => {
            expect(detectLanguage('config.json')).toBe('unsupported');
        });

        it('should return unsupported for .md files', () => {
            expect(detectLanguage('README.md')).toBe('unsupported');
        });

        it('should return unsupported for .css files', () => {
            expect(detectLanguage('styles.css')).toBe('unsupported');
        });
    });

    describe('Edge cases', () => {
        it('should handle files with multiple dots', () => {
            expect(detectLanguage('file.test.ts')).toBe('typescript');
            expect(detectLanguage('lib.module.dart')).toBe('dart');
        });

        it('should handle empty string', () => {
            expect(detectLanguage('')).toBe('unsupported');
        });

        it('should handle file starting with dot', () => {
            expect(detectLanguage('.gitignore')).toBe('unsupported');
        });

        it('should handle path with directories', () => {
            expect(detectLanguage('src/models/Person.ts')).toBe('typescript');
            expect(detectLanguage('lib/models/person.dart')).toBe('dart');
        });
    });
});

describe('isSupportedLanguage', () => {
    describe('Supported languages', () => {
        it('SL-001: should return true for .ts files', () => {
            expect(isSupportedLanguage('Person.ts')).toBe(true);
        });

        it('SL-002: should return true for .dart files', () => {
            expect(isSupportedLanguage('Person.dart')).toBe(true);
        });

        it('should return true for .tsx files', () => {
            expect(isSupportedLanguage('Component.tsx')).toBe(true);
        });
    });

    describe('Unsupported languages', () => {
        it('SL-003: should return false for .py files', () => {
            expect(isSupportedLanguage('script.py')).toBe(false);
        });

        it('SL-004: should return false for files without extension', () => {
            expect(isSupportedLanguage('Makefile')).toBe(false);
        });

        it('should return false for .js files', () => {
            expect(isSupportedLanguage('script.js')).toBe(false);
        });

        it('should return false for .json files', () => {
            expect(isSupportedLanguage('package.json')).toBe(false);
        });
    });
});

describe('getSupportedExtensions', () => {
    it('should return array of supported extensions', () => {
        const extensions = getSupportedExtensions();
        expect(extensions).toContain('ts');
        expect(extensions).toContain('tsx');
        expect(extensions).toContain('dart');
    });

    it('should not include unsupported extensions', () => {
        const extensions = getSupportedExtensions();
        expect(extensions).not.toContain('py');
        expect(extensions).not.toContain('js');
        expect(extensions).not.toContain('json');
    });
});
