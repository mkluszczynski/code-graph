/**
 * Integration test for relationship visualization (User Story 5)
 * Tests the complete flow: TypeScript code → Parse → Extract relationships → Generate diagram → Render edges
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../../src/typescript-parser/TypeScriptParser';
import { generateDiagram } from '../../src/diagram-visualization/DiagramGenerator';

describe('Relationship Visualization Integration Tests', () => {
    it('should visualize inheritance relationship between classes', () => {
        // Given: TypeScript code with inheritance
        const sourceCode = `
export class Person {
  name: string;
  age: number;
}

export class Employee extends Person {
  employeeId: string;
  salary: number;
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should have 2 nodes and 1 inheritance edge
        expect(diagram.nodes).toHaveLength(2);
        expect(diagram.edges).toHaveLength(1);

        const edge = diagram.edges[0];
        expect(edge.type).toBe('inheritance');
        expect(edge.source).toContain('Employee');
        expect(edge.target).toContain('Person');
    });

    it('should visualize interface implementation relationship', () => {
        // Given: TypeScript code with interface implementation
        const sourceCode = `
export interface IWorker {
  work(): void;
}

export class Employee implements IWorker {
  work(): void {
    console.log('Working...');
  }
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should have 2 nodes (1 class, 1 interface) and 1 realization edge
        expect(diagram.nodes).toHaveLength(2);
        expect(diagram.edges).toHaveLength(1);

        const edge = diagram.edges[0];
        expect(edge.type).toBe('realization');
        expect(edge.source).toContain('Employee');
        expect(edge.target).toContain('IWorker');
    });

    it('should visualize association relationship from property types', () => {
        // Given: TypeScript code with class property referencing another class
        const sourceCode = `
export class Department {
  name: string;
}

export class Employee {
  department: Department;
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should have 2 nodes and 1 association edge
        expect(diagram.nodes).toHaveLength(2);
        expect(diagram.edges).toHaveLength(1);

        const edge = diagram.edges[0];
        expect(edge.type).toBe('association');
        expect(edge.source).toContain('Employee');
        expect(edge.target).toContain('Department');
    });

    it('should visualize aggregation relationship from array property types', () => {
        // Given: TypeScript code with array property
        const sourceCode = `
export class Employee {
  name: string;
}

export class Team {
  members: Employee[];
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should have 2 nodes and 1 aggregation edge
        expect(diagram.nodes).toHaveLength(2);
        expect(diagram.edges).toHaveLength(1);

        const edge = diagram.edges[0];
        expect(edge.type).toBe('aggregation');
        expect(edge.source).toContain('Team');
        expect(edge.target).toContain('Employee');
    });

    it('should handle complex multi-class system with multiple relationship types', () => {
        // Given: Complex TypeScript code with all relationship types
        const sourceCode = `
export interface IManager {
  manage(): void;
}

export class Person {
  name: string;
  age: number;
}

export class Employee extends Person {
  employeeId: string;
}

export class Department {
  name: string;
}

export class Manager extends Employee implements IManager {
  department: Department;
  team: Employee[];

  manage(): void {
    console.log('Managing...');
  }
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should have correct number of nodes and edges
        expect(diagram.nodes.length).toBeGreaterThanOrEqual(5); // 4 classes + 1 interface
        expect(diagram.edges.length).toBeGreaterThanOrEqual(4); // Multiple relationships

        // Verify different edge types exist
        const edgeTypes = diagram.edges.map(e => e.type);
        expect(edgeTypes).toContain('inheritance');
        expect(edgeTypes).toContain('realization');
        expect(edgeTypes).toContain('association');
        expect(edgeTypes).toContain('aggregation');
    });

    it('should handle interface inheritance', () => {
        // Given: Interfaces extending other interfaces
        const sourceCode = `
export interface IEntity {
  id: string;
}

export interface IPerson extends IEntity {
  name: string;
}

export interface IEmployee extends IPerson {
  employeeId: string;
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should have 3 interface nodes and 2 inheritance edges
        expect(diagram.nodes).toHaveLength(3);
        expect(diagram.nodes.every(n => n.type === 'interface')).toBe(true);
        expect(diagram.edges).toHaveLength(2);
        expect(diagram.edges.every(e => e.type === 'inheritance')).toBe(true);
    });

    it('should ignore built-in types and not create relationships', () => {
        // Given: Class with only built-in property types
        const sourceCode = `
export class Person {
  name: string;
  age: number;
  active: boolean;
  data: any;
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should have 1 node and no edges (no relationships to built-in types)
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.edges).toHaveLength(0);
    });

    it('should apply layout to position nodes correctly', () => {
        // Given: Multi-class system
        const sourceCode = `
export class A {}
export class B extends A {}
export class C extends B {}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: All nodes should have valid positions
        expect(diagram.nodes).toHaveLength(3);

        diagram.nodes.forEach(node => {
            expect(node.position).toBeDefined();
            expect(node.position.x).toBeGreaterThanOrEqual(0);
            expect(node.position.y).toBeGreaterThanOrEqual(0);
            expect(node.width).toBeGreaterThan(0);
            expect(node.height).toBeGreaterThan(0);
        });

        // Edges should be defined
        expect(diagram.edges).toHaveLength(2);
    });

    it('should handle generic types in relationships', () => {
        // Given: Classes with generic types
        const sourceCode = `
export class Container<T> {
  value: T;
}

export class Employee {
  id: string;
}

export class EmployeeContainer extends Container<Employee> {
  // Inherits value: Employee
}
        `;

        // When: Parse and generate diagram
        const parseResult = parse(sourceCode, 'test.ts');
        const diagram = generateDiagram(
            parseResult.classes,
            parseResult.interfaces,
            parseResult.relationships
        );

        // Then: Should detect inheritance relationship
        expect(diagram.nodes).toHaveLength(3);

        const inheritanceEdges = diagram.edges.filter(e => e.type === 'inheritance');
        expect(inheritanceEdges.length).toBeGreaterThan(0);
    });
});
