/**
 * DiagramExporter Tests
 *
 * Tests for diagram export functionality (PNG and SVG).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToPng, exportToSvg, getSuggestedFileName } from "../DiagramExporter";
import type { Node } from "@xyflow/react";

// Mock html-to-image
vi.mock("html-to-image", () => ({
    toPng: vi.fn(),
    toSvg: vi.fn(),
}));

describe("DiagramExporter", () => {
    let mockElement: HTMLElement;
    let mockNodes: Node[];
    let mockLink: {
        click: ReturnType<typeof vi.fn>;
        download: string;
        href: string;
    };

    beforeEach(() => {
        // Create mock element
        mockElement = document.createElement("div");

        // Create mock nodes
        mockNodes = [
            {
                id: "1",
                type: "class",
                position: { x: 0, y: 0 },
                data: { label: "Test Class" },
            },
            {
                id: "2",
                type: "class",
                position: { x: 200, y: 0 },
                data: { label: "Another Class" },
            },
        ];

        // Mock document.createElement for link creation
        mockLink = {
            click: vi.fn(),
            download: "",
            href: "",
        };
        vi.spyOn(document, "createElement").mockReturnValue(mockLink as unknown as HTMLElement);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("exportToPng", () => {
        it("should export diagram as PNG with default options", async () => {
            const { toPng } = await import("html-to-image");
            (toPng as ReturnType<typeof vi.fn>).mockResolvedValue("data:image/png;base64,mock");

            await exportToPng(mockElement, mockNodes);

            expect(toPng).toHaveBeenCalledWith(
                mockElement,
                expect.objectContaining({
                    backgroundColor: "#ffffff",
                })
            );
            expect(mockLink.download).toBe("diagram.png");
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should export diagram as PNG with custom file name", async () => {
            const { toPng } = await import("html-to-image");
            (toPng as ReturnType<typeof vi.fn>).mockResolvedValue("data:image/png;base64,mock");

            await exportToPng(mockElement, mockNodes, {
                fileName: "my-custom-diagram",
            });

            expect(mockLink.download).toBe("my-custom-diagram.png");
        });

        it("should export diagram as PNG with custom background color", async () => {
            const { toPng } = await import("html-to-image");
            (toPng as ReturnType<typeof vi.fn>).mockResolvedValue("data:image/png;base64,mock");

            await exportToPng(mockElement, mockNodes, {
                backgroundColor: "#f0f0f0",
            });

            expect(toPng).toHaveBeenCalledWith(
                mockElement,
                expect.objectContaining({
                    backgroundColor: "#f0f0f0",
                })
            );
        });

        it("should throw error when PNG export fails", async () => {
            const { toPng } = await import("html-to-image");
            (toPng as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Export failed"));

            await expect(
                exportToPng(mockElement, mockNodes)
            ).rejects.toThrow("Failed to export diagram as PNG");
        });
    });

    describe("exportToSvg", () => {
        it("should export diagram as SVG with default options", async () => {
            const { toSvg } = await import("html-to-image");
            (toSvg as ReturnType<typeof vi.fn>).mockResolvedValue("data:image/svg+xml;base64,mock");

            await exportToSvg(mockElement, mockNodes);

            expect(toSvg).toHaveBeenCalledWith(
                mockElement,
                expect.objectContaining({
                    backgroundColor: "#ffffff",
                })
            );
            expect(mockLink.download).toBe("diagram.svg");
            expect(mockLink.click).toHaveBeenCalled();
        });

        it("should export diagram as SVG with custom file name", async () => {
            const { toSvg } = await import("html-to-image");
            (toSvg as ReturnType<typeof vi.fn>).mockResolvedValue("data:image/svg+xml;base64,mock");

            await exportToSvg(mockElement, mockNodes, {
                fileName: "my-custom-diagram",
            });

            expect(mockLink.download).toBe("my-custom-diagram.svg");
        });

        it("should throw error when SVG export fails", async () => {
            const { toSvg } = await import("html-to-image");
            (toSvg as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Export failed"));

            await expect(
                exportToSvg(mockElement, mockNodes)
            ).rejects.toThrow("Failed to export diagram as SVG");
        });
    });

    describe("getSuggestedFileName", () => {
        it("should generate file name with timestamp", () => {
            const fileName = getSuggestedFileName();

            expect(fileName).toMatch(/^uml-diagram-\d{8}$/);
        });

        it("should generate file name with project name and timestamp", () => {
            const fileName = getSuggestedFileName("my-project");

            expect(fileName).toMatch(/^my-project-diagram-\d{8}$/);
        });

        it("should use current date in file name", () => {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const fileName = getSuggestedFileName();

            expect(fileName).toContain(today);
        });
    });
});
