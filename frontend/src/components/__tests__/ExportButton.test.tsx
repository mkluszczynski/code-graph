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
    let onCopyToClipboard: () => Promise<void>;

    beforeEach(() => {
        onExportPng = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
        onCopyToClipboard = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    });

    it("should render export button", () => {
        render(
            <ExportButton onExportPng={onExportPng} onCopyToClipboard={onCopyToClipboard} />
        );

        expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("should be disabled when disabled prop is true", () => {
        render(
            <ExportButton
                onExportPng={onExportPng}
                onCopyToClipboard={onCopyToClipboard}
                disabled={true}
            />
        );

        expect(screen.getByText("Export")).toBeDisabled();
    });

    it("should open dropdown menu on click", async () => {
        const user = userEvent.setup();
        render(
            <ExportButton onExportPng={onExportPng} onCopyToClipboard={onCopyToClipboard} />
        );

        await user.click(screen.getByText("Export"));

        await waitFor(() => {
            expect(screen.getByText("Export as PNG")).toBeInTheDocument();
            expect(screen.getByText("Copy to Clipboard")).toBeInTheDocument();
        });
    });

    it("should call onExportPng when PNG option is selected", async () => {
        const user = userEvent.setup();
        render(
            <ExportButton onExportPng={onExportPng} onCopyToClipboard={onCopyToClipboard} />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Export as PNG"));
        await user.click(screen.getByText("Export as PNG"));

        await waitFor(() => {
            expect(onExportPng).toHaveBeenCalledTimes(1);
        });
    });

    it("should call onCopyToClipboard when Clipboard option is selected", async () => {
        const user = userEvent.setup();
        render(
            <ExportButton onExportPng={onExportPng} onCopyToClipboard={onCopyToClipboard} />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Copy to Clipboard"));
        await user.click(screen.getByText("Copy to Clipboard"));

        await waitFor(() => {
            expect(onCopyToClipboard).toHaveBeenCalledTimes(1);
        });
    });

    it("should show exporting state during export", async () => {
        const user = userEvent.setup();
        const slowExport = vi.fn<() => Promise<void>>().mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <ExportButton onExportPng={slowExport} onCopyToClipboard={onCopyToClipboard} />
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
                onCopyToClipboard={onCopyToClipboard}
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
            <ExportButton onExportPng={slowExport} onCopyToClipboard={onCopyToClipboard} />
        );

        await user.click(screen.getByText("Export"));
        await waitFor(() => screen.getByText("Export as PNG"));
        await user.click(screen.getByText("Export as PNG"));

        await waitFor(() => {
            expect(screen.getByText("Exporting...")).toBeDisabled();
        });
    });
});
