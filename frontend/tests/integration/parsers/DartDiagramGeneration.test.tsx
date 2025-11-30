/**
 * Integration Tests: Dart Parser + DiagramGenerator
 * 
 * Tests the complete flow from Dart source code parsing to UML diagram generation.
 * Verifies that parsed Dart classes and relationships are correctly converted
 * to React Flow nodes and edges.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DartParser } from '../../../src/parsers/dart/DartParser';
import { generateDiagram } from '../../../src/diagram-visualization/DiagramGenerator';
import type { ClassDefinition, InterfaceDefinition, Relationship } from '../../../src/shared/types';

describe('Dart Diagram Generation Integration Tests', () => {
    let parser: DartParser;

    beforeAll(async () => {
        parser = new DartParser();
        if (parser.requiresInitialization) {
            await parser.initialize();
        }
    });

    describe('Single class diagram', () => {
        it('should generate a diagram with one node for a simple class', () => {
            const code = `
class Person {
    String name;
    int age;
    void greet() {}
}
            `;
            const result = parser.parse(code, 'Person.dart', 'file-001');
            expect(result.success).toBe(true);

            const { nodes, edges } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            expect(nodes).toHaveLength(1);
            expect(nodes[0].id).toContain('Person');
            expect(nodes[0].type).toBe('classNode');
            expect(edges).toHaveLength(0);
        });
    });

    describe('Class with inheritance', () => {
        it('should generate nodes and inheritance edge', () => {
            const code = `
class Animal {}
class Dog extends Animal {}
            `;
            const result = parser.parse(code, 'Animals.dart', 'file-002');
            expect(result.success).toBe(true);

            const { nodes, edges } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            expect(nodes).toHaveLength(2);

            const inheritanceEdge = edges.find(e => e.type === 'inheritance');
            expect(inheritanceEdge).toBeDefined();
            expect(inheritanceEdge?.source).toContain('Dog');
            expect(inheritanceEdge?.target).toContain('Animal');
        });
    });

    describe('Class implementing abstract class (interface)', () => {
        it('should generate nodes and realization edge', () => {
            const code = `
abstract class IService {}
class ServiceImpl implements IService {}
            `;
            const result = parser.parse(code, 'Service.dart', 'file-003');
            expect(result.success).toBe(true);

            const { nodes, edges } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            expect(nodes).toHaveLength(2);

            // Abstract class becomes interface node
            const interfaceNode = nodes.find(n => n.id.includes('IService'));
            expect(interfaceNode?.type).toBe('interfaceNode');

            // Realization edge
            const realizationEdge = edges.find(e => e.type === 'realization');
            expect(realizationEdge).toBeDefined();
        });
    });

    describe('Class with property association', () => {
        it('should generate nodes and association edge', () => {
            const code = `
class Address {
    String city;
}
class Person {
    Address address;
}
            `;
            const result = parser.parse(code, 'Person.dart', 'file-004');
            expect(result.success).toBe(true);

            const { nodes, edges } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            expect(nodes).toHaveLength(2);

            const associationEdge = edges.find(e => e.type === 'association');
            expect(associationEdge).toBeDefined();
            expect(associationEdge?.source).toContain('Person');
            expect(associationEdge?.target).toContain('Address');
        });
    });

    describe('Class with List property (aggregation)', () => {
        it('should generate nodes and aggregation edge', () => {
            const code = `
class Item {
    String name;
}
class Cart {
    List<Item> items;
}
            `;
            const result = parser.parse(code, 'Cart.dart', 'file-005');
            expect(result.success).toBe(true);

            const { nodes, edges } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            expect(nodes).toHaveLength(2);

            const aggregationEdge = edges.find(e => e.type === 'aggregation');
            expect(aggregationEdge).toBeDefined();
            expect(aggregationEdge?.source).toContain('Cart');
            expect(aggregationEdge?.target).toContain('Item');
        });
    });

    describe('Complex class hierarchy', () => {
        it('should generate complete diagram for complex hierarchy', () => {
            const code = `
abstract class Entity {
    String id;
}

abstract class Auditable {
    DateTime createdAt;
    DateTime updatedAt;
}

class User extends Entity implements Auditable {
    String name;
    String email;
    List<Role> roles;
}

class Role {
    String name;
    List<Permission> permissions;
}

class Permission {
    String action;
    String resource;
}
            `;
            const result = parser.parse(code, 'Domain.dart', 'file-006');
            expect(result.success).toBe(true);

            const { nodes, edges } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            // 5 entities: Entity (interface), Auditable (interface), User, Role, Permission
            expect(nodes.length).toBeGreaterThanOrEqual(5);

            // Should have multiple relationships
            expect(edges.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Diagram node data', () => {
        it('should include properties and methods in node data', () => {
            const code = `
class Person {
    String name;
    final int age;
    
    void greet() {}
    String getName() => name;
}
            `;
            const result = parser.parse(code, 'Person.dart', 'file-007');
            expect(result.success).toBe(true);

            const { nodes } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            expect(nodes).toHaveLength(1);
            const nodeData = nodes[0].data as {
                name: string;
                properties: unknown[];
                methods: unknown[]
            };

            expect(nodeData.name).toBe('Person');
            expect(nodeData.properties.length).toBeGreaterThanOrEqual(2);
            expect(nodeData.methods.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Empty file diagram', () => {
        it('should return empty nodes and edges for empty file', () => {
            const result = parser.parse('', 'Empty.dart', 'file-008');
            expect(result.success).toBe(true);

            const { nodes, edges } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );

            expect(nodes).toHaveLength(0);
            expect(edges).toHaveLength(0);
        });
    });

    describe('Performance target', () => {
        it('should generate diagram in <200ms for 10 classes', () => {
            const classes: string[] = [];
            for (let i = 0; i < 10; i++) {
                classes.push(`
class Class${i} {
    String field${i};
    void method${i}() {}
}
                `);
            }
            const code = classes.join('\n');

            const startParse = performance.now();
            const result = parser.parse(code, 'Many.dart', 'file-009');
            const parseTime = performance.now() - startParse;
            expect(result.success).toBe(true);

            const startDiagram = performance.now();
            const { nodes } = generateDiagram(
                result.classes,
                result.interfaces,
                result.relationships
            );
            const diagramTime = performance.now() - startDiagram;

            const totalTime = parseTime + diagramTime;

            expect(nodes).toHaveLength(10);
            expect(totalTime).toBeLessThan(200); // SC-002: <200ms for 10 entities
        });
    });
});
