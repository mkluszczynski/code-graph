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
import React, { useCallback, useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { useStore } from "../shared/store";
import type { DiagramEdge, DiagramNode } from "../shared/types";
import { nodeTypes } from "./NodeRenderer";
import { InheritanceEdge } from "./edges/InheritanceEdge";
import { ImplementationEdge } from "./edges/ImplementationEdge";
import { AssociationEdge } from "./edges/AssociationEdge";
import { computeDiagramDiff, hasSignificantChanges, mergeNodesPreservingPositions } from "./DiagramDiffer";

// Define custom edge types for UML relationships
const edgeTypes = {
    inheritance: InheritanceEdge,
    realization: ImplementationEdge,
    association: AssociationEdge,
    aggregation: AssociationEdge, // Use same component for now
};

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
    const activeFileId = useStore((state) => state.activeFileId);
    const parseErrors = useStore((state) => state.parseErrors);

    // Local state for React Flow nodes and edges
    const [flowNodes, setFlowNodes] = useState<Node[]>([]);
    const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

    // Track previous state for efficient updates (T091)
    const previousNodesRef = useRef<DiagramNode[]>([]);
    const previousEdgesRef = useRef<DiagramEdge[]>([]);

    // Track last valid diagram state for error recovery (T092)
    const lastValidNodesRef = useRef<DiagramNode[]>([]);
    const lastValidEdgesRef = useRef<DiagramEdge[]>([]);

    // Check if there are parse errors for the active file (T092)
    const hasParseErrors = activeFileId ? parseErrors.has(activeFileId) : false;
    const currentErrors = activeFileId ? parseErrors.get(activeFileId) : [];

    // Convert store nodes/edges to React Flow format with efficient updates (T091)
    useEffect(() => {
        // Compute diagram diff
        const diff = computeDiagramDiff(
            previousNodesRef.current,
            nodes,
            previousEdgesRef.current,
            edges
        );

        // If there are parse errors, use last valid diagram (T092)
        let nodesToDisplay = nodes;
        let edgesToDisplay = edges;

        if (hasParseErrors && lastValidNodesRef.current.length > 0) {
            // Use last valid diagram when there are errors
            nodesToDisplay = lastValidNodesRef.current;
            edgesToDisplay = lastValidEdgesRef.current;
        } else if (!hasParseErrors && nodes.length > 0) {
            // Update last valid diagram when parse is successful
            lastValidNodesRef.current = nodes;
            lastValidEdgesRef.current = edges;
        }

        // Only update if there are significant changes (T091 optimization)
        if (hasSignificantChanges(diff) || hasParseErrors) {
            // Preserve node positions for unchanged nodes (T091)
            const mergedNodes = mergeNodesPreservingPositions(
                previousNodesRef.current,
                nodesToDisplay
            );

            const convertedNodes: Node[] = mergedNodes.map((node: DiagramNode) => ({
                id: node.id,
                type: node.type,
                data: node.data,
                position: node.position,
                selected: selectedNodeId === node.id,
            }));

            const convertedEdges: Edge[] = edgesToDisplay.map((edge: DiagramEdge) => ({
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

            // Update previous state reference
            previousNodesRef.current = nodesToDisplay;
            previousEdgesRef.current = edgesToDisplay;
        }
    }, [nodes, edges, selectedNodeId, hasParseErrors]);

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
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    animated: false,
                }}
                // Disable spacebar for panning to prevent interference with editor typing
                panOnScroll={true}
                selectionOnDrag={false}
                panActivationKeyCode={null}
            >
                {/* SVG marker definitions for UML edges */}
                <svg>
                    <defs>
                        {/* Inheritance marker - hollow triangle */}
                        <marker
                            id="inheritance-marker"
                            markerWidth="12"
                            markerHeight="12"
                            refX="10"
                            refY="6"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 0 0 L 10 6 L 0 12 Z"
                                fill="white"
                                stroke="black"
                                strokeWidth="1.5"
                            />
                        </marker>

                        {/* Realization marker - hollow triangle (dashed line handled in component) */}
                        <marker
                            id="realization-marker"
                            markerWidth="12"
                            markerHeight="12"
                            refX="10"
                            refY="6"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 0 0 L 10 6 L 0 12 Z"
                                fill="white"
                                stroke="black"
                                strokeWidth="1.5"
                            />
                        </marker>

                        {/* Association marker - simple arrow */}
                        <marker
                            id="association-marker"
                            markerWidth="10"
                            markerHeight="10"
                            refX="9"
                            refY="5"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 0 0 L 10 5 L 0 10 L 3 5 Z"
                                fill="#666"
                            />
                        </marker>
                    </defs>
                </svg>

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
                {flowNodes.length === 0 && !hasParseErrors && (
                    <Panel position="top-center" className="mt-4">
                        <div className="bg-muted border border-border rounded-md px-4 py-2 text-sm text-muted-foreground">
                            No classes or interfaces to display. Create a file to get started.
                        </div>
                    </Panel>
                )}

                {/* Error state panel (T092) */}
                {hasParseErrors && (
                    <Panel position="top-center" className="mt-4">
                        <div className="bg-destructive/10 border border-destructive rounded-md px-4 py-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <div className="text-sm">
                                <span className="font-medium text-destructive">Syntax Error:</span>
                                <span className="text-muted-foreground ml-2">
                                    Showing last valid diagram. {currentErrors && currentErrors.length > 0 && (
                                        <>
                                            {currentErrors[0].message} (Line {currentErrors[0].line})
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
};
