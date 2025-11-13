function App() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-primary text-primary-foreground flex items-center px-4 border-b">
        <h1 className="text-lg font-semibold">
          TypeScript UML Graph Visualizer
        </h1>
      </header>

      {/* Main content area with three panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: File Tree */}
        <aside className="w-64 bg-muted border-r flex flex-col">
          <div className="p-3 border-b bg-background">
            <h2 className="text-sm font-medium">Project Files</h2>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {/* File tree will be rendered here */}
            <div className="text-sm text-muted-foreground">No files yet</div>
          </div>
        </aside>

        {/* Center panel: Code Editor */}
        <main className="flex-1 flex flex-col bg-background">
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

        {/* Right panel: UML Diagram */}
        <aside className="w-96 bg-background border-l flex flex-col">
          <div className="p-3 border-b">
            <h2 className="text-sm font-medium">UML Diagram</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            {/* React Flow diagram will be rendered here */}
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No diagram to display
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
