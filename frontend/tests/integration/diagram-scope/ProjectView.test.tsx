/**
 * Project View Integration Tests (User Story 3)
 * 
 * Test Objective: Verify project-wide view toggle displays ALL entities from ALL files
 * 
 * User Story 3 Goal: Add toggle button to switch between "File View" (focused single-file)
 * and "Project View" (entire project's class structure), providing both detailed and
 * strategic perspectives.
 * 
 * Expected: When user switches to Project View mode, diagram shows ALL entities from ALL files.
 * When toggled back to File View, shows only the active file's entities.
 * 
 * These tests follow TDD - they should FAIL before implementation (T074)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../../src/shared/store';
import { parse } from '../../../src/parsers/typescript/TypeScriptParser';
import { generateDiagram } from '../../../src/diagram-visualization/DiagramGenerator';
import type { ProjectFile, ClassDefinition, InterfaceDefinition } from '../../../src/shared/types';
import { buildDependencyGraph } from '../../../src/diagram-visualization/ImportResolver';
import { filterEntitiesByScope } from '../../../src/diagram-visualization/EntityFilter';
import { extractRelationships } from '../../../src/parsers/typescript/RelationshipAnalyzer';

describe('User Story 3: Project-Wide View Toggle', () => {
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

    it('T070: displays all entities from all files in project view', () => {
        // Given: Three files with different classes and interfaces
        const fileA: ProjectFile = {
            id: 'file-a',
            name: 'Models.ts',
            path: '/src/Models.ts',
            content: `
export class User {
    name: string;
    email: string;
}

export class Product {
    id: number;
    title: string;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const fileB: ProjectFile = {
            id: 'file-b',
            name: 'Services.ts',
            path: '/src/Services.ts',
            content: `
export class UserService {
    getUser(id: number): User {
        return null as any;
    }
}

export interface ILogger {
    log(message: string): void;
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const fileC: ProjectFile = {
            id: 'file-c',
            name: 'Controllers.ts',
            path: '/src/Controllers.ts',
            content: `
export class ApiController {
    service: UserService;
}

export class DataController {
    processData(): void {}
}
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        // Add files to store
        useStore.getState().addFile(fileA);
        useStore.getState().addFile(fileB);
        useStore.getState().addFile(fileC);

        // Parse all files
        const parseResultA = parse(fileA.content, fileA.name);
        const parseResultB = parse(fileB.content, fileB.name);
        const parseResultC = parse(fileC.content, fileC.name);

        // Store parsed entities
        useStore.getState().setParsedEntities(fileA.id, [
            ...parseResultA.classes,
            ...parseResultA.interfaces,
        ]);
        useStore.getState().setParsedEntities(fileB.id, [
            ...parseResultB.classes,
            ...parseResultB.interfaces,
        ]);
        useStore.getState().setParsedEntities(fileC.id, [
            ...parseResultC.classes,
            ...parseResultC.interfaces,
        ]);

        // Set active file to File A
        useStore.getState().setActiveFile(fileA.id);

        // When: User switches to project view mode
        useStore.getState().setDiagramViewMode('project');

        // Build dependency graph from all files
        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        // Filter entities based on project view scope
        const scope = {
            mode: 'project' as const,
            activeFileId: fileA.id, // Active file still set, but should be ignored in project mode
            importGraph: graph,
        };
        const filteredResult = filterEntitiesByScope(allParsedEntities, scope);

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

        // Then: Should display ALL entities from ALL three files
        // File A: User, Product (2 classes)
        // File B: UserService (1 class), ILogger (1 interface)
        // File C: ApiController, DataController (2 classes)
        // Total: 5 classes + 1 interface = 6 nodes
        expect(diagram.nodes).toHaveLength(6);

        const entityNames = diagram.nodes.map(node => node.data.name).sort();
        expect(entityNames).toEqual([
            'ApiController',
            'DataController',
            'ILogger',
            'Product',
            'User',
            'UserService',
        ]);

        // Verify all classes are present
        expect(entityNames).toContain('User');
        expect(entityNames).toContain('Product');
        expect(entityNames).toContain('UserService');
        expect(entityNames).toContain('ILogger');
        expect(entityNames).toContain('ApiController');
        expect(entityNames).toContain('DataController');
    });

    it('T071: returns to file view when toggled back', () => {
        // Given: Two files with classes
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

export class ClassC {
    propC: boolean;
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

        // Set active file to File A
        useStore.getState().setActiveFile(fileA.id);

        // When: User switches to project view mode
        useStore.getState().setDiagramViewMode('project');

        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        // First, verify project view shows all entities
        let scope = {
            mode: 'project' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };
        let filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        let classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        let interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        let relationships = extractRelationships(classes, interfaces);
        let diagram = generateDiagram(classes, interfaces, relationships);

        // Should show all 3 classes
        expect(diagram.nodes).toHaveLength(3);
        expect(diagram.nodes.map(n => n.data.name).sort()).toEqual([
            'ClassA',
            'ClassB',
            'ClassC',
        ]);

        // When: User toggles back to file view
        useStore.getState().setDiagramViewMode('file');

        // Then: Should show only File A's entities
        const fileViewScope = {
            mode: 'file' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };
        filteredResult = filterEntitiesByScope(allParsedEntities, fileViewScope);
        classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        relationships = extractRelationships(classes, interfaces);
        diagram = generateDiagram(classes, interfaces, relationships);

        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0].data.name).toBe('ClassA');
    });

    it('T072: maintains project view mode when switching files', () => {
        // Given: Three files with classes
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
            `.trim(),
            lastModified: Date.now(),
            isActive: false,
        };

        const fileC: ProjectFile = {
            id: 'file-c',
            name: 'ClassC.ts',
            path: '/src/ClassC.ts',
            content: `
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
        useStore.getState().addFile(fileC);

        const parseResultA = parse(fileA.content, fileA.name);
        const parseResultB = parse(fileB.content, fileB.name);
        const parseResultC = parse(fileC.content, fileC.name);

        useStore.getState().setParsedEntities(fileA.id, [
            ...parseResultA.classes,
            ...parseResultA.interfaces,
        ]);
        useStore.getState().setParsedEntities(fileB.id, [
            ...parseResultB.classes,
            ...parseResultB.interfaces,
        ]);
        useStore.getState().setParsedEntities(fileC.id, [
            ...parseResultC.classes,
            ...parseResultC.interfaces,
        ]);

        // When: User switches to project view mode with File A active
        useStore.getState().setActiveFile(fileA.id);
        useStore.getState().setDiagramViewMode('project');

        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        // Verify project view shows all entities
        let scope = {
            mode: 'project' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };
        let filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        let classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        let interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        let relationships = extractRelationships(classes, interfaces);
        let diagram = generateDiagram(classes, interfaces, relationships);

        expect(diagram.nodes).toHaveLength(3);

        // When: User switches to File B (without changing view mode)
        useStore.getState().setActiveFile(fileB.id);

        // Then: Should still show all entities (project view maintained)
        scope = {
            mode: 'project' as const, // View mode should remain 'project'
            activeFileId: fileB.id, // Active file changed, but doesn't affect project view
            importGraph: graph,
        };
        filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        relationships = extractRelationships(classes, interfaces);
        diagram = generateDiagram(classes, interfaces, relationships);

        // Should still show all 3 classes
        expect(diagram.nodes).toHaveLength(3);
        expect(diagram.nodes.map(n => n.data.name).sort()).toEqual([
            'ClassA',
            'ClassB',
            'ClassC',
        ]);

        // When: User switches to File C
        useStore.getState().setActiveFile(fileC.id);

        // Then: Should still show all entities
        scope = {
            mode: 'project' as const,
            activeFileId: fileC.id,
            importGraph: graph,
        };
        filteredResult = filterEntitiesByScope(allParsedEntities, scope);
        classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        relationships = extractRelationships(classes, interfaces);
        diagram = generateDiagram(classes, interfaces, relationships);

        expect(diagram.nodes).toHaveLength(3);
    });

    it('T073: applies spacious layout in project view', () => {
        // Given: Multiple files to trigger layout differences
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

        useStore.getState().setActiveFile(fileA.id);

        const allFiles = useStore.getState().files;
        const allParsedEntities = useStore.getState().parsedEntities;
        const graph = buildDependencyGraph(allFiles, allParsedEntities);

        // When: Generate diagram in file view mode (compact layout)
        const fileViewScope = {
            mode: 'file' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };
        let filteredResult = filterEntitiesByScope(allParsedEntities, fileViewScope);
        let classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        let interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        let relationships = extractRelationships(classes, interfaces);

        // Note: Currently generateDiagram doesn't accept viewMode parameter
        // This test will verify the layout AFTER we implement T080-T082
        const fileViewDiagram = generateDiagram(classes, interfaces, relationships);

        // When: Switch to project view mode (spacious layout)
        useStore.getState().setDiagramViewMode('project');
        const projectViewScope = {
            mode: 'project' as const,
            activeFileId: fileA.id,
            importGraph: graph,
        };
        filteredResult = filterEntitiesByScope(allParsedEntities, projectViewScope);
        classes = filteredResult.entities.filter(
            (e): e is ClassDefinition => 'extendsClass' in e
        );
        interfaces = filteredResult.entities.filter(
            (e): e is InterfaceDefinition => 'extendsInterfaces' in e
        );
        relationships = extractRelationships(classes, interfaces);

        const projectViewDiagram = generateDiagram(classes, interfaces, relationships);

        // Then: Project view should show both classes
        expect(projectViewDiagram.nodes).toHaveLength(2);

        // NOTE: Layout spacing verification will be added after T080-T082 implementation
        // When LayoutEngine accepts viewMode parameter, we'll verify:
        // - Project view has larger nodeSpacing (200 vs 150)
        // - Project view has larger rankSpacing (150 vs 100)
        // For now, we verify the entities are all present
        const entityNames = projectViewDiagram.nodes.map(n => n.data.name).sort();
        expect(entityNames).toEqual(['ClassA', 'ClassB']);
    });
});
