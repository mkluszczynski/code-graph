/**
 * DiagramRenderer Component
 *
 * Main UML diagram visualization component using React Flow.
 * Handles node rendering, edge rendering, interactions, and layout.
 */

import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    type Edge,
    type Node,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../shared/store";
import type { DiagramEdge, DiagramNode } from "../shared/types";
import { nodeTypes } from "./NodeRenderer";

export interface DiagramRendererProps {
    /** Optional className for styling */
    className?: string;
}

/**
 * DiagramRenderer Component
 *
 * Renders UML class diagrams using React Flow.
 * - Displays class and interface nodes
 * - Handles node click to select files
 * - Supports zoom, pan, and layout features
 */
export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
    className,
}) => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const setActiveFile = useStore((state) => state.setActiveFile);
    const setSelectedNode = useStore((state) => state.setSelectedNode);
    const selectedNodeId = useStore((state) => state.selectedNodeId);

    // Local state for React Flow nodes and edges
    const [flowNodes, setFlowNodes] = useState<Node[]>([]);
    const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

    // Convert store nodes/edges to React Flow format
    useEffect(() => {
        const convertedNodes: Node[] = nodes.map((node: DiagramNode) => ({
            id: node.id,
            type: node.type,
            data: node.data,
            position: node.position,
            selected: selectedNodeId === node.id,
        }));

        const convertedEdges: Edge[] = edges.map((edge: DiagramEdge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            label: edge.label,
            animated: edge.animated,
            style: edge.style,
        }));

        setFlowNodes(convertedNodes);
        setFlowEdges(convertedEdges);
    }, [nodes, edges, selectedNodeId]);

    /**
     * Handle node click - navigate to the corresponding file
     */
    const handleNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            const fileId = node.data.fileId as string;

            // Update selected node visual state
            setSelectedNode(node.id);

            // Navigate to the file (only if fileId is valid)
            if (fileId) {
                setActiveFile(fileId);
            }
        },
        [setActiveFile, setSelectedNode]
    );

    /**
     * Handle click on diagram background - clear selection
     */
    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
    }, [setSelectedNode]);

    /**
     * Handle node changes (drag, select, etc.)
     */
    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            setFlowNodes((nds) => applyNodeChanges(changes, nds));
        },
        []
    );

    /**
     * Handle edge changes
     */
    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            setFlowEdges((eds) => applyEdgeChanges(changes, eds));
        },
        []
    );

    /**
     * Handle connection creation (not used in MVP, but required by React Flow)
     */
    const onConnect: OnConnect = useCallback(
        (params) => {
            console.log("Connection attempt:", params);
            // In the future, this could allow user-created relationships
        },
        []
    );

    return (
        <div className={className} style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    animated: false,
                }}
            >
                {/* Background grid */}
                <Background gap={16} size={1} />

                {/* Zoom and pan controls */}
                <Controls />

                {/* Mini-map for navigation */}
                <MiniMap
                    nodeStrokeWidth={3}
                    pannable
                    zoomable
                    className="!bg-background !border-border"
                />

                {/* Empty state panel */}
                {flowNodes.length === 0 && (
                    <Panel position="top-center" className="mt-4">
                        <div className="bg-muted border border-border rounded-md px-4 py-2 text-sm text-muted-foreground">
                            No classes or interfaces to display. Create a file to get started.
                        </div>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
};
