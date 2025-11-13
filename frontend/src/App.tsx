import { useMemo, useCallback } from "react";
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

function App() {
  const { createFile, isInitialized } = useProjectManager();
  const files = useStore((state) => state.files);
  const isCreatingFile = useStore((state) => state.isCreatingFile);
  const setCreatingFile = useStore((state) => state.setCreatingFile);
  const activeFileId = useStore((state) => state.activeFileId);
  const updateFile = useStore((state) => state.updateFile);
  const editorContent = useStore((state) => state.editorContent);
  const isDirty = useStore((state) => state.isDirty);
  const setIsDirty = useStore((state) => state.setIsDirty);

  // Build file tree from files
  const fileTreeManager = useMemo(() => new FileTreeManager(), []);
  const fileTree = useMemo(() => {
    return fileTreeManager.buildTree(files);
  }, [files, fileTreeManager]);

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
  }, []);

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

  const handleCreateClass = async () => {
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
  };

  const handleCreateInterface = async () => {
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
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
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
  );
}

export default App;
