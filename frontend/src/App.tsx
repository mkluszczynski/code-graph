import { useMemo, useCallback, useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { AddButton } from "./components/AddButton";
import { CodeEditor } from "./code-editor/CodeEditor";
import { DiagramRenderer } from "./diagram-visualization/DiagramRenderer";
import { FileTreeManager } from "./file-tree/FileTreeManager";
import { FileTreeView } from "./file-tree/FileTreeView";
import { useProjectManager } from "./shared/hooks/useProjectManager";
import { useStore } from "./shared/store";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useKeyboardShortcuts } from "./shared/hooks/useKeyboardShortcuts";
import { ThemeToggle } from "./components/ThemeToggle";
import { PersistenceController } from "./project-management/PersistenceController";
import { PersistenceControllerContext } from "./project-management/PersistenceControllerContext";
import { StorageUnavailableError } from "./shared/types/errors";
import { StorageWarningBanner } from "./components/StorageWarningBanner";

function App() {
  const { createFile, isInitialized, projectManager } = useProjectManager();
  const files = useStore((state) => state.files);
  const isCreatingFile = useStore((state) => state.isCreatingFile);
  const setCreatingFile = useStore((state) => state.setCreatingFile);
  const activeFileId = useStore((state) => state.activeFileId);
  const updateFile = useStore((state) => state.updateFile);
  const editorContent = useStore((state) => state.editorContent);
  const isDirty = useStore((state) => state.isDirty);
  const setIsDirty = useStore((state) => state.setIsDirty);

  // Persistence controller state
  const [persistenceController, setPersistenceController] =
    useState<PersistenceController | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Initialize persistence controller
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
          setStorageWarning("Storage initialization failed. Changes may not persist.");
        }
      }
    };

    initPersistence();

    // Cleanup on unmount
    return () => {
      persistenceController?.cleanup();
    };
  }, [isInitialized, projectManager]);

  // Add beforeunload listener for crash recovery debugging
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { isSaving, pendingSaves, lastSavedTimestamp } = useStore.getState();

      // Log save status for debugging
      console.log('[CRASH RECOVERY] Page unloading - Save status:', {
        isSaving,
        pendingSavesCount: pendingSaves.size,
        lastSavedTimestamp,
        timeSinceLastSave: lastSavedTimestamp
          ? Date.now() - lastSavedTimestamp
          : null,
      });

      // If there are pending saves or actively saving, warn user
      if (isSaving || pendingSaves.size > 0) {
        const message = 'Changes are being saved. Leaving now may lose recent edits.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Build file tree from files
  const fileTreeManager = useMemo(() => new FileTreeManager(), []);
  const fileTree = useMemo(() => {
    return fileTreeManager.buildTree(files);
  }, [files, fileTreeManager]);

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

  // Show dialog for creating a new file
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

  // Save current file
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

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNewFile: handleNewFileDialog,
    onSave: handleSave,
    enabled: true,
  });

  return (
    <PersistenceControllerContext.Provider value={persistenceController}>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        {/* Storage Warning Banner - from store metadata */}
        <StorageWarningBanner />

        {/* Storage Warning Banner - initialization errors */}
        {storageWarning && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200 flex items-center justify-between">
            <span>⚠️ {storageWarning}</span>
            <button
              onClick={() => setStorageWarning(null)}
              className="text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <header className="h-12 bg-primary text-primary-foreground flex items-center justify-between px-4 border-b">
          <h1 className="text-lg font-semibold">
            TypeScript UML Graph Visualizer
          </h1>
          <ThemeToggle />
        </header>

        {/* Main content area with three panels */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Left panel: File Tree */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <aside className="h-full bg-muted border-r flex flex-col">
                <div className="p-3 border-b bg-background flex items-center justify-between">
                  <h2 className="text-sm font-medium">Project Files</h2>
                  <AddButton
                    onCreateClass={handleCreateClass}
                    onCreateInterface={handleCreateInterface}
                    isLoading={isCreatingFile}
                  />
                </div>
                <div className="flex-1 overflow-auto p-2">
                  {/* File tree */}
                  {isInitialized && fileTree.length > 0 ? (
                    <ErrorBoundary
                      fallback={
                        <div className="text-sm text-destructive p-2">
                          Error loading file tree
                        </div>
                      }
                    >
                      <FileTreeView nodes={fileTree} />
                    </ErrorBoundary>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isInitialized ? "No files yet" : "Loading..."}
                    </div>
                  )}
                </div>
              </aside>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center panel: Code Editor */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <main className="h-full flex flex-col bg-background">
                <div className="p-3 border-b">
                  <h2 className="text-sm font-medium">Code Editor</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full text-destructive">
                        Error loading code editor
                      </div>
                    }
                  >
                    <CodeEditor />
                  </ErrorBoundary>
                </div>
              </main>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right panel: UML Diagram */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <aside className="h-full bg-background border-l flex flex-col">
                <div className="p-3 border-b">
                  <h2 className="text-sm font-medium">UML Diagram</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ErrorBoundary
                    fallback={
                      <div className="flex items-center justify-center h-full text-destructive">
                        Error loading diagram
                      </div>
                    }
                  >
                    <DiagramRenderer className="h-full w-full" />
                  </ErrorBoundary>
                </div>
              </aside>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </PersistenceControllerContext.Provider>
  );
}

export default App;
