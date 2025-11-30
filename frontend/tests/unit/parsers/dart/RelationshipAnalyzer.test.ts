/**
 * Contract Tests: RelationshipAnalyzer.extractRelationships()
 * 
 * Tests the extraction of relationships between Dart classes and interfaces.
 * 
 * Contract IDs: RA-001 to RA-005
 * 
 * NOTE: WASM-based parsing tests are skipped in Node/Vitest environment.
 * Full parsing tests are covered in E2E tests where WASM works in browser.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DartParser } from '../../../../src/parsers/dart/DartParser';
import type { Relationship } from '../../../../src/shared/types';

// Check if we're in a WASM-capable environment
const isWasmEnvironment = typeof WebAssembly !== 'undefined' && typeof window !== 'undefined';

describe('Dart RelationshipAnalyzer Contract Tests', () => {
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

    describe('RA-001: Inheritance relationship (extends)', () => {
        wasmIt('should detect inheritance relationship between Child and Parent', () => {
            const code = `
class Parent {}
class Child extends Parent {}
            `;
            const result = parser.parse(code, 'Hierarchy.dart', 'file-001');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(2);

            const inheritanceRel = result.relationships.find((r: Relationship) => r.type === 'inheritance');
            expect(inheritanceRel).toBeDefined();
            expect(inheritanceRel?.sourceId).toContain('Child');
            expect(inheritanceRel?.targetId).toContain('Parent');
        });
    });

    describe('RA-002: Realization relationship (implements)', () => {
        wasmIt('should detect realization relationship for implements clause', () => {
            const code = `
abstract class IService {}
class Impl implements IService {}
            `;
            const result = parser.parse(code, 'Service.dart', 'file-002');

            expect(result.success).toBe(true);

            const realizationRel = result.relationships.find((r: Relationship) => r.type === 'realization');
            expect(realizationRel).toBeDefined();
            expect(realizationRel?.sourceId).toContain('Impl');
            expect(realizationRel?.targetId).toContain('IService');
        });
    });

    describe('RA-003: Mixin as realization relationship', () => {
        wasmIt('should detect realization relationship for mixin (with clause)', () => {
            const code = `
mixin Logger {}
class Service with Logger {}
            `;
            const result = parser.parse(code, 'Service.dart', 'file-003');

            expect(result.success).toBe(true);

            // Mixins should be treated as realization relationships
            // Note: Mixins might be treated differently depending on implementation
            // The class should have Logger in implementsInterfaces
            const serviceClass = result.classes.find((c: { name: string }) => c.name === 'Service');
            expect(serviceClass).toBeDefined();
            expect(serviceClass?.implementsInterfaces).toContain('Logger');
        });
    });

    describe('RA-004: Association relationship (property type)', () => {
        wasmIt('should detect association when class has property of another class type', () => {
            const code = `
class Address {}
class Person {
    Address address;
}
            `;
            const result = parser.parse(code, 'Person.dart', 'file-004');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(2);

            const associationRel = result.relationships.find((r: Relationship) => r.type === 'association');
            expect(associationRel).toBeDefined();
            expect(associationRel?.sourceId).toContain('Person');
            expect(associationRel?.targetId).toContain('Address');
        });
    });

    describe('RA-005: No relationships', () => {
        wasmIt('should return empty relationships array for unrelated classes', () => {
            const code = `
class Person {}
class Animal {}
            `;
            const result = parser.parse(code, 'Unrelated.dart', 'file-005');

            expect(result.success).toBe(true);
            expect(result.classes).toHaveLength(2);
            expect(result.relationships).toHaveLength(0);
        });
    });

    describe('Aggregation relationship (List property)', () => {
        wasmIt('should detect aggregation for List/array properties', () => {
            const code = `
class Item {}
class Cart {
    List<Item> items;
}
            `;
            const result = parser.parse(code, 'Cart.dart', 'file-006');

            expect(result.success).toBe(true);

            const aggregationRel = result.relationships.find((r: Relationship) => r.type === 'aggregation');
            expect(aggregationRel).toBeDefined();
            expect(aggregationRel?.sourceId).toContain('Cart');
            expect(aggregationRel?.targetId).toContain('Item');
        });
    });

    describe('Multiple relationships', () => {
        wasmIt('should detect all relationship types in complex hierarchy', () => {
            const code = `
abstract class ILogger {}
class BaseService {}
class Service extends BaseService implements ILogger {
    BaseService helper;
}
            `;
            const result = parser.parse(code, 'Complex.dart', 'file-007');

            expect(result.success).toBe(true);

            // Should have: inheritance (extends), realization (implements), association (property)
            const types = result.relationships.map((r: Relationship) => r.type);
            expect(types).toContain('inheritance');
            expect(types).toContain('realization');
            expect(types).toContain('association');
        });
    });

    describe('Self-referencing relationship', () => {
        wasmIt('should detect association for self-referencing property', () => {
            const code = `
class Node {
    Node? parent;
    List<Node> children;
}
            `;
            const result = parser.parse(code, 'Node.dart', 'file-008');

            expect(result.success).toBe(true);

            // Should have both association (parent) and aggregation (children)
            const nodeRelationships = result.relationships.filter((r: Relationship) =>
                r.sourceId.includes('Node') && r.targetId.includes('Node')
            );
            expect(nodeRelationships.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('No relationship for built-in types', () => {
        wasmIt('should not create relationships for built-in types', () => {
            const code = `
class Person {
    String name;
    int age;
    bool active;
    List<String> tags;
}
            `;
            const result = parser.parse(code, 'Person.dart', 'file-009');

            expect(result.success).toBe(true);
            // No relationships because all types are built-in
            expect(result.relationships).toHaveLength(0);
        });
    });
});
