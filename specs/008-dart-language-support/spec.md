# Feature Specification: Dart Language Support

**Feature Branch**: `008-dart-language-support`  
**Created**: 2025-11-29  
**Status**: Draft  
**Input**: User description: "Add Dart language support for diagram visualization with user-specified file extensions and unsupported language warnings"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create File with Custom Extension (Priority: P1)

As a user, I want to specify the file extension when creating a new file so that I can work with different programming languages (TypeScript, Dart, or others).

Currently, when creating a new file, the system defaults to `.ts` extension. With this change, the user must specify the extension, allowing them to choose between supported languages like TypeScript (`.ts`) and Dart (`.dart`).

**Why this priority**: This is the foundational change that enables multi-language support. Without explicit extension specification, users cannot create files in languages other than TypeScript.

**Independent Test**: Can be fully tested by creating a new file, specifying `.dart` or `.ts` extension, and verifying the file is created with the correct extension.

**Acceptance Scenarios**:

1. **Given** the user clicks the "Add File" button, **When** the create dialog opens, **Then** the user sees an input field for file name that requires an extension (e.g., "MyClass.dart" or "MyClass.ts")

2. **Given** the user enters a filename without extension (e.g., "MyClass"), **When** the user tries to confirm, **Then** the system shows a validation error indicating an extension is required

3. **Given** the user enters a filename with a valid extension (e.g., "Person.dart"), **When** the user confirms, **Then** the file is created with that exact extension

4. **Given** the user enters a filename with extension (e.g., "utils.ts"), **When** the user confirms, **Then** the file is created and opens in the editor

---

### User Story 2 - Visualize Dart Class Diagrams (Priority: P2)

As a user working with Dart code, I want to see UML class diagrams generated from my Dart files so that I can visualize the structure of my Dart codebase.

The system should parse Dart files and extract classes, interfaces (abstract classes in Dart), properties, methods, and relationships (inheritance, implementation) to generate UML diagrams similar to how it works for TypeScript.

**Why this priority**: This delivers the core value of Dart support. Once users can create Dart files, they need to see diagrams to get value from the tool.

**Independent Test**: Can be tested by creating a Dart file with classes, properties, and methods, then verifying the diagram displays correct nodes and relationships.

**Acceptance Scenarios**:

1. **Given** a Dart file with a class definition, **When** the user views the file, **Then** the diagram shows a UML class node with the class name

2. **Given** a Dart class with properties and methods, **When** the diagram is rendered, **Then** the node displays properties with their types and methods with signatures

3. **Given** a Dart class that extends another class, **When** the diagram is rendered, **Then** an inheritance arrow connects child to parent

4. **Given** a Dart class that implements an abstract class (interface), **When** the diagram is rendered, **Then** a realization arrow connects the implementing class to the abstract class

5. **Given** a Dart class with typed properties referencing other classes, **When** the diagram is rendered, **Then** association relationships are shown between related classes

---

### User Story 3 - Unsupported Language Warning (Priority: P3)

As a user, I want to see a warning indicator on files with unsupported language extensions so that I understand why diagrams are not being generated for those files.

When a file has an extension that the system doesn't support for diagram generation (e.g., `.js`, `.py`, `.java`), the file should display a warning icon in the file tree, and hovering over it should show a tooltip explaining that the language is not supported.

**Why this priority**: This provides clear feedback to users when they create or import files in unsupported languages, improving the user experience by setting correct expectations.

**Independent Test**: Can be tested by creating a file with an unsupported extension (e.g., `.py`), verifying the warning icon appears in the file tree, and confirming the tooltip message on hover.

**Acceptance Scenarios**:

1. **Given** a file with an unsupported extension (e.g., "script.py") exists, **When** the file tree is rendered, **Then** the file displays with a warning icon next to it

2. **Given** a file with an unsupported extension shows a warning icon, **When** the user hovers over the file or icon, **Then** a tooltip appears with the message "Language not supported for diagram visualization"

3. **Given** a file with a supported extension (`.ts` or `.dart`), **When** the file tree is rendered, **Then** no warning icon is displayed

4. **Given** the user creates a new file with an unsupported extension, **When** the file appears in the file tree, **Then** it immediately shows the warning icon

---

### Edge Cases

- What happens when a user enters only an extension as filename (e.g., ".ts")? → System should require a valid filename before the extension
- What happens when a file has no extension (e.g., "Makefile")? → System shows warning icon indicating diagram visualization is not available
- What happens when a Dart file has syntax errors? → System should handle gracefully, similar to TypeScript error handling
- How does the system handle mixed TypeScript and Dart files in project view? → Both should be parsed and displayed together in the diagram
- What happens when a Dart file imports from a TypeScript file or vice versa? → Cross-language imports should be recognized but may show as unresolved references

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require users to specify a file extension when creating new files
- **FR-002**: System MUST validate that the filename includes a valid extension (contains at least one character before the dot and an extension after)
- **FR-003**: System MUST support `.ts` (TypeScript) and `.dart` (Dart) extensions for diagram visualization
- **FR-004**: System MUST parse Dart files to extract classes, including class names, properties, and methods
- **FR-005**: System MUST extract Dart class relationships including inheritance (extends) and implementation (implements)
- **FR-006**: System MUST extract property types and method signatures from Dart classes
- **FR-007**: System MUST display a warning icon on files with unsupported extensions in the file tree
- **FR-008**: System MUST show a tooltip with "Language not supported for diagram visualization" when hovering over unsupported files
- **FR-009**: System MUST generate UML diagrams for Dart files following the same visual conventions as TypeScript diagrams
- **FR-010**: System MUST handle Dart syntax errors gracefully without crashing

### Key Entities

- **SupportedLanguage**: Represents a programming language the system can parse and visualize (currently TypeScript and Dart), with associated file extensions and parser configuration
- **FileExtension**: The suffix of a filename (e.g., ".ts", ".dart") used to determine which language parser to use
- **LanguageParser**: The component responsible for extracting class information from a specific language's source code

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create files with any extension in under 5 seconds (including extension specification)
- **SC-002**: Dart files with classes render correct UML diagrams within the same performance targets as TypeScript files (<200ms for 10 entities)
- **SC-003**: 100% of files with unsupported extensions display the warning icon in the file tree
- **SC-004**: Tooltip appears within 200ms of hovering over an unsupported file
- **SC-005**: System correctly identifies and parses Dart class structures including properties, methods, and relationships with 100% accuracy for valid Dart syntax
- **SC-006**: Users can work with mixed TypeScript and Dart projects, seeing unified diagrams in project view

## Assumptions

- Dart class syntax follows standard Dart 3.x conventions
- Abstract classes in Dart serve as interfaces (since Dart doesn't have explicit interface keyword)
- The Dart parser will be implemented client-side similar to TypeScript parser
- Warning icons use existing Lucide React icon library
- Tooltip component uses existing shadcn/ui tooltip primitive
