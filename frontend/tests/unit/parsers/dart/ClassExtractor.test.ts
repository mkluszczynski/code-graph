/**
 * Contract Tests: ClassExtractor.extractClassInfo()
 * 
 * Tests the extraction of class information from Dart AST nodes.
 * 
 * Contract IDs: CE-001 to CE-005
 * 
 * NOTE: WASM-based parsing tests are skipped in Node/Vitest environment.
 * Full parsing tests are covered in E2E tests where WASM works in browser.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DartParser } from '../../../../src/parsers/dart/DartParser';
import type { ClassDefinition } from '../../../../src/shared/types';

// Check if we're in a WASM-capable environment
const isWasmEnvironment = typeof WebAssembly !== 'undefined' && typeof window !== 'undefined';

describe('Dart ClassExtractor Contract Tests', () => {
    let parser: DartParser;
    let initializationError: Error | null = null;

    beforeAll(async () => {
        parser = new DartParser();
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

    describe('CE-001: Basic class extraction', () => {
        wasmIt('should extract class name and isAbstract=false for regular class', () => {
            const code = 'class Person {}';
            const result = parser.parse(code, 'Person.dart', 'file-001');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Person');
            expect(result.classes[0].isAbstract).toBe(false);
        });
    });

    describe('CE-002: Abstract class becomes interface', () => {
        wasmIt('should extract abstract class as InterfaceDefinition', () => {
            const code = 'abstract class Service {}';
            const result = parser.parse(code, 'Service.dart', 'file-002');

            expect(result.success).toBe(true);
            // Abstract classes are extracted as interfaces
            expect(result.interfaces).toHaveLength(1);
            expect(result.interfaces[0].name).toBe('Service');
            expect(result.classes).toHaveLength(0);
        });
    });

    describe('CE-003: Private class with underscore prefix', () => {
        wasmIt('should extract private class (underscore prefix)', () => {
            const code = 'class _Private {}';
            const result = parser.parse(code, 'Private.dart', 'file-003');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('_Private');
            // In Dart, underscore prefix indicates library-private
            // We reflect this in the class name, visibility is at file level
        });
    });

    describe('CE-004: Generic class with single type parameter', () => {
        wasmIt('should extract type parameters from generic class', () => {
            const code = 'class Generic<T> {}';
            const result = parser.parse(code, 'Generic.dart', 'file-004');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Generic');
            expect(result.classes[0].typeParameters).toContain('T');
        });
    });

    describe('CE-005: Generic class with multiple type parameters and constraints', () => {
        wasmIt('should extract multiple type parameters with constraints', () => {
            const code = 'class Multi<T, K extends Object> {}';
            const result = parser.parse(code, 'Multi.dart', 'file-005');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Multi');
            expect(result.classes[0].typeParameters).toHaveLength(2);
            expect(result.classes[0].typeParameters).toContain('T');
            // The second type parameter should include the constraint
            expect(result.classes[0].typeParameters.some((tp: string) =>
                tp.includes('K') && tp.includes('Object')
            )).toBe(true);
        });
    });

    describe('Class with extends and implements', () => {
        wasmIt('should extract extends and implements correctly', () => {
            const code = 'class Employee extends Person implements Worker, Comparable {}';
            const result = parser.parse(code, 'Employee.dart', 'file-006');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('Employee');
            expect(result.classes[0].extendsClass).toBe('Person');
            expect(result.classes[0].implementsInterfaces).toContain('Worker');
            expect(result.classes[0].implementsInterfaces).toContain('Comparable');
        });
    });

    describe('Class file ID assignment', () => {
        wasmIt('should assign correct fileId to extracted class', () => {
            const code = 'class Test {}';
            const result = parser.parse(code, 'Test.dart', 'custom-file-id');

            expect(result.success).toBe(true);
            expect(result.classes[0].fileId).toBe('custom-file-id');
        });
    });

    describe('Class ID generation', () => {
        wasmIt('should generate unique ID from filename and class name', () => {
            const code = 'class MyClass {}';
            const result = parser.parse(code, 'MyClass.dart', 'file-id');

            expect(result.success).toBe(true);
            // ID format: fileName::className
            expect(result.classes[0].id).toBe('MyClass.dart::MyClass');
        });
    });
});
