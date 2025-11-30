/**
 * Contract Tests: MethodExtractor.extractMethods()
 * 
 * Tests the extraction of methods from Dart class bodies.
 * 
 * Contract IDs: ME-001 to ME-008
 * 
 * NOTE: WASM-based parsing tests are skipped in Node/Vitest environment.
 * Full parsing tests are covered in E2E tests where WASM works in browser.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DartParser } from '../../../../src/parsers/dart/DartParser';
import type { Method } from '../../../../src/shared/types';

// Check if we're in a WASM-capable environment
const isWasmEnvironment = typeof WebAssembly !== 'undefined' && typeof window !== 'undefined';

describe('Dart MethodExtractor Contract Tests', () => {
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

    describe('ME-001: Basic void method', () => {
        wasmIt('should extract method name and void return type', () => {
            const code = 'class Person { void greet() {} }';
            const result = parser.parse(code, 'Person.dart', 'file-001');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].name).toBe('greet');
            expect(result.classes[0].methods[0].returnType).toBe('void');
        });
    });

    describe('ME-002: Arrow function with return type', () => {
        wasmIt('should extract return type from arrow function', () => {
            const code = 'class Person { String getName() => name; }';
            const result = parser.parse(code, 'Person.dart', 'file-002');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].name).toBe('getName');
            expect(result.classes[0].methods[0].returnType).toBe('String');
        });
    });

    describe('ME-003: Async method with Future return type', () => {
        wasmIt('should extract async method with isAsync=true', () => {
            const code = 'class Service { Future<void> fetchData() async {} }';
            const result = parser.parse(code, 'Service.dart', 'file-003');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].name).toBe('fetchData');
            expect(result.classes[0].methods[0].returnType).toBe('Future<void>');
            expect(result.classes[0].methods[0].isAsync).toBe(true);
        });
    });

    describe('ME-004: Static method', () => {
        wasmIt('should extract static method with isStatic=true', () => {
            const code = 'class Utils { static void helper() {} }';
            const result = parser.parse(code, 'Utils.dart', 'file-004');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].name).toBe('helper');
            expect(result.classes[0].methods[0].isStatic).toBe(true);
        });
    });

    describe('ME-005: Private method (underscore prefix)', () => {
        wasmIt('should extract private method with visibility="private"', () => {
            const code = 'class Person { void _private() {} }';
            const result = parser.parse(code, 'Person.dart', 'file-005');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].name).toBe('_private');
            expect(result.classes[0].methods[0].visibility).toBe('private');
        });
    });

    describe('ME-006: Method with positional parameters', () => {
        wasmIt('should extract parameters from method signature', () => {
            const code = 'class Person { void greet(String name, int age) {} }';
            const result = parser.parse(code, 'Person.dart', 'file-006');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].parameters).toHaveLength(2);
            expect(result.classes[0].methods[0].parameters[0].name).toBe('name');
            expect(result.classes[0].methods[0].parameters[0].type).toBe('String');
            expect(result.classes[0].methods[0].parameters[1].name).toBe('age');
            expect(result.classes[0].methods[0].parameters[1].type).toBe('int');
        });
    });

    describe('ME-007: Method with optional named parameters', () => {
        wasmIt('should extract optional named parameter', () => {
            const code = 'class Person { void greet({String? name}) {} }';
            const result = parser.parse(code, 'Person.dart', 'file-007');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].parameters).toHaveLength(1);
            expect(result.classes[0].methods[0].parameters[0].name).toBe('name');
            expect(result.classes[0].methods[0].parameters[0].isOptional).toBe(true);
        });
    });

    describe('ME-008: Method with optional positional parameters', () => {
        wasmIt('should extract optional positional parameter with default value', () => {
            const code = 'class Counter { void increment([int count = 0]) {} }';
            const result = parser.parse(code, 'Counter.dart', 'file-008');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].parameters).toHaveLength(1);
            expect(result.classes[0].methods[0].parameters[0].name).toBe('count');
            expect(result.classes[0].methods[0].parameters[0].isOptional).toBe(true);
            expect(result.classes[0].methods[0].parameters[0].defaultValue).toBe('0');
        });
    });

    describe('Constructor handling', () => {
        wasmIt('should extract constructor as method', () => {
            const code = 'class Person { Person(String name) {} }';
            const result = parser.parse(code, 'Person.dart', 'file-009');

            expect(result.success).toBe(true);
            // Constructor should be treated as a method
            const constructorMethod = result.classes[0].methods.find((m: Method) => m.name === 'Person');
            expect(constructorMethod).toBeDefined();
            expect(constructorMethod?.returnType).toBe('void');
        });
    });

    describe('Named constructor', () => {
        wasmIt('should extract named constructor with ClassName.constructorName format', () => {
            const code = 'class Person { Person.fromJson(Map data) {} }';
            const result = parser.parse(code, 'Person.dart', 'file-010');

            expect(result.success).toBe(true);
            const namedConstructor = result.classes[0].methods.find((m: Method) =>
                m.name === 'Person.fromJson'
            );
            expect(namedConstructor).toBeDefined();
        });
    });

    describe('Getter method', () => {
        wasmIt('should extract getter as method', () => {
            const code = 'class Person { String get fullName => name; }';
            const result = parser.parse(code, 'Person.dart', 'file-011');

            expect(result.success).toBe(true);
            // Getters are treated as methods
            const getter = result.classes[0].methods.find((m: Method) => m.name === 'fullName');
            expect(getter).toBeDefined();
            expect(getter?.returnType).toBe('String');
        });
    });

    describe('Setter method', () => {
        wasmIt('should extract setter as method', () => {
            const code = 'class Person { set age(int value) {} }';
            const result = parser.parse(code, 'Person.dart', 'file-012');

            expect(result.success).toBe(true);
            // Setters are treated as methods
            const setter = result.classes[0].methods.find((m: Method) => m.name === 'age');
            expect(setter).toBeDefined();
        });
    });

    describe('Method visibility default', () => {
        wasmIt('should mark public methods as public', () => {
            const code = 'class Person { void publicMethod() {} }';
            const result = parser.parse(code, 'Person.dart', 'file-013');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods[0].visibility).toBe('public');
        });
    });

    describe('Generic method return type', () => {
        wasmIt('should extract generic return types', () => {
            const code = 'class Service { Future<List<String>> getData() async { return []; } }';
            const result = parser.parse(code, 'Service.dart', 'file-014');

            expect(result.success).toBe(true);
            expect(result.classes[0].methods[0].returnType).toBe('Future<List<String>>');
        });
    });
});
