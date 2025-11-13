/**
 * ImplementationEdge - Custom edge component for UML realization relationships
 * Renders dashed line with hollow triangle marker (standard UML interface implementation notation)
 */

import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';

export function ImplementationEdge(props: EdgeProps) {
    const [edgePath] = getStraightPath({
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        targetX: props.targetX,
        targetY: props.targetY,
    });

    return (
        <BaseEdge
            path={edgePath}
            markerEnd="url(#realization-marker)"
            style={{
                stroke: '#000',
                strokeWidth: 2,
                strokeDasharray: '5 5', // Dashed line for interface implementation
            }}
            {...props}
        />
    );
}
