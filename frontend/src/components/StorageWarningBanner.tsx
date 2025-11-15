/**
 * Storage Warning Banner Component
 *
 * Displays warnings for:
 * - Storage quota exceeded
 * - Storage unavailable
 * - Multiple tabs detected
 */

import { useStore } from "../shared/store";
import { useState } from "react";
import { STORAGE_WARNING_THRESHOLD } from "../shared/constants";

export function StorageWarningBanner() {
    const storageMetadata = useStore((state) => state.storageMetadata);
    const saveError = useStore((state) => state.saveError);
    const [dismissed, setDismissed] = useState(false);

    if (!storageMetadata || dismissed) {
        return null;
    }

    const { percentUsed, hasMultipleTabs, isAvailable } = storageMetadata;

    // Storage unavailable
    if (!isAvailable) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-800 dark:text-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                        <strong>Storage Unavailable</strong> - Changes will not persist after
                        refresh. Consider exporting your project.
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 ml-4"
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        );
    }

    // Storage quota warning
    if (percentUsed >= STORAGE_WARNING_THRESHOLD) {
        const isError = saveError && saveError.includes("quota");
        const bgColor = isError
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
        const textColor = isError
            ? "text-red-800 dark:text-red-200"
            : "text-yellow-800 dark:text-yellow-200";

        return (
            <div
                className={`${bgColor} border-b px-4 py-2 text-sm ${textColor} flex items-center justify-between`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                        <strong>Storage {isError ? "Full" : "Warning"}</strong> - Using{" "}
                        {percentUsed.toFixed(1)}% of available storage.{" "}
                        {isError
                            ? "Cannot save. Delete unused files."
                            : "Consider deleting unused files."}
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className={textColor + " ml-4 hover:opacity-80"}
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        );
    }

    // Multiple tabs detected
    if (hasMultipleTabs) {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2 text-sm text-blue-800 dark:text-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">ℹ️</span>
                    <div>
                        <strong>Multiple Tabs Detected</strong> - Changes in this tab may be
                        overwritten by other tabs. Last write wins.
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100 ml-4"
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        );
    }

    return null;
}
