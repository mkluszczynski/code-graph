# TypeScript UML Graph Visualizer - User Guide

**Version**: 1.0.0  
**Last Updated**: November 14, 2025

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [User Interface Overview](#user-interface-overview)
5. [Creating Files](#creating-files)
6. [Writing Code](#writing-code)
7. [Navigating the Diagram](#navigating-the-diagram)
8. [Understanding UML Diagrams](#understanding-uml-diagrams)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Tips and Best Practices](#tips-and-best-practices)
11. [Troubleshooting](#troubleshooting)

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

### Large Diagrams

For projects with many classes:
1. Use the **mini-map** (bottom-left) for overview
2. **Zoom out** to see full structure
3. **Zoom in** on specific areas for detail
4. **Pan** to navigate between sections

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

### Diagram Export (Coming Soon)

Future versions will support:
- Export as PNG image
- Export as SVG vector
- Print diagram

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
┌────────────────────────────────────────────────┐
│  TypeScript UML Visualizer - Shortcuts        │
├────────────────────────────────────────────────┤
│  Ctrl/⌘ + N    →  New File                    │
│  Ctrl/⌘ + S    →  Save File                   │
│  Ctrl + Space  →  IntelliSense (in editor)    │
│  Ctrl + /      →  Comment Line (in editor)    │
│  Mouse Wheel   →  Zoom Diagram                 │
│  Click Node    →  Open File                    │
│  Drag BG       →  Pan Diagram                  │
└────────────────────────────────────────────────┘
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
