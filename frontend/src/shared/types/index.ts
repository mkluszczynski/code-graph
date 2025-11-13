/**
 * TypeScript UML Graph Visualizer - Type Definitions
 *
 * Core entity types for the application based on data-model.md
 */

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Represents a TypeScript file in the project
 */
export interface ProjectFile {
  /** Unique identifier (UUID) */
  id: string;
  /** File name (e.g., "MyClass.ts") */
  name: string;
  /** Virtual file path (e.g., "/src/MyClass.ts") */
  path: string;
  /** TypeScript source code */
  content: string;
  /** Timestamp (milliseconds since epoch) */
  lastModified: number;
  /** Whether this file is currently open in the editor */
  isActive: boolean;
}

/**
 * Represents a TypeScript class extracted from parsed code
 */
export interface ClassDefinition {
  /** Unique identifier (derived from file path + class name) */
  id: string;
  /** Class name */
  name: string;
  /** Reference to ProjectFile.id */
  fileId: string;
  /** Whether class is abstract */
  isAbstract: boolean;
  /** Whether class is exported */
  isExported: boolean;
  /** Array of class properties */
  properties: Property[];
  /** Array of class methods */
  methods: Method[];
  /** Generic type parameters (e.g., ["T", "K"]) */
  typeParameters: string[];
  /** Name of parent class (if extends) */
  extendsClass: string | null;
  /** Names of implemented interfaces */
  implementsInterfaces: string[];
}

/**
 * Represents a TypeScript interface extracted from parsed code
 */
export interface InterfaceDefinition {
  /** Unique identifier (derived from file path + interface name) */
  id: string;
  /** Interface name */
  name: string;
  /** Reference to ProjectFile.id */
  fileId: string;
  /** Whether interface is exported */
  isExported: boolean;
  /** Array of property signatures */
  properties: PropertySignature[];
  /** Array of method signatures */
  methods: MethodSignature[];
  /** Generic type parameters */
  typeParameters: string[];
  /** Names of extended interfaces */
  extendsInterfaces: string[];
}

/**
 * Access modifier for class members
 */
export type Visibility = "public" | "private" | "protected";

/**
 * Represents a class property
 */
export interface Property {
  /** Property name */
  name: string;
  /** TypeScript type (e.g., "string", "number", "Person[]") */
  type: string;
  /** Access modifier */
  visibility: Visibility;
  /** Whether property is static */
  isStatic: boolean;
  /** Whether property is readonly */
  isReadonly: boolean;
  /** Optional default value (as source code string) */
  defaultValue?: string;
}

/**
 * Represents a class method
 */
export interface Method {
  /** Method name */
  name: string;
  /** Return type (e.g., "void", "Promise<User>") */
  returnType: string;
  /** Array of method parameters */
  parameters: Parameter[];
  /** Access modifier */
  visibility: Visibility;
  /** Whether method is static */
  isStatic: boolean;
  /** Whether method is abstract */
  isAbstract: boolean;
  /** Whether method is async */
  isAsync: boolean;
}

/**
 * Represents a method parameter
 */
export interface Parameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Whether parameter is optional (has ?) */
  isOptional: boolean;
  /** Default value if any */
  defaultValue?: string;
}

/**
 * Represents an interface property signature
 */
export interface PropertySignature {
  /** Property name */
  name: string;
  /** Property type */
  type: string;
  /** Whether property is optional */
  isOptional: boolean;
  /** Whether property is readonly */
  isReadonly: boolean;
}

/**
 * Represents an interface method signature
 */
export interface MethodSignature {
  /** Method name */
  name: string;
  /** Return type */
  returnType: string;
  /** Method parameters */
  parameters: Parameter[];
}

/**
 * Type of relationship between classes/interfaces
 */
export type RelationshipType =
  | "inheritance" // Class extends another class
  | "realization" // Class implements interface
  | "association" // Class has property of another class type
  | "composition" // Strong ownership
  | "aggregation" // Weak ownership
  | "dependency"; // Uses in method signature

/**
 * Represents a relationship between classes/interfaces in the UML diagram
 */
export interface Relationship {
  /** Unique identifier */
  id: string;
  /** Type of relationship */
  type: RelationshipType;
  /** Source entity ID (ClassDefinition.id or InterfaceDefinition.id) */
  sourceId: string;
  /** Target entity ID */
  targetId: string;
  /** Optional relationship label (e.g., "manages", "uses") */
  label?: string;
  /** Optional multiplicity (e.g., "1", "0..*", "1..*") */
  multiplicity?: string;
}

