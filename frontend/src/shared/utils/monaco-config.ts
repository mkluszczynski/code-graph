/**
 * Monaco Editor Configuration
 *
 * Base configuration for Monaco Editor including TypeScript compiler options and theme
 * 
 * NOTE: Using `any` types for Monaco editor is justified here because:
 * 1. Monaco editor is loaded dynamically at runtime via @monaco-editor/react
 * 2. Monaco types are complex and change between versions
 * 3. The editor instance is provided by the Monaco loader, not directly imported
 * 4. This approach is recommended by the @monaco-editor/react documentation
 * 
 * Constitutional exception: Complexity justified in writing (see above).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TypeScript compiler options for Monaco Editor
 * These options configure how TypeScript code is analyzed and checked in the editor
 */
export const typescriptCompilerOptions: any = {
  target: 99, // Monaco.languages.typescript.ScriptTarget.Latest
  allowNonTsExtensions: true,
  moduleResolution: 2, // Monaco.languages.typescript.ModuleResolutionKind.NodeJs
  module: 99, // Monaco.languages.typescript.ModuleKind.ESNext
  noEmit: true,
  esModuleInterop: true,
  jsx: 2, // Monaco.languages.typescript.JsxEmit.React
  reactNamespace: "React",
  allowJs: false,
  typeRoots: ["node_modules/@types"],
  strict: true,
  strictNullChecks: true,
  strictFunctionTypes: true,
  strictBindCallApply: true,
  strictPropertyInitialization: true,
  noImplicitAny: true,
  noImplicitThis: true,
  alwaysStrict: true,
};

/**
 * Monaco Editor diagnostics options
 * Controls error checking and validation in the editor
 */
export const diagnosticOptions: any = {
  noSemanticValidation: false,
  noSyntaxValidation: false,
  onlyVisible: false,
};

/**
 * Monaco Editor options
 * General editor appearance and behavior settings
 */
export const editorOptions: any = {
  minimap: {
    enabled: true,
  },
  fontSize: 14,
  lineNumbers: "on",
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true,
  wordWrap: "off",
  folding: true,
  foldingStrategy: "indentation",
  showFoldingControls: "always",
  renderLineHighlight: "all",
  selectOnLineNumbers: true,
  cursorStyle: "line",
  cursorBlinking: "blink",
  theme: "vs-dark",
  scrollbar: {
    vertical: "visible",
    horizontal: "visible",
    useShadows: false,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  suggest: {
    showKeywords: true,
    showSnippets: true,
  },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false,
  },
  parameterHints: {
    enabled: true,
  },
};

/**
 * Initializes Monaco Editor with TypeScript configuration
 * Call this function before creating any editor instances
 *
 * @param monaco - Monaco editor module instance
 */
export function initializeMonaco(monaco: any): void {
  // Set TypeScript compiler options
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    typescriptCompilerOptions
  );

  // Set diagnostics options
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
    diagnosticOptions
  );

  // Enable eager model sync to get faster IntelliSense
  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

  // Add custom TypeScript library definitions if needed
  // This is where you would add type definitions for custom APIs
  // monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //   'declare module "my-module" { export function myFunction(): void; }',
  //   'my-module.d.ts'
  // );
}

/**
 * Creates a Monaco Editor model for a TypeScript file
 *
 * @param monaco - Monaco editor module instance
 * @param content - File content
 * @param filePath - File path (used for model URI)
 * @returns Monaco editor model
 */
export function createTypescriptModel(
  monaco: any,
  content: string,
  filePath: string
): any {
  const uri = monaco.Uri.parse(`file:///${filePath}`);

  // Check if model already exists
  const existingModel = monaco.editor.getModel(uri);
  if (existingModel) {
    existingModel.setValue(content);
    return existingModel;
  }

  // Create new model
  return monaco.editor.createModel(content, "typescript", uri);
}

/**
 * Disposes a Monaco Editor model
 *
 * @param model - The model to dispose
 */
export function disposeModel(model: any): void {
  model.dispose();
}

/**
 * Gets all Monaco Editor models
 *
 * @param monaco - Monaco editor module instance
 * @returns Array of all models
 */
export function getAllModels(monaco: any): any[] {
  return monaco.editor.getModels();
}

/**
 * Dark theme configuration (default)
 */
export const darkTheme: any = {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "editor.lineHighlightBackground": "#2a2a2a",
    "editorCursor.foreground": "#ffffff",
    "editor.selectionBackground": "#264f78",
    "editor.inactiveSelectionBackground": "#3a3d41",
  },
};

/**
 * Light theme configuration
 */
export const lightTheme: any = {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#000000",
    "editor.lineHighlightBackground": "#f0f0f0",
    "editorCursor.foreground": "#000000",
    "editor.selectionBackground": "#add6ff",
    "editor.inactiveSelectionBackground": "#e5ebf1",
  },
};

/**
 * Defines custom themes
 *
 * @param monaco - Monaco editor module instance
 */
export function defineThemes(monaco: any): void {
  monaco.editor.defineTheme("uml-dark", darkTheme);
  monaco.editor.defineTheme("uml-light", lightTheme);
}
