/**
 * DiagramExporter
 *
 * Utilities for exporting UML diagrams to various formats (PNG, SVG).
 * Uses React Flow's built-in export capabilities.
 */

import { getNodesBounds } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { BoundingBox, ClipboardResult } from "../shared/types";

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
    /** Current theme for computing background color (light or dark) */
    theme?: 'light' | 'dark';
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

/**
 * Get background color based on theme
 * Reads computed CSS variables from document root
 * 
 * @param theme - Current theme (light or dark)
 * @returns Background color as hex string
 */
function getBackgroundColor(theme: 'light' | 'dark'): string {
    // For light theme, use white
    if (theme === 'light') {
        return '#ffffff';
    }

    // For dark theme, get the background color from CSS variable
    // The dark background is: oklch(0.145 0 0) which is approximately #252525
    return '#252525';
}

/**
 * Get edge stroke color based on theme
 * 
 * @param theme - Current theme (light or dark)
 * @returns Edge stroke color as hex string
 */
function getEdgeColor(theme: 'light' | 'dark'): string {
    // For light theme, use dark gray/black for visibility
    if (theme === 'light') {
        return '#0a0a0a'; // Almost black (--foreground in light mode)
    }

    // For dark theme, use light gray/white for visibility
    return '#fafafa'; // Almost white (--foreground in dark mode)
}

/**
 * Apply theme-specific inline styles to edges and markers for export
 * 
 * @param viewportElement - The React Flow viewport DOM element
 * @param theme - Current theme (light or dark)
 */
function applyEdgeStylesToExport(viewportElement: HTMLElement, theme: 'light' | 'dark'): void {
    // Skip if not a real DOM element (e.g., in tests with mocks)
    if (!viewportElement.querySelectorAll) {
        return;
    }

    const edgeColor = getEdgeColor(theme);

    // Style all edge paths
    const edgePaths = viewportElement.querySelectorAll('.react-flow__edge-path');
    edgePaths.forEach((path) => {
        (path as SVGPathElement).style.stroke = edgeColor;
    });

    // Style all marker paths (arrows)
    const markerPaths = viewportElement.querySelectorAll('marker path');
    markerPaths.forEach((path) => {
        const pathElement = path as SVGPathElement;
        pathElement.style.stroke = edgeColor;
        // For hollow markers (inheritance, realization), set fill to background
        if (pathElement.getAttribute('fill') !== 'none') {
            const currentFill = pathElement.getAttribute('fill');
            // Check if it's a hollow marker (uses background color)
            if (currentFill?.includes('--background') || pathElement.closest('marker')?.id.includes('inheritance') || pathElement.closest('marker')?.id.includes('realization')) {
                pathElement.style.fill = getBackgroundColor(theme);
            } else {
                // Solid markers (association) use edge color
                pathElement.style.fill = edgeColor;
            }
        }
    });
}

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
    const { fileName = "diagram" } = options;

    try {
        // Performance monitoring
        const startTime = performance.now();

        // Generate diagram as data URL
        const dataUrl = await generateDiagramDataUrl(viewportElement, nodes, options);

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
 * Generate diagram image as data URL
 * 
 * @param viewportElement - The React Flow viewport DOM element
 * @param nodes - Array of nodes to include in the export
 * @param options - Export options
 * @returns Promise resolving to data URL
 * @throws Error if generation fails
 */
export async function generateDiagramDataUrl(
    viewportElement: HTMLElement,
    nodes: Node[],
    options: ExportOptions = {}
): Promise<string> {
    const { theme = 'light' } = options;

    // Use theme-based background color if not explicitly provided
    const backgroundColor = options.backgroundColor ?? getBackgroundColor(theme);

    // Apply theme-specific inline styles to edges and markers
    // This ensures edges are visible in the exported image
    applyEdgeStylesToExport(viewportElement, theme);

    // Calculate bounding box with padding
    const padding = options.padding ?? DEFAULT_OPTIONS.padding;
    const bbox = calculateBoundingBox(nodes, padding);

    // Use html-to-image to convert the viewport to PNG
    return await toPng(viewportElement, {
        backgroundColor,
        width: bbox.width,
        height: bbox.height,
        style: {
            width: `${bbox.width}px`,
            height: `${bbox.height}px`,
            transform: `translate(${-bbox.x}px, ${-bbox.y}px) scale(1)`,
        },
    });
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
 * Internal helper: Write data URL to clipboard
 * 
 * @param dataUrl - Data URL of the image
 * @returns ClipboardResult indicating success or failure with error details
 */
async function writeDataUrlToClipboard(dataUrl: string): Promise<ClipboardResult> {
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

/**
 * Copy a diagram image to the system clipboard
 * 
 * Supports two usage patterns:
 * 1. Legacy: copyImageToClipboard(dataUrl: string) - for existing tests
 * 2. New: copyImageToClipboard(viewportElement, nodes, options) - with theme support
 * 
 * @param viewportElementOrDataUrl - Either React Flow viewport element or data URL string
 * @param nodes - Array of nodes (only for new signature)
 * @param options - Export options including theme (only for new signature)
 * @returns ClipboardResult indicating success or failure with error details
 */
export async function copyImageToClipboard(
    viewportElementOrDataUrl: HTMLElement | string,
    nodes?: Node[],
    options: ExportOptions = {}
): Promise<ClipboardResult> {
    // Legacy signature: copyImageToClipboard(dataUrl)
    // This includes null/undefined which should be handled by writeDataUrlToClipboard
    if (typeof viewportElementOrDataUrl === 'string' || !viewportElementOrDataUrl) {
        return writeDataUrlToClipboard(viewportElementOrDataUrl as string);
    }

    // New signature: copyImageToClipboard(viewportElement, nodes, options)
    const viewportElement = viewportElementOrDataUrl;
    if (!nodes) {
        return {
            success: false,
            error: 'Invalid parameters: nodes array is required',
            errorCode: 'write_failed',
        };
    }

    try {
        // Generate diagram as data URL with theme-based background
        const dataUrl = await generateDiagramDataUrl(viewportElement, nodes, options);

        // Use the internal helper to write to clipboard
        return await writeDataUrlToClipboard(dataUrl);
    } catch (error) {
        return mapErrorToResult(error);
    }
}
