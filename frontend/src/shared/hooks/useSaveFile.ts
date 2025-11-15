import { useCallback } from "react";
import { useStore } from "../store";

export function useSaveFile() {
    const activeFileId = useStore((state) => state.activeFileId);
    const editorContent = useStore((state) => state.editorContent);
    const isDirty = useStore((state) => state.isDirty);
    const updateFile = useStore((state) => state.updateFile);
    const setIsDirty = useStore((state) => state.setIsDirty);

    const handleSave = useCallback(() => {
        if (!activeFileId || !isDirty) return;

        updateFile(activeFileId, {
            content: editorContent,
            lastModified: Date.now(),
        });
        setIsDirty(false);

        // Show save confirmation
        console.log("File saved successfully");
    }, [activeFileId, isDirty, editorContent, updateFile, setIsDirty]);

    return { handleSave };
}
