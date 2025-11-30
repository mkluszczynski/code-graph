/**
 * DependencyEdge - Custom edge component for UML dependency relationships
 * Renders dashed line with open arrow marker (standard UML dependency notation)
 * Used when a class uses another class in method signatures (return types or parameters)
 */

import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';

export function DependencyEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerStart,
}: EdgeProps) {
    const [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    return (
        <BaseEdge
            id={id}
            path={edgePath}
            markerEnd="url(#dependency-marker)"
            markerStart={markerStart}
            style={{
                strokeWidth: 1.5,
                strokeDasharray: '4 4', // Dashed line for dependency
            }}
            className="stroke-muted-foreground!"
        />
    );
}
