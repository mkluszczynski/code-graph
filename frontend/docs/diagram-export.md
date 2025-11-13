# Diagram Export Feature

## Overview

The diagram export feature allows users to save their UML diagrams as image files in PNG or SVG formats. This is useful for:
- Including diagrams in documentation
- Sharing diagrams with team members
- Creating presentations
- Archiving project architecture

## Usage

### Exporting a Diagram

1. Create or open a TypeScript file with classes/interfaces
2. Wait for the UML diagram to be generated
3. Click the "Export" button in the top-right corner of the diagram panel
4. Select either "Export as PNG" or "Export as SVG" from the dropdown menu
5. The diagram will be downloaded to your default downloads folder

### File Naming

Exported files are automatically named using the following format:
- `uml-diagram-YYYYMMDD.png` (or `.svg`)

Where `YYYYMMDD` is the current date.

### Export Formats

#### PNG (Portable Network Graphics)
- Raster image format
- Best for: Embedding in documents, presentations, web pages
- Pros: Widely supported, good quality, small file size
- Cons: Cannot be scaled without quality loss

#### SVG (Scalable Vector Graphics)
- Vector image format
- Best for: Print materials, high-resolution displays, further editing
- Pros: Infinite scalability, editable in vector graphics software
- Cons: Larger file size, may not render in all applications

## Technical Details

### Implementation

The export feature is built using the following components:

1. **DiagramExporter** (`src/diagram-visualization/DiagramExporter.ts`)
   - Core export logic
   - Uses `html-to-image` library to convert the diagram viewport to image formats
   - Handles file download and error cases

2. **ExportButton** (`src/components/ExportButton.tsx`)
   - UI component with dropdown menu
   - Handles user interaction and loading states
   - Displays error messages if export fails

3. **DiagramRenderer** (updated)
   - Integrates the export button into the diagram panel
   - Provides viewport access for image generation
   - Disables export when no diagram is present

### Dependencies

- `html-to-image`: Library for converting DOM elements to images
- `@xyflow/react`: React Flow utilities for viewport management

### Error Handling

The export feature handles several error cases:

1. **Missing viewport**: If the diagram viewport cannot be found, an error is thrown
2. **Export failure**: If the image generation fails, an error message is displayed to the user
3. **Empty diagram**: The export button is disabled when no nodes are present

## Testing

The feature includes comprehensive test coverage:

1. **Unit Tests** (`DiagramExporter.test.ts`)
   - PNG export with various options
   - SVG export with various options
   - File name generation
   - Error handling

2. **Integration Tests** (`ExportButton.test.tsx`)
   - Button rendering and interaction
   - Export callbacks
   - Loading states
   - Error display

## Future Enhancements

Potential improvements for future versions:

1. **Custom file naming**: Allow users to specify custom file names
2. **Export settings**: Configurable image dimensions, background color, padding
3. **Export selected nodes**: Export only a subset of the diagram
4. **Export to PDF**: Add PDF export option
5. **Clipboard copy**: Copy diagram to clipboard instead of downloading
6. **Batch export**: Export all diagrams in a project at once
