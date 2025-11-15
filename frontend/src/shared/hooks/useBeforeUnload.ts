import { useEffect } from "react";
import { useStore } from "../store";

export function useBeforeUnload() {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const { isSaving, pendingSaves, lastSavedTimestamp } =
                useStore.getState();

            // Log save status for debugging
            console.log("[CRASH RECOVERY] Page unloading - Save status:", {
                isSaving,
                pendingSavesCount: pendingSaves.size,
                lastSavedTimestamp,
                timeSinceLastSave: lastSavedTimestamp
                    ? Date.now() - lastSavedTimestamp
                    : null,
            });

            // If there are pending saves or actively saving, warn user
            if (isSaving || pendingSaves.size > 0) {
                const message =
                    "Changes are being saved. Leaving now may lose recent edits.";
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);
}
