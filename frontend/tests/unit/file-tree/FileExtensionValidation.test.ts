/**
 * Contract tests for file extension validation
 * Tests VE-001 to VE-007 from contracts/parser-contracts.md
 *
 * TDD: These tests are written FIRST and should FAIL until implementation
 */
import { describe, it, expect } from 'vitest';
import { validateFileExtension } from '../../../src/file-tree/FileOperations';

describe('validateFileExtension', () => {
    describe('Valid Extensions (VE-001, VE-002, VE-003)', () => {
        it('VE-001: accepts .ts extension', () => {
            const result = validateFileExtension('Person.ts');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('VE-002: accepts .dart extension', () => {
            const result = validateFileExtension('Person.dart');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('VE-003: accepts files with multiple dots', () => {
            const result = validateFileExtension('file.test.ts');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('accepts .tsx extension', () => {
            const result = validateFileExtension('Component.tsx');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('accepts .py extension (any extension is valid format-wise)', () => {
            const result = validateFileExtension('script.py');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('accepts .js extension', () => {
            const result = validateFileExtension('index.js');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });

    describe('Invalid: No Extension (VE-004)', () => {
        it('VE-004: rejects filename without extension', () => {
            const result = validateFileExtension('Person');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('extension');
        });

        it('rejects filename with no dot', () => {
            const result = validateFileExtension('MyClass');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Invalid: Extension Only (VE-005)', () => {
        it('VE-005: rejects extension-only filename', () => {
            const result = validateFileExtension('.ts');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('rejects hidden file with no name', () => {
            const result = validateFileExtension('.dart');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Invalid: Empty Extension (VE-006)', () => {
        it('VE-006: rejects trailing dot with no extension', () => {
            const result = validateFileExtension('file.');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('extension');
        });

        it('rejects multiple trailing dots', () => {
            const result = validateFileExtension('file..');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Whitespace Handling (VE-007)', () => {
        it('VE-007: trims whitespace and accepts valid filename', () => {
            const result = validateFileExtension('  file.ts  ');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('trims leading whitespace', () => {
            const result = validateFileExtension('   Person.dart');
            expect(result.isValid).toBe(true);
        });

        it('trims trailing whitespace', () => {
            const result = validateFileExtension('script.py   ');
            expect(result.isValid).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('rejects empty string', () => {
            const result = validateFileExtension('');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('rejects whitespace-only string', () => {
            const result = validateFileExtension('   ');
            expect(result.isValid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('accepts single-character extension', () => {
            const result = validateFileExtension('file.c');
            expect(result.isValid).toBe(true);
        });

        it('accepts long extensions', () => {
            const result = validateFileExtension('file.typescript');
            expect(result.isValid).toBe(true);
        });

        it('accepts extensions with numbers', () => {
            const result = validateFileExtension('data.mp3');
            expect(result.isValid).toBe(true);
        });
    });
});