// ============================================================================
// Diagram Entities
// ============================================================================

/**
 * Data displayed in a diagram node
 */
export interface DiagramNodeData {
  /** Class/interface name */
  name: string;
  /** Formatted property strings (e.g., "+ name: string") */
  properties: string[];
  /** Formatted method strings (e.g., "+ getName(): string") */
  methods: string[];
  /** Optional stereotype (e.g., "<<interface>>", "<<abstract>>") */
  stereotype?: string;
  /** Link back to source file */
  fileId: string;
  /** Index signature for React Flow compatibility */
  [key: string]: unknown;
}

/**
 * Represents a visual node in the UML diagram (React Flow node)
 */
export interface DiagramNode {
  /** Same as ClassDefinition.id or InterfaceDefinition.id */
  id: string;
  /** Node type */
  type: "class" | "interface";
  /** Node display data */
  data: DiagramNodeData;
  /** Node position on canvas */
  position: { x: number; y: number };
  /** Calculated width based on content */
  width: number;
  /** Calculated height based on content */
  height: number;
}

/**
 * Represents a visual edge in the UML diagram (React Flow edge)
 */
export interface DiagramEdge {
  /** Same as Relationship.id */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Edge rendering type (maps to custom edge components) */
  type: string;
  /** Optional edge label */
  label?: string;
  /** Whether edge is animated (for emphasis) */
  animated: boolean;
  /** CSS styles for edge appearance */
  style: Record<string, unknown>;
}

// ============================================================================
// Application State
// ============================================================================

/**
 * Position in the editor
 */
export interface Position {
  line: number;
  column: number;
}

/**
 * Manages the current state of the code editor
 */
export interface EditorState {
  /** Currently open file ID */
  activeFileId: string | null;
  /** Current editor content (may be unsaved) */
  activeFileContent: string;
  /** Whether content differs from saved version */
  isDirty: boolean;
  /** Current cursor position */
  cursorPosition: Position;
  /** Current selection */
  selectedRange: { start: Position; end: Position } | null;
}

/**
 * Manages the UML diagram visualization state
 */
export interface DiagramState {
  /** All diagram nodes */
  nodes: DiagramNode[];
  /** All diagram edges */
  edges: DiagramEdge[];
  /** Current viewport position and zoom */
  viewport: { x: number; y: number; zoom: number };
  /** Currently selected node */
  selectedNodeId: string | null;
  /** Whether auto-layout is disabled (user has manually positioned nodes) */
  isLayoutLocked: boolean;
  /** Timestamp of last diagram update */
  lastUpdated: number;
}

/**
 * Manages the file tree UI state
 */
export interface FileTreeState {
  /** All files in the project */
  files: ProjectFile[];
  /** Paths of expanded directories */
  expandedPaths: Set<string>;
  /** Currently selected file in tree */
  selectedFileId: string | null;
  /** File sorting order */
  sortOrder: "name" | "modified";
}

/**
 * Parse error information
 */
export interface ParseError {
  /** Error line number */
  line: number;
  /** Error column number */
  column: number;
  /** Error message */
  message: string;
  /** Error severity */
  severity: "error" | "warning";
}

/**
 * Manages TypeScript parsing state
 */
export interface ParserState {
  /** Whether parsing is in progress */
  isParsing: boolean;
  /** Errors by file ID */
  parseErrors: Map<string, ParseError[]>;
  /** Timestamp of last successful parse */
  lastParseTime: number;
  /** Parsed entities by file ID */
  parsedEntities: Map<string, (ClassDefinition | InterfaceDefinition)[]>;
}

/**
 * Result of parsing a TypeScript file
 */
export interface ParseResult {
  /** Extracted class definitions */
  classes: ClassDefinition[];
  /** Extracted interface definitions */
  interfaces: InterfaceDefinition[];
  /** Extracted relationships */
  relationships: Relationship[];
  /** Parse errors if any */
  errors: ParseError[];
  /** Whether parsing succeeded */
  success: boolean;
}

// ============================================================================
// File Tree Types
// ============================================================================

/**
 * Node in the file tree hierarchy
 */
export interface FileTreeNode {
  /** Node ID (path for directories, file ID for files) */
  id: string;
  /** Display name */
  name: string;
  /** Node type */
  type: "file" | "directory";
  /** Full path */
  path: string;
  /** Child nodes (for directories) */
  children?: FileTreeNode[];
  /** Reference to ProjectFile (for files) */
  file?: ProjectFile;
  /** Whether directory is expanded */
  isExpanded?: boolean;
}
