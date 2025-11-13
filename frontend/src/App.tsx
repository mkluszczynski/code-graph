import { useMemo, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable";
import { AddButton } from "./components/AddButton";
import { DiagramRenderer } from "./diagram-visualization/DiagramRenderer";
import { FileTreeManager } from "./file-tree/FileTreeManager";
import { FileTreeView } from "./file-tree/FileTreeView";
import { useProjectManager } from "./shared/hooks/useProjectManager";
import { useStore } from "./shared/store";

function App() {
  const { createFile, isInitialized } = useProjectManager();
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const files = useStore((state) => state.files);

  // Build file tree from files
  const fileTreeManager = useMemo(() => new FileTreeManager(), []);
  const fileTree = useMemo(() => {
    return fileTreeManager.buildTree(files);
  }, [files, fileTreeManager]);

  const handleCreateClass = async () => {
    if (isCreatingFile) return;

    const className = prompt("Enter class name:");
    if (!className) return;

    setIsCreatingFile(true);
    try {
      await createFile(className, "class");
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create class file"
      );
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleCreateInterface = async () => {
    if (isCreatingFile) return;

    const interfaceName = prompt("Enter interface name:");
    if (!interfaceName) return;

    setIsCreatingFile(true);
    try {
      await createFile(interfaceName, "interface");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create interface file"
      );
    } finally {
      setIsCreatingFile(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-primary text-primary-foreground flex items-center px-4 border-b">
        <h1 className="text-lg font-semibold">
          TypeScript UML Graph Visualizer
        </h1>
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
                />
              </div>
              <div className="flex-1 overflow-auto p-2">
                {/* File tree */}
                {isInitialized && fileTree.length > 0 ? (
                  <FileTreeView nodes={fileTree} />
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
                {/* Monaco editor will be rendered here */}
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Select or create a file to start editing
                </div>
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
                <DiagramRenderer className="h-full w-full" />
              </div>
            </aside>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default App;
