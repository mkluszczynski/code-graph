/**
 * Contract Tests: PropertyExtractor.extractProperties()
 * 
 * Tests the extraction of properties/fields from Dart class bodies.
 * 
 * Contract IDs: PE-001 to PE-008
 * 
 * NOTE: WASM-based parsing tests are skipped in Node/Vitest environment.
 * Full parsing tests are covered in E2E tests where WASM works in browser.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DartParser } from '../../../../src/parsers/dart/DartParser';

// Check if we're in a WASM-capable environment
const isWasmEnvironment = typeof WebAssembly !== 'undefined' && typeof window !== 'undefined';

describe('Dart PropertyExtractor Contract Tests', () => {
    let parser: DartParser;

    beforeAll(async () => {
        parser = new DartParser();
        if (parser.requiresInitialization) {
            try {
                await parser.initialize();
            } catch (error) {
                console.warn('DartParser WASM initialization failed (expected in Node environment):',
                    (error as Error).message);
            }
        }
    });

    // WASM-dependent tests are skipped in Node
    const wasmIt = isWasmEnvironment ? it : it.skip;

    describe('PE-001: Basic String property', () => {
        wasmIt('should extract String type with isReadonly=false', () => {
            const code = 'class Person { String name; }';
            const result = parser.parse(code, 'Person.dart', 'file-001');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('name');
            expect(result.classes[0].properties[0].type).toBe('String');
            expect(result.classes[0].properties[0].isReadonly).toBe(false);
        });
    });

    describe('PE-002: Final property (readonly)', () => {
        wasmIt('should extract final property with isReadonly=true', () => {
            const code = 'class Person { final int age; }';
            const result = parser.parse(code, 'Person.dart', 'file-002');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('age');
            expect(result.classes[0].properties[0].type).toBe('int');
            expect(result.classes[0].properties[0].isReadonly).toBe(true);
        });
    });

    describe('PE-003: Static property', () => {
        wasmIt('should extract static property with isStatic=true', () => {
            const code = 'class Person { static String id; }';
            const result = parser.parse(code, 'Person.dart', 'file-003');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('id');
            expect(result.classes[0].properties[0].isStatic).toBe(true);
        });
    });

    describe('PE-004: Nullable property', () => {
        wasmIt('should extract nullable type with ? in type string', () => {
            const code = 'class Person { String? nickname; }';
            const result = parser.parse(code, 'Person.dart', 'file-004');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('nickname');
            expect(result.classes[0].properties[0].type).toBe('String?');
        });
    });

    describe('PE-005: Late property (late ignored)', () => {
        wasmIt('should extract late property with type String (late is ignored)', () => {
            const code = 'class Person { late String data; }';
            const result = parser.parse(code, 'Person.dart', 'file-005');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('data');
            expect(result.classes[0].properties[0].type).toBe('String');
        });
    });

    describe('PE-006: Property with default value', () => {
        wasmIt('should extract property with defaultValue', () => {
            const code = "class Person { String name = 'default'; }";
            const result = parser.parse(code, 'Person.dart', 'file-006');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('name');
            // Default value should be captured
            expect(result.classes[0].properties[0].defaultValue).toBe("'default'");
        });
    });

    describe('PE-007: Private property (underscore prefix)', () => {
        wasmIt('should extract private property with visibility="private"', () => {
            const code = 'class Person { String _privateField; }';
            const result = parser.parse(code, 'Person.dart', 'file-007');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('_privateField');
            expect(result.classes[0].properties[0].visibility).toBe('private');
        });
    });

    describe('PE-008: Const property (readonly and static)', () => {
        wasmIt('should extract const property with isReadonly=true and isStatic=true', () => {
            const code = 'class Math { static const double PI = 3.14; }';
            const result = parser.parse(code, 'Math.dart', 'file-008');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].name).toBe('PI');
            expect(result.classes[0].properties[0].isReadonly).toBe(true);
            expect(result.classes[0].properties[0].isStatic).toBe(true);
        });
    });

    describe('Multiple properties', () => {
        wasmIt('should extract all properties from class', () => {
            const code = `
class Person {
    String name;
    final int age;
    String? email;
}
            `;
            const result = parser.parse(code, 'Person.dart', 'file-009');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(3);

            const propNames = result.classes[0].properties.map((p: { name: string }) => p.name);
            expect(propNames).toContain('name');
            expect(propNames).toContain('age');
            expect(propNames).toContain('email');
        });
    });

    describe('Property visibility based on underscore', () => {
        wasmIt('should mark public properties as public', () => {
            const code = 'class Person { String publicField; }';
            const result = parser.parse(code, 'Person.dart', 'file-010');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties[0].visibility).toBe('public');
        });
    });

    describe('Generic property types', () => {
        wasmIt('should extract generic types correctly', () => {
            const code = 'class Container { List<String> items; }';
            const result = parser.parse(code, 'Container.dart', 'file-011');

            expect(result.success).toBe(true);
            expect(result.classes[0].properties).toHaveLength(1);
            expect(result.classes[0].properties[0].type).toBe('List<String>');
        });
    });
});
