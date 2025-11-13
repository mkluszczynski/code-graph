/**
 * useProjectManager Hook
 *
 * Custom hook that integrates ProjectManager with Zustand store
 */

import { useCallback, useEffect, useState } from "react";
import { ProjectManager } from "../../project-management/ProjectManager";
import { useStore } from "../store";
import type { ProjectFile } from "../types";

let projectManagerInstance: ProjectManager | null = null;

/**
 * Get or create the singleton ProjectManager instance
 */
function getProjectManager(): ProjectManager {
  if (!projectManagerInstance) {
    projectManagerInstance = new ProjectManager();
  }
  return projectManagerInstance;
}

export function useProjectManager() {
  const { setFiles, addFile } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize ProjectManager and load files on mount
  useEffect(() => {
    const initializeProject = async () => {
      const manager = getProjectManager();
      await manager.initialize();

      // Load all files into the store
      const files = await manager.getAllFiles();
      setFiles(files);
      setIsInitialized(true);
    };

    initializeProject();
  }, [setFiles]);

  /**
   * Create a new file (class or interface)
   */
  const createFile = useCallback(
    async (name: string, type: "class" | "interface"): Promise<ProjectFile> => {
      const manager = getProjectManager();
      const file = await manager.createFile(name, type);

      // Add to store
      addFile(file);

      return file;
    },
    [addFile]
  );

  return {
    isInitialized,
    createFile,
    projectManager: getProjectManager(),
  };
}
