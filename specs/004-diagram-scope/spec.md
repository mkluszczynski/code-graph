# Feature Specification: UML Diagram Scope Control & Cross-File Import Resolution

**Feature Branch**: `004-diagram-scope`  
**Created**: 2025-11-16  
**Status**: Draft  
**Input**: User description: "Fix diagram scope issues: isolate single-file view, implement cross-file imports, add project-wide view toggle"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Isolated File View (Priority: P1)

As a developer, when I select a file in the file tree, I want to see ONLY the classes and interfaces defined in that file with their internal relationships, so I can focus on understanding a single file's structure without visual clutter from other files.

**Why this priority**: This is the critical bug fix. Currently, the diagram shows entities from ALL files simultaneously, making it confusing and unusable when working with multi-file projects. This must be fixed first to restore basic usability.

**Independent Test**: Can be fully tested by creating two files with classes, clicking on File A, and verifying that only File A's entities appear in the diagram (no entities from File B should be visible).

**Acceptance Scenarios**:

1. **Given** I have two files: "Person.ts" with class Person and "Employee.ts" with class Employee, **When** I click on "Person.ts" in the file tree, **Then** the diagram displays ONLY the Person class (Employee is not shown)
2. **Given** I am viewing Person.ts with only Person class visible, **When** I click on "Employee.ts", **Then** the diagram clears Person and displays ONLY the Employee class
3. **Given** a file contains a class that extends another class in the SAME file, **When** I select that file, **Then** I see both classes with the inheritance relationship arrow between them
4. **Given** a file contains a class implementing an interface in the SAME file, **When** I select that file, **Then** I see both the class and interface with the realization relationship arrow

---

### User Story 2 - Cross-File Import Visualization (Priority: P2)

As a developer, when viewing a file that imports classes or interfaces from other files, I want to see those imported types in the diagram with relationship arrows, so I can understand dependencies between files.

**Why this priority**: This enables understanding cross-file relationships, which is essential for comprehending application architecture. Without this, developers can't see how files interact.

**Independent Test**: Can be fully tested by creating two files where File A imports from File B, selecting File A, and verifying that both File A's entities AND the imported entities from File B appear with relationship arrows.

**Acceptance Scenarios**:

1. **Given** "Employee.ts" imports Person from "Person.ts" and extends it, **When** I select "Employee.ts", **Then** the diagram shows Employee class AND Person class with an inheritance arrow from Employee to Person
2. **Given** "Manager.ts" imports both Person and Employee, extending Employee, **When** I select "Manager.ts", **Then** the diagram shows Manager, Employee, AND Person with inheritance chain: Manager → Employee → Person
3. **Given** "UserService.ts" imports IUser interface and has a property of type IUser, **When** I select "UserService.ts", **Then** the diagram shows UserService class AND IUser interface with an association arrow
4. **Given** a file imports a class but doesn't use it in any relationship, **When** I select that file, **Then** the imported class does NOT appear (only related imports shown)
5. **Given** a circular import exists (File A imports from B, B imports from A), **When** I select either file, **Then** the diagram shows both entities with bidirectional relationships without infinite loop

---

### User Story 3 - Project-Wide View Toggle (Priority: P3)

As a developer, I want to toggle between "File View" and "Project View" modes, so I can see either a focused single-file diagram or the entire project's class structure at once.

**Why this priority**: This adds strategic value for understanding overall architecture but is not critical for core functionality. File view (P1) and imports (P2) provide the essential features.

**Independent Test**: Can be fully tested by creating multiple files, switching to "Project View" mode, and verifying that ALL entities from ALL files appear in the diagram simultaneously.

**Acceptance Scenarios**:

1. **Given** I am in "File View" mode viewing "Person.ts", **When** I click the "Project View" toggle button, **Then** the diagram expands to show ALL classes and interfaces from ALL project files with all relationships
2. **Given** I am in "Project View" seeing all entities, **When** I click the "File View" toggle button, **Then** the diagram returns to showing only the currently selected file's entities
3. **Given** I switch to "Project View", **When** I select a different file in the file tree, **Then** the view remains in "Project View" mode showing all entities (mode is sticky)
4. **Given** the project has 10+ files with many entities, **When** I switch to "Project View", **Then** the diagram auto-arranges all entities in a readable layout (no overlapping)
5. **Given** I am in "Project View", **When** I click on a node in the diagram, **Then** the corresponding file becomes active in the editor (navigation still works)

---

### Edge Cases

- What happens when a file imports from a non-existent file? → Diagram shows only the entities defined in the current file, silently ignores broken imports (no error state)
- What happens when a file has 20+ classes? → Diagram renders all with auto-layout, may require scrolling/zooming (performance tested separately)
- What happens when switching files rapidly? → Debounced updates prevent flickering, latest selection wins
- What happens when in Project View with no files? → Empty state message: "No files in project. Create a file to get started."
- What happens when import path is relative (e.g., './Person')? → System resolves relative imports correctly based on file tree structure
- What happens when import uses index files (e.g., 'from ./models')? → System attempts resolution; if not found, treats as external dependency (ignored in diagram)
- What happens when toggling view modes with parse errors? → Last valid diagram for current mode is displayed, error banner remains visible

