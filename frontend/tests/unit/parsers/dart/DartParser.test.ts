/**
 * Contract Tests: DartParser.parse()
 * 
 * Tests the main DartParser class that parses Dart source code
 * and extracts class/interface definitions for UML diagram visualization.
 * 
 * Contract IDs: DP-001 to DP-010
 * 
 * NOTE: WASM-based parsing tests are skipped in Node/Vitest environment.
 * Full parsing tests are covered in E2E tests where WASM works in browser.
 * This file tests metadata and canParse() which don't require WASM.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DartParser } from '../../../../src/parsers/dart/DartParser';
import type { ParseResult } from '../../../../src/shared/types';

// Check if we're in a WASM-capable environment
const isWasmEnvironment = typeof WebAssembly !== 'undefined' && typeof window !== 'undefined';

describe('DartParser Contract Tests', () => {
    let parser: DartParser;
    let initializationError: Error | null = null;

    beforeAll(async () => {
        parser = new DartParser();
        // Try to initialize, but don't fail if WASM isn't available in Node
        if (parser.requiresInitialization) {
            try {
                await parser.initialize();
            } catch (error) {
                initializationError = error as Error;
                console.warn('DartParser WASM initialization failed (expected in Node environment):',
                    (error as Error).message);
            }
        }
    });

    // WASM-dependent tests are skipped in Node
    const wasmIt = isWasmEnvironment ? it : it.skip;

    describe('DP-001: Empty string input', () => {
        wasmIt('should return empty result with success: true for empty string', () => {
            const result: ParseResult = parser.parse('', 'empty.dart', 'file-001');

            expect(result.classes).toEqual([]);
            expect(result.interfaces).toEqual([]);
            expect(result.relationships).toEqual([]);
            expect(result.errors).toEqual([]);
            expect(result.success).toBe(true);
        });

        it('should return error when parser not initialized (Node test)', () => {
            if (initializationError) {
                const result: ParseResult = parser.parse('', 'empty.dart', 'file-001');
                expect(result.success).toBe(false);
                expect(result.errors[0].message).toContain('not initialized');
            }
        });
    });

    describe('DP-002: Simple class with no members', () => {
        wasmIt('should parse a simple class with empty properties/methods', () => {
            const code = 'class Person {}';
            const result = parser.parse(code, 'Person.dart', 'file-002');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Person');
            expect(result.classes[0].properties).toEqual([]);
            expect(result.classes[0].methods).toEqual([]);
        });
    });

    describe('DP-003: Class with property', () => {
        wasmIt('should parse a class with one property', () => {
            const code = 'class Person { String name; }';
            const result = parser.parse(code, 'Person.dart', 'file-003');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('name');
            expect(result.classes[0].properties[0].type).toBe('String');
        });
    });

    describe('DP-004: Class with method', () => {
        wasmIt('should parse a class with one method', () => {
            const code = 'class Person { void greet() {} }';
            const result = parser.parse(code, 'Person.dart', 'file-004');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].name).toBe('greet');
            expect(result.classes[0].methods[0].returnType).toBe('void');
        });
    });

    describe('DP-005: Abstract class becomes interface', () => {
        wasmIt('should parse abstract class as interface', () => {
            const code = 'abstract class IService {}';
            const result = parser.parse(code, 'IService.dart', 'file-005');

            expect(result.success).toBe(true);
            // Abstract classes in Dart are treated as interfaces
            expect(result.interfaces).toHaveLength(1);
            expect(result.interfaces[0].name).toBe('IService');
            expect(result.classes).toHaveLength(0);
        });
    });

    describe('DP-006: Class with extends clause', () => {
        wasmIt('should parse class with extendsClass property', () => {
            const code = 'class Child extends Parent {}';
            const result = parser.parse(code, 'Child.dart', 'file-006');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Child');
            expect(result.classes[0].extendsClass).toBe('Parent');
        });
    });

    describe('DP-007: Class with implements clause', () => {
        wasmIt('should parse class with implementsInterfaces array', () => {
            const code = 'class Impl implements IService {}';
            const result = parser.parse(code, 'Impl.dart', 'file-007');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Impl');
            expect(result.classes[0].implementsInterfaces).toContain('IService');
        });
    });

    describe('DP-008: Class with mixins', () => {
        wasmIt('should parse class with mixins as implementsInterfaces', () => {
            const code = 'class Mixed with Mixin1, Mixin2 {}';
            const result = parser.parse(code, 'Mixed.dart', 'file-008');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Mixed');
            expect(result.classes[0].implementsInterfaces).toContain('Mixin1');
            expect(result.classes[0].implementsInterfaces).toContain('Mixin2');
        });
    });

    describe('DP-009: Syntax error handling', () => {
        wasmIt('should return success: false with errors for invalid syntax', () => {
            const code = 'class Person { void greet( }'; // Missing closing paren
            const result = parser.parse(code, 'Invalid.dart', 'file-009');

            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('DP-010: Multiple classes', () => {
        wasmIt('should parse multiple classes in one file', () => {
            const code = `
class Person {}
class Employee {}
class Manager {}
            `;
            const result = parser.parse(code, 'Multiple.dart', 'file-010');

            expect(result.success).toBe(true);
            expect(result.classes.length).toBeGreaterThanOrEqual(3);

            const classNames = result.classes.map(c => c.name);
            expect(classNames).toContain('Person');
            expect(classNames).toContain('Employee');
            expect(classNames).toContain('Manager');
        });
    });

    // Parser metadata tests - these don't require WASM
    describe('Parser metadata', () => {
        it('should have correct language identifier', () => {
            expect(parser.language).toBe('dart');
        });

        it('should handle .dart extension', () => {
            expect(parser.extensions).toContain('dart');
        });

        it('should have display name', () => {
            expect(parser.displayName).toBe('Dart');
        });

        it('should return true for canParse with .dart file', () => {
            expect(parser.canParse('Person.dart')).toBe(true);
        });

        it('should return false for canParse with .ts file', () => {
            expect(parser.canParse('Person.ts')).toBe(false);
        });

        it('should require initialization (WASM)', () => {
            expect(parser.requiresInitialization).toBe(true);
        });
    });
});
