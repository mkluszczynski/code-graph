/**
 * ImplementationEdge - Custom edge component for UML realization relationships
 * Renders dashed line with hollow triangle marker (standard UML interface implementation notation)
 */

import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';

export function ImplementationEdge({
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
            markerEnd="url(#realization-marker)"
            markerStart={markerStart}
            style={{
                strokeWidth: 2,
                strokeDasharray: '5 5', // Dashed line for interface implementation
            }}
        />
    );
}
