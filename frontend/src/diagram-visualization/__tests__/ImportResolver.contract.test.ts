/**
 * Contract Tests for ImportResolver
 * 
 * These tests define the expected behavior of the ImportResolver module
 * following Test-Driven Development (TDD) principles.
 * 
 * Test execution order:
 * 1. Write these tests FIRST (they will FAIL - red phase)
 * 2. Implement ImportResolver functions
 * 3. Verify tests PASS (green phase)
 * 4. Refactor for clean code
 */

import { describe, it, expect } from 'vitest';
import type { ImportInfo, DependencyNode, ProjectFile } from '../../shared/types';

// Import the functions we're testing (will be implemented after tests)
import {
    parseImports,
    resolveImportPaths,
    buildDependencyGraph,
    collectRelatedEntities,
} from '../ImportResolver';

describe('ImportResolver - Contract Tests', () => {
    describe('parseImports() - Named imports', () => {
        it('should parse single named import', () => {
            const sourceCode = `import { Person } from './Person';`;
            const result = parseImports(sourceCode, 'src/Manager.ts');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                importPath: './Person',
                importedNames: ['Person'],
                isTypeOnly: false,
                isNamespaceImport: false,
                lineNumber: 1,
            });
        });

        it('should parse multiple named imports', () => {
            const sourceCode = `import { Person, Employee, Manager } from './models';`;
            const result = parseImports(sourceCode, 'src/index.ts');

            expect(result).toHaveLength(1);
            expect(result[0].importedNames).toEqual(['Person', 'Employee', 'Manager']);
        });

        it('should parse aliased named imports', () => {
            const sourceCode = `import { Person as P, Employee as E } from './models';`;
            const result = parseImports(sourceCode, 'src/index.ts');

            expect(result).toHaveLength(1);
            expect(result[0].importedNames).toEqual(['Person', 'Employee']);
        });
    });

    describe('parseImports() - Default imports', () => {
        it('should parse default import', () => {
            const sourceCode = `import Person from './Person';`;
            const result = parseImports(sourceCode, 'src/Manager.ts');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                importPath: './Person',
                importedNames: ['default'],
                isTypeOnly: false,
                isNamespaceImport: false,
            });
        });

        it('should parse mixed default and named imports', () => {
            const sourceCode = `import React, { useState, useEffect } from 'react';`;
            const result = parseImports(sourceCode, 'src/App.tsx');

            expect(result).toHaveLength(1);
            expect(result[0].importedNames).toContain('default');
            expect(result[0].importedNames).toContain('useState');
            expect(result[0].importedNames).toContain('useEffect');
        });
    });

    describe('parseImports() - Namespace imports', () => {
        it('should parse namespace import', () => {
            const sourceCode = `import * as models from './models';`;
            const result = parseImports(sourceCode, 'src/index.ts');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                importPath: './models',
                importedNames: [],
                isNamespaceImport: true,
            });
        });
    });

    describe('parseImports() - Type-only imports', () => {
        it('should parse type-only import', () => {
            const sourceCode = `import type { IPerson } from './interfaces';`;
            const result = parseImports(sourceCode, 'src/Manager.ts');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                importPath: './interfaces',
                importedNames: ['IPerson'],
                isTypeOnly: true,
            });
        });

        it('should parse inline type imports', () => {
            const sourceCode = `import { type IPerson, Employee } from './models';`;
            const result = parseImports(sourceCode, 'src/index.ts');

            expect(result).toHaveLength(1);
            expect(result[0].importedNames).toContain('IPerson');
            expect(result[0].importedNames).toContain('Employee');
        });
    });

    describe('resolveImportPaths() - Relative paths', () => {
        it('should resolve same-directory import', () => {
            const imports: ImportInfo[] = [
                {
                    importPath: './Person',
                    resolvedPath: null,
                    resolvedFileId: null,
                    importedNames: ['Person'],
                    isTypeOnly: false,
                    isNamespaceImport: false,
                    lineNumber: 1,
                },
            ];

            const filePathMap = new Map([
                ['src/models/Person.ts', 'file-1'],
                ['src/models/Employee.ts', 'file-2'],
            ]);

            const result = resolveImportPaths(imports, 'src/models/Employee.ts', filePathMap);

            expect(result[0].resolvedPath).toBe('src/models/Person.ts');
            expect(result[0].resolvedFileId).toBe('file-1');
        });

        it('should resolve parent-directory import', () => {
            const imports: ImportInfo[] = [
                {
                    importPath: '../Person',
                    resolvedPath: null,
                    resolvedFileId: null,
                    importedNames: ['Person'],
                    isTypeOnly: false,
                    isNamespaceImport: false,
                    lineNumber: 1,
                },
            ];

            const filePathMap = new Map([
                ['src/Person.ts', 'file-1'],
                ['src/models/Employee.ts', 'file-2'],
            ]);

            const result = resolveImportPaths(imports, 'src/models/Employee.ts', filePathMap);

            expect(result[0].resolvedPath).toBe('src/Person.ts');
            expect(result[0].resolvedFileId).toBe('file-1');
        });

        it('should resolve nested relative import', () => {
            const imports: ImportInfo[] = [
                {
                    importPath: '../../shared/types',
                    resolvedPath: null,
                    resolvedFileId: null,
                    importedNames: ['User'],
                    isTypeOnly: false,
                    isNamespaceImport: false,
                    lineNumber: 1,
                },
            ];

            const filePathMap = new Map([
                ['src/shared/types.ts', 'file-1'],
                ['src/features/users/UserService.ts', 'file-2'],
            ]);

            const result = resolveImportPaths(imports, 'src/features/users/UserService.ts', filePathMap);

            expect(result[0].resolvedPath).toBe('src/shared/types.ts');
            expect(result[0].resolvedFileId).toBe('file-1');
        });
    });

    describe('resolveImportPaths() - Extension handling', () => {
        it('should handle import without extension', () => {
            const imports: ImportInfo[] = [
                {
                    importPath: './Person',
                    resolvedPath: null,
                    resolvedFileId: null,
                    importedNames: ['Person'],
                    isTypeOnly: false,
                    isNamespaceImport: false,
                    lineNumber: 1,
                },
            ];

            const filePathMap = new Map([
                ['src/Person.ts', 'file-1'],
            ]);

            const result = resolveImportPaths(imports, 'src/Employee.ts', filePathMap);

            expect(result[0].resolvedPath).toBe('src/Person.ts');
            expect(result[0].resolvedFileId).toBe('file-1');
        });

        it('should handle import with .ts extension', () => {
            const imports: ImportInfo[] = [
                {
                    importPath: './Person.ts',
                    resolvedPath: null,
                    resolvedFileId: null,
                    importedNames: ['Person'],
                    isTypeOnly: false,
                    isNamespaceImport: false,
                    lineNumber: 1,
                },
            ];

            const filePathMap = new Map([
                ['src/Person.ts', 'file-1'],
            ]);

            const result = resolveImportPaths(imports, 'src/Employee.ts', filePathMap);

            expect(result[0].resolvedPath).toBe('src/Person.ts');
            expect(result[0].resolvedFileId).toBe('file-1');
        });

        it('should return null for unresolved imports', () => {
            const imports: ImportInfo[] = [
                {
                    importPath: './NonExistent',
                    resolvedPath: null,
                    resolvedFileId: null,
                    importedNames: ['Something'],
                    isTypeOnly: false,
                    isNamespaceImport: false,
                    lineNumber: 1,
                },
            ];

            const filePathMap = new Map([
                ['src/Person.ts', 'file-1'],
            ]);

            const result = resolveImportPaths(imports, 'src/Employee.ts', filePathMap);

            expect(result[0].resolvedPath).toBeNull();
            expect(result[0].resolvedFileId).toBeNull();
        });

        it('should ignore external imports (non-relative)', () => {
            const imports: ImportInfo[] = [
                {
                    importPath: 'react',
                    resolvedPath: null,
                    resolvedFileId: null,
                    importedNames: ['useState'],
                    isTypeOnly: false,
                    isNamespaceImport: false,
                    lineNumber: 1,
                },
            ];

            const filePathMap = new Map([
                ['src/Person.ts', 'file-1'],
            ]);

            const result = resolveImportPaths(imports, 'src/Employee.ts', filePathMap);

            expect(result[0].resolvedPath).toBeNull();
            expect(result[0].resolvedFileId).toBeNull();
        });
    });

    describe('buildDependencyGraph() - Multi-file project', () => {
        it('should build graph for two-file project with one import', () => {
            const files: ProjectFile[] = [
                {
                    id: 'file-1',
                    name: 'Person.ts',
                    path: 'src/Person.ts',
                    content: 'export class Person { name: string; }',
                    lastModified: Date.now(),
                    isActive: false,
                },
                {
                    id: 'file-2',
                    name: 'Employee.ts',
                    path: 'src/Employee.ts',
                    content: `import { Person } from './Person';\nexport class Employee extends Person { id: number; }`,
                    lastModified: Date.now(),
                    isActive: true,
                },
            ];

            const parsedEntities = new Map([
                ['file-1', [{ id: 'Person', name: 'Person', fileId: 'file-1' } as any]],
                ['file-2', [{ id: 'Employee', name: 'Employee', fileId: 'file-2' } as any]],
            ]);

            const graph = buildDependencyGraph(files, parsedEntities);

            expect(graph.size).toBe(2);
            expect(graph.has('file-1')).toBe(true);
            expect(graph.has('file-2')).toBe(true);

            const employeeNode = graph.get('file-2');
            expect(employeeNode?.importedFileIds.has('file-1')).toBe(true);
        });

        it('should handle multiple imports from same file', () => {
            const files: ProjectFile[] = [
                {
                    id: 'file-1',
                    name: 'models.ts',
                    path: 'src/models.ts',
                    content: 'export class Person {}\nexport class Address {}',
                    lastModified: Date.now(),
                    isActive: false,
                },
                {
                    id: 'file-2',
                    name: 'Employee.ts',
                    path: 'src/Employee.ts',
                    content: `import { Person, Address } from './models';`,
                    lastModified: Date.now(),
                    isActive: true,
                },
            ];

            const parsedEntities = new Map([
                ['file-1', [
                    { id: 'Person', name: 'Person', fileId: 'file-1' } as any,
                    { id: 'Address', name: 'Address', fileId: 'file-1' } as any,
                ]],
                ['file-2', [{ id: 'Employee', name: 'Employee', fileId: 'file-2' } as any]],
            ]);

            const graph = buildDependencyGraph(files, parsedEntities);

            const employeeNode = graph.get('file-2');
            expect(employeeNode?.imports).toHaveLength(1);
            expect(employeeNode?.importedFileIds.size).toBe(1);
        });
    });

    describe('collectRelatedEntities() - Circular dependencies', () => {
        it('should handle circular dependency without infinite loop', () => {
            // File A imports B, File B imports A
            const graph = new Map<string, DependencyNode>([
                [
                    'file-a',
                    {
                        fileId: 'file-a',
                        filePath: 'src/A.ts',
                        imports: [],
                        importedFileIds: new Set(['file-b']),
                        entities: [{ id: 'A', name: 'A', fileId: 'file-a' } as any],
                    },
                ],
                [
                    'file-b',
                    {
                        fileId: 'file-b',
                        filePath: 'src/B.ts',
                        imports: [],
                        importedFileIds: new Set(['file-a']),
                        entities: [{ id: 'B', name: 'B', fileId: 'file-b' } as any],
                    },
                ],
            ]);

            const entities = collectRelatedEntities('file-a', graph);

            expect(entities).toHaveLength(2);
            expect(entities.map(e => e.name)).toContain('A');
            expect(entities.map(e => e.name)).toContain('B');
        });

        it('should handle three-way circular dependency', () => {
            // A → B → C → A
            const graph = new Map<string, DependencyNode>([
                [
                    'file-a',
                    {
                        fileId: 'file-a',
                        filePath: 'src/A.ts',
                        imports: [],
                        importedFileIds: new Set(['file-b']),
                        entities: [{ id: 'A', name: 'A', fileId: 'file-a' } as any],
                    },
                ],
                [
                    'file-b',
                    {
                        fileId: 'file-b',
                        filePath: 'src/B.ts',
                        imports: [],
                        importedFileIds: new Set(['file-c']),
                        entities: [{ id: 'B', name: 'B', fileId: 'file-b' } as any],
                    },
                ],
                [
                    'file-c',
                    {
                        fileId: 'file-c',
                        filePath: 'src/C.ts',
                        imports: [],
                        importedFileIds: new Set(['file-a']),
                        entities: [{ id: 'C', name: 'C', fileId: 'file-c' } as any],
                    },
                ],
            ]);

            const entities = collectRelatedEntities('file-a', graph);

            expect(entities).toHaveLength(3);
            expect(entities.map(e => e.name)).toEqual(expect.arrayContaining(['A', 'B', 'C']));
        });
    });

    describe('Performance - Import resolution', () => {
        it('should complete in <100ms for 100 files', () => {
            const files: ProjectFile[] = [];
            const parsedEntities = new Map();

            // Generate 100 files with imports
            for (let i = 0; i < 100; i++) {
                const fileId = `file-${i}`;
                // const nextFileId = i < 99 ? `file-${i + 1}` : 'file-0';

                files.push({
                    id: fileId,
                    name: `Class${i}.ts`,
                    path: `src/Class${i}.ts`,
                    content: `import { Class${i + 1} } from './Class${i + 1}';\nexport class Class${i} {}`,
                    lastModified: Date.now(),
                    isActive: false,
                });

                parsedEntities.set(fileId, [
                    { id: `Class${i}`, name: `Class${i}`, fileId } as any,
                ]);
            }

            const startTime = performance.now();
            const graph = buildDependencyGraph(files, parsedEntities);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100);
            expect(graph.size).toBe(100);
        });

        it('should handle deep import chains efficiently', () => {
            // Create chain: A → B → C → D → E (5 levels deep)
            const graph = new Map<string, DependencyNode>();

            for (let i = 0; i < 5; i++) {
                const fileId = `file-${i}`;
                const nextFileId = i < 4 ? `file-${i + 1}` : null;

                graph.set(fileId, {
                    fileId,
                    filePath: `src/Class${i}.ts`,
                    imports: [],
                    importedFileIds: nextFileId ? new Set([nextFileId]) : new Set(),
                    entities: [{ id: `Class${i}`, name: `Class${i}`, fileId } as any],
                });
            }

            const startTime = performance.now();
            const entities = collectRelatedEntities('file-0', graph, 5);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(50);
            expect(entities).toHaveLength(5);
        });
    });
});
