/**
 * DiagramExporter
 *
 * Utilities for exporting UML diagrams to various formats (PNG, SVG).
 * Uses React Flow's built-in export capabilities.
 */

import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";

export interface ExportOptions {
    /** Background color for the exported image */
    backgroundColor?: string;
    /** Width of the exported image (default: auto from diagram bounds) */
    width?: number;
    /** Height of the exported image (default: auto from diagram bounds) */
    height?: number;
    /** File name for the download (without extension) */
    fileName?: string;
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS: Required<Omit<ExportOptions, "fileName">> = {
    backgroundColor: "#ffffff",
    width: 1920,
    height: 1080,
};

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
 * Get the viewport dimensions that contain all nodes
 */
function getImageDimensions(
    nodes: Node[],
    options: ExportOptions
): { width: number; height: number; x: number; y: number } {
    const nodesBounds = getNodesBounds(nodes);
    const viewport = getViewportForBounds(
        nodesBounds,
        nodesBounds.width,
        nodesBounds.height,
        0.5,
        2,
        0.1
    );

    return {
        width: options.width || DEFAULT_OPTIONS.width,
        height: options.height || DEFAULT_OPTIONS.height,
        x: viewport.x,
        y: viewport.y,
    };
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
        // Get the optimal dimensions for the export
        const imageData = getImageDimensions(nodes, options);

        // Use html-to-image to convert the viewport to PNG
        const dataUrl = await toPng(viewportElement, {
            backgroundColor,
            width: imageData.width,
            height: imageData.height,
            style: {
                width: `${imageData.width}px`,
                height: `${imageData.height}px`,
                transform: `translate(${imageData.x}px, ${imageData.y}px)`,
            },
        });

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
 * @param viewportElement - The React Flow viewport DOM element
 * @param nodes - Array of nodes to include in the export
 * @param options - Export options
 * @throws Error if export fails
 */
export async function exportToSvg(
    viewportElement: HTMLElement,
    nodes: Node[],
    options: ExportOptions = {}
): Promise<void> {
    const { backgroundColor = DEFAULT_OPTIONS.backgroundColor, fileName = "diagram" } = options;

    try {
        // Get the optimal dimensions for the export
        const imageData = getImageDimensions(nodes, options);

        // Use html-to-image to convert the viewport to SVG
        const dataUrl = await toSvg(viewportElement, {
            backgroundColor,
            width: imageData.width,
            height: imageData.height,
            style: {
                width: `${imageData.width}px`,
                height: `${imageData.height}px`,
                transform: `translate(${imageData.x}px, ${imageData.y}px)`,
            },
        });

        // Trigger download
        downloadImage(dataUrl, `${fileName}.svg`);
    } catch (error) {
        console.error("Failed to export diagram as SVG:", error);
        throw new Error("Failed to export diagram as SVG. Please try again.");
    }
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
