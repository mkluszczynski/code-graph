/**
 * DiagramDiffer - Computes differences between diagram states
 * Task T090: Implement diagram diffing for efficient partial updates
 * 
 * This module compares old and new diagram states to determine which nodes
 * have been added, removed, or modified, enabling efficient partial updates
 * instead of full re-renders.
 */

import type { DiagramNode, DiagramEdge } from '../shared/types';

export interface DiagramDiff {
    /** Nodes that were added */
    nodesAdded: DiagramNode[];
    /** Nodes that were removed */
    nodesRemoved: DiagramNode[];
    /** Nodes that were modified */
    nodesModified: DiagramNode[];
    /** Nodes that haven't changed */
    nodesUnchanged: DiagramNode[];
    /** Edges that were added */
    edgesAdded: DiagramEdge[];
    /** Edges that were removed */
    edgesRemoved: DiagramEdge[];
    /** Edges that were modified */
    edgesModified: DiagramEdge[];
    /** Edges that haven't changed */
    edgesUnchanged: DiagramEdge[];
}

/**
 * Computes the difference between old and new diagram states
 * 
 * @param oldNodes - Previous diagram nodes
 * @param newNodes - New diagram nodes
 * @param oldEdges - Previous diagram edges
 * @param newEdges - New diagram edges
 * @returns DiagramDiff object containing all changes
 */
export function computeDiagramDiff(
    oldNodes: DiagramNode[],
    newNodes: DiagramNode[],
    oldEdges: DiagramEdge[],
    newEdges: DiagramEdge[]
): DiagramDiff {
    const diff: DiagramDiff = {
        nodesAdded: [],
        nodesRemoved: [],
        nodesModified: [],
        nodesUnchanged: [],
        edgesAdded: [],
        edgesRemoved: [],
        edgesModified: [],
        edgesUnchanged: [],
    };

    // Create lookup maps for efficient comparison
    const oldNodesMap = new Map(oldNodes.map(n => [n.id, n]));
    const newNodesMap = new Map(newNodes.map(n => [n.id, n]));
    const oldEdgesMap = new Map(oldEdges.map(e => [e.id, e]));
    const newEdgesMap = new Map(newEdges.map(e => [e.id, e]));

    // Find added and modified nodes
    for (const newNode of newNodes) {
        const oldNode = oldNodesMap.get(newNode.id);

        if (!oldNode) {
            // Node was added
            diff.nodesAdded.push(newNode);
        } else if (isNodeModified(oldNode, newNode)) {
            // Node was modified
            diff.nodesModified.push(newNode);
        } else {
            // Node unchanged
            diff.nodesUnchanged.push(newNode);
        }
    }

    // Find removed nodes
    for (const oldNode of oldNodes) {
        if (!newNodesMap.has(oldNode.id)) {
            diff.nodesRemoved.push(oldNode);
        }
    }

    // Find added and modified edges
    for (const newEdge of newEdges) {
        const oldEdge = oldEdgesMap.get(newEdge.id);

        if (!oldEdge) {
            // Edge was added
            diff.edgesAdded.push(newEdge);
        } else if (isEdgeModified(oldEdge, newEdge)) {
            // Edge was modified
            diff.edgesModified.push(newEdge);
        } else {
            // Edge unchanged
            diff.edgesUnchanged.push(newEdge);
        }
    }

    // Find removed edges
    for (const oldEdge of oldEdges) {
        if (!newEdgesMap.has(oldEdge.id)) {
            diff.edgesRemoved.push(oldEdge);
        }
    }

    return diff;
}

/**
 * Checks if a node has been modified by comparing relevant properties
 * 
 * @param oldNode - Previous node state
 * @param newNode - New node state
 * @returns True if node was modified
 */
function isNodeModified(oldNode: DiagramNode, newNode: DiagramNode): boolean {
    // Compare node data (the UML content)
    if (JSON.stringify(oldNode.data) !== JSON.stringify(newNode.data)) {
        return true;
    }

    // Compare type
    if (oldNode.type !== newNode.type) {
        return true;
    }

    // Compare position (if manually moved)
    if (oldNode.position.x !== newNode.position.x || oldNode.position.y !== newNode.position.y) {
        return true;
    }

    // No changes detected
    return false;
}

/**
 * Checks if an edge has been modified by comparing relevant properties
 * 
 * @param oldEdge - Previous edge state
 * @param newEdge - New edge state
 * @returns True if edge was modified
 */
function isEdgeModified(oldEdge: DiagramEdge, newEdge: DiagramEdge): boolean {
    // Compare source and target
    if (oldEdge.source !== newEdge.source || oldEdge.target !== newEdge.target) {
        return true;
    }

    // Compare type
    if (oldEdge.type !== newEdge.type) {
        return true;
    }

    // Compare label
    if (oldEdge.label !== newEdge.label) {
        return true;
    }

    // No changes detected
    return false;
}

/**
 * Checks if a diagram update is significant enough to warrant a re-render
 * 
 * @param diff - The computed diagram diff
 * @returns True if the diff contains any changes
 */
export function hasSignificantChanges(diff: DiagramDiff): boolean {
    return (
        diff.nodesAdded.length > 0 ||
        diff.nodesRemoved.length > 0 ||
        diff.nodesModified.length > 0 ||
        diff.edgesAdded.length > 0 ||
        diff.edgesRemoved.length > 0 ||
        diff.edgesModified.length > 0
    );
}

/**
 * Merges old and new nodes, preserving user-modified positions
 * 
 * This is useful when re-laying out the diagram - we want to preserve
 * positions for nodes that haven't changed, but use new positions for
 * nodes that were added or had structural changes.
 * 
 * @param oldNodes - Previous diagram nodes
 * @param newNodes - New diagram nodes
 * @returns Merged nodes with preserved positions where appropriate
 */
export function mergeNodesPreservingPositions(
    oldNodes: DiagramNode[],
    newNodes: DiagramNode[]
): DiagramNode[] {
    const oldNodesMap = new Map(oldNodes.map(n => [n.id, n]));

    return newNodes.map(newNode => {
        const oldNode = oldNodesMap.get(newNode.id);

        if (!oldNode) {
            // New node, use new position
            return newNode;
        }

        // Check if content changed (which might affect size/layout)
        if (isNodeModified(oldNode, newNode)) {
            // Content changed, use new position
            return newNode;
        }

        // Node unchanged, preserve old position
        return {
            ...newNode,
            position: oldNode.position,
        };
    });
}
