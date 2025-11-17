/**
 * Unit Tests for EntityFilter
 * 
 * These tests define the expected behavior of the EntityFilter module
 * following Test-Driven Development (TDD) principles.
 * 
 * Test execution order:
 * 1. Write these tests FIRST (they will FAIL - red phase)
 * 2. Implement EntityFilter functions
 * 3. Verify tests PASS (green phase)
 * 4. Refactor for clean code
 */

import { describe, it, expect } from 'vitest';
import type {
    DiagramScope,
    DependencyNode,
    ClassDefinition,
    InterfaceDefinition,
} from '../../shared/types';

// Import the function we're testing (will be implemented after tests)
import { filterEntitiesByScope } from '../EntityFilter';

describe('EntityFilter - Unit Tests', () => {
    describe('Project view mode', () => {
        it('should return all entities when in project view', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                [
                    'file-1',
                    [
                        {
                            id: 'Person',
                            name: 'Person',
                            fileId: 'file-1',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
                [
                    'file-2',
                    [
                        {
                            id: 'Employee',
                            name: 'Employee',
                            fileId: 'file-2',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: 'Person',
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'project',
                activeFileId: null,
                importGraph: undefined,
            };

            const result = filterEntitiesByScope(allEntities, scope);

            expect(result.entities).toHaveLength(2);
            expect(result.entities.map((e) => e.name)).toEqual(
                expect.arrayContaining(['Person', 'Employee'])
            );
            expect(result.totalEntitiesBeforeFilter).toBe(2);
            expect(result.inclusionReasons.size).toBe(2);
            expect(result.inclusionReasons.get('Person')).toEqual({ type: 'project-view' });
            expect(result.inclusionReasons.get('Employee')).toEqual({ type: 'project-view' });
        });

        it('should include all entities from all files (large project)', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>();

            // Create 50 entities across 10 files
            for (let i = 0; i < 10; i++) {
                const fileId = `file-${i}`;
                const entities: ClassDefinition[] = [];

                for (let j = 0; j < 5; j++) {
                    entities.push({
                        id: `Class${i}-${j}`,
                        name: `Class${i}_${j}`,
                        fileId,
                        isAbstract: false,
                        isExported: true,
                        properties: [],
                        methods: [],
                        typeParameters: [],
                        extendsClass: null,
                        implementsInterfaces: [],
                    } as ClassDefinition);
                }

                allEntities.set(fileId, entities);
            }

            const scope: DiagramScope = {
                mode: 'project',
                activeFileId: null,
                importGraph: undefined,
            };

            const result = filterEntitiesByScope(allEntities, scope);

            expect(result.entities).toHaveLength(50);
            expect(result.totalEntitiesBeforeFilter).toBe(50);
        });
    });

    describe('File view with no imports', () => {
        it('should return only entities from active file', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                [
                    'file-1',
                    [
                        {
                            id: 'Person',
                            name: 'Person',
                            fileId: 'file-1',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
                [
                    'file-2',
                    [
                        {
                            id: 'Employee',
                            name: 'Employee',
                            fileId: 'file-2',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-1',
                importGraph: undefined, // No imports
            };

            const result = filterEntitiesByScope(allEntities, scope);

            expect(result.entities).toHaveLength(1);
            expect(result.entities[0].name).toBe('Person');
            expect(result.inclusionReasons.get('Person')).toEqual({
                type: 'local',
                fileId: 'file-1',
            });
        });

        it('should return empty array when active file has no entities', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                ['file-1', []],
                [
                    'file-2',
                    [
                        {
                            id: 'Employee',
                            name: 'Employee',
                            fileId: 'file-2',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-1',
                importGraph: undefined,
            };

            const result = filterEntitiesByScope(allEntities, scope);

            expect(result.entities).toHaveLength(0);
            expect(result.totalEntitiesBeforeFilter).toBe(1);
        });
    });

    describe('File view with imports and relationships', () => {
        it('should include imported entity with inheritance relationship', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                [
                    'file-1',
                    [
                        {
                            id: 'Person',
                            name: 'Person',
                            fileId: 'file-1',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
                [
                    'file-2',
                    [
                        {
                            id: 'Employee',
                            name: 'Employee',
                            fileId: 'file-2',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: 'Person', // Extends Person from file-1
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const importGraph = new Map<string, DependencyNode>([
                [
                    'file-1',
                    {
                        fileId: 'file-1',
                        filePath: 'src/Person.ts',
                        imports: [],
                        importedFileIds: new Set(),
                        entities: allEntities.get('file-1')!,
                    },
                ],
                [
                    'file-2',
                    {
                        fileId: 'file-2',
                        filePath: 'src/Employee.ts',
                        imports: [],
                        importedFileIds: new Set(['file-1']), // Imports from file-1
                        entities: allEntities.get('file-2')!,
                    },
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-2',
                importGraph,
            };

            const result = filterEntitiesByScope(allEntities, scope, importGraph);

            expect(result.entities).toHaveLength(2);
            expect(result.entities.map((e) => e.name)).toEqual(
                expect.arrayContaining(['Employee', 'Person'])
            );
            expect(result.inclusionReasons.get('Employee')).toEqual({
                type: 'local',
                fileId: 'file-2',
            });
            expect(result.inclusionReasons.get('Person')).toMatchObject({
                type: 'imported',
                importedBy: 'file-2',
                hasRelationship: true,
            });
        });

        it('should include imported entity with interface realization', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                [
                    'file-1',
                    [
                        {
                            id: 'IPerson',
                            name: 'IPerson',
                            fileId: 'file-1',
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsInterfaces: [],
                        } as InterfaceDefinition,
                    ],
                ],
                [
                    'file-2',
                    [
                        {
                            id: 'Employee',
                            name: 'Employee',
                            fileId: 'file-2',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: ['IPerson'], // Implements IPerson from file-1
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const importGraph = new Map<string, DependencyNode>([
                [
                    'file-1',
                    {
                        fileId: 'file-1',
                        filePath: 'src/IPerson.ts',
                        imports: [],
                        importedFileIds: new Set(),
                        entities: allEntities.get('file-1')!,
                    },
                ],
                [
                    'file-2',
                    {
                        fileId: 'file-2',
                        filePath: 'src/Employee.ts',
                        imports: [],
                        importedFileIds: new Set(['file-1']),
                        entities: allEntities.get('file-2')!,
                    },
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-2',
                importGraph,
            };

            const result = filterEntitiesByScope(allEntities, scope, importGraph);

            expect(result.entities).toHaveLength(2);
            expect(result.entities.map((e) => e.name)).toEqual(
                expect.arrayContaining(['Employee', 'IPerson'])
            );
        });

        it('should include imported entity with association (property type)', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                [
                    'file-1',
                    [
                        {
                            id: 'Address',
                            name: 'Address',
                            fileId: 'file-1',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
                [
                    'file-2',
                    [
                        {
                            id: 'Person',
                            name: 'Person',
                            fileId: 'file-2',
                            isAbstract: false,
                            isExported: true,
                            properties: [
                                {
                                    name: 'address',
                                    type: 'Address', // Property of type Address
                                    visibility: 'public',
                                    isStatic: false,
                                    isReadonly: false,
                                },
                            ],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const importGraph = new Map<string, DependencyNode>([
                [
                    'file-1',
                    {
                        fileId: 'file-1',
                        filePath: 'src/Address.ts',
                        imports: [],
                        importedFileIds: new Set(),
                        entities: allEntities.get('file-1')!,
                    },
                ],
                [
                    'file-2',
                    {
                        fileId: 'file-2',
                        filePath: 'src/Person.ts',
                        imports: [],
                        importedFileIds: new Set(['file-1']),
                        entities: allEntities.get('file-2')!,
                    },
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-2',
                importGraph,
            };

            const result = filterEntitiesByScope(allEntities, scope, importGraph);

            expect(result.entities).toHaveLength(2);
            expect(result.entities.map((e) => e.name)).toEqual(
                expect.arrayContaining(['Person', 'Address'])
            );
        });

        it('should exclude imported entity with no relationships', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                [
                    'file-1',
                    [
                        {
                            id: 'UnusedClass',
                            name: 'UnusedClass',
                            fileId: 'file-1',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
                [
                    'file-2',
                    [
                        {
                            id: 'Employee',
                            name: 'Employee',
                            fileId: 'file-2',
                            isAbstract: false,
                            isExported: true,
                            properties: [],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const importGraph = new Map<string, DependencyNode>([
                [
                    'file-1',
                    {
                        fileId: 'file-1',
                        filePath: 'src/UnusedClass.ts',
                        imports: [],
                        importedFileIds: new Set(),
                        entities: allEntities.get('file-1')!,
                    },
                ],
                [
                    'file-2',
                    {
                        fileId: 'file-2',
                        filePath: 'src/Employee.ts',
                        imports: [],
                        importedFileIds: new Set(['file-1']), // Imports but doesn't use
                        entities: allEntities.get('file-2')!,
                    },
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-2',
                importGraph,
            };

            const result = filterEntitiesByScope(allEntities, scope, importGraph);

            expect(result.entities).toHaveLength(1);
            expect(result.entities[0].name).toBe('Employee');
        });
    });

    describe('Circular dependencies', () => {
        it('should handle circular import without infinite loop', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>([
                [
                    'file-a',
                    [
                        {
                            id: 'A',
                            name: 'A',
                            fileId: 'file-a',
                            isAbstract: false,
                            isExported: true,
                            properties: [{ name: 'b', type: 'B', visibility: 'public', isStatic: false, isReadonly: false }],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
                [
                    'file-b',
                    [
                        {
                            id: 'B',
                            name: 'B',
                            fileId: 'file-b',
                            isAbstract: false,
                            isExported: true,
                            properties: [{ name: 'a', type: 'A', visibility: 'public', isStatic: false, isReadonly: false }],
                            methods: [],
                            typeParameters: [],
                            extendsClass: null,
                            implementsInterfaces: [],
                        } as ClassDefinition,
                    ],
                ],
            ]);

            const importGraph = new Map<string, DependencyNode>([
                [
                    'file-a',
                    {
                        fileId: 'file-a',
                        filePath: 'src/A.ts',
                        imports: [],
                        importedFileIds: new Set(['file-b']),
                        entities: allEntities.get('file-a')!,
                    },
                ],
                [
                    'file-b',
                    {
                        fileId: 'file-b',
                        filePath: 'src/B.ts',
                        imports: [],
                        importedFileIds: new Set(['file-a']),
                        entities: allEntities.get('file-b')!,
                    },
                ],
            ]);

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-a',
                importGraph,
            };

            const startTime = performance.now();
            const result = filterEntitiesByScope(allEntities, scope, importGraph);
            const endTime = performance.now();

            expect(result.entities).toHaveLength(2);
            expect(result.entities.map((e) => e.name)).toEqual(expect.arrayContaining(['A', 'B']));
            expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
        });
    });

    describe('Performance', () => {
        it('should complete in <50ms for 50 entities', () => {
            const allEntities = new Map<string, (ClassDefinition | InterfaceDefinition)[]>();

            // Create 50 entities
            for (let i = 0; i < 50; i++) {
                const fileId = `file-${i}`;
                allEntities.set(fileId, [
                    {
                        id: `Class${i}`,
                        name: `Class${i}`,
                        fileId,
                        isAbstract: false,
                        isExported: true,
                        properties: [],
                        methods: [],
                        typeParameters: [],
                        extendsClass: null,
                        implementsInterfaces: [],
                    } as ClassDefinition,
                ]);
            }

            const scope: DiagramScope = {
                mode: 'file',
                activeFileId: 'file-0',
                importGraph: undefined,
            };

            const startTime = performance.now();
            const result = filterEntitiesByScope(allEntities, scope);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(50);
            expect(result.filterTimeMs).toBeLessThan(50);
            expect(result.entities).toHaveLength(1);
        });
    });
});
