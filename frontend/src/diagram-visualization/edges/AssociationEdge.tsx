/**
 * AssociationEdge - Custom edge component for UML association relationships
 * Renders solid line with arrow marker (standard UML association notation)
 */

import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';

export function AssociationEdge(props: EdgeProps) {
    const [edgePath] = getStraightPath({
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        targetX: props.targetX,
        targetY: props.targetY,
    });

    return (
        <BaseEdge
            path={edgePath}
            markerEnd="url(#association-marker)"
            style={{
                stroke: '#666',
                strokeWidth: 1.5,
            }}
            {...props}
        />
    );
}
