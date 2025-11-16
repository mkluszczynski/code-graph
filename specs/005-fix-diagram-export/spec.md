# Feature Specification: Fix Diagram Export & Add Clipboard Copy

**Feature Branch**: `005-fix-diagram-export`  
**Created**: 2025-11-16  
**Status**: Draft  
**Input**: User description: "We have this feature that we can export our diagram to png or svg, but this not working properly. When we export to png we get large image with a lot of empty space. We would like to have exported image in resolution of the diagram (can be a bit bigger to have this border like space). Also we can remove option to export to svg its not working properly anyway but we would like to add feature to copy image to clip board."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fix PNG Export Size (Priority: P1)

Users export UML diagrams as PNG images to include in documentation, presentations, or share with colleagues. Currently, exported images contain excessive empty space, making them impractical for use. Users need exported images to be cropped to the actual diagram content with a reasonable border.

**Why this priority**: This is the core issue causing user frustration. The export feature exists but is unusable due to quality issues. Fixing this restores a critical workflow for documentation and sharing.

**Independent Test**: Can be fully tested by exporting a diagram to PNG and verifying the image dimensions match the diagram content plus a defined border margin. Delivers immediate value by making the export feature functional.

**Acceptance Scenarios**:

1. **Given** a diagram with 5 classes displayed in the viewport, **When** user exports to PNG, **Then** the exported image contains only the diagram content with a uniform border of approximately 20-40 pixels on all sides
2. **Given** a large diagram requiring scrolling to view entirely, **When** user exports to PNG, **Then** the exported image captures the complete diagram at full resolution without excessive empty space
3. **Given** a small diagram with 2 classes, **When** user exports to PNG, **Then** the exported image is compact, not padded to viewport size

---

### User Story 2 - Copy Diagram to Clipboard (Priority: P2)

Users frequently need to paste diagrams directly into emails, chat applications, or documents without saving an intermediate file. Users want to copy the diagram as a PNG image to their system clipboard for immediate pasting.

**Why this priority**: Enhances workflow efficiency by eliminating the save-then-upload cycle. Valuable for quick sharing but secondary to fixing the broken export functionality.

**Independent Test**: Can be fully tested by using the copy function and pasting into an external application (e.g., email client, Slack, Google Docs). Delivers value by streamlining the sharing workflow.

**Acceptance Scenarios**:

1. **Given** a diagram is displayed, **When** user selects "Copy to Clipboard", **Then** the diagram is copied as a PNG image with proper sizing (matching Story 1 requirements)
2. **Given** diagram is copied to clipboard, **When** user pastes into an external application, **Then** the pasted image displays correctly with transparent or white background
3. **Given** user attempts to copy a very large diagram, **When** clipboard operation completes, **Then** user receives feedback about success or failure within 2 seconds

---

### User Story 3 - Remove SVG Export Option (Priority: P3)

The current SVG export option is non-functional and confuses users who attempt to use it. Removing this option streamlines the export interface and prevents user frustration from trying a broken feature.

**Why this priority**: This is cleanup work that improves UX but doesn't add new value. Can be done last since it's a simple removal.

**Independent Test**: Can be fully tested by verifying the SVG export option is no longer visible in the export menu. Delivers value by reducing UI clutter and preventing user confusion.

**Acceptance Scenarios**:

1. **Given** user opens the export menu, **When** viewing available options, **Then** only PNG export and Copy to Clipboard options are visible
2. **Given** user previously used keyboard shortcuts for SVG export, **When** attempting to use old shortcuts, **Then** nothing happens or user is informed the feature was removed

---

### Edge Cases

- What happens when the diagram is empty (no classes or interfaces)?
- What happens when a diagram is extremely large (100+ entities)?
- How does the system handle clipboard copy failure (clipboard permission denied, memory limitations)?
- What happens when user attempts to export during diagram layout calculation?
- How does the copy function behave on different operating systems (Windows, macOS, Linux)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate the bounding box of all visible diagram elements (nodes and edges) when exporting
- **FR-002**: System MUST crop exported PNG images to the diagram bounding box plus a configurable border margin (default: 30 pixels)
- **FR-003**: System MUST provide a "Copy to Clipboard" function that copies the diagram as a PNG image
- **FR-004**: Copied images MUST use the same sizing logic as PNG export (cropped to content with border)
- **FR-005**: System MUST remove the SVG export option from the export menu
- **FR-006**: System MUST provide visual feedback when clipboard copy succeeds or fails
- **FR-007**: Exported and copied images MUST maintain the same visual appearance (colors, fonts, line styles) as displayed in the viewport
- **FR-008**: System MUST handle clipboard permission errors gracefully with user-friendly error messages
- **FR-009**: System MUST preserve diagram resolution in exported/copied images (no quality loss from scaling)
- **FR-010**: System MUST support clipboard copy across major browsers (Chrome, Firefox, Safari, Edge)

### Key Entities

- **Diagram Image**: Represents the rendered UML diagram as a raster image (PNG format), with properties including dimensions (width, height), resolution, and content bounding box
- **Bounding Box**: Represents the rectangular area containing all diagram elements, defined by minimum/maximum X and Y coordinates plus border margin
- **Export Options**: Configuration for export operations, including format (PNG), border size, background color, and resolution settings

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Exported PNG images are no more than 110% of the minimum bounding box size (diagram content + border), reducing file size by at least 60% compared to current implementation
- **SC-002**: Users can copy diagram to clipboard and paste into external applications within 3 seconds total workflow time
- **SC-003**: 95% of users successfully export or copy diagrams on first attempt without errors
- **SC-004**: Zero SVG export options remain visible in the user interface
- **SC-005**: Clipboard copy operations complete in under 2 seconds for diagrams with up to 20 entities
- **SC-006**: Exported/copied images maintain visual fidelity with 100% accuracy (no distortion, color shifts, or missing elements)
