/**
 * ExportButton Component
 *
 * Provides a button with dropdown menu for exporting diagrams to various formats.
 */

import React, { useState } from "react";
import { Download, Clipboard } from "lucide-react";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface ExportButtonProps {
    /** Callback when PNG export is requested */
    onExportPng: () => Promise<void>;
    /** Callback when clipboard copy is requested */
    onCopyToClipboard: () => Promise<void>;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Optional className for styling */
    className?: string;
}

/**
 * ExportButton - Button with dropdown menu for exporting diagrams
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
    onExportPng,
    onCopyToClipboard,
    disabled = false,
    className,
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleExport = async (exportFn: () => Promise<void>, format: string) => {
        setIsExporting(true);
        setError(null);
        setSuccess(null);

        try {
            await exportFn();
            // Show success message for clipboard copy
            if (format === 'Clipboard') {
                setSuccess('Diagram copied to clipboard!');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to export as ${format}`;
            setError(errorMessage);
            console.error(`Export failed:`, err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className={className}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={disabled || isExporting}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {isExporting ? "Exporting..." : "Export"}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Diagram</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleExport(onExportPng, "PNG")}
                        disabled={isExporting}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export as PNG
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleExport(onCopyToClipboard, "Clipboard")}
                        disabled={isExporting}
                    >
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copy to Clipboard
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Success message */}
            {success && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                    {success}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-2 text-xs text-destructive">
                    {error}
                </div>
            )}
        </div>
    );
};
