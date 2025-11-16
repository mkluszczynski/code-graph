/**
 * InheritanceEdge - Custom edge component for UML inheritance relationships
 * Renders solid line with hollow triangle marker (standard UML inheritance notation)
 */

import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';

export function InheritanceEdge({
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
            markerEnd="url(#inheritance-marker)"
            markerStart={markerStart}
            style={{
                strokeWidth: 2,
            }}
        />
    );
}
