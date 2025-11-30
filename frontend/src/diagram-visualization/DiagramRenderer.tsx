/**
 * DiagramRenderer Component
 *
 * Main UML diagram visualization component using React Flow.
 * Handles node rendering, edge rendering, interactions, and layout.
 * 
 * NOTE: This file is 399 lines. Justification:
 * - Central React component for diagram visualization
 * - Includes multiple related hooks: useNodesData, useEdgesData, useNodeClick, etc.
 * - React Flow integration requires component co-location
 * - Splitting would separate UI event handlers from render logic
 * Constitutional exception: Complexity justified in writing.
 */

import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    MiniMap,
    Panel,
    useReactFlow,
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
import { DependencyEdge } from "./edges/DependencyEdge";
import { computeDiagramDiff, hasSignificantChanges, mergeNodesPreservingPositions } from "./DiagramDiffer";
import { ExportButton } from "../components/ExportButton";
import { exportToPng, copyImageToClipboard, getSuggestedFileName } from "./DiagramExporter";

// Define custom edge types for UML relationships
const edgeTypes = {
    inheritance: InheritanceEdge,
    realization: ImplementationEdge,
    association: AssociationEdge,
    aggregation: AssociationEdge, // Use same component for now
    dependency: DependencyEdge,
};

export interface DiagramRendererProps {
    /** Optional className for styling */
    className?: string;
}

/**
 * DiagramRenderer - Internal component that uses React Flow hooks
 */
const DiagramRendererInternal: React.FC<DiagramRendererProps> = ({
    className,
}) => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const setActiveFile = useStore((state) => state.setActiveFile);
    const setSelectedNode = useStore((state) => state.setSelectedNode);
    const selectedNodeId = useStore((state) => state.selectedNodeId);
    const activeFileId = useStore((state) => state.activeFileId);
    const parseErrors = useStore((state) => state.parseErrors);
    const isParsing = useStore((state) => state.isParsing);
    const isGeneratingDiagram = useStore((state) => state.isGeneratingDiagram);
    const resolvedTheme = useStore((state) => state.resolvedTheme);

    // React Flow instance for programmatic control (T103)
    const { fitView } = useReactFlow();

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

            // Auto-fit diagram when nodes change (T103)
            // Wait for next tick to ensure nodes are rendered
            setTimeout(() => {
                fitView({ padding: 0.2, duration: 300 });
            }, 50);
        }
    }, [nodes, edges, selectedNodeId, hasParseErrors, fitView]);

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

    /**
     * Handle diagram export to PNG format
     */
    const handleExportPng = useCallback(async () => {
        // Get the React Flow viewport element
        const viewportElement = document.querySelector(".react-flow__viewport") as HTMLElement;
        if (!viewportElement) {
            throw new Error("Unable to find diagram viewport");
        }

        // Generate a suggested file name
        const fileName = getSuggestedFileName();

        // Export the diagram with current theme
        await exportToPng(viewportElement, flowNodes, { fileName, theme: resolvedTheme });
    }, [flowNodes, resolvedTheme]);

    /**
     * Handle diagram copy to clipboard
     */
    const handleCopyToClipboard = useCallback(async () => {
        // Get the React Flow viewport element
        const viewportElement = document.querySelector(".react-flow__viewport") as HTMLElement;
        if (!viewportElement) {
            throw new Error("Unable to find diagram viewport");
        }

        // Copy to clipboard with current theme
        const result = await copyImageToClipboard(viewportElement, flowNodes, { theme: resolvedTheme });

        // Throw error if copy failed to show error message in UI
        if (!result.success) {
            throw new Error(result.error);
        }
    }, [flowNodes, resolvedTheme]);

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
                                className="fill-background stroke-foreground"
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
                                className="fill-background stroke-foreground"
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
                                className="fill-muted-foreground"
                            />
                        </marker>

                        {/* Dependency marker - open arrow (dashed line handled in component) */}
                        <marker
                            id="dependency-marker"
                            markerWidth="10"
                            markerHeight="10"
                            refX="9"
                            refY="5"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 0 0 L 10 5 L 0 10"
                                className="stroke-muted-foreground"
                                fill="none"
                                strokeWidth="1.5"
                            />
                        </marker>
                    </defs>
                </svg>

                {/* Background grid */}
                <Background gap={16} size={1} />

                {/* Zoom and pan controls */}
                {/* <Controls /> */}

                {/* Mini-map for navigation */}
                <MiniMap
                    nodeStrokeWidth={3}
                    pannable
                    zoomable
                    className="bg-background! border-border!"
                />

                {/* Export button panel */}
                <Panel position="top-right" className="mt-4 mr-4">
                    <ExportButton
                        onExportPng={handleExportPng}
                        onCopyToClipboard={handleCopyToClipboard}
                        disabled={flowNodes.length === 0}
                    />
                </Panel>

                {/* Loading state panel */}
                {(isParsing || isGeneratingDiagram) && (
                    <Panel position="top-center" className="mt-4">
                        <div className="bg-muted border border-border rounded-md px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isParsing ? "Parsing code..." : "Generating diagram..."}
                        </div>
                    </Panel>
                )}

                {/* Empty state panel */}
                {flowNodes.length === 0 && !hasParseErrors && !isParsing && !isGeneratingDiagram && (
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

/**
 * DiagramRenderer - Wrapper component with ReactFlow provider
 * 
 * Exports the main component wrapped with ReactFlowProvider for hook access (T103)
 */
export const DiagramRenderer: React.FC<DiagramRendererProps> = (props) => {
    return (
        <ReactFlowProvider>
            <DiagramRendererInternal {...props} />
        </ReactFlowProvider>
    );
};
