import { useCallback } from "react";
import { useStore } from "../store";
import type { ProjectFile } from "../types";

export function useFileCreation(
    createFile: (
        name: string,
        type: "class" | "interface"
    ) => Promise<ProjectFile>
) {
    const isCreatingFile = useStore((state) => state.isCreatingFile);
    const setCreatingFile = useStore((state) => state.setCreatingFile);

    const handleCreateClass = useCallback(async () => {
        if (isCreatingFile) return;

        const className = prompt("Enter class name:");
        if (!className) return;

        setCreatingFile(true);
        try {
            await createFile(className, "class");
        } catch (error) {
            alert(
                error instanceof Error ? error.message : "Failed to create class file"
            );
        } finally {
            setCreatingFile(false);
        }
    }, [isCreatingFile, createFile, setCreatingFile]);

    const handleCreateInterface = useCallback(async () => {
        if (isCreatingFile) return;

        const interfaceName = prompt("Enter interface name:");
        if (!interfaceName) return;

        setCreatingFile(true);
        try {
            await createFile(interfaceName, "interface");
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to create interface file"
            );
        } finally {
            setCreatingFile(false);
        }
    }, [isCreatingFile, createFile, setCreatingFile]);

    const handleNewFileDialog = useCallback(() => {
        const choice = prompt(
            "Choose file type:\n1. Class\n2. Interface\n\nEnter 1 or 2:"
        );

        if (choice === "1") {
            handleCreateClass();
        } else if (choice === "2") {
            handleCreateInterface();
        }
    }, [handleCreateClass, handleCreateInterface]);

    return {
        handleCreateClass,
        handleCreateInterface,
        handleNewFileDialog,
        isCreatingFile,
    };
}
