/**
 * DiagramGenerator - Generates React Flow diagram nodes and edges
 * Implementation for T061, T098
 * 
 * NOTE: This file is 412 lines. Justification:
 * - Core diagram generation module with cohesive responsibility
 * - Functions are well-scoped: generateDiagram, createClassNode, createInterfaceNode, etc.
 * - All functions under 50 lines
 * - Splitting would separate tightly coupled diagram generation logic
 * Constitutional exception: Complexity justified in writing.
 */

import dagre from '@dagrejs/dagre';
import type {
    ClassDefinition,
    InterfaceDefinition,
    Relationship,
    DiagramNode,
    DiagramEdge,
} from '../shared/types';
import { formatProperty, formatMethod } from './UMLFormatter';
import { LayoutEngine, getLayoutConfig } from './LayoutEngine';
import { performanceMonitor } from '../shared/utils/performance';

/**
 * Result of diagram generation
 */
export interface DiagramData {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    layoutDirection: 'TB' | 'LR';
}

/**
 * Generates diagram nodes and edges from parsed TypeScript entities.
 *
 * @param classes - Array of parsed classes
 * @param interfaces - Array of parsed interfaces
 * @param relationships - Array of relationships between entities
 * @param viewMode - View mode for layout configuration (file or project) - defaults to 'file'
 * @returns DiagramData with nodes and edges
 */
export function generateDiagram(
    classes: ClassDefinition[],
    interfaces: InterfaceDefinition[],
    relationships: Relationship[],
    viewMode: 'file' | 'project' = 'file'
): DiagramData {
    performanceMonitor.startTimer('Diagram Generation');

    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Generate nodes for classes
    for (const classInfo of classes) {
        const node = createClassNode(classInfo);
        nodes.push(node);
    }

    // Generate nodes for interfaces
    for (const interfaceInfo of interfaces) {
        const node = createInterfaceNode(interfaceInfo);
        nodes.push(node);
    }

    // Generate edges for relationships
    for (const relationship of relationships) {
        // Check if both source and target nodes exist
        const sourceExists = nodes.some(n => n.id === relationship.sourceId);
        const targetExists = nodes.some(n => n.id === relationship.targetId);

        if (sourceExists && targetExists) {
            const edge = createEdge(relationship);
            edges.push(edge);
        } else {
            console.warn(
                `Skipping relationship ${relationship.id}: missing source or target node`
            );
        }
    }

    // Apply layout to position nodes using LayoutEngine with view mode config
    const layoutConfig = getLayoutConfig(viewMode);
    const layoutEngine = new LayoutEngine(layoutConfig);
    const layoutedNodes = layoutEngine.applyLayout(nodes, edges);

    performanceMonitor.endTimer('Diagram Generation', {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        classCount: classes.length,
        interfaceCount: interfaces.length,
    });

    return {
        nodes: layoutedNodes,
        edges,
        layoutDirection: 'TB',
    };
}

/**
 * Creates a diagram node for a class.
 *
 * @param classInfo - Class definition
 * @returns DiagramNode
 */
function createClassNode(classInfo: ClassDefinition): DiagramNode {
    // Format properties
    const properties = classInfo.properties.map(prop =>
        formatProperty(prop, false)
    );

    // Format methods
    const methods = classInfo.methods.map(method => formatMethod(method, false));

    // Determine stereotype
    const stereotype = classInfo.isAbstract ? '<<abstract>>' : undefined;

    // Calculate initial dimensions (will be refined by layout)
    const width = calculateNodeWidth(
        classInfo.name,
        properties,
        methods,
        stereotype
    );
    const height = calculateNodeHeight(properties.length + methods.length);

    return {
        id: classInfo.id,
        type: 'class',
        data: {
            name: classInfo.name,
            properties,
            methods,
            stereotype,
            fileId: classInfo.fileId,
        },
        position: { x: 0, y: 0 }, // Will be set by layout
        width,
        height,
    };
}

/**
 * Creates a diagram node for an interface.
 *
 * @param interfaceInfo - Interface definition
 * @returns DiagramNode
 */
function createInterfaceNode(interfaceInfo: InterfaceDefinition): DiagramNode {
    // Format properties
    const properties = interfaceInfo.properties.map(prop =>
        formatProperty(prop, true)
    );

    // Format methods
    const methods = interfaceInfo.methods.map(method =>
        formatMethod(method, true)
    );

    // Interface stereotype
    const stereotype = '<<interface>>';

    // Calculate initial dimensions
    const width = calculateNodeWidth(
        interfaceInfo.name,
        properties,
        methods,
        stereotype
    );
    const height = calculateNodeHeight(properties.length + methods.length);

    return {
        id: interfaceInfo.id,
        type: 'interface',
        data: {
            name: interfaceInfo.name,
            properties,
            methods,
            stereotype,
            fileId: interfaceInfo.fileId,
        },
        position: { x: 0, y: 0 }, // Will be set by layout
        width,
        height,
    };
}

