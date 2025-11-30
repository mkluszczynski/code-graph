# Feature Specification: File and Folder Management with Improved UX

**Feature Branch**: `006-folder-management`  
**Created**: 2025-11-28  
**Status**: Draft  
**Input**: User description: "We should refactor creating file a bit. Now we have only one folder 'src' and we can't remove it or add new one. We would like to add this feature that you can manage folders. Another thing is that creating files is a bit tricky. Now you press add file button you have option to choose 'class' or 'interface' We don't want that. We just want to show user option to create a file and then he decide what will be in this file. So we just want to change option list to 'Add file' and 'Add folder'. Also, now you got standard 'prompt' to input file name, we would like to change it to use shadcn components for better ux"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simplified File Creation (Priority: P1)

Users need a straightforward way to create new files without being forced to choose between predefined templates (class or interface). The system should allow users to create an empty file and let them decide its content.

**Why this priority**: This is the core change that directly addresses user friction. Creating files is a fundamental operation, and the current template-based approach adds unnecessary complexity for users who want flexibility.

**Independent Test**: Can be fully tested by clicking "Add File" button, entering a filename in a dialog, and verifying an empty file is created with the specified name.

**Acceptance Scenarios**:

1. **Given** user clicks the "Add File" button, **When** a dialog appears with a name input field, **Then** user can enter a filename and confirm to create an empty file
2. **Given** user enters a valid filename (e.g., "utils.ts"), **When** user confirms creation, **Then** system creates an empty TypeScript file with that name in the current directory
3. **Given** user enters an invalid filename (e.g., empty string, special characters), **When** user attempts to create the file, **Then** system displays validation error message inline without closing the dialog
4. **Given** user enters a filename that already exists in the current directory, **When** user attempts to create the file, **Then** system displays error message indicating duplicate name
5. **Given** file creation dialog is open, **When** user clicks cancel or presses Escape key, **Then** dialog closes without creating a file

---

### User Story 2 - Create and Delete Folders (Priority: P2)

Users need the ability to organize their code by creating custom folder structures and removing folders they no longer need. Currently, only the 'src' folder exists and cannot be managed.

**Why this priority**: Folder management is essential for project organization, but it builds on basic file creation. Users can work with a flat file structure initially, making this secondary to P1.

**Independent Test**: Can be fully tested by creating a new folder with "Add Folder" button, verifying it appears in the file tree, and deleting it via context menu.

**Acceptance Scenarios**:

1. **Given** user clicks "Add Folder" button, **When** a dialog appears with a name input field, **Then** user can enter a folder name and confirm to create an empty folder in the current directory
2. **Given** user enters a valid folder name (e.g., "components"), **When** user confirms creation, **Then** system creates an empty folder with that name
3. **Given** user right-clicks on a folder, **When** context menu appears, **Then** user sees "Delete" option
4. **Given** user selects "Delete" on an empty folder, **When** confirmation dialog appears, **Then** user can confirm to permanently delete the folder
5. **Given** user attempts to delete a folder containing files or subfolders, **When** confirmation dialog appears, **Then** system warns that all contents will be deleted and requires explicit confirmation
6. **Given** folder exists in the file tree, **When** user creates a file inside that folder, **Then** the file is created in the correct folder path and persisted correctly

---

### User Story 3 - Rename and Duplicate Folders (Priority: P3)

Users need the ability to rename folders to reorganize their project structure and duplicate folders to quickly replicate directory structures.

**Why this priority**: These are convenience features that enhance workflow efficiency but aren't blocking for basic folder management. Users can work without these initially.

**Independent Test**: Can be fully tested by right-clicking a folder, selecting "Rename", updating the name, and verifying the folder and all its contents are accessible under the new name.

**Acceptance Scenarios**:

1. **Given** user right-clicks on a folder, **When** context menu appears, **Then** user sees "Rename" option
2. **Given** user selects "Rename" on a folder, **When** inline editor appears, **Then** user can type a new name and press Enter to commit the change
3. **Given** user renames a folder containing files, **When** rename is confirmed, **Then** all file paths are updated and files remain accessible
4. **Given** user right-clicks on a folder, **When** context menu appears, **Then** user sees "Duplicate" option
5. **Given** user selects "Duplicate" on a folder, **When** operation completes, **Then** system creates a copy of the folder with name pattern "foldername copy", including all contents recursively
6. **Given** duplicate folder already exists, **When** user duplicates again, **Then** system generates unique name "foldername copy 2", "foldername copy 3", etc.

---

### User Story 4 - Improved Dialog UX with shadcn Components (Priority: P4)

Users experience a more polished and consistent interface when creating files and folders using a modern dialog component instead of native browser prompts.

**Why this priority**: This is a UX polish enhancement that improves the experience but doesn't change core functionality. Can be implemented after core features are working.

**Independent Test**: Can be fully tested by triggering any creation dialog and verifying it uses shadcn Dialog component with proper styling, keyboard navigation, and accessibility features.

**Acceptance Scenarios**:

