/**
 * NodeRenderer Component
 *
 * Custom React Flow node component for rendering UML class and interface boxes.
 * Displays class/interface name, properties, methods with proper UML notation.
 */

import { Handle, Position } from "@xyflow/react";
import React from "react";
import type { DiagramNodeData } from "../shared/types";
import { cn } from "../shared/utils";

export interface DiagramNodeProps {
    /** Node data containing class/interface information */
    data: DiagramNodeData;
    /** Whether the node is selected */
    selected?: boolean;
}

/**
 * UML Class/Interface Node Component
 *
 * Renders a class or interface box with three sections:
 * 1. Header: Class/interface name with optional stereotype
 * 2. Properties: List of properties with UML notation
 * 3. Methods: List of methods with UML notation
 */
export const DiagramNode: React.FC<DiagramNodeProps> = ({ data, selected }) => {
    return (
        <div
            className={cn(
                "bg-background border-2 rounded-md shadow-md min-w-[180px] max-w-[300px]",
                "transition-all duration-200",
                selected
                    ? "border-primary shadow-lg ring-2 ring-primary ring-opacity-50"
                    : "border-border hover:border-primary/50"
            )}
        >
            {/* Connection handles for edges */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-primary"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-primary"
            />

            {/* Header: Name and Stereotype */}
            <div className="bg-muted px-3 py-2 border-b border-border">
                {data.stereotype && (
                    <div className="text-xs text-muted-foreground italic mb-1">
                        {data.stereotype}
                    </div>
                )}
                <div className="font-semibold text-sm text-foreground truncate">
                    {data.name}
                </div>
            </div>

            {/* Properties Section */}
            {data.properties && data.properties.length > 0 && (
                <div className="px-3 py-2 border-b border-border">
                    <div className="space-y-1">
                        {data.properties.map((prop, index) => (
                            <div
                                key={`${data.name}-prop-${index}`}
                                className="text-xs font-mono text-foreground/80 truncate"
                                title={prop} // Show full text on hover
                            >
                                {prop}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Methods Section */}
            {data.methods && data.methods.length > 0 && (
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {data.methods.map((method, index) => (
                            <div
                                key={`${data.name}-method-${index}`}
                                className="text-xs font-mono text-foreground/80 truncate"
                                title={method} // Show full text on hover
                            >
                                {method}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state: No properties or methods */}
            {(!data.properties || data.properties.length === 0) &&
                (!data.methods || data.methods.length === 0) && (
                    <div className="px-3 py-3 text-xs text-muted-foreground italic text-center">
                        Empty {data.stereotype?.includes("interface") ? "interface" : "class"}
                    </div>
                )}
        </div>
    );
};

/**
 * Node type configuration for React Flow
 */
export const nodeTypes = {
    class: DiagramNode,
    interface: DiagramNode,
};
