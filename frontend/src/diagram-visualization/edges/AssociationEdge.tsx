/**
 * AssociationEdge - Custom edge component for UML association relationships
 * Renders solid line with arrow marker (standard UML association notation)
 */

import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';

export function AssociationEdge({
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
            markerEnd="url(#association-marker)"
            markerStart={markerStart}
            style={{
                strokeWidth: 1.5,
            }}
            className="stroke-muted-foreground!"
        />
    );
}