1. **Given** user triggers file or folder creation, **When** dialog appears, **Then** it uses shadcn Dialog component with consistent styling
2. **Given** creation dialog is open, **When** user types in the name field, **Then** validation feedback appears inline without closing the dialog
3. **Given** creation dialog is open, **When** user presses Enter key, **Then** creation is confirmed (same as clicking Create button)
4. **Given** creation dialog is open, **When** user presses Escape key, **Then** dialog closes without creating anything (same as clicking Cancel button)
5. **Given** creation dialog is open, **When** dialog first appears, **Then** name input field is automatically focused for immediate typing

---

### Edge Cases

- What happens when user creates a folder with the same name as an existing file in the same directory? System should display validation error.
- What happens when user deletes a folder containing the currently open file? System should close the active editor tab and clear the diagram.
- What happens when user renames a folder containing the currently open file? System should update the active file path and keep the editor open with correct reference.
- What happens when user attempts to create deeply nested folder structures (e.g., >10 levels)? System should allow it up to reasonable depth limit (documented).
- What happens when user duplicates a large folder structure with many files? System should provide visual feedback (loading indicator) during the operation.
- What happens if IndexedDB storage quota is exceeded during folder duplication? System should display clear error message and rollback the partial operation.
- What happens when user enters path separators (/, \) in folder name input? System should show validation error indicating invalid characters.
- What happens when user creates a file without specifying extension? System should default to .ts extension (documented behavior).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create empty files by clicking "Add File" button
- **FR-002**: System MUST display a dialog component (shadcn Dialog) for entering file names with inline validation
- **FR-003**: System MUST create files with .ts extension if no extension is specified by the user
- **FR-004**: System MUST validate file names to prevent duplicates within the same directory
- **FR-005**: System MUST validate file and folder names to reject empty strings, special characters (/, \, :, *, ?, ", <, >, |), and path separators
- **FR-006**: System MUST allow users to create folders by clicking "Add Folder" button
- **FR-007**: System MUST display a dialog component (shadcn Dialog) for entering folder names with inline validation
- **FR-008**: System MUST support creating folders in any directory within the project structure
- **FR-009**: System MUST allow users to delete folders via context menu
- **FR-010**: System MUST display confirmation dialog when deleting folders, with warning if folder contains contents
- **FR-011**: System MUST recursively delete all contents (files and subfolders) when a folder is deleted
- **FR-012**: System MUST allow users to rename folders via context menu with inline editing
- **FR-013**: System MUST update all file paths within renamed folders to maintain data integrity
- **FR-014**: System MUST close active editor tab if the currently open file is deleted as part of folder deletion
- **FR-015**: System MUST update active file reference if the currently open file's parent folder is renamed
- **FR-016**: System MUST allow users to duplicate folders via context menu
- **FR-017**: System MUST recursively duplicate all contents when duplicating a folder
- **FR-018**: System MUST generate unique names for duplicated folders using pattern "name copy", "name copy 2", etc.
- **FR-019**: System MUST persist all file and folder operations to IndexedDB storage
- **FR-020**: System MUST provide rollback mechanism if storage operations fail
- **FR-021**: System MUST auto-focus name input field when creation dialogs appear
- **FR-022**: System MUST support keyboard shortcuts (Enter to confirm, Escape to cancel) in creation dialogs
- **FR-023**: System MUST display loading indicators for operations that take longer than 500ms (e.g., large folder duplication)
- **FR-024**: System MUST replace the "Add File" button's dropdown menu options from "New Class/New Interface" to "Add File/Add Folder"

### Key Entities

- **FileTreeNode**: Represents both files and folders in the project structure
  - Attributes: id, name, type (file/folder), path, children (for folders), parent reference
  - Relationships: Parent-child relationships for nested folder structures

- **CreateDialog**: Dialog component state for file/folder creation
  - Attributes: open state, name value, validation error message, creation type (file/folder)
  - Validation rules: non-empty, no special characters, no duplicates in same directory

- **FolderOperation**: Represents folder management actions
  - Operations: create, delete, rename, duplicate
  - Side effects: recursive operations on children, path updates, active file state changes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new empty file in under 5 seconds from clicking "Add File" to having the file in the tree
- **SC-002**: Users can create a new folder in under 5 seconds from clicking "Add Folder" to seeing it in the file tree
- **SC-003**: File and folder creation dialogs respond to user input with validation feedback in under 200ms
- **SC-004**: Users can successfully organize projects with custom folder structures up to 10 levels deep without performance degradation
- **SC-005**: Folder deletion operations complete in under 3 seconds for folders containing up to 50 files
- **SC-006**: Folder rename operations update all affected file paths in under 2 seconds for folders containing up to 50 files
- **SC-007**: 100% of file and folder operations successfully persist to IndexedDB with automatic rollback on failure
- **SC-008**: Users can navigate creation dialogs entirely via keyboard without requiring mouse interaction
- **SC-009**: Folder duplication operations complete in under 5 seconds for folders containing up to 20 files
- **SC-010**: Zero data corruption incidents when renaming or deleting folders containing open/active files
- **SC-011**: 95% of users successfully create their first custom folder structure without assistance
