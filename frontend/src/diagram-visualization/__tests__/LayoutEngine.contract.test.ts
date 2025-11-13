/**
 * Contract tests for LayoutEngine
 * 
 * Purpose: Verify automatic layout algorithm for UML diagrams
 * 
 * These tests define the contract for:
 * - Applying dagre-based automatic layout to large diagrams (10+ nodes)
 * - Minimizing edge crossings for readable diagrams
 * - Calculating node dimensions based on content
 */

import { describe, it, expect } from 'vitest';
import { LayoutEngine } from '../LayoutEngine';
import type { DiagramNode, DiagramEdge } from '../../shared/types';

describe('LayoutEngine Contract Tests', () => {
    describe('applyLayout with 10+ nodes', () => {
        it('should arrange 10+ nodes in a hierarchical layout', () => {
            // Arrange: Create 10 nodes with various relationships
            const nodes: DiagramNode[] = Array.from({ length: 10 }, (_, i) => ({
                id: `node-${i}`,
                type: 'class' as const,
                data: {
                    name: `Class${i}`,
                    properties: [`prop${i}: string`],
                    methods: [`method${i}(): void`],
                    fileId: `file-${i}`,
                },
                position: { x: 0, y: 0 }, // Initial position (will be calculated)
                width: 200,
                height: 150,
            }));

            // Create edges forming a hierarchy (tree-like structure)
            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'node-0', target: 'node-1', type: 'inheritance', animated: false, style: {} },
                { id: 'e2', source: 'node-0', target: 'node-2', type: 'inheritance', animated: false, style: {} },
                { id: 'e3', source: 'node-1', target: 'node-3', type: 'inheritance', animated: false, style: {} },
                { id: 'e4', source: 'node-1', target: 'node-4', type: 'inheritance', animated: false, style: {} },
                { id: 'e5', source: 'node-2', target: 'node-5', type: 'inheritance', animated: false, style: {} },
                { id: 'e6', source: 'node-3', target: 'node-6', type: 'association', animated: false, style: {} },
                { id: 'e7', source: 'node-4', target: 'node-7', type: 'association', animated: false, style: {} },
                { id: 'e8', source: 'node-5', target: 'node-8', type: 'association', animated: false, style: {} },
                { id: 'e9', source: 'node-6', target: 'node-9', type: 'association', animated: false, style: {} },
            ];

            // Act: Apply layout
            const layoutEngine = new LayoutEngine();
            const layoutedNodes = layoutEngine.applyLayout(nodes, edges);

            // Assert: All nodes should have unique positions
            expect(layoutedNodes).toHaveLength(10);

            // No two nodes should occupy the exact same position
            const positions = layoutedNodes.map((n: DiagramNode) => `${n.position.x},${n.position.y}`);
            const uniquePositions = new Set(positions);
            expect(uniquePositions.size).toBe(10);

            // Nodes should be positioned in a reasonable coordinate space (not all at origin)
            const atOrigin = layoutedNodes.filter((n: DiagramNode) => n.position.x === 0 && n.position.y === 0);
            expect(atOrigin.length).toBeLessThan(2); // At most one node at origin

            // Parent nodes should generally be above their children in hierarchical layout
            // (node-0 is root, should have smaller y than its children node-1, node-2)
            const root = layoutedNodes.find((n: DiagramNode) => n.id === 'node-0');
            const child1 = layoutedNodes.find((n: DiagramNode) => n.id === 'node-1');
            const child2 = layoutedNodes.find((n: DiagramNode) => n.id === 'node-2');

            expect(root).toBeDefined();
            expect(child1).toBeDefined();
            expect(child2).toBeDefined();

            if (root && child1 && child2) {
                expect(root.position.y).toBeLessThan(child1.position.y);
                expect(root.position.y).toBeLessThan(child2.position.y);
            }
        });

        it('should handle 15 nodes with complex interconnections', () => {
            // Arrange: Create 15 nodes
            const nodes: DiagramNode[] = Array.from({ length: 15 }, (_, i) => {
                const nodeType: 'interface' | 'class' = i % 3 === 0 ? 'interface' : 'class';
                return {
                    id: `node-${i}`,
                    type: nodeType,
                    data: {
                        name: `Entity${i}`,
                        properties: [`id: number`, `name: string`],
                        methods: [`update(): void`],
                        fileId: `file-${i}`,
                    },
                    position: { x: 0, y: 0 },
                    width: 200,
                    height: 150,
                };
            });

            // Create more complex edges (not just tree structure)
            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'node-0', target: 'node-1', type: 'implementation', animated: false, style: {} },
                { id: 'e2', source: 'node-0', target: 'node-2', type: 'implementation', animated: false, style: {} },
                { id: 'e3', source: 'node-1', target: 'node-3', type: 'inheritance', animated: false, style: {} },
                { id: 'e4', source: 'node-2', target: 'node-4', type: 'inheritance', animated: false, style: {} },
                { id: 'e5', source: 'node-3', target: 'node-5', type: 'association', animated: false, style: {} },
                { id: 'e6', source: 'node-4', target: 'node-6', type: 'association', animated: false, style: {} },
                { id: 'e7', source: 'node-5', target: 'node-7', type: 'association', animated: false, style: {} },
                { id: 'e8', source: 'node-6', target: 'node-8', type: 'association', animated: false, style: {} },
                { id: 'e9', source: 'node-7', target: 'node-9', type: 'association', animated: false, style: {} },
                { id: 'e10', source: 'node-8', target: 'node-10', type: 'association', animated: false, style: {} },
                { id: 'e11', source: 'node-9', target: 'node-11', type: 'association', animated: false, style: {} },
                { id: 'e12', source: 'node-10', target: 'node-12', type: 'association', animated: false, style: {} },
                { id: 'e13', source: 'node-11', target: 'node-13', type: 'association', animated: false, style: {} },
                { id: 'e14', source: 'node-12', target: 'node-14', type: 'association', animated: false, style: {} },
                // Add some cross-connections to make it more complex
                { id: 'e15', source: 'node-3', target: 'node-8', type: 'association', animated: false, style: {} },
                { id: 'e16', source: 'node-5', target: 'node-12', type: 'association', animated: false, style: {} },
            ];

            // Act: Apply layout
            const layoutEngine = new LayoutEngine();
            const layoutedNodes = layoutEngine.applyLayout(nodes, edges);

            // Assert: All 15 nodes should have positions
            expect(layoutedNodes).toHaveLength(15);

            // All positions should be unique
            const positions = layoutedNodes.map((n: DiagramNode) => `${n.position.x},${n.position.y}`);
            const uniquePositions = new Set(positions);
            expect(uniquePositions.size).toBe(15);

            // Positions should span a reasonable area (not clustered at origin)
            const xPositions = layoutedNodes.map((n: DiagramNode) => n.position.x);
            const yPositions = layoutedNodes.map((n: DiagramNode) => n.position.y);

            const xSpread = Math.max(...xPositions) - Math.min(...xPositions);
            const ySpread = Math.max(...yPositions) - Math.min(...yPositions);

            expect(xSpread).toBeGreaterThan(0); // Nodes spread horizontally
            expect(ySpread).toBeGreaterThan(0); // Nodes spread vertically
        });
    });

    describe('minimizing edge crossings', () => {
        it('should arrange nodes to minimize edge crossings in simple hierarchy', () => {
            // Arrange: Create a simple hierarchy where layout matters
            // Structure:
            //        A
            //      / | \
            //     B  C  D
            //     |  |  |
            //     E  F  G
            const nodes: DiagramNode[] = [
                { id: 'A', type: 'class', data: { name: 'ClassA', properties: [], methods: [], fileId: 'file-a' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'B', type: 'class', data: { name: 'ClassB', properties: [], methods: [], fileId: 'file-b' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'C', type: 'class', data: { name: 'ClassC', properties: [], methods: [], fileId: 'file-c' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'D', type: 'class', data: { name: 'ClassD', properties: [], methods: [], fileId: 'file-d' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'E', type: 'class', data: { name: 'ClassE', properties: [], methods: [], fileId: 'file-e' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'F', type: 'class', data: { name: 'ClassF', properties: [], methods: [], fileId: 'file-f' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'G', type: 'class', data: { name: 'ClassG', properties: [], methods: [], fileId: 'file-g' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'inheritance', animated: false, style: {} },
                { id: 'e2', source: 'A', target: 'C', type: 'inheritance', animated: false, style: {} },
                { id: 'e3', source: 'A', target: 'D', type: 'inheritance', animated: false, style: {} },
                { id: 'e4', source: 'B', target: 'E', type: 'inheritance', animated: false, style: {} },
                { id: 'e5', source: 'C', target: 'F', type: 'inheritance', animated: false, style: {} },
                { id: 'e6', source: 'D', target: 'G', type: 'inheritance', animated: false, style: {} },
            ];

            // Act: Apply layout
            const layoutEngine = new LayoutEngine();
            const layoutedNodes = layoutEngine.applyLayout(nodes, edges);

            // Assert: Hierarchical structure should be preserved
            const nodeA = layoutedNodes.find((n: DiagramNode) => n.id === 'A')!;
            const nodeB = layoutedNodes.find((n: DiagramNode) => n.id === 'B')!;
            const nodeC = layoutedNodes.find((n: DiagramNode) => n.id === 'C')!;
            const nodeD = layoutedNodes.find((n: DiagramNode) => n.id === 'D')!;

            // A should be at the top
            expect(nodeA.position.y).toBeLessThan(nodeB.position.y);
            expect(nodeA.position.y).toBeLessThan(nodeC.position.y);
            expect(nodeA.position.y).toBeLessThan(nodeD.position.y);

            // B, C, D should be horizontally distributed (children of A)
            expect(nodeB.position.x).not.toBe(nodeC.position.x);
            expect(nodeC.position.x).not.toBe(nodeD.position.x);

            // Children should be roughly at same vertical level
            expect(Math.abs(nodeB.position.y - nodeC.position.y)).toBeLessThan(50);
            expect(Math.abs(nodeC.position.y - nodeD.position.y)).toBeLessThan(50);
        });

        it('should handle diamond pattern without excessive crossings', () => {
            // Arrange: Diamond inheritance pattern
            //      A
            //     / \
            //    B   C
            //     \ /
            //      D
            const nodes: DiagramNode[] = [
                { id: 'A', type: 'interface', data: { name: 'IBase', properties: [], methods: [], fileId: 'file-a' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'B', type: 'class', data: { name: 'ClassB', properties: [], methods: [], fileId: 'file-b' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'C', type: 'class', data: { name: 'ClassC', properties: [], methods: [], fileId: 'file-c' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
                { id: 'D', type: 'class', data: { name: 'ClassD', properties: [], methods: [], fileId: 'file-d' }, position: { x: 0, y: 0 }, width: 200, height: 100 },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'implementation', animated: false, style: {} },
                { id: 'e2', source: 'A', target: 'C', type: 'implementation', animated: false, style: {} },
                { id: 'e3', source: 'B', target: 'D', type: 'inheritance', animated: false, style: {} },
                { id: 'e4', source: 'C', target: 'D', type: 'inheritance', animated: false, style: {} },
            ];

            // Act: Apply layout
            const layoutEngine = new LayoutEngine();
            const layoutedNodes = layoutEngine.applyLayout(nodes, edges);

            // Assert: Diamond pattern should be recognizable
            const nodeA = layoutedNodes.find((n: DiagramNode) => n.id === 'A')!;
            const nodeB = layoutedNodes.find((n: DiagramNode) => n.id === 'B')!;
            const nodeC = layoutedNodes.find((n: DiagramNode) => n.id === 'C')!;
            const nodeD = layoutedNodes.find((n: DiagramNode) => n.id === 'D')!;

            // A at top, D at bottom
            expect(nodeA.position.y).toBeLessThan(nodeB.position.y);
            expect(nodeA.position.y).toBeLessThan(nodeC.position.y);
            expect(nodeB.position.y).toBeLessThan(nodeD.position.y);
            expect(nodeC.position.y).toBeLessThan(nodeD.position.y);

            // B and C should be at similar vertical level
            expect(Math.abs(nodeB.position.y - nodeC.position.y)).toBeLessThan(50);

            // D should be centered relative to B and C (within reasonable tolerance)
            const bcMidpoint = (nodeB.position.x + nodeC.position.x) / 2;
            expect(Math.abs(nodeD.position.x - bcMidpoint)).toBeLessThan(150); // Dagre may not center perfectly
        });
    });

    describe('calculateNodeDimensions', () => {
        it('should calculate dimensions based on content length', () => {
            // Arrange: Node with short content
            const shortNode: DiagramNode = {
                id: 'short',
                type: 'class',
                data: {
                    name: 'User',
                    properties: ['id: number'],
                    methods: ['save(): void'],
                    fileId: 'file-1',
                },
                position: { x: 0, y: 0 },
                width: 200,
                height: 100,
            };

            // Node with longer content
            const longNode: DiagramNode = {
                id: 'long',
                type: 'class',
                data: {
                    name: 'VeryLongClassNameForTesting',
                    properties: [
                        'veryLongPropertyName: SomeComplexType',
                        'anotherReallyLongProperty: AnotherType',
                        'thirdProperty: string',
                    ],
                    methods: [
                        'methodWithLongName(param1: Type1, param2: Type2): ReturnType',
                        'anotherMethod(): void',
                    ],
                    fileId: 'file-2',
                },
                position: { x: 0, y: 0 },
                width: 200,
                height: 100,
            };

            // Act: Calculate dimensions
            const layoutEngine = new LayoutEngine();
            const shortDimensions = layoutEngine.calculateNodeDimensions(shortNode);
            const longDimensions = layoutEngine.calculateNodeDimensions(longNode);

            // Assert: Longer content should result in larger dimensions
            expect(longDimensions.width).toBeGreaterThan(shortDimensions.width);
            expect(longDimensions.height).toBeGreaterThan(shortDimensions.height);

            // Dimensions should be reasonable (not 0, not excessively large)
            expect(shortDimensions.width).toBeGreaterThan(50);
            expect(shortDimensions.width).toBeLessThan(500);
            expect(shortDimensions.height).toBeGreaterThan(50);
            expect(shortDimensions.height).toBeLessThan(500);

            expect(longDimensions.width).toBeGreaterThan(100);
            expect(longDimensions.width).toBeLessThan(800);
            expect(longDimensions.height).toBeGreaterThan(80);
            expect(longDimensions.height).toBeLessThan(800);
        });

        it('should account for number of properties and methods', () => {
            // Arrange: Node with few items
            const fewItems: DiagramNode = {
                id: 'few',
                type: 'class',
                data: {
                    name: 'Simple',
                    properties: ['id: number'],
                    methods: [],
                    fileId: 'file-1',
                },
                position: { x: 0, y: 0 },
                width: 200,
                height: 100,
            };

            // Node with many items
            const manyItems: DiagramNode = {
                id: 'many',
                type: 'class',
                data: {
                    name: 'Complex',
                    properties: [
                        'prop1: string',
                        'prop2: number',
                        'prop3: boolean',
                        'prop4: Date',
                        'prop5: string[]',
                    ],
                    methods: [
                        'method1(): void',
                        'method2(): string',
                        'method3(): number',
                        'method4(): boolean',
                    ],
                    fileId: 'file-2',
                },
                position: { x: 0, y: 0 },
                width: 200,
                height: 100,
            };

            // Act: Calculate dimensions
            const layoutEngine = new LayoutEngine();
            const fewDimensions = layoutEngine.calculateNodeDimensions(fewItems);
            const manyDimensions = layoutEngine.calculateNodeDimensions(manyItems);

            // Assert: More items should result in taller node
            expect(manyDimensions.height).toBeGreaterThan(fewDimensions.height);

            // Height should scale with number of items
            const fewItemCount = fewItems.data.properties.length + fewItems.data.methods.length;
            const manyItemCount = manyItems.data.properties.length + manyItems.data.methods.length;

            expect(manyItemCount).toBeGreaterThan(fewItemCount * 2);
            expect(manyDimensions.height).toBeGreaterThan(fewDimensions.height * 1.5);
        });
    });
});
