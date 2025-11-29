# Feature Specification: Add Files to Folders & Drag-and-Drop Organization

**Feature Branch**: `007-file-folder-dnd`  
**Created**: 2025-11-29  
**Status**: Draft  
**Input**: User description: "Add option to folder's context menu that user can add new file inside selected folder. Add feature that user can drag files and folders inside other folders"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create File Inside Folder via Context Menu (Priority: P1)

Users need the ability to create new files directly inside a specific folder by right-clicking on the folder and selecting an "Add File" option. Currently, files can only be created at the root level, making it tedious to organize code in nested folders.

**Why this priority**: This is a fundamental workflow improvement that directly addresses the core user pain point. Users frequently need to add files to specific folders, and currently must create files at root and then move them manually (which isn't even supported yet).

**Independent Test**: Can be fully tested by right-clicking a folder, selecting "Add File", entering a filename, and verifying the file is created inside that folder with the correct path.

**Acceptance Scenarios**:

1. **Given** user right-clicks on a folder in the file tree, **When** context menu appears, **Then** user sees "Add File" option at the top of the menu
2. **Given** user selects "Add File" from a folder's context menu, **When** a dialog appears, **Then** user can enter a filename and confirm to create the file inside that specific folder
3. **Given** user creates a file in a nested folder (e.g., `/src/components`), **When** creation is confirmed, **Then** the file path correctly reflects the folder structure (e.g., `/src/components/Button.ts`)
4. **Given** user enters a filename that already exists in the target folder, **When** user attempts to create the file, **Then** system displays validation error message indicating duplicate name
5. **Given** the target folder is collapsed, **When** user creates a file inside it, **Then** the folder automatically expands to show the new file

---

### User Story 2 - Drag and Drop Files into Folders (Priority: P2)

Users need the ability to reorganize their project by dragging files from one location and dropping them into a folder. This provides an intuitive way to move files around the project structure.

**Why this priority**: This is the natural companion to US1 - once users can create files in folders, they'll want to move existing files around. Drag-and-drop is the most intuitive method for this operation.

**Independent Test**: Can be fully tested by dragging a file from the root level and dropping it onto a folder, then verifying the file's path is updated and it appears under the target folder.

**Acceptance Scenarios**:

1. **Given** user begins dragging a file in the file tree, **When** file is being dragged, **Then** visual feedback shows the file is being moved (drag preview/ghost element)
2. **Given** user drags a file over a folder, **When** hovering over the folder, **Then** folder shows visual drop indicator (highlight/border change) indicating it can receive the file
3. **Given** user drops a file onto a folder, **When** drop is completed, **Then** the file is moved into that folder with its path updated correctly
4. **Given** user drops a file onto a folder that already contains a file with the same name, **When** drop is attempted, **Then** system displays error message and cancels the operation
5. **Given** user drags a file over a collapsed folder, **When** hovering for 500ms, **Then** the folder automatically expands to reveal its contents
6. **Given** user is dragging a file, **When** user presses Escape key, **Then** drag operation is cancelled and file returns to original position
7. **Given** user drags a file to the root level (outside any folder), **When** drop is completed, **Then** the file is moved to the root level with path updated accordingly

---

### User Story 3 - Drag and Drop Folders into Other Folders (Priority: P3)

Users need the ability to move entire folders (including all their contents) into other folders, enabling complex project reorganization without recreating the folder structure.

**Why this priority**: This extends the drag-and-drop concept to folders, which is more complex due to recursive path updates but provides significant value for project reorganization.

**Independent Test**: Can be fully tested by dragging a folder with files into another folder, then verifying both the folder and all its contents have their paths updated correctly.

**Acceptance Scenarios**:

1. **Given** user begins dragging a folder in the file tree, **When** folder is being dragged, **Then** visual feedback shows the folder is being moved (drag preview/ghost element)
2. **Given** user drags a folder over another folder, **When** hovering over the target folder, **Then** target shows visual drop indicator indicating it can receive the folder
3. **Given** user drops a folder into another folder, **When** drop is completed, **Then** the folder and all its contents are moved with all paths updated correctly
4. **Given** user attempts to drop a folder onto itself, **When** drop is attempted, **Then** system prevents the operation (cannot drop a folder into itself)
5. **Given** user attempts to drop a folder onto one of its descendants, **When** drop is attempted, **Then** system prevents the operation and shows error (cannot drop folder into its own child)
6. **Given** user drops a folder onto a target that already contains a folder with the same name, **When** drop is attempted, **Then** system displays error message and cancels the operation
7. **Given** source folder contains the currently active file, **When** folder is moved, **Then** the active file reference is updated and editor remains open with correct path

---

### Edge Cases

- What happens when user drags a file/folder outside the file tree panel? System should cancel the operation and show no effect.
- What happens when user drags over a loading indicator or placeholder? System should ignore and not allow drop on non-folder elements.
- What happens when IndexedDB update fails during move operation? System should rollback to original paths and display error message.
- What happens when user moves a file that's currently open in the editor? System should update the editor's file reference seamlessly.
- What happens when user rapidly drags multiple items in succession? System should queue operations and process them sequentially to prevent race conditions.
- What happens when user drops an item while the target folder is in rename mode? System should cancel rename mode and complete the drop operation.
- What happens when user attempts to move a folder into the same parent? System should detect no-op and skip the operation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display "Add File" option in folder context menu
- **FR-002**: System MUST open file creation dialog with target folder path when "Add File" is selected from folder context menu
- **FR-003**: System MUST create new files with correct path relative to target folder
- **FR-004**: System MUST automatically expand target folder after file creation to show new file
- **FR-005**: System MUST support HTML5 drag-and-drop for file tree items
- **FR-006**: System MUST show visual drag preview when dragging files or folders
- **FR-007**: System MUST show drop indicator (highlight) on valid drop targets when dragging over them
- **FR-008**: System MUST update file path when file is dropped into a new folder
- **FR-009**: System MUST update all nested file paths when folder is dropped into a new folder
- **FR-010**: System MUST prevent dropping a folder onto itself
- **FR-011**: System MUST prevent dropping a folder onto any of its descendants (circular reference prevention)
- **FR-012**: System MUST validate for duplicate names at drop target and show error if conflict exists
- **FR-013**: System MUST auto-expand folders when hovering over them during drag for 500ms
- **FR-014**: System MUST cancel drag operation when Escape key is pressed
- **FR-015**: System MUST update active file reference when moving the currently open file
- **FR-016**: System MUST persist all move operations to IndexedDB
- **FR-017**: System MUST rollback path changes if IndexedDB operation fails
- **FR-018**: System MUST support dropping files/folders at root level
- **FR-019**: System MUST maintain file content when moving files between folders
- **FR-020**: System MUST maintain folder structure and contents when moving folders

### Key Entities

- **DragState**: Tracks current drag-and-drop operation state
  - Attributes: isDragging, draggedItem (file/folder), draggedItemPath, sourceParentPath
  - Used for visual feedback and drop validation

- **DropTarget**: Represents a valid drop target in the file tree
  - Attributes: targetPath, isValidDrop, isHovered, hoverStartTime
  - Used for drop zone highlighting and auto-expand timing

- **MoveOperation**: Represents a file/folder move action
  - Attributes: sourcePath, targetPath, itemType (file/folder), affectedPaths (for folders)
  - Side effects: path updates for all nested items, active file reference update

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a file inside a folder in under 5 seconds from right-click to file appearing in tree
- **SC-002**: Drag-and-drop visual feedback appears within 100ms of starting drag operation
- **SC-003**: Drop indicator appears within 50ms of hovering over a valid drop target
- **SC-004**: File move operations complete in under 1 second for individual files
- **SC-005**: Folder move operations complete in under 3 seconds for folders containing up to 50 files
- **SC-006**: 100% of move operations successfully persist to IndexedDB with automatic rollback on failure
- **SC-007**: Auto-expand on hover triggers consistently at 500ms (±100ms tolerance)
- **SC-008**: Zero data loss when moving files/folders (content preserved 100%)
- **SC-009**: Active file remains accessible and correctly displayed after being moved via drag-and-drop
- **SC-010**: Users can successfully reorganize a 3-level folder structure using only drag-and-drop within 30 seconds
