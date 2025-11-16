/**
 * Cross-File Import Integration Tests (User Story 2)
 * 
 * Test Objective: Verify cross-file import resolution and relationship visualization
 * 
 * User Story 2 Goal: When viewing a file that imports classes/interfaces from other files,
 * display those imported types with relationship arrows to understand dependencies between files.
 * 
 * Expected: Create two files where File A imports from File B, select File A,
 * verify that both File A's entities AND the imported entities from File B appear with relationship arrows.
 * 
 * These tests follow TDD - they should FAIL before implementation (T061)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../../src/shared/store';
import { parse } from '../../../src/typescript-parser/TypeScriptParser';
import { generateDiagram } from '../../../src/diagram-visualization/DiagramGenerator';
import type { ProjectFile, ClassDefinition, InterfaceDefinition } from '../../../src/shared/types';
import { buildDependencyGraph } from '../../../src/diagram-visualization/ImportResolver';
import { filterEntitiesByScope } from '../../../src/diagram-visualization/EntityFilter';
import { extractRelationships } from '../../../src/typescript-parser/RelationshipAnalyzer';

describe('User Story 2: Cross-File Import Visualization', () => {
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

    it('T055: displays imported entity with inheritance relationship', () => {
        // Given: Two files where Employee extends Person (cross-file inheritance)
        const personFile: ProjectFile = {
            id: 'person-file',
            name: 'Person.ts',
            path: '/src/Person.ts',
            content: `
export class Person {
    name: string;
    age: number;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const employeeFile: ProjectFile = {
            id: 'employee-file',
            name: 'Employee.ts',
            path: '/src/Employee.ts',
            content: `
import { Person } from './Person';

export class Employee extends Person {
    employeeId: string;
    department: string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add files to store
        useStore.getState().addFile(personFile);
        useStore.getState().addFile(employeeFile);

        // Parse both files
        const parseResultPerson = parse(personFile.content, personFile.name);
        const parseResultEmployee = parse(employeeFile.content, employeeFile.name);

        // Store parsed entities
        useStore.getState().setParsedEntities(personFile.id, [
            ...parseResultPerson.classes,
            ...parseResultPerson.interfaces,
        ]);
        useStore.getState().setParsedEntities(employeeFile.id, [
            ...parseResultEmployee.classes,
            ...parseResultEmployee.interfaces,
        ]);

        // When: User selects Employee file (which imports Person)
        useStore.getState().setActiveFile(employeeFile.id);

        // Build dependency graph from all files
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        // Filter entities based on scope (file view mode + active file)
        const scope = {
            mode: 'file' as const,
            activeFileId: employeeFile.id,
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

        // Then: Should display both Employee (local) and Person (imported with relationship)
        expect(diagram.nodes).toHaveLength(2);
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).toContain('Employee');
        expect(classNames).toContain('Person');

        // And: Should show inheritance edge from Employee to Person
        expect(diagram.edges).toHaveLength(1);
        expect(diagram.edges[0].type).toBe('inheritance');

        const employeeNode = diagram.nodes.find(n => n.data.name === 'Employee');
        const personNode = diagram.nodes.find(n => n.data.name === 'Person');

        expect(employeeNode).toBeDefined();
        expect(personNode).toBeDefined();
        expect(diagram.edges[0].source).toBe(employeeNode!.id);
        expect(diagram.edges[0].target).toBe(personNode!.id);
    });

    it('T056: displays imported entity with interface realization', () => {
        // Given: Two files where Employee implements IPayable interface from another file
        const payableFile: ProjectFile = {
            id: 'payable-file',
            name: 'IPayable.ts',
            path: '/src/interfaces/IPayable.ts',
            content: `
export interface IPayable {
    calculatePay(): number;
    getPaymentMethod(): string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const employeeFile: ProjectFile = {
            id: 'employee-file',
            name: 'Employee.ts',
            path: '/src/Employee.ts',
            content: `
import { IPayable } from './interfaces/IPayable';

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

        // Add and parse files
        useStore.getState().addFile(payableFile);
        useStore.getState().addFile(employeeFile);

        const parseResultPayable = parse(payableFile.content, payableFile.name);
        const parseResultEmployee = parse(employeeFile.content, employeeFile.name);

        useStore.getState().setParsedEntities(payableFile.id, [
            ...parseResultPayable.classes,
            ...parseResultPayable.interfaces,
        ]);
        useStore.getState().setParsedEntities(employeeFile.id, [
            ...parseResultEmployee.classes,
            ...parseResultEmployee.interfaces,
        ]);

        // When: View Employee file (which implements IPayable)
        useStore.getState().setActiveFile(employeeFile.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        const scope = {
            mode: 'file' as const,
            activeFileId: employeeFile.id,
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);

        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        const relationships = extractRelationships(classes, interfaces);

        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show both Employee and IPayable
        expect(diagram.nodes).toHaveLength(2);
        const entityNames = diagram.nodes.map(node => node.data.name);
        expect(entityNames).toContain('Employee');
        expect(entityNames).toContain('IPayable');

        // And: Should show realization edge from Employee to IPayable
        expect(diagram.edges).toHaveLength(1);
        expect(diagram.edges[0].type).toBe('realization');

        const employeeNode = diagram.nodes.find(n => n.data.name === 'Employee');
        const payableNode = diagram.nodes.find(n => n.data.name === 'IPayable');

        expect(employeeNode).toBeDefined();
        expect(payableNode).toBeDefined();
        expect(diagram.edges[0].source).toBe(employeeNode!.id);
        expect(diagram.edges[0].target).toBe(payableNode!.id);
    });

    it('T057: displays imported entity with association (property type)', () => {
        // Given: Two files where Manager has Employee as property type (association)
        const employeeFile: ProjectFile = {
            id: 'employee-file',
            name: 'Employee.ts',
            path: '/src/Employee.ts',
            content: `
export class Employee {
    employeeId: string;
    name: string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const managerFile: ProjectFile = {
            id: 'manager-file',
            name: 'Manager.ts',
            path: '/src/Manager.ts',
            content: `
import { Employee } from './Employee';

export class Manager {
    managerId: string;
    teamLead: Employee;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add and parse files
        useStore.getState().addFile(employeeFile);
        useStore.getState().addFile(managerFile);

        const parseResultEmployee = parse(employeeFile.content, employeeFile.name);
        const parseResultManager = parse(managerFile.content, managerFile.name);

        useStore.getState().setParsedEntities(employeeFile.id, [
            ...parseResultEmployee.classes,
            ...parseResultEmployee.interfaces,
        ]);
        useStore.getState().setParsedEntities(managerFile.id, [
            ...parseResultManager.classes,
            ...parseResultManager.interfaces,
        ]);

        // When: View Manager file (which has Employee as property type)
        useStore.getState().setActiveFile(managerFile.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        const scope = {
            mode: 'file' as const,
            activeFileId: managerFile.id,
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);

        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        const relationships = extractRelationships(classes, interfaces);

        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show both Manager and Employee
        expect(diagram.nodes).toHaveLength(2);
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).toContain('Manager');
        expect(classNames).toContain('Employee');

        // And: Should show association edge from Manager to Employee
        expect(diagram.edges).toHaveLength(1);
        expect(diagram.edges[0].type).toBe('association');

        const managerNode = diagram.nodes.find(n => n.data.name === 'Manager');
        const employeeNode = diagram.nodes.find(n => n.data.name === 'Employee');

        expect(managerNode).toBeDefined();
        expect(employeeNode).toBeDefined();
        expect(diagram.edges[0].source).toBe(managerNode!.id);
        expect(diagram.edges[0].target).toBe(employeeNode!.id);
    });

    it('T058: excludes imported entity with no relationships', () => {
        // Given: Two files where Manager imports Person but has no relationship with it
        const personFile: ProjectFile = {
            id: 'person-file',
            name: 'Person.ts',
            path: '/src/Person.ts',
            content: `
export class Person {
    name: string;
    age: number;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const managerFile: ProjectFile = {
            id: 'manager-file',
            name: 'Manager.ts',
            path: '/src/Manager.ts',
            content: `
import { Person } from './Person';

export class Manager {
    managerId: string;
    department: string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add and parse files
        useStore.getState().addFile(personFile);
        useStore.getState().addFile(managerFile);

        const parseResultPerson = parse(personFile.content, personFile.name);
        const parseResultManager = parse(managerFile.content, managerFile.name);

        useStore.getState().setParsedEntities(personFile.id, [
            ...parseResultPerson.classes,
            ...parseResultPerson.interfaces,
        ]);
        useStore.getState().setParsedEntities(managerFile.id, [
            ...parseResultManager.classes,
            ...parseResultManager.interfaces,
        ]);

        // When: View Manager file (which imports Person but doesn't use it)
        useStore.getState().setActiveFile(managerFile.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        const scope = {
            mode: 'file' as const,
            activeFileId: managerFile.id,
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);

        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        const relationships = extractRelationships(classes, interfaces);

        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show only Manager, NOT Person (no relationship)
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0].data.name).toBe('Manager');

        // Person should NOT be in the diagram
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).not.toContain('Person');

        // No edges should be present
        expect(diagram.edges).toHaveLength(0);
    });

    it('T059: displays multi-level import chain (Manager → Employee → Person)', () => {
        // Given: Three files with transitive inheritance chain
        const personFile: ProjectFile = {
            id: 'person-file',
            name: 'Person.ts',
            path: '/src/Person.ts',
            content: `
export class Person {
    name: string;
    age: number;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const employeeFile: ProjectFile = {
            id: 'employee-file',
            name: 'Employee.ts',
            path: '/src/Employee.ts',
            content: `
import { Person } from './Person';

export class Employee extends Person {
    employeeId: string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const managerFile: ProjectFile = {
            id: 'manager-file',
            name: 'Manager.ts',
            path: '/src/Manager.ts',
            content: `
import { Employee } from './Employee';

export class Manager extends Employee {
    department: string;
    teamSize: number;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add and parse all files
        useStore.getState().addFile(personFile);
        useStore.getState().addFile(employeeFile);
        useStore.getState().addFile(managerFile);

        const parseResultPerson = parse(personFile.content, personFile.name);
        const parseResultEmployee = parse(employeeFile.content, employeeFile.name);
        const parseResultManager = parse(managerFile.content, managerFile.name);

        useStore.getState().setParsedEntities(personFile.id, [
            ...parseResultPerson.classes,
            ...parseResultPerson.interfaces,
        ]);
        useStore.getState().setParsedEntities(employeeFile.id, [
            ...parseResultEmployee.classes,
            ...parseResultEmployee.interfaces,
        ]);
        useStore.getState().setParsedEntities(managerFile.id, [
            ...parseResultManager.classes,
            ...parseResultManager.interfaces,
        ]);

        // When: View Manager file (which transitively imports Person through Employee)
        useStore.getState().setActiveFile(managerFile.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        const scope = {
            mode: 'file' as const,
            activeFileId: managerFile.id,
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);

        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        const relationships = extractRelationships(classes, interfaces);

        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show all three classes (Manager, Employee, Person)
        expect(diagram.nodes).toHaveLength(3);
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).toContain('Manager');
        expect(classNames).toContain('Employee');
        expect(classNames).toContain('Person');

        // And: Should show two inheritance edges (Manager → Employee, Employee → Person)
        expect(diagram.edges).toHaveLength(2);
        expect(diagram.edges.every(edge => edge.type === 'inheritance')).toBe(true);

        // Verify the chain: Manager extends Employee, Employee extends Person
        const managerNode = diagram.nodes.find(n => n.data.name === 'Manager');
        const employeeNode = diagram.nodes.find(n => n.data.name === 'Employee');
        const personNode = diagram.nodes.find(n => n.data.name === 'Person');

        expect(managerNode).toBeDefined();
        expect(employeeNode).toBeDefined();
        expect(personNode).toBeDefined();

        const managerToEmployee = diagram.edges.find(
            e => e.source === managerNode!.id && e.target === employeeNode!.id
        );
        const employeeToPerson = diagram.edges.find(
            e => e.source === employeeNode!.id && e.target === personNode!.id
        );

        expect(managerToEmployee).toBeDefined();
        expect(employeeToPerson).toBeDefined();
    });

    it('T060: handles circular imports without infinite loop', () => {
        // Given: Two files with circular import references
        const fileA: ProjectFile = {
            id: 'file-a',
            name: 'ClassA.ts',
            path: '/src/ClassA.ts',
            content: `
import { ClassB } from './ClassB';

export class ClassA {
    name: string;
    relatedB: ClassB;
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
import { ClassA } from './ClassA';

export class ClassB {
    value: number;
    relatedA: ClassA;
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

        // When: View File A (which has circular dependency with File B)
        useStore.getState().setActiveFile(fileA.id);
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;

        // This should NOT cause infinite loop or crash
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        const scope = {
            mode: 'file' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };

        // This should also handle circular dependency gracefully
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);

        const classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        const interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        const relationships = extractRelationships(classes, interfaces);

        const diagram = generateDiagram(classes, interfaces, relationships);

        // Then: Should show both ClassA and ClassB (both have relationships)
        expect(diagram.nodes).toHaveLength(2);
        const classNames = diagram.nodes.map(node => node.data.name);
        expect(classNames).toContain('ClassA');
        expect(classNames).toContain('ClassB');

        // And: Should show association edges between them
        expect(diagram.edges.length).toBeGreaterThan(0);
        expect(diagram.edges.every(edge => edge.type === 'association')).toBe(true);

        // Verify no errors occurred (test completes successfully)
        expect(filteredResult.entities).toBeDefined();
    });
});
