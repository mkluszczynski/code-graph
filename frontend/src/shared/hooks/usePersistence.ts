import { useEffect, useState } from "react";
import { PersistenceController } from "../../project-management/PersistenceController";
import { ProjectManager } from "../../project-management/ProjectManager";
import { StorageUnavailableError } from "../types/errors";

export function usePersistence(
    isInitialized: boolean,
    projectManager: ProjectManager
) {
    const [persistenceController, setPersistenceController] =
        useState<PersistenceController | null>(null);
    const [storageWarning, setStorageWarning] = useState<string | null>(null);

    useEffect(() => {
        const initPersistence = async () => {
            if (!isInitialized) return;

            try {
                const controller = new PersistenceController(projectManager);
                await controller.initialize();
                setPersistenceController(controller);
                setStorageWarning(null);
            } catch (error) {
                if (error instanceof StorageUnavailableError) {
                    setStorageWarning(error.message);
                } else {
                    console.error("Failed to initialize persistence:", error);
                    setStorageWarning(
                        "Storage initialization failed. Changes may not persist."
                    );
                }
            }
        };

        initPersistence();

        return () => {
            persistenceController?.cleanup();
        };
    }, [isInitialized, projectManager]);

    return {
        persistenceController,
        storageWarning,
        setStorageWarning,
    };
}
