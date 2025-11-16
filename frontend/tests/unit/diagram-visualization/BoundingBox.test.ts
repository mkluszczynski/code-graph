/**
 * Contract Tests: Bounding Box Calculation
 * 
 * Tests for calculateBoundingBox() function following TDD approach.
 * These tests are written FIRST and should FAIL before implementation.
 * 
 * Contract: specs/005-fix-diagram-export/contracts/bounding-box.contract.md
 */

import { describe, it, expect } from 'vitest';
import type { Node } from '@xyflow/react';
import { calculateBoundingBox } from '../../../src/diagram-visualization/DiagramExporter';

describe('calculateBoundingBox - Contract Tests', () => {
    // Helper to create a minimal React Flow node
    const createNode = (id: string, x: number, y: number, width: number, height: number): Node => ({
        id,
        position: { x, y },
        data: {},
        width,
        height,
        type: 'default',
    });

    describe('Success Cases', () => {
        it('TC-001: Single node with default padding', () => {
            const nodes = [createNode('1', 100, 100, 200, 150)];
            const result = calculateBoundingBox(nodes, 30);

            expect(result).toEqual({
                x: 70,      // 100 - 30
                y: 70,      // 100 - 30
                width: 260, // 200 + (2 * 30)
                height: 210 // 150 + (2 * 30)
            });
        });

        it('TC-002: Multiple nodes aligned horizontally', () => {
            const nodes = [
                createNode('1', 0, 0, 100, 100),
                createNode('2', 150, 0, 100, 100),
            ];
            const result = calculateBoundingBox(nodes, 30);

            expect(result).toEqual({
                x: -30,     // 0 - 30
                y: -30,     // 0 - 30
                width: 310, // (250 - 0) + 60
                height: 160 // (100 - 0) + 60
            });
        });

        it('TC-003: Nodes at negative coordinates', () => {
            const nodes = [
                createNode('1', -100, -50, 80, 80),
                createNode('2', 50, 50, 80, 80),
            ];
            const result = calculateBoundingBox(nodes, 20);

            expect(result).toEqual({
                x: -120,    // -100 - 20
                y: -70,     // -50 - 20
                width: 270, // (130 - (-100)) = 230, + 40 = 270
                height: 220 // (130 - (-50)) = 180, + 40 = 220
            });
        });

        it('TC-004: Custom padding (zero)', () => {
            const nodes = [createNode('1', 10, 20, 100, 50)];
            const result = calculateBoundingBox(nodes, 0);

            expect(result).toEqual({
                x: 10,
                y: 20,
                width: 100,
                height: 50
            });
        });

        it('TC-005: Custom padding (large)', () => {
            const nodes = [createNode('1', 0, 0, 100, 100)];
            const result = calculateBoundingBox(nodes, 100);

            expect(result).toEqual({
                x: -100,
                y: -100,
                width: 300,  // 100 + 200
                height: 300  // 100 + 200
            });
        });

        it('TC-006: Overlapping nodes', () => {
            const nodes = [
                createNode('1', 0, 0, 100, 100),
                createNode('2', 50, 50, 100, 100),
            ];
            const result = calculateBoundingBox(nodes, 10);

            expect(result).toEqual({
                x: -10,
                y: -10,
                width: 170, // (150 - 0) + 20
                height: 170 // (150 - 0) + 20
            });
        });
    });

    describe('Error Cases', () => {
        it('EC-001: Empty nodes array', () => {
            expect(() => {
                calculateBoundingBox([], 30);
            }).toThrow('Cannot calculate bounding box: no nodes provided');
        });

        it('EC-002: Invalid padding (negative)', () => {
            const nodes = [createNode('1', 0, 0, 100, 100)];
            expect(() => {
                calculateBoundingBox(nodes, -10);
            }).toThrow('Padding must be between 0 and 200 pixels');
        });

        it('EC-003: Invalid padding (too large)', () => {
            const nodes = [createNode('1', 0, 0, 100, 100)];
            expect(() => {
                calculateBoundingBox(nodes, 300);
            }).toThrow('Padding must be between 0 and 200 pixels');
        });

        it('EC-004: Nodes with infinite coordinates', () => {
            const nodes = [createNode('1', Infinity, 0, 100, 100)];
            expect(() => {
                calculateBoundingBox(nodes, 30);
            }).toThrow('Invalid node coordinates: all positions must be finite');
        });

        it('EC-005: Nodes with NaN coordinates', () => {
            const nodes = [createNode('1', NaN, 0, 100, 100)];
            expect(() => {
                calculateBoundingBox(nodes, 30);
            }).toThrow('Invalid node coordinates: all positions must be finite');
        });
    });

    describe('Performance', () => {
        it('should complete in <100ms for 100 nodes', () => {
            const nodes = Array.from({ length: 100 }, (_, i) =>
                createNode(`${i}`, i * 50, i * 30, 100, 80)
            );

            const start = performance.now();
            calculateBoundingBox(nodes, 30);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100);
        });
    });

    describe('Idempotency', () => {
        it('should produce identical output when called twice with same inputs', () => {
            const nodes = [
                createNode('1', 10, 20, 100, 80),
                createNode('2', 150, 50, 120, 90),
            ];

            const result1 = calculateBoundingBox(nodes, 25);
            const result2 = calculateBoundingBox(nodes, 25);

            expect(result1).toEqual(result2);
        });
    });
});