## Requirements *(mandatory)*

### Functional Requirements

#### File View Mode (Default)

- **FR-001**: System MUST display only entities (classes and interfaces) defined in the currently selected file when no imports exist
- **FR-002**: System MUST display relationships (inheritance, realization, association) between entities within the same file
- **FR-003**: System MUST display imported entities when they have a relationship with entities in the current file (inheritance, realization, or association)
- **FR-004**: System MUST NOT display imported entities that have no relationship with entities in the current file
- **FR-005**: System MUST resolve relative import paths correctly (e.g., './Person', '../models/User')
- **FR-006**: System MUST resolve absolute import paths relative to project root
- **FR-007**: System MUST trace multi-level imports (e.g., if A imports B which extends C, show A, B, and C when viewing A)
- **FR-008**: System MUST clear the previous file's diagram when switching to a new file
- **FR-009**: System MUST update the diagram immediately when file selection changes (within 200ms)

#### Cross-File Import Resolution

- **FR-010**: System MUST parse import statements to identify imported class and interface names
- **FR-011**: System MUST match imported names against parsed entities from other project files
- **FR-012**: System MUST handle both named imports (import { Person }) and default imports (import Person)
- **FR-013**: System MUST support multiple imports from a single file (import { A, B, C })
- **FR-014**: System MUST preserve entity metadata (fileId, name, properties, methods) when including imported entities
- **FR-015**: System MUST handle circular dependencies without infinite loops or stack overflow
- **FR-016**: System MUST detect inheritance relationships across file boundaries (extends imported class)
- **FR-017**: System MUST detect realization relationships across file boundaries (implements imported interface)
- **FR-018**: System MUST detect association relationships across file boundaries (property type is imported class/interface)

#### Project View Mode

- **FR-019**: System MUST provide a toggle control to switch between "File View" and "Project View" modes
- **FR-020**: System MUST persist the selected view mode across file selections (sticky mode)
- **FR-021**: System MUST display ALL entities from ALL files in Project View mode
- **FR-022**: System MUST display ALL relationships across the entire project in Project View mode
- **FR-023**: System MUST apply automatic layout to prevent overlapping nodes in Project View
- **FR-024**: System MUST support navigation from diagram nodes to files in both view modes
- **FR-025**: System MUST indicate the current view mode visually (active toggle state)
- **FR-026**: System MUST default to "File View" mode when the application loads

#### Error Handling & Edge Cases

- **FR-027**: System MUST silently ignore import statements that reference non-existent files
- **FR-028**: System MUST silently ignore import statements that reference external libraries (e.g., 'react', 'lodash')
- **FR-029**: System MUST handle files with no classes or interfaces by displaying empty state
- **FR-030**: System MUST debounce rapid file switching to prevent performance issues (300ms debounce)
- **FR-031**: System MUST maintain the last valid diagram when parse errors occur in the currently selected file
- **FR-032**: System MUST update import relationships when file content changes trigger re-parsing

### Key Entities

- **DiagramScope**: Represents the current viewing mode (file-scoped or project-scoped) and controls which entities are rendered
- **ImportResolver**: Resolves import statements to actual parsed entities from other files, builds the dependency graph
- **EntityFilter**: Filters parsed entities based on current scope and relationship criteria
- **ViewModeState**: Persists the user's selection of File View vs Project View across file navigation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When selecting a file with 3 local classes, diagram displays exactly 3 nodes (0 nodes from other files)
- **SC-002**: When selecting a file that imports 2 classes and extends 1 of them, diagram displays exactly 3 nodes (1 local + 2 imported) with 1 inheritance relationship
- **SC-003**: File selection change updates the diagram within 200ms for files with up to 10 entities
- **SC-004**: Project View mode displays 100% of project entities (tested with 20 file project)
- **SC-005**: Toggle between File View and Project View completes within 300ms for projects with up to 50 entities
- **SC-006**: Import resolution correctly identifies 95%+ of standard import patterns (named imports, default imports, multiple imports)
- **SC-007**: Circular import scenarios render without errors or infinite loops in 100% of test cases
- **SC-008**: All E2E tests for file management pass (currently failing due to diagram scope issues)
- **SC-009**: Users can understand file dependencies by viewing imported entities in File View mode
- **SC-010**: Users can understand project architecture by switching to Project View mode and seeing all relationships
- **SC-011**: Diagram auto-layout in Project View mode produces zero overlapping nodes for projects with up to 30 entities

## Assumptions

- All project files are TypeScript (.ts) files with standard ES6 import syntax
- Import paths follow either relative (./file, ../folder/file) or absolute from project root patterns
- The file tree structure is flat or hierarchical without symlinks or aliases
- Users expect imported entities to appear ONLY when they have relationships with local entities (not all imports shown)
- The toggle button for view modes will be prominently placed near the diagram (UI design follows existing patterns)
- Performance targets assume modern browsers with adequate memory (500MB+ available)
- Project View mode is intended for small to medium projects (up to 100 files); very large projects may require optimization
- Import resolution does not need to handle dynamic imports (import()) or require() statements
- External library imports (node_modules) are always ignored in diagram rendering
- Circular imports are valid in the codebase and should be supported (TypeScript allows them)
