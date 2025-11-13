/**
 * ExportButton Integration Tests
 *
 * Tests for the export button component and its integration with DiagramExporter.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ExportButton } from "../../components/ExportButton";

describe("ExportButton", () => {
    let onExportPng: () => Promise<void>;
    let onExportSvg: () => Promise<void>;

    beforeEach(() => {
        onExportPng = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
        onExportSvg = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    });

    it("should render export button", () => {
        render(
            <ExportButton onExportPng={onExportPng} onExportSvg={onExportSvg} />
        );

        expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("should be disabled when disabled prop is true", () => {
        render(
            <ExportButton
                onExportPng={onExportPng}
                onExportSvg={onExportSvg}
                disabled={true}
            />
        );

        expect(screen.getByText("Export")).toBeDisabled();
    });

    it("should open dropdown menu on click", async () => {
        const user = userEvent.setup();
        render(
            <ExportButton onExportPng={onExportPng} onExportSvg={onExportSvg} />
        );

        await user.click(screen.getByText("Export"));

        await waitFor(() => {
            expect(screen.getByText("Export as PNG")).toBeInTheDocument();
            expect(screen.getByText("Export as SVG")).toBeInTheDocument();
        });
    });

    it("should call onExportPng when PNG option is selected", async () => {
        const user = userEvent.setup();
        render(
            <ExportButton onExportPng={onExportPng} onExportSvg={onExportSvg} />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Export as PNG"));
        await user.click(screen.getByText("Export as PNG"));

        await waitFor(() => {
            expect(onExportPng).toHaveBeenCalledTimes(1);
        });
    });

    it("should call onExportSvg when SVG option is selected", async () => {
        const user = userEvent.setup();
        render(
            <ExportButton onExportPng={onExportPng} onExportSvg={onExportSvg} />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Export as SVG"));
        await user.click(screen.getByText("Export as SVG"));

        await waitFor(() => {
            expect(onExportSvg).toHaveBeenCalledTimes(1);
        });
    });

    it("should show exporting state during export", async () => {
        const user = userEvent.setup();
        const slowExport = vi.fn<() => Promise<void>>().mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <ExportButton onExportPng={slowExport} onExportSvg={onExportSvg} />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Export as PNG"));
        await user.click(screen.getByText("Export as PNG"));

        await waitFor(() => {
            expect(screen.getByText("Exporting...")).toBeInTheDocument();
        });
    });

    it("should display error message when export fails", async () => {
        const user = userEvent.setup();
        const failingExport = vi
            .fn<() => Promise<void>>()
            .mockRejectedValue(new Error("Export failed"));

        render(
            <ExportButton
                onExportPng={failingExport}
                onExportSvg={onExportSvg}
            />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Export as PNG"));
        await user.click(screen.getByText("Export as PNG"));

        await waitFor(() => {
            expect(screen.getByText("Export failed")).toBeInTheDocument();
        });
    });

    it("should disable button during export", async () => {
        const user = userEvent.setup();
        const slowExport = vi.fn<() => Promise<void>>().mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <ExportButton onExportPng={slowExport} onExportSvg={onExportSvg} />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Export as PNG"));
        await user.click(screen.getByText("Export as PNG"));

        await waitFor(() => {
            expect(screen.getByText("Exporting...")).toBeDisabled();
        });
    });
});
