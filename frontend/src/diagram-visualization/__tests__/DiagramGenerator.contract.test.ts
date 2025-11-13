/**
 * Contract tests for DiagramGenerator
 * These tests MUST pass before implementation begins (TDD)
 * Contract: specs/001-uml-graph-visualizer/contracts/diagram-generator.contract.md
 */

import { describe, it, expect } from 'vitest';
import type {
    ClassDefinition,
    InterfaceDefinition,
    Relationship,
    Property,
    Method,
    PropertySignature,
    MethodSignature,
} from '../../shared/types';
import { generateDiagram } from '../DiagramGenerator';
import { formatProperty, formatMethod } from '../UMLFormatter';

describe('DiagramGenerator Contract Tests', () => {
    describe('T053: generateDiagram() with single class', () => {
        it('should generate diagram node for a single class', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::Person',
                    name: 'Person',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: 'name',
                            type: 'string',
                            visibility: 'private',
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [
                        {
                            name: 'getName',
                            returnType: 'string',
                            parameters: [],
                            visibility: 'public',
                            isStatic: false,
                            isAbstract: false,
                            isAsync: false,
                        },
                    ],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];

            const result = generateDiagram(classes, [], []);

            expect(result.nodes).toHaveLength(1);
            expect(result.edges).toHaveLength(0);
            expect(result.layoutDirection).toBe('TB');

            const node = result.nodes[0];
            expect(node.id).toBe('file1::Person');
            expect(node.type).toBe('class');
            expect(node.data.name).toBe('Person');
            expect(node.data.fileId).toBe('file1');
            expect(node.data.properties).toContain('- name: string');
            expect(node.data.methods).toContain('+ getName(): string');
            expect(node.data.stereotype).toBeUndefined();
            expect(node.position).toBeDefined();
            expect(node.width).toBeGreaterThan(0);
            expect(node.height).toBeGreaterThan(0);
        });

        it('should apply layout to position nodes', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::Person',
                    name: 'Person',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];

            const result = generateDiagram(classes, [], []);

            const node = result.nodes[0];
            expect(node.position.x).toBeGreaterThanOrEqual(0);
            expect(node.position.y).toBeGreaterThanOrEqual(0);
        });
    });

    describe('T054: generateDiagram() with class and interface', () => {
        it('should generate nodes for both class and interface', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::Person',
                    name: 'Person',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: [
                        {
                            name: 'name',
                            type: 'string',
                            visibility: 'private',
                            isStatic: false,
                            isReadonly: false,
                        },
                    ],
                    methods: [
                        {
                            name: 'getName',
                            returnType: 'string',
                            parameters: [],
                            visibility: 'public',
                            isStatic: false,
                            isAbstract: false,
                            isAsync: false,
                        },
                    ],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];

            const interfaces: InterfaceDefinition[] = [
                {
                    id: 'file2::IPerson',
                    name: 'IPerson',
                    fileId: 'file2',
                    isExported: true,
                    properties: [
                        {
                            name: 'name',
                            type: 'string',
                            isOptional: false,
                            isReadonly: true,
                        },
                    ],
                    methods: [
                        {
                            name: 'getName',
                            returnType: 'string',
                            parameters: [],
                        },
                    ],
                    typeParameters: [],
                    extendsInterfaces: [],
                },
            ];

            const result = generateDiagram(classes, interfaces, []);

            expect(result.nodes).toHaveLength(2);

            const classNode = result.nodes.find(n => n.id === 'file1::Person');
            const interfaceNode = result.nodes.find(n => n.id === 'file2::IPerson');

            expect(classNode?.type).toBe('class');
            expect(interfaceNode?.type).toBe('interface');
            expect(interfaceNode?.data.stereotype).toBe('<<interface>>');
        });

        it('should handle abstract class stereotype', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::Animal',
                    name: 'Animal',
                    fileId: 'file1',
                    isAbstract: true,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];

            const result = generateDiagram(classes, [], []);

            expect(result.nodes[0].data.stereotype).toBe('<<abstract>>');
        });

        it('should generate edges for relationships', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::Person',
                    name: 'Person',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
                {
                    id: 'file1::Employee',
                    name: 'Employee',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: 'Person',
                    implementsInterfaces: [],
                },
            ];

            const relationships: Relationship[] = [
                {
                    id: 'rel1',
                    type: 'inheritance',
                    sourceId: 'file1::Employee',
                    targetId: 'file1::Person',
                },
            ];

            const result = generateDiagram(classes, [], relationships);

            expect(result.edges).toHaveLength(1);
            expect(result.edges[0]).toMatchObject({
                id: 'rel1',
                source: 'file1::Employee',
                target: 'file1::Person',
                type: 'inheritance',
            });
        });
    });

    describe('formatProperty() tests', () => {
        it('should format public class property', () => {
            const property: Property = {
                name: 'age',
                type: 'number',
                visibility: 'public',
                isStatic: false,
                isReadonly: false,
            };

            const formatted = formatProperty(property, false);
            expect(formatted).toBe('+ age: number');
        });

        it('should format private class property', () => {
            const property: Property = {
                name: 'id',
                type: 'string',
                visibility: 'private',
                isStatic: false,
                isReadonly: false,
            };

            const formatted = formatProperty(property, false);
            expect(formatted).toBe('- id: string');
        });

        it('should format protected class property', () => {
            const property: Property = {
                name: 'data',
                type: 'object',
                visibility: 'protected',
                isStatic: false,
                isReadonly: false,
            };

            const formatted = formatProperty(property, false);
            expect(formatted).toBe('# data: object');
        });

        it('should format static property', () => {
            const property: Property = {
                name: 'count',
                type: 'number',
                visibility: 'private',
                isStatic: true,
                isReadonly: false,
            };

            const formatted = formatProperty(property, false);
            expect(formatted).toContain('count: number');
            expect(formatted).toContain('static');
        });

        it('should format readonly property', () => {
            const property: Property = {
                name: 'id',
                type: 'string',
                visibility: 'public',
                isStatic: false,
                isReadonly: true,
            };

            const formatted = formatProperty(property, false);
            expect(formatted).toContain('id: string');
            expect(formatted).toContain('readOnly');
        });

        it('should format interface property without visibility', () => {
            const property: PropertySignature = {
                name: 'id',
                type: 'string',
                isOptional: false,
                isReadonly: true,
            };

            const formatted = formatProperty(property, true);
            expect(formatted).not.toContain('+');
            expect(formatted).not.toContain('-');
            expect(formatted).not.toContain('#');
            expect(formatted).toContain('id: string');
            expect(formatted).toContain('readOnly');
        });

        it('should format optional interface property', () => {
            const property: PropertySignature = {
                name: 'description',
                type: 'string',
                isOptional: true,
                isReadonly: false,
            };

            const formatted = formatProperty(property, true);
            expect(formatted).toContain('description');
            expect(formatted).toContain('string');
        });
    });

    describe('formatMethod() tests', () => {
        it('should format public method', () => {
            const method: Method = {
                name: 'getName',
                returnType: 'string',
                parameters: [],
                visibility: 'public',
                isStatic: false,
                isAbstract: false,
                isAsync: false,
            };

            const formatted = formatMethod(method, false);
            expect(formatted).toBe('+ getName(): string');
        });

        it('should format private method', () => {
            const method: Method = {
                name: 'validate',
                returnType: 'boolean',
                parameters: [],
                visibility: 'private',
                isStatic: false,
                isAbstract: false,
                isAsync: false,
            };

            const formatted = formatMethod(method, false);
            expect(formatted).toBe('- validate(): boolean');
        });

        it('should format protected method', () => {
            const method: Method = {
                name: 'process',
                returnType: 'void',
                parameters: [],
                visibility: 'protected',
                isStatic: false,
                isAbstract: false,
                isAsync: false,
            };

            const formatted = formatMethod(method, false);
            expect(formatted).toBe('# process(): void');
        });

        it('should format method with parameters', () => {
            const method: Method = {
                name: 'calculate',
                returnType: 'number',
                parameters: [
                    { name: 'x', type: 'number', isOptional: false },
                    { name: 'y', type: 'number', isOptional: false },
                ],
                visibility: 'private',
                isStatic: false,
                isAbstract: false,
                isAsync: false,
            };

            const formatted = formatMethod(method, false);
            expect(formatted).toBe('- calculate(x: number, y: number): number');
        });

        it('should format method with optional parameters', () => {
            const method: Method = {
                name: 'setup',
                returnType: 'void',
                parameters: [
                    { name: 'port', type: 'number', isOptional: true, defaultValue: '3000' },
                ],
                visibility: 'public',
                isStatic: false,
                isAbstract: false,
                isAsync: false,
            };

            const formatted = formatMethod(method, false);
            expect(formatted).toContain('setup');
            expect(formatted).toContain('port?');
            expect(formatted).toContain('number');
            expect(formatted).toContain('void');
        });

        it('should format static method', () => {
            const method: Method = {
                name: 'create',
                returnType: 'Person',
                parameters: [],
                visibility: 'public',
                isStatic: true,
                isAbstract: false,
                isAsync: false,
            };

            const formatted = formatMethod(method, false);
            expect(formatted).toContain('create');
            expect(formatted).toContain('Person');
            expect(formatted).toContain('static');
        });

        it('should format abstract method', () => {
            const method: Method = {
                name: 'render',
                returnType: 'void',
                parameters: [],
                visibility: 'public',
                isStatic: false,
                isAbstract: true,
                isAsync: false,
            };

            const formatted = formatMethod(method, false);
            expect(formatted).toContain('render');
            expect(formatted).toContain('void');
            expect(formatted).toContain('abstract');
        });

        it('should format interface method without visibility', () => {
            const method: MethodSignature = {
                name: 'save',
                returnType: 'Promise<void>',
                parameters: [],
            };

            const formatted = formatMethod(method, true);
            expect(formatted).not.toContain('+');
            expect(formatted).not.toContain('-');
            expect(formatted).not.toContain('#');
            expect(formatted).toBe('save(): Promise<void>');
        });
    });

    describe('Edge cases and performance', () => {
        it('should handle empty input arrays', () => {
            const result = generateDiagram([], [], []);

            expect(result.nodes).toHaveLength(0);
            expect(result.edges).toHaveLength(0);
            expect(result.layoutDirection).toBe('TB');
        });

        it('should skip relationships with missing source or target', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::Person',
                    name: 'Person',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];

            const relationships: Relationship[] = [
                {
                    id: 'rel1',
                    type: 'inheritance',
                    sourceId: 'file1::Person',
                    targetId: 'file1::NonExistent', // Missing target
                },
            ];

            const result = generateDiagram(classes, [], relationships);

            // Should skip invalid relationship
            expect(result.edges).toHaveLength(0);
        });

        it('should calculate node dimensions based on content', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::LargeClass',
                    name: 'LargeClass',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: Array(10).fill(null).map((_, i) => ({
                        name: `property${i}`,
                        type: 'string',
                        visibility: 'public' as const,
                        isStatic: false,
                        isReadonly: false,
                    })),
                    methods: Array(10).fill(null).map((_, i) => ({
                        name: `method${i}`,
                        returnType: 'void',
                        parameters: [],
                        visibility: 'public' as const,
                        isStatic: false,
                        isAbstract: false,
                        isAsync: false,
                    })),
                    typeParameters: [],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];

            const result = generateDiagram(classes, [], []);

            const node = result.nodes[0];
            expect(node.width).toBeGreaterThan(150);
            expect(node.height).toBeGreaterThan(200);
        });

        it('should handle classes with generic type parameters', () => {
            const classes: ClassDefinition[] = [
                {
                    id: 'file1::Container',
                    name: 'Container',
                    fileId: 'file1',
                    isAbstract: false,
                    isExported: true,
                    properties: [],
                    methods: [],
                    typeParameters: ['T', 'K'],
                    extendsClass: null,
                    implementsInterfaces: [],
                },
            ];

            const result = generateDiagram(classes, [], []);

            expect(result.nodes[0].data.name).toContain('Container');
            // Type parameters might be displayed as "Container<T, K>" or similar
        });
    });
});
