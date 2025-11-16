/**
 * LayoutEngine - Automatic layout for UML diagrams
 * 
 * Uses dagre algorithm to arrange nodes hierarchically and minimize edge crossings.
 * Calculates node dimensions based on content (class/interface names, properties, methods).
 */

import dagre from '@dagrejs/dagre';
import type { DiagramNode, DiagramEdge } from '../shared/types';

/**
 * Node dimensions interface
 */
export interface NodeDimensions {
    width: number;
    height: number;
}

/**
 * Layout configuration options
 */
export interface LayoutOptions {
    /** Direction of the graph layout */
    rankdir?: 'TB' | 'LR' | 'BT' | 'RL';
    /** Horizontal spacing between nodes */
    nodesep?: number;
    /** Vertical spacing between ranks */
    ranksep?: number;
    /** Whether to align nodes at their edges */
    align?: 'UL' | 'UR' | 'DL' | 'DR';
}

/**
 * Default layout options
 */
const DEFAULT_OPTIONS: LayoutOptions = {
    rankdir: 'TB', // Top to bottom
    nodesep: 50,   // 50px horizontal spacing
    ranksep: 100,  // 100px vertical spacing
    align: 'UL',   // Align upper-left
};

/**
 * Get layout configuration based on view mode
 * 
 * File view uses compact spacing for focused analysis of a single file.
 * Project view uses spacious spacing for better readability when showing many entities.
 * 
 * @param viewMode - Current diagram view mode ('file' or 'project')
 * @returns Layout options appropriate for the view mode
 */
export function getLayoutConfig(viewMode: 'file' | 'project'): LayoutOptions {
    if (viewMode === 'project') {
        // Spacious layout for project view (showing all entities)
        return {
            rankdir: 'TB',
            nodesep: 80,   // More horizontal spacing (vs 50 in file view)
            ranksep: 150,  // More vertical spacing (vs 100 in file view)
            align: 'UL',
        };
    } else {
        // Compact layout for file view (focused on single file)
        return {
            rankdir: 'TB',
            nodesep: 50,   // Standard horizontal spacing
            ranksep: 100,  // Standard vertical spacing
            align: 'UL',
        };
    }
}

/**
 * LayoutEngine class for automatic diagram layout
 */
export class LayoutEngine {
    private options: LayoutOptions;

    constructor(options: LayoutOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Apply automatic layout to diagram nodes using dagre algorithm
     * 
     * @param nodes - Array of diagram nodes to layout
     * @param edges - Array of edges between nodes
     * @returns Array of nodes with updated positions
     */
    applyLayout(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode[] {
        // Create a new directed graph
        const graph = new dagre.graphlib.Graph();

        // Set graph options
        graph.setGraph({
            rankdir: this.options.rankdir,
            nodesep: this.options.nodesep,
            ranksep: this.options.ranksep,
            align: this.options.align,
        });

        // Default to assigning a new object as a label for each new edge
        graph.setDefaultEdgeLabel(() => ({}));

        // Add nodes to the graph with their calculated dimensions
        nodes.forEach((node) => {
            const dimensions = this.calculateNodeDimensions(node);
            graph.setNode(node.id, {
                width: dimensions.width,
                height: dimensions.height,
            });
        });

        // Add edges to the graph
        edges.forEach((edge) => {
            graph.setEdge(edge.source, edge.target);
        });

        // Run the dagre layout algorithm
        dagre.layout(graph);

        // Update node positions based on layout results
        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = graph.node(node.id);

            // dagre returns center coordinates, but React Flow uses top-left
            // So we need to subtract half the width and height
            const dimensions = this.calculateNodeDimensions(node);

            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - dimensions.width / 2,
                    y: nodeWithPosition.y - dimensions.height / 2,
                },
                width: dimensions.width,
                height: dimensions.height,
            };
        });

        return layoutedNodes;
    }

    /**
     * Calculate node dimensions based on its content
     * 
     * Takes into account:
     * - Class/interface name length
     * - Number of properties
     * - Number of methods
     * - Length of property/method strings
     * 
     * @param node - The diagram node
     * @returns Width and height dimensions
     */
    calculateNodeDimensions(node: DiagramNode): NodeDimensions {
        // Base dimensions
        const MIN_WIDTH = 180;
        const MIN_HEIGHT = 80;
        const PADDING = 20;

        // Character width estimates (in pixels)
        const CHAR_WIDTH = 7;
        const HEADER_CHAR_WIDTH = 9; // Headers use larger font

        // Line heights
        const HEADER_HEIGHT = 35;
        const LINE_HEIGHT = 20;
        const SECTION_SPACING = 10;

        // Calculate width based on longest line
        let maxLineWidth = node.data.name.length * HEADER_CHAR_WIDTH;

        // Check property widths
        node.data.properties.forEach((prop) => {
            const propWidth = prop.length * CHAR_WIDTH;
            maxLineWidth = Math.max(maxLineWidth, propWidth);
        });

        // Check method widths
        node.data.methods.forEach((method) => {
            const methodWidth = method.length * CHAR_WIDTH;
            maxLineWidth = Math.max(maxLineWidth, methodWidth);
        });

        // Calculate final width with padding
        const width = Math.max(MIN_WIDTH, maxLineWidth + (PADDING * 2));

        // Calculate height based on number of lines
        let height = HEADER_HEIGHT; // Header section

        // Properties section
        if (node.data.properties.length > 0) {
            height += SECTION_SPACING;
            height += node.data.properties.length * LINE_HEIGHT;
        }

        // Methods section
        if (node.data.methods.length > 0) {
            height += SECTION_SPACING;
            height += node.data.methods.length * LINE_HEIGHT;
        }

        // Add bottom padding
        height += PADDING;

        // Ensure minimum height
        height = Math.max(MIN_HEIGHT, height);

        return { width, height };
    }

    /**
     * Update layout options
     * 
     * @param options - New options to merge with existing
     */
    setOptions(options: Partial<LayoutOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Get current layout options
     * 
     * @returns Current options
     */
    getOptions(): LayoutOptions {
        return { ...this.options };
    }
}
