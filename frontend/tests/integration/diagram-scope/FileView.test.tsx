/**
 * File View Integration Tests (User Story 1)
 * 
 * Test Objective: Verify isolated file view displays ONLY entities from the selected file
 * 
 * User Story 1 Goal: Fix critical bug where diagram shows entities from all files simultaneously.
 * Expected: When user selects File A, diagram shows only File A's entities (no entities from File B).
 * 
 * These tests follow TDD - they should FAIL before implementation (T043)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../../src/shared/store';
import { parse } from '../../../src/typescript-parser/TypeScriptParser';
import { generateDiagram } from '../../../src/diagram-visualization/DiagramGenerator';
import type { ProjectFile, ClassDefinition, InterfaceDefinition } from '../../../src/shared/types';
import { buildDependencyGraph } from '../../../src/diagram-visualization/ImportResolver';
import { filterEntitiesByScope } from '../../../src/diagram-visualization/EntityFilter';
import { extractRelationships } from '../../../src/typescript-parser/RelationshipAnalyzer';

describe('User Story 1: Isolated File View', () => {
    beforeEach(() => {
        // Reset store before each test
        useStore.setState({
            files: [],
            activeFileId: null,
            parsedEntities: new Map(),
            nodes: [],
            edges: [],
            diagramViewMode: 'file', // Default to file view mode
        });
    });

    it('T039: displays only entities from selected file', () => {
        // Given: Two files with different classes
        const fileA: ProjectFile = {
            id: 'file-a',
            name: 'ClassA.ts',
            path: '/src/ClassA.ts',
            content: `
export class ClassA {
    propA: string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const fileB: ProjectFile = {
            id: 'file-b',
            name: 'ClassB.ts',
            path: '/src/ClassB.ts',
            content: `
export class ClassB {
    propB: number;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add files to store
        useStore.getState().addFile(fileA);
        useStore.getState().addFile(fileB);

        // Parse both files
        const parseResultA = parse(fileA.content, fileA.name);
        const parseResultB = parse(fileB.content, fileB.name);

        // Store parsed entities
        useStore.getState().setParsedEntities(fileA.id, [
            ...parseResultA.classes,
            ...parseResultA.interfaces,
        ]);
        useStore.getState().setParsedEntities(fileB.id, [
            ...parseResultB.classes,
            ...parseResultB.interfaces,
        ]);

        // When: User selects File A
        useStore.getState().setActiveFile(fileA.id);

        // Build dependency graph from all files
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        // Filter entities based on scope (file view mode + active file)
        const scope = {
            mode: 'file' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(
            allParsedEntities,
            scope
        );

        // Separate filtered entities into classes and interfaces
        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );

        // Extract relationships from filtered entities
        const relationships = extractRelationships(classes, interfaces);

        // Generate diagram with filtered entities
        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should display only ClassA (from File A), not ClassB (from File B)
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0].data.name).toBe('ClassA');
        expect(diagram.nodes[0].data.properties).toHaveLength(1);
        expect(diagram.nodes[0].data.properties[0]).toContain('propA');

        // ClassB should NOT be in the diagram
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).not.toContain('ClassB');
    });

    it('T040: clears previous file\'s diagram when switching files', () => {
        // Given: Two files with different classes
        const fileA: ProjectFile = {
            id: 'file-a',
            name: 'ClassA.ts',
            path: '/src/ClassA.ts',
            content: `
export class ClassA {
    valueA: string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const fileB: ProjectFile = {
            id: 'file-b',
            name: 'ClassB.ts',
            path: '/src/ClassB.ts',
            content: `
export class ClassB {
    valueB: number;
}

export class ClassC {
    valueC: boolean;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add and parse files
        useStore.getState().addFile(fileA);
        useStore.getState().addFile(fileB);

        const parseResultA = parse(fileA.content, fileA.name);
        const parseResultB = parse(fileB.content, fileB.name);

        useStore.getState().setParsedEntities(fileA.id, [
            ...parseResultA.classes,
            ...parseResultA.interfaces,
        ]);
        useStore.getState().setParsedEntities(fileB.id, [
            ...parseResultB.classes,
            ...parseResultB.interfaces,
        ]);

        // When: First, view File A
        useStore.getState().setActiveFile(fileA.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        let scope = {
            mode: 'file' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };
        let filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        
        // Separate and extract relationships
        let classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        let interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        let relationships = extractRelationships(classes, interfaces);
        
        let diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show only ClassA
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0].data.name).toBe('ClassA');

        // When: Switch to File B
        useStore.getState().setActiveFile(fileB.id);
        scope = {
            mode: 'file' as const,
            activeFileId: fileB.id,
            importGraph: graph,
        };
        filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        
        // Separate and extract relationships
        classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        relationships = extractRelationships(classes, interfaces);
        
        diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show only ClassB and ClassC (from File B), NOT ClassA
        expect(diagram.nodes).toHaveLength(2);
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).toContain('ClassB');
        expect(classNames).toContain('ClassC');
        expect(classNames).not.toContain('ClassA');
    });

    it('T041: shows inheritance relationships within same file', () => {
        // Given: File with inheritance relationship (Manager extends Employee)
        const file: ProjectFile = {
            id: 'file-1',
            name: 'Employees.ts',
            path: '/src/Employees.ts',
            content: `
export class Employee {
    employeeId: string;
    name: string;
}

export class Manager extends Employee {
    department: string;
    teamSize: number;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add and parse file
        useStore.getState().addFile(file);
        const parseResult = parse(file.content, file.name);

        useStore.getState().setParsedEntities(file.id, [
            ...parseResult.classes,
            ...parseResult.interfaces,
        ]);

        // When: View this file
        useStore.getState().setActiveFile(file.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        const scope = {
            mode: 'file' as const,
            activeFileId: file.id,
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        
        // Separate and extract relationships
        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        const relationships = extractRelationships(classes, interfaces);
        
        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show both Employee and Manager
        expect(diagram.nodes).toHaveLength(2);
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).toContain('Employee');
        expect(classNames).toContain('Manager');

        // And: Should show inheritance edge from Manager to Employee
        expect(diagram.edges).toHaveLength(1);
        expect(diagram.edges[0].type).toBe('inheritance');
        
        // Find source and target node IDs
        const managerNode = diagram.nodes.find(n => n.data.name === 'Manager');
        const employeeNode = diagram.nodes.find(n => n.data.name === 'Employee');
        
        expect(managerNode).toBeDefined();
        expect(employeeNode).toBeDefined();
        expect(diagram.edges[0].source).toBe(managerNode!.id);
        expect(diagram.edges[0].target).toBe(employeeNode!.id);
    });

    it('T042: shows interface realization within same file', () => {
        // Given: File with interface implementation
        const file: ProjectFile = {
            id: 'file-1',
            name: 'Payable.ts',
            path: '/src/Payable.ts',
            content: `
export interface IPayable {
    calculatePay(): number;
    getPaymentMethod(): string;
}

export class Employee implements IPayable {
    salary: number;
    
    calculatePay(): number {
        return this.salary;
    }
    
    getPaymentMethod(): string {
        return 'bank-transfer';
    }
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add and parse file
        useStore.getState().addFile(file);
        const parseResult = parse(file.content, file.name);

        useStore.getState().setParsedEntities(file.id, [
            ...parseResult.classes,
            ...parseResult.interfaces,
        ]);

        // When: View this file
        useStore.getState().setActiveFile(file.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        const scope = {
            mode: 'file' as const,
            activeFileId: file.id,
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        
        // Separate and extract relationships
        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        const relationships = extractRelationships(classes, interfaces);
        
        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show both IPayable interface and Employee class
        expect(diagram.nodes).toHaveLength(2);
        const entityNames = diagram.nodes.map(node => node.data.name);
        expect(entityNames).toContain('IPayable');
        expect(entityNames).toContain('Employee');

        // And: Should show realization edge from Employee to IPayable
        expect(diagram.edges).toHaveLength(1);
        expect(diagram.edges[0].type).toBe('realization');
        
        // Find source and target node IDs
        const employeeNode = diagram.nodes.find(n => n.data.name === 'Employee');
        const payableNode = diagram.nodes.find(n => n.data.name === 'IPayable');
        
        expect(employeeNode).toBeDefined();
        expect(payableNode).toBeDefined();
        expect(diagram.edges[0].source).toBe(employeeNode!.id);
        expect(diagram.edges[0].target).toBe(payableNode!.id);
    });
});
