# Feature Specification: File Tree Context Menu

**Feature Branch**: `003-file-tree-context-menu`  
**Created**: 2025-11-15  
**Status**: Draft  
**Input**: User description: "We need to add feature to manage files in files tree. Now when we create new file there is no option to change name or delete it. When i right click on file, context menu should pop up and list a list of option such as: Rename, Duplicate, Delete"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Delete Unwanted Files (Priority: P1)

A user creates multiple test files while exploring the application and wants to remove files they no longer need to keep their project organized.

**Why this priority**: File deletion is the most critical operation as it directly addresses the pain point of accumulating unwanted files with no way to remove them. This is blocking users from maintaining a clean workspace.

**Independent Test**: Can be fully tested by creating a file, right-clicking it, selecting "Delete" from the context menu, confirming the deletion, and verifying the file is removed from both the file tree and the editor. Delivers immediate value by allowing users to clean up their workspace.

**Acceptance Scenarios**:

1. **Given** a file exists in the file tree, **When** the user right-clicks on the file and selects "Delete" from the context menu, **Then** a confirmation dialog appears asking to confirm the deletion
2. **Given** the confirmation dialog is displayed, **When** the user confirms the deletion, **Then** the file is removed from the file tree and from storage
3. **Given** the deleted file was open in the editor, **When** the file is deleted, **Then** the editor tab closes and a different file is selected if available
4. **Given** the confirmation dialog is displayed, **When** the user cancels the deletion, **Then** the file remains in the tree and no changes occur

---

### User Story 2 - Rename Files for Better Organization (Priority: P2)

A user creates a file with a default or temporary name and wants to rename it to something more meaningful that reflects its purpose.

**Why this priority**: File renaming is essential for organization and clarity but not as critical as deletion since users can work around it by recreating files with correct names (though inefficient).

**Independent Test**: Can be tested independently by creating a file, right-clicking it, selecting "Rename", entering a new name, and verifying the file appears with the new name in the tree while preserving its content.

**Acceptance Scenarios**:

1. **Given** a file exists in the file tree, **When** the user right-clicks on the file and selects "Rename", **Then** an inline input field appears with the current filename pre-selected
2. **Given** the rename input is active, **When** the user enters a new valid filename and presses Enter or clicks outside, **Then** the file is renamed and appears with the new name in the tree
3. **Given** the renamed file was open in the editor, **When** the file is renamed, **Then** the editor tab title updates to show the new filename
4. **Given** the rename input is active, **When** the user presses Escape or enters an empty name, **Then** the rename is cancelled and the original filename is retained
5. **Given** the rename input is active, **When** the user enters a filename that already exists in the same folder, **Then** an error message is displayed and the rename is not applied

---

### User Story 3 - Duplicate Files for Templates (Priority: P3)

A user has a file with code they want to reuse as a starting point and wants to create a copy to work on without modifying the original.

**Why this priority**: File duplication is a convenience feature that improves productivity but is the least critical since users can manually copy-paste content between files.

**Independent Test**: Can be tested independently by creating a file with content, right-clicking it, selecting "Duplicate", and verifying a new file is created with the same content and a modified name (e.g., "file copy.ts").

**Acceptance Scenarios**:

1. **Given** a file exists in the file tree, **When** the user right-clicks on the file and selects "Duplicate", **Then** a new file is created in the same folder with the same content and a name like "[original-name] copy.[ext]"
2. **Given** a file named "[name] copy.[ext]" already exists, **When** the user duplicates the original file again, **Then** the new file is named "[name] copy 2.[ext]" (incrementing the number)
3. **Given** a file is duplicated, **When** the duplication completes, **Then** the new file appears in the file tree and is selected for editing
4. **Given** a file is duplicated, **When** the new file is created, **Then** the duplicate has the exact same content as the original file

---

### Edge Cases

- What happens when the user right-clicks on a folder instead of a file? (Context menu should either show folder-specific options or no context menu)
- What happens when attempting to rename a file to a name with invalid characters? (System should display an error message and prevent the rename)
- What happens when a file is deleted while another file with the same name is being created? (System should prevent naming conflicts)
- What happens when the user tries to duplicate the last remaining file? (Should work normally - no special handling needed)
- What happens when the context menu is open and the user clicks elsewhere? (Context menu should close without performing any action)
- What happens when pressing right-click on empty space in the file tree? (No context menu should appear)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a context menu when a user right-clicks on a file in the file tree
- **FR-002**: Context menu MUST contain three options: "Rename", "Duplicate", and "Delete"
- **FR-003**: System MUST show a confirmation dialog before deleting a file to prevent accidental deletions
- **FR-004**: System MUST allow users to rename files through an inline editing interface
- **FR-005**: System MUST validate filenames during rename to prevent duplicate names within the same folder
- **FR-006**: System MUST validate filenames during rename to prevent invalid characters or empty names
- **FR-007**: System MUST close the editor tab when a file that is currently open is deleted
- **FR-008**: System MUST update the editor tab title when an open file is renamed
- **FR-009**: System MUST create a duplicate file with a modified name pattern (e.g., "[name] copy.[ext]") when the duplicate action is triggered
- **FR-010**: System MUST preserve the complete content of the original file when creating a duplicate
- **FR-011**: System MUST increment the copy number (e.g., "copy 2", "copy 3") if a file with the duplicate name already exists
- **FR-012**: System MUST close the context menu after an action is selected or if the user clicks outside the menu
- **FR-013**: System MUST persist file changes (rename, delete, duplicate) to storage immediately
- **FR-014**: System MUST only show the context menu when right-clicking on a file node, not on folders or empty space
- **FR-015**: System MUST allow users to cancel a rename operation by pressing Escape or clicking outside the input field

### Key Entities

- **File Node**: Represents a file in the file tree with properties including unique ID, name, path, content, and parent folder reference
- **Context Menu**: A temporary UI element that appears at the cursor position containing action options specific to the selected file
- **File Operation**: An action performed on a file (rename, duplicate, delete) that modifies the file tree structure and storage

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully delete any file in the file tree within 3 clicks (right-click, select Delete, confirm)
- **SC-002**: Users can rename a file and see the updated name reflected in both the file tree and editor tab within 2 seconds of confirming the new name
- **SC-003**: Users can duplicate a file and have the new file ready for editing within 2 seconds of selecting the duplicate action
- **SC-004**: 100% of file operations (rename, duplicate, delete) persist correctly to storage and survive page refresh
- **SC-005**: Users can complete rename operation without errors when entering valid filenames in under 10 seconds
- **SC-006**: Context menu appears within 200 milliseconds of right-clicking a file
- **SC-007**: Zero accidental file deletions due to the confirmation dialog requirement
- **SC-008**: 95% of users can discover and use the context menu operations without explicit instruction