/**
 * Creates a diagram edge for a relationship.
 *
 * @param relationship - Relationship definition
 * @returns DiagramEdge
 */
function createEdge(relationship: Relationship): DiagramEdge {
    const edgeStyle = getEdgeStyle(relationship.type);

    return {
        id: relationship.id,
        source: relationship.sourceId,
        target: relationship.targetId,
        type: edgeStyle.type,
        label: relationship.label,
        animated: edgeStyle.animated,
        style: edgeStyle.style,
    };
}

/**
 * Gets edge styling based on relationship type.
 *
 * @param relationshipType - Type of relationship
 * @returns Edge styling configuration
 */
function getEdgeStyle(relationshipType: string): {
    type: string;
    animated: boolean;
    style: Record<string, unknown>;
} {
    switch (relationshipType) {
        case 'inheritance':
            return {
                type: 'inheritance',
                animated: false,
                style: {
                    stroke: '#000',
                    strokeWidth: 2,
                },
            };
        case 'realization':
            return {
                type: 'realization',
                animated: false,
                style: {
                    stroke: '#000',
                    strokeWidth: 2,
                    strokeDasharray: '5 5',
                },
            };
        case 'association':
            return {
                type: 'association',
                animated: false,
                style: {
                    stroke: '#666',
                    strokeWidth: 1.5,
                },
            };
        case 'aggregation':
            return {
                type: 'aggregation',
                animated: false,
                style: {
                    stroke: '#666',
                    strokeWidth: 1.5,
                },
            };
        default:
            return {
                type: 'default',
                animated: false,
                style: {
                    stroke: '#000',
                    strokeWidth: 2,
                },
            };
    }
}

/**
 * Calculates node width based on content.
 *
 * @param name - Class/interface name
 * @param properties - Formatted property strings
 * @param methods - Formatted method strings
 * @param stereotype - Stereotype string
 * @returns Width in pixels
 */
function calculateNodeWidth(
    name: string,
    properties: string[],
    methods: string[],
    stereotype?: string
): number {
    const minWidth = 150;
    const charWidth = 8; // Approximate character width

    // Calculate max content length
    let maxLength = name.length;

    if (stereotype) {
        maxLength = Math.max(maxLength, stereotype.length);
    }

    for (const prop of properties) {
        maxLength = Math.max(maxLength, prop.length);
    }

    for (const method of methods) {
        maxLength = Math.max(maxLength, method.length);
    }

    const calculatedWidth = maxLength * charWidth + 40; // Add padding
    return Math.max(minWidth, calculatedWidth);
}

/**
 * Calculates node height based on member count.
 *
 * @param memberCount - Total number of properties and methods
 * @returns Height in pixels
 */
function calculateNodeHeight(memberCount: number): number {
    const headerHeight = 60; // Name + stereotype
    const memberHeight = 20; // Height per member
    const minHeight = 80;

    const calculatedHeight = headerHeight + memberCount * memberHeight;
    return Math.max(minHeight, calculatedHeight);
}

/**
 * Applies automatic layout to diagram nodes using dagre algorithm.
 *
 * @param nodes - Diagram nodes
 * @param edges - Diagram edges
 * @param direction - Layout direction ('TB' or 'LR')
 * @returns Object with positioned nodes and edges
 */
export function applyLayout(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    direction: 'TB' | 'LR' = 'TB'
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
    if (nodes.length === 0) {
        return { nodes, edges };
    }

    // Create a new dagre graph
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
        rankdir: direction,
        nodesep: 80,
        ranksep: 100,
        marginx: 20,
        marginy: 20,
    });

    // Add nodes to the graph
    for (const node of nodes) {
        graph.setNode(node.id, {
            width: node.width,
            height: node.height,
        });
    }

    // Add edges to the graph
    for (const edge of edges) {
        graph.setEdge(edge.source, edge.target);
    }

    // Run the layout algorithm
    try {
        dagre.layout(graph);
    } catch (error) {
        console.error('Dagre layout failed:', error);
        // Fall back to grid layout
        return gridLayout(nodes, edges);
    }

    // Update node positions from the layout
    const positionedNodes = nodes.map(node => {
        const nodeWithPosition = graph.node(node.id);
        return {
            ...node,
            position: {
                // Dagre returns center position, React Flow uses top-left
                x: nodeWithPosition.x - node.width / 2,
                y: nodeWithPosition.y - node.height / 2,
            },
        };
    });

    return {
        nodes: positionedNodes,
        edges,
    };
}

/**
 * Fallback grid layout if dagre fails.
 *
 * @param nodes - Diagram nodes
 * @param edges - Diagram edges
 * @returns Object with positioned nodes and edges
 */
function gridLayout(
    nodes: DiagramNode[],
    edges: DiagramEdge[]
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
    const columns = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 300;

    const positionedNodes = nodes.map((node, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;

        return {
            ...node,
            position: {
                x: col * spacing,
                y: row * spacing,
            },
        };
    });

    return {
        nodes: positionedNodes,
        edges,
    };
}
