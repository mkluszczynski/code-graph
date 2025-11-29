# TypeScript UML Graph Visualizer - User Guide

**Version**: 1.2.0  
**Last Updated**: November 16, 2025

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [User Interface Overview](#user-interface-overview)
5. [Creating Files](#creating-files)
6. [Managing Folders](#managing-folders)
7. [Writing Code](#writing-code)
8. [Navigating the Diagram](#navigating-the-diagram)
9. [Understanding UML Diagrams](#understanding-uml-diagrams)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Tips and Best Practices](#tips-and-best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

The TypeScript UML Graph Visualizer is an IDE-like web application that provides real-time UML class diagram visualization for your TypeScript code. As you write classes and interfaces, the application automatically generates and updates UML diagrams to help you visualize code structure and relationships.

### Key Benefits

- **Real-time Visualization**: See your code structure as UML diagrams instantly
- **Bidirectional Navigation**: Click on diagram nodes to jump to code, or navigate via file tree
- **Relationship Visualization**: Understand inheritance, implementation, and associations at a glance
- **No Setup Required**: Entirely browser-based, no installation needed
- **Persistent Storage**: Your projects are saved locally in your browser

---

## Getting Started

### First Steps

1. **Open the Application**: Navigate to the application URL in your modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)

2. **Create Your First File**: Click the "Add File" button in the top-left panel and select "New Class" or "New Interface"

3. **Write Some Code**: Start typing TypeScript code in the center editor panel

4. **Watch the Magic**: Your UML diagram will appear automatically in the right panel within 2 seconds

### System Requirements

- **Browser**: Modern browser with ES6+ support
- **Screen Resolution**: Minimum 1280px width recommended
- **Storage**: ~5MB local storage for average projects
- **Internet**: Not required after initial load (works offline)

---

## Core Features

### 1. File Creation
- Create TypeScript class and interface files
- Automatic template generation
- Naming validation

### 2. Code Editing
- Monaco Editor (same as VS Code)
- TypeScript IntelliSense
- Syntax highlighting
- Real-time error detection

### 3. UML Visualization
- Automatic diagram generation
- Relationship mapping (inheritance, implementation, associations)
- Interactive node navigation
- Zoom and pan controls

### 4. Project Management
- Hierarchical file tree
- File selection and navigation
- Automatic file saving
- Local persistence (IndexedDB)

---

## User Interface Overview

The application is divided into three main panels:

### Left Panel: Project Files
- **File Tree**: Hierarchical view of all your TypeScript files
- **Add Button**: Create new classes or interfaces
- **File Selection**: Click any file to open it in the editor

### Center Panel: Code Editor
- **Monaco Editor**: Full-featured code editor
- **File Title**: Shows currently opened file name
- **Syntax Highlighting**: TypeScript-aware coloring
- **Auto-save**: Changes are saved automatically when switching files

### Right Panel: UML Diagram
- **Interactive Diagram**: Click nodes to navigate to files
- **View Mode Toggle**: Switch between File View and Project View
- **Zoom Controls**: Buttons to zoom in/out or fit to view
- **Mini-map**: Overview of large diagrams
- **Pan**: Drag to move around the diagram

---

## Creating Files

### Using the Add Button

1. Click the **"Add File"** button in the left panel
2. Select file type:
   - **New Class**: Creates a TypeScript class file
   - **New Interface**: Creates a TypeScript interface file
3. Enter a name when prompted (e.g., `Person`, `IRepository`)
4. File will appear in the tree with a template

### File Naming Rules

- Must start with a letter
- Can contain letters, numbers, underscores
- No spaces or special characters
- File extension `.ts` is added automatically
- Names must be unique within the project

### Class Template

```typescript
export class ClassName {
  // Add properties and methods
}
```

### Interface Template

```typescript
export interface InterfaceName {
  // Add properties and methods
}
```

---

## Managing Folders

Organize your TypeScript files into folders for better project structure. Folders help group related classes and interfaces logically.

### Creating Folders

1. Click the **"Add File"** button (dropdown) in the left panel
2. Select **"Add Folder"**
3. Enter a folder name (e.g., `models`, `services`, `components`)
4. The folder will appear in the file tree

**Folder Naming Rules**:
- Must start with a letter
- Can contain letters, numbers, underscores, and hyphens
- No spaces or special characters
- Names must be unique within the parent folder
- Maximum folder depth: 10 levels

### Deleting Folders

1. Right-click on a folder in the file tree
2. Select **"Delete"** from the context menu
3. A confirmation dialog appears showing how many files will be deleted
4. Click **"Delete"** to confirm, or **"Cancel"** to abort

**Important**: Deleting a folder also deletes all files and subfolders inside it. This action cannot be undone.

### Renaming Folders

1. Right-click on a folder in the file tree
2. Select **"Rename"** from the context menu
3. Type the new name in the inline input
4. Press **Enter** to confirm or **Escape** to cancel

**Notes**:
- All files within the folder will have their paths updated automatically
- If the renamed folder contains the currently active file, the editor will update accordingly
- The rename operation is atomic - either all files update or none do

### Duplicating Folders

1. Right-click on a folder in the file tree
2. Select **"Duplicate"** from the context menu
3. A copy of the folder (and all its contents) is created with a " copy" suffix

**Example**: Duplicating `/src/models` creates `/src/models copy` with all the same files.

### Organizing Files in Folders

After creating folders, you can create files directly inside them:
1. Navigate to the folder in the file tree
2. Use the **"Add File"** button 
3. New files are created at the root level by default
4. Files can be created in specific folders in future updates

### Best Practices

**Recommended Folder Structure**:
```
/
├── models/          # Data classes and entities
│   ├── Person.ts
│   ├── Employee.ts
│   └── interfaces/  # Model interfaces
│       └── IEntity.ts
├── services/        # Business logic
│   ├── UserService.ts
│   └── OrderService.ts
├── repositories/    # Data access
│   └── UserRepository.ts
└── utils/           # Utility functions
    └── helpers.ts
```

**Tips**:
- Group related classes in the same folder
- Keep interface files near their implementations
- Use meaningful folder names that describe the content
- Limit folder nesting to 3-4 levels for clarity

---

## Writing Code

### Supported TypeScript Features

#### Classes
```typescript
export class Person {
  // Properties
  private name: string;
  protected age: number;
  public email: string;

  // Methods
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  public getName(): string {
    return this.name;
  }
}
```

#### Interfaces
```typescript
export interface IRepository<T> {
  findById(id: string): T | null;
  save(entity: T): void;
  delete(id: string): boolean;
}
```

#### Inheritance
```typescript
export class Student extends Person {
  private studentId: string;

  constructor(name: string, age: number, studentId: string) {
    super(name, age);
    this.studentId = studentId;
  }
}
```

#### Implementation
```typescript
export class UserRepository implements IRepository<User> {
  findById(id: string): User | null {
    // Implementation
    return null;
  }

  save(entity: User): void {
    // Implementation
  }

  delete(id: string): boolean {
    // Implementation
    return false;
  }
}
```

#### Associations
```typescript
export class Order {
  private customer: Customer;  // Association
  private items: OrderItem[];  // Association (array)
}
```

### Real-time Parsing

- **Debounced**: Diagram updates 500ms after you stop typing
- **Error Handling**: Syntax errors show last valid diagram
- **Performance**: Handles up to 20 classes per file efficiently

---

## Navigating the Diagram

### View Modes

The application offers two view modes to help you understand your code at different levels:

#### File View (Default)
- **Purpose**: Focused analysis of a single file
- **What's Shown**: Only entities from the currently selected file, plus imported entities that have direct relationships
- **Use Case**: Understanding a specific class and its immediate dependencies
- **Layout**: Compact spacing for detailed viewing
- **Shortcut**: `Ctrl+Shift+F` (Windows/Linux) or `⌘+Shift+F` (Mac)

**Example**: If `Manager.ts` imports `Employee` from another file and extends it, both `Manager` and `Employee` will appear in the diagram. If `Manager.ts` also imports `Logger` but doesn't use it in relationships, `Logger` won't appear.

#### Project View
- **Purpose**: Strategic overview of the entire codebase
- **What's Shown**: All entities from all files in the project
- **Use Case**: Understanding overall architecture and system design
- **Layout**: Spacious layout for large-scale visualization
- **Shortcut**: `Ctrl+Shift+P` (Windows/Linux) or `⌘+Shift+P` (Mac)

**Example**: See all classes and interfaces in your project simultaneously, with all relationships visible.

#### Switching Views

Use the toggle buttons at the top of the diagram panel:
- Click **"File View"** for focused, single-file analysis
- Click **"Project View"** for complete project overview
- Your view preference persists as you navigate between files

### Interacting with Nodes

- **Click a Node**: Opens the corresponding file in the editor
- **Drag a Node**: Reposition manually (positions are temporary)
- **Hover**: See node details

### Zoom and Pan

- **Mouse Wheel**: Zoom in/out
- **Drag Background**: Pan around
- **Controls**: Use +/- buttons in bottom-left
- **Fit View**: Click compass icon to fit all nodes
- **Mini-map**: Click and drag for quick navigation

### Understanding Cross-File Relationships

When viewing a file that imports classes or interfaces from other files:

1. **Direct Relationships**: Imported entities that your class extends, implements, or uses as property types will automatically appear in File View
2. **Transitive Dependencies**: If you import `Manager` which extends `Employee` which extends `Person`, all three will appear if there are connecting relationships
3. **No Relationship**: Imported entities without relationships are hidden in File View to reduce clutter
4. **Relationship Indicators**: Arrows show inheritance (solid line with hollow triangle), implementation (dashed line with hollow triangle), and associations (solid line with arrow)

### Large Diagrams

For projects with many classes:
1. **Use File View**: Start with File View to focus on one file at a time
2. **Switch to Project View**: Use Project View when you need to see the big picture
3. **Mini-map**: Use the mini-map (bottom-left) for overview navigation
4. **Zoom Controls**: Zoom out to see full structure, zoom in for detail
5. **Pan**: Drag to navigate between sections

---

## Understanding UML Diagrams

### Node Types

#### Class Node
```
┌─────────────────┐
│   ClassName     │  ← Class name (bold)
├─────────────────┤
│ - privateProp   │  ← Properties (with visibility)
│ + publicProp    │
├─────────────────┤
│ + method(): T   │  ← Methods (with return type)
└─────────────────┘
```

#### Interface Node
```
┌─────────────────┐
│ <<interface>>   │  ← Stereotype
│ InterfaceName   │  ← Interface name
├─────────────────┤
│ property: T     │  ← Properties
├─────────────────┤
│ method(): T     │  ← Method signatures
└─────────────────┘
```

### Visibility Modifiers

- **-** : `private` (red)
- **#** : `protected` (orange)
- **+** : `public` (green)
- No symbol: default/public

### Relationship Types

#### Inheritance (Extends)
```
Child ───────▷ Parent
      (solid line, hollow triangle)
```
- Represents `class Child extends Parent`
- Shows "is-a" relationship

#### Implementation (Implements)
```
Class ┈┈┈┈┈┈▷ Interface
      (dashed line, hollow triangle)
```
- Represents `class implements interface`
- Shows contract fulfillment

#### Association (Uses)
```
ClassA ───────→ ClassB
      (solid line, arrow)
```
- Represents property of another class type
- Shows "has-a" relationship

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+N` (Windows/Linux)<br>`⌘+N` (Mac) | New File | Open file creation dialog |
| `Ctrl+S` (Windows/Linux)<br>`⌘+S` (Mac) | Save File | Save current file changes |
| `Ctrl+Shift+F` (Windows/Linux)<br>`⌘+Shift+F` (Mac) | File View | Switch to file-focused diagram view |
| `Ctrl+Shift+P` (Windows/Linux)<br>`⌘+Shift+P` (Mac) | Project View | Switch to project-wide diagram view |

### Editor Shortcuts (Monaco)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` | Trigger IntelliSense |
| `Ctrl+/` | Toggle line comment |
| `Alt+Up/Down` | Move line up/down |
| `Ctrl+D` | Add selection to next find match |
| `F12` | Go to definition |
| `Ctrl+F` | Find |
| `Ctrl+H` | Replace |

---

## Tips and Best Practices

### Code Organization

1. **One Class Per File**: Keep files focused and manageable
2. **Meaningful Names**: Use descriptive class and interface names
3. **Export Everything**: Always export classes/interfaces for diagram visibility
4. **Use Interfaces**: Define contracts before implementations

### Performance Optimization

1. **File Size**: Keep individual files under 20 classes
2. **Project Size**: Optimal for 10-50 files total
3. **Complexity**: Break down large classes into smaller ones

### Diagram Clarity

1. **Minimize Dependencies**: Reduce coupling for clearer diagrams
2. **Use Interfaces**: Separate interface files for cleaner structure
3. **Group Related Classes**: Keep related files together

### Workflow

1. **Design First**: Sketch classes and relationships
2. **Create Interfaces**: Define contracts
3. **Implement Classes**: Write implementations
4. **Refactor**: Use diagram to identify improvements

---

## Troubleshooting

### Common Issues

#### Diagram Not Updating

**Symptoms**: Code changes don't reflect in diagram

**Solutions**:
- Wait 2 seconds for debounce
- Check for syntax errors (red squiggly lines)
- Ensure class/interface is exported
- Refresh browser if stuck

#### File Tree Empty

**Symptoms**: No files showing in left panel

**Solutions**:
- Create a new file using Add button
- Check browser console for errors
- Clear IndexedDB and restart: `localStorage.clear()`

#### Editor Not Loading

**Symptoms**: Code editor shows error or doesn't appear

**Solutions**:
- Refresh browser
- Check browser console for errors
- Ensure browser supports ES6+
- Try different browser

#### Parse Errors

**Symptoms**: "Syntax Error" message above diagram

**Solutions**:
- Check editor for red error indicators
- Fix TypeScript syntax errors
- Last valid diagram remains visible
- Error message shows line number

#### Slow Performance

**Symptoms**: Laggy typing or diagram updates

**Solutions**:
- Reduce file size (split large classes)
- Reduce number of relationships
- Close unused browser tabs
- Try desktop browser instead of mobile

### Browser Storage Issues

If your project data is lost or corrupted:

1. **Check Browser Storage**: Ensure IndexedDB is enabled
2. **Storage Quota**: Clear old data if running low on space
3. **Incognito Mode**: Storage is temporary in incognito/private mode
4. **Browser Updates**: Some browser updates clear data

### Getting Help

If you encounter persistent issues:

1. **Check Browser Console**: Press F12 and look for errors
2. **Clear Cache**: Try hard refresh (Ctrl+Shift+R)
3. **Update Browser**: Ensure you're on latest version
4. **Report Bug**: Include browser version and error messages

---

## Advanced Features

### Diagram Export

Export your UML diagrams to share with team members, include in documentation, or save for reference.

#### Export as PNG

1. Click the **"Export"** dropdown button in the top-right corner of the diagram panel
2. Select **"Export as PNG"**
3. The diagram will be downloaded to your default downloads folder
4. File name format: `uml-diagram-YYYYMMDD.png` (date-stamped)

**PNG Export Features**:
- **Smart Cropping**: Images are automatically cropped to diagram content with minimal padding (30px border)
- **High Quality**: Full resolution capture maintains diagram clarity
- **Compact Files**: No excessive whitespace - images are sized to content
- **Fast**: Export completes in under 2 seconds for typical diagrams (5-20 classes)

**Use Cases**: Embedding in documents, presentations, web pages, Slack/Teams messages

#### Copy to Clipboard

For quick sharing without saving intermediate files:

1. Click the **"Export"** dropdown button
2. Select **"Copy to Clipboard"**
3. A success message confirms the copy
4. Paste directly into:
   - Google Docs, Microsoft Word, PowerPoint
   - Slack, Teams, Discord messages
   - Email clients (Gmail, Outlook, etc.)
   - Image editors (Photoshop, GIMP, etc.)

**Clipboard Copy Features**:
- **Instant Sharing**: No intermediate file downloads
- **Same Quality**: Uses the same smart cropping as PNG export
- **Fast Workflow**: Copy and paste in under 3 seconds total
- **Cross-Platform**: Works on Windows, macOS, and Linux

**Browser Requirements**: Requires modern browser with Clipboard API support (Chrome 76+, Firefox 87+, Safari 13.1+, Edge 79+)

**Troubleshooting**:
- If clipboard copy fails, you may need to grant clipboard permissions in browser settings
- For large diagrams (50+ classes), consider using PNG export instead
- Some older browsers may not support clipboard copy - use PNG export as fallback

#### Export Tips

- **View Mode Matters**: Export reflects your current view mode:
  - **File View**: Exports only the focused file and its related imports
  - **Project View**: Exports the entire project architecture
- **Before Exporting**: 
  - Use **Fit View** button to ensure all nodes are visible
  - Adjust zoom level if needed (exported image uses current diagram state)
- **Large Diagrams**: For projects with 50+ classes, use **Fit View** first to capture all entities
- **Quick Sharing**: Use clipboard copy for instant sharing in chat apps or documents
- **Archival**: Use PNG export for permanent storage or documentation

### Dark Mode (Available)

Toggle between light and dark themes for comfortable viewing in any environment.

### Performance Monitoring

The application tracks:
- Parse time per file
- Diagram generation time
- Memory usage

Check browser console for performance metrics.

---

## Keyboard Reference Card

```
┌─────────────────────────────────────────────────┐
│  TypeScript UML Visualizer - Shortcuts         │
├─────────────────────────────────────────────────┤
│  Ctrl/⌘ + N        →  New File                 │
│  Ctrl/⌘ + S        →  Save File                │
│  Ctrl/⌘ + Shift + F→  File View                │
│  Ctrl/⌘ + Shift + P→  Project View             │
│  Ctrl + Space      →  IntelliSense (editor)    │
│  Ctrl + /          →  Comment Line (editor)    │
│  Mouse Wheel       →  Zoom Diagram             │
│  Click Node        →  Open File                │
│  Drag BG           →  Pan Diagram              │
└─────────────────────────────────────────────────┘
```

---

## Glossary

**Class**: TypeScript class definition with properties and methods  
**Interface**: TypeScript interface defining a contract  
**UML**: Unified Modeling Language for visualizing code structure  
**Node**: Graphical representation of a class or interface  
**Edge**: Line connecting nodes (represents relationships)  
**Association**: Relationship where one class uses another  
**Inheritance**: Relationship where class extends another  
**Implementation**: Relationship where class implements interface  
**Debounce**: Delay before action triggers (reduces excessive updates)  
**IndexedDB**: Browser storage for persisting data locally  

---

## Version History

### Version 1.2.0 (November 2025)
- **NEW**: Folder management - create, delete, rename, and duplicate folders
- **NEW**: Folder context menu with right-click access to folder operations
- **NEW**: Inline folder rename with Enter/Escape key support
- **NEW**: Folder duplication with automatic "copy" suffix naming
- **NEW**: Confirmation dialog for folder deletion (shows affected file count)
- **IMPROVED**: File tree now displays folders with proper hierarchy
- **IMPROVED**: Folders persist to IndexedDB with atomic operations
- **IMPROVED**: Error handling for storage quota and database failures

### Version 1.1.0 (November 2025)
- **NEW**: File View and Project View toggle for different analysis perspectives
- **NEW**: Cross-file import visualization with relationship detection
- **NEW**: Keyboard shortcuts for view mode switching (Ctrl+Shift+F/P)
- **IMPROVED**: Diagram scope control shows only relevant entities
- **IMPROVED**: Auto-layout adapts to view mode (compact vs spacious)
- **IMPROVED**: Performance optimization for multi-file projects

### Version 1.0.0 (November 2025)
- Initial release
- Real-time UML visualization
- File tree navigation
- Monaco code editor
- Relationship visualization
- Keyboard shortcuts
- Error boundaries
- Loading states
- Dark mode support

---

## Conclusion

The TypeScript UML Graph Visualizer helps you understand and design your code structure visually. Whether you're learning TypeScript, designing a new system, or refactoring existing code, this tool provides instant feedback through automatically generated UML diagrams.

**Happy coding!** 🚀

---

*For technical documentation and developer information, see the README.md and quickstart.md files in the repository.*
