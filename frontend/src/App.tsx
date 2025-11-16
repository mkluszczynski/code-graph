import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { CodeEditor } from "./code-editor/CodeEditor";
import { DiagramRenderer } from "./diagram-visualization/DiagramRenderer";
import { FileTreePanel } from "./components/FileTreePanel";
import { useProjectManager } from "./shared/hooks/useProjectManager";
import { useStore } from "./shared/store";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useKeyboardShortcuts } from "./shared/hooks/useKeyboardShortcuts";
import { ThemeToggle } from "./components/ThemeToggle";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { PersistenceControllerContext } from "./project-management/PersistenceControllerContext";
import { StorageWarningBanner } from "./components/StorageWarningBanner";
import { usePersistence } from "./shared/hooks/usePersistence";
import { useFileCreation } from "./shared/hooks/useFileCreation";
import { useSaveFile } from "./shared/hooks/useSaveFile";
import { useBeforeUnload } from "./shared/hooks/useBeforeUnload";

function App() {
  const { createFile, isInitialized, projectManager } = useProjectManager();
  const files = useStore((state) => state.files);

  // Initialize persistence controller and handle storage warnings
  const { persistenceController, storageWarning, setStorageWarning } =
    usePersistence(isInitialized, projectManager);

  // Handle file creation (class/interface)
  const {
    handleCreateClass,
    handleCreateInterface,
    handleNewFileDialog,
    isCreatingFile,
  } = useFileCreation(createFile);

  // Handle file saving
  const { handleSave } = useSaveFile();

  // Setup crash recovery warning
  useBeforeUnload();

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
              <FileTreePanel
                files={files}
                isInitialized={isInitialized}
                onCreateClass={handleCreateClass}
                onCreateInterface={handleCreateInterface}
                isCreatingFile={isCreatingFile}
              />
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
                <div className="p-3 border-b flex items-center justify-between">
                  <h2 className="text-sm font-medium">UML Diagram</h2>
                  <ViewModeToggle />
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
