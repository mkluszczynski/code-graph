/**
 * DiagramExporter
 *
 * Utilities for exporting UML diagrams to various formats (PNG, SVG).
 * Uses React Flow's built-in export capabilities.
 */

import { getNodesBounds } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { BoundingBox, ClipboardResult, ClipboardErrorCode } from "../shared/types";

export interface ExportOptions {
    /** Background color for the exported image */
    backgroundColor?: string;
    /** Padding around diagram content in pixels (default: 30) */
    padding?: number;
    /** Maximum width constraint for large diagrams */
    maxWidth?: number;
    /** Maximum height constraint for large diagrams */
    maxHeight?: number;
    /** File name for the download (without extension) */
    fileName?: string;
    /** @deprecated Use padding instead - will be removed in future version */
    width?: number;
    /** @deprecated Use padding instead - will be removed in future version */
    height?: number;
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS = {
    backgroundColor: "#ffffff",
    padding: 30,
} as const;

// ============================================================================
// Bounding Box Calculation
// ============================================================================

/**
 * Calculate the bounding box for a set of React Flow nodes with padding
 * 
 * @param nodes - Array of React Flow nodes
 * @param padding - Padding around content in pixels (default: 30)
 * @returns BoundingBox containing all nodes plus padding
 * @throws Error if nodes array is empty or invalid
 */
export function calculateBoundingBox(
    nodes: Node[],
    padding: number = DEFAULT_OPTIONS.padding
): BoundingBox {
    // Validate inputs
    if (!nodes || nodes.length === 0) {
        throw new Error('Cannot calculate bounding box: no nodes provided');
    }

    if (padding < 0 || padding > 200) {
        throw new Error('Padding must be between 0 and 200 pixels');
    }

    // Validate node coordinates
    for (const node of nodes) {
        if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) {
            throw new Error('Invalid node coordinates: all positions must be finite');
        }
        if (node.width !== undefined && !Number.isFinite(node.width)) {
            throw new Error('Invalid node coordinates: all positions must be finite');
        }
        if (node.height !== undefined && !Number.isFinite(node.height)) {
            throw new Error('Invalid node coordinates: all positions must be finite');
        }
    }

    // Use React Flow's optimized getNodesBounds
    const bounds = getNodesBounds(nodes);

    // Apply padding
    return {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + (padding * 2),
        height: bounds.height + (padding * 2),
    };
}

/**
 * Download a data URL as a file
 */
function downloadImage(dataUrl: string, fileName: string) {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
}

/**
 * Export the diagram as a PNG image
 *
 * @param viewportElement - The React Flow viewport DOM element
 * @param nodes - Array of nodes to include in the export
 * @param options - Export options
 * @throws Error if export fails
 */
export async function exportToPng(
    viewportElement: HTMLElement,
    nodes: Node[],
    options: ExportOptions = {}
): Promise<void> {
    const { backgroundColor = DEFAULT_OPTIONS.backgroundColor, fileName = "diagram" } = options;

    try {
        // Performance monitoring
        const startTime = performance.now();

        // Calculate bounding box with padding
        const padding = options.padding ?? DEFAULT_OPTIONS.padding;
        const bbox = calculateBoundingBox(nodes, padding);

        // Use html-to-image to convert the viewport to PNG with proper cropping
        const dataUrl = await toPng(viewportElement, {
            backgroundColor,
            width: bbox.width,
            height: bbox.height,
            style: {
                width: `${bbox.width}px`,
                height: `${bbox.height}px`,
                transform: `translate(${-bbox.x}px, ${-bbox.y}px) scale(1)`,
            },
        });

        // Check performance
        const duration = performance.now() - startTime;
        if (duration > 2000) {
            console.warn(`PNG export took ${duration.toFixed(0)}ms (target: <2000ms)`);
        }

        // Trigger download
        downloadImage(dataUrl, `${fileName}.png`);
    } catch (error) {
        console.error("Failed to export diagram as PNG:", error);
        throw new Error("Failed to export diagram as PNG. Please try again.");
    }
}

/**
 * Export the diagram as an SVG image
 * 
 * @deprecated SVG export is disabled. Will be reimplemented in future release.
 * @throws Error indicating SVG export is not available
 */
export async function exportToSvg(): Promise<void> {
    throw new Error('SVG export is not available. Please use PNG export or clipboard copy.');
}

/**
 * Get a suggested file name based on the current project
 *
 * @param projectName - Optional project name
 * @returns Suggested file name (without extension)
 */
export function getSuggestedFileName(projectName?: string): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const baseName = projectName ? `${projectName}-diagram` : "uml-diagram";
    return `${baseName}-${timestamp}`;
}

/**
 * Convert data URL to Blob
 * 
 * @param dataUrl - Data URL from html-to-image
 * @returns Promise resolving to Blob
 * @throws Error if conversion fails
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    if (!response.ok) {
        throw new Error('Failed to convert data URL to blob');
    }
    return await response.blob();
}

/**
 * Map error to ClipboardResult
 * 
 * @param error - Error from clipboard operation
 * @returns ClipboardResult with appropriate error message and code
 */
function mapErrorToResult(error: unknown): ClipboardResult {
    // Permission denied or security error
    if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
            return {
                success: false,
                error: 'Clipboard access denied. Please enable clipboard permissions in your browser settings.',
                errorCode: 'permission_denied',
            };
        }
    }

    // Timeout error
    if (error instanceof Error && error.message.includes('timeout')) {
        return {
            success: false,
            error: 'Clipboard copy timed out. Try exporting as PNG file instead.',
            errorCode: 'blob_conversion_failed',
        };
    }

    // Blob conversion error
    if (error instanceof Error && error.message.includes('blob')) {
        return {
            success: false,
            error: 'Invalid image data. Please try exporting again.',
            errorCode: 'blob_conversion_failed',
        };
    }

    // Generic write failure
    return {
        success: false,
        error: 'Failed to copy diagram to clipboard. Please try again.',
        errorCode: 'write_failed',
    };
}

/**
 * Copy a diagram image to the system clipboard
 * 
 * @param dataUrl - Data URL of the image (from html-to-image)
 * @returns ClipboardResult indicating success or failure with error details
 */
export async function copyImageToClipboard(
    dataUrl: string
): Promise<ClipboardResult> {
    // Check if clipboard API is supported
    if (!navigator.clipboard || !navigator.clipboard.write) {
        return {
            success: false,
            error: 'Clipboard copy is not supported in this browser. Please try the PNG export option instead.',
            errorCode: 'not_supported',
        };
    }

    // Validate data URL
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        return {
            success: false,
            error: 'Invalid image data. Please try exporting again.',
            errorCode: 'blob_conversion_failed',
        };
    }

    try {
        // Convert data URL to blob with 10-second timeout
        const blobPromise = dataUrlToBlob(dataUrl);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Blob conversion timeout')), 10000)
        );

        const blob = await Promise.race([blobPromise, timeoutPromise]);

        // Create clipboard item and write to clipboard
        const clipboardItem = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([clipboardItem]);

        return {
            success: true,
        };
    } catch (error) {
        return mapErrorToResult(error);
    }
}
