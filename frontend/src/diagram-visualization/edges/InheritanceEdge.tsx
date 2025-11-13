/**
 * InheritanceEdge - Custom edge component for UML inheritance relationships
 * Renders solid line with hollow triangle marker (standard UML inheritance notation)
 */

import { BaseEdge, type EdgeProps, getStraightPath } from '@xyflow/react';

export function InheritanceEdge(props: EdgeProps) {
    const [edgePath] = getStraightPath({
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        targetX: props.targetX,
        targetY: props.targetY,
    });

    return (
        <BaseEdge
            path={edgePath}
            markerEnd="url(#inheritance-marker)"
            style={{
                stroke: '#000',
                strokeWidth: 2,
            }}
            {...props}
        />
    );
}
