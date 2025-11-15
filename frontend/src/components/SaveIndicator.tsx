/**
 * Save Indicator Component
 *
 * Displays save status: saving, saved, or error
 * Shows time since last save
 */

import { useStore } from "../shared/store";

export function SaveIndicator() {
    const isSaving = useStore((state) => state.isSaving);
    const lastSaved = useStore((state) => state.lastSavedTimestamp);
    const saveError = useStore((state) => state.saveError);
    const autoSaveEnabled = useStore((state) => state.autoSaveEnabled);

    // Don't show indicator if auto-save is disabled
    if (!autoSaveEnabled && !saveError) {
        return null;
    }

    // Error state
    if (saveError) {
        return (
            <div className="text-sm text-destructive flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <span>{saveError}</span>
            </div>
        );
    }

    // Saving state
    if (isSaving) {
        return (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                <span>Saving...</span>
            </div>
        );
    }

    // Saved state with timestamp
    if (lastSaved) {
        const secondsAgo = Math.floor((Date.now() - lastSaved) / 1000);
        let timeText = "";

        if (secondsAgo < 5) {
            timeText = "just now";
        } else if (secondsAgo < 60) {
            timeText = `${secondsAgo}s ago`;
        } else if (secondsAgo < 3600) {
            const minutesAgo = Math.floor(secondsAgo / 60);
            timeText = `${minutesAgo}m ago`;
        } else {
            const hoursAgo = Math.floor(secondsAgo / 3600);
            timeText = `${hoursAgo}h ago`;
        }

        return (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Saved {timeText}</span>
            </div>
        );
    }

    return null;
}
