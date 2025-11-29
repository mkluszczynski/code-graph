# Data Model: Dart Language Support

**Feature**: 008-dart-language-support  
**Date**: 2025-11-29  
**Status**: Complete

## New Types

### SupportedLanguage

Represents a programming language that the system can parse and visualize.

```typescript
/**
 * Languages supported for diagram visualization
 */
export type SupportedLanguage = 'typescript' | 'dart' | 'unsupported';
```

**Usage**: Routing logic in ParserRegistry, warning icon display in FileTreeView

---

### LanguageParser (Abstract Class)

Abstract base class that all language parsers must implement. Provides consistent interface for parsing source code and extracting UML entities.

```typescript
/**
 * Abstract base class for language-specific parsers.
 * 
 * Implement this class to add support for a new programming language.
 * Each parser is responsible for:
 * 1. Parsing source code into an AST
 * 2. Extracting classes, interfaces, and their members
 * 3. Identifying relationships between entities
 * 4. Handling syntax errors gracefully
 * 
 * @example
 * class DartParser extends LanguageParser {
 *   readonly language = 'dart';
 *   readonly extensions = ['dart'];
 *   readonly displayName = 'Dart';
 *   
 *   parse(sourceCode: string, fileName: string, fileId?: string): ParseResult {
 *     // Dart-specific parsing logic
 *   }
 * }
 */
export abstract class LanguageParser {
  /** Unique language identifier */
  abstract readonly language: SupportedLanguage;
  
  /** File extensions this parser handles (without dot, lowercase) */
  abstract readonly extensions: readonly string[];
  
  /** Human-readable language name for UI display */
  abstract readonly displayName: string;
  
  /**
   * Parses source code and extracts UML entities.
   * 
   * @param sourceCode - The source code to parse
   * @param fileName - Name of the file (for error reporting and ID generation)
   * @param fileId - Optional unique file identifier (for entity references)
   * @returns ParseResult containing classes, interfaces, relationships, and errors
   */
  abstract parse(sourceCode: string, fileName: string, fileId?: string): ParseResult;
  
  /**
   * Checks if this parser can handle a file based on its extension.
   * 
   * @param fileName - Name of the file including extension
   * @returns true if this parser handles the file's language
   */
  canParse(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext !== undefined && this.extensions.includes(ext);
  }
  
  /**
   * Optional: Initialize parser resources (e.g., load WASM modules).
   * Called before first parse. Default implementation does nothing.
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    // Default: no initialization needed
  }
  
  /**
   * Whether the parser requires async initialization.
   * Override to return true if initialize() must be called before parse().
   */
  get requiresInitialization(): boolean {
    return false;
  }
}
```

**Usage**: Base class for TypeScriptParser, DartParser, and future language parsers.

---

### ParserRegistry

Manages parser instances and routes files to the correct parser.

```typescript
/**
 * Registry for language parsers.
 * 
 * Provides centralized access to all registered parsers and handles
 * routing files to the appropriate parser based on extension.
 */
export class ParserRegistry {
  private parsers: Map<SupportedLanguage, LanguageParser> = new Map();
  private extensionMap: Map<string, LanguageParser> = new Map();
  
  /**
   * Registers a parser instance.
   * 
   * @param parser - Parser instance to register
   */
  register(parser: LanguageParser): void;
  
  /**
   * Gets the parser for a specific language.
   * 
   * @param language - Language identifier
   * @returns Parser instance or undefined if not registered
   */
  getParser(language: SupportedLanguage): LanguageParser | undefined;
  
  /**
   * Gets the parser that can handle a file based on its extension.
   * 
   * @param fileName - Name of the file including extension
   * @returns Parser instance or undefined if no parser handles this extension
   */
  getParserForFile(fileName: string): LanguageParser | undefined;
  
  /**
   * Parses a file using the appropriate parser.
   * 
   * @param sourceCode - Source code to parse
   * @param fileName - File name for parser selection and error reporting
   * @param fileId - Optional file identifier
   * @returns ParseResult or null if no parser handles this file type
   */
  async parse(
    sourceCode: string, 
    fileName: string, 
    fileId?: string
  ): Promise<ParseResult | null>;
  
  /**
   * Checks if any registered parser can handle a file.
   * 
   * @param fileName - Name of the file including extension
   * @returns true if a parser exists for this file type
   */
  canParse(fileName: string): boolean;
  
  /**
   * Gets all registered parsers.
   */
  getAllParsers(): LanguageParser[];
  
  /**
   * Gets all supported file extensions.
   */
  getSupportedExtensions(): string[];
}
```

**Usage**: Central parser management in useEditorController, language detection

---

### LanguageConfig

Configuration for a supported language parser.

```typescript
/**
 * Configuration for a language parser
 */
export interface LanguageConfig {
  /** Language identifier */
  language: SupportedLanguage;
  
  /** File extensions that map to this language (without dot) */
  extensions: string[];
  
  /** Display name for UI */
  displayName: string;
  
  /** Whether parser is loaded and ready */
  isLoaded: boolean;
}
```

**Instances**:
```typescript
const TYPESCRIPT_CONFIG: LanguageConfig = {
  language: 'typescript',
  extensions: ['ts', 'tsx'],
  displayName: 'TypeScript',
  isLoaded: true, // TypeScript parser is always loaded (uses built-in ts module)
};

const DART_CONFIG: LanguageConfig = {
  language: 'dart',
  extensions: ['dart'],
  displayName: 'Dart',
  isLoaded: false, // Lazy-loaded WASM parser
};
```

---

### DartNode (Internal)

Tree-sitter AST node type for Dart parsing.

```typescript
/**
 * Tree-sitter node from Dart grammar (internal use only)
 */
interface DartNode {
  type: string;          // e.g., 'class_declaration', 'method_signature'
  text: string;          // Source text of the node
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: DartNode[];
  childForFieldName(name: string): DartNode | null;
  namedChildren: DartNode[];
  parent: DartNode | null;
}
```

**Note**: This is the tree-sitter Node interface. We don't define it ourselves, but document it for reference.

---

## Modified Types

### FileValidationResult

Extend to include extension validation error messages.

```typescript
/**
 * Result of file name validation
 */
export interface FileValidationResult {
  /** Whether the name is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}
```

No structural change - just ensure error messages support new extension validation.

---

## Existing Types (Reused)

### ClassDefinition

Reused for Dart classes. No changes needed.

```typescript
export interface ClassDefinition {
  id: string;
  name: string;
  fileId: string;
  isAbstract: boolean;
  isExported: boolean;        // In Dart, all public classes are "exported"
  properties: Property[];
  methods: Method[];
  typeParameters: string[];
  extendsClass: string | null;
  implementsInterfaces: string[];  // Includes both `implements` and `with` mixins
}
```

**Dart Mapping**:
- `isExported`: Always `true` for Dart (no export keyword, public by default)
- `implementsInterfaces`: Combines both `implements` and `with` clauses

---

### InterfaceDefinition

Reused for Dart abstract classes. No changes needed.

```typescript
export interface InterfaceDefinition {
  id: string;
  name: string;
  fileId: string;
  isExported: boolean;
  properties: PropertySignature[];
  methods: MethodSignature[];
  typeParameters: string[];
  extendsInterfaces: string[];
}
```

**Dart Mapping**:
- Abstract classes in Dart → InterfaceDefinition
- `extendsInterfaces`: Includes `extends` and `implements` from abstract class

---

### Property

Reused for Dart class fields. No changes needed.

```typescript
export interface Property {
  name: string;
  type: string;
  visibility: Visibility;       // public/private/protected
  isStatic: boolean;
  isReadonly: boolean;         // Maps to Dart `final`
  defaultValue?: string;
}
```

**Dart Mapping**:
- `visibility`: `_` prefix → private, otherwise public
- `isReadonly`: Dart `final` or `const` → true
- `late` keyword: Ignored (just a late initialization marker)
- Nullable `?`: Included in type string (e.g., "String?")

---

### Method

Reused for Dart class methods. No changes needed.

```typescript
export interface Method {
  name: string;
  returnType: string;
  parameters: Parameter[];
  visibility: Visibility;
  isStatic: boolean;
  isAbstract: boolean;
  isAsync: boolean;
}
```

**Dart Mapping**:
- Factory constructors: Treated as static methods
- Named constructors: Included with `ClassName.constructorName` format
- Getters/setters: Treated as methods

---

### ParseResult

Reused for Dart parser output. No changes needed.

```typescript
export interface ParseResult {
  classes: ClassDefinition[];
  interfaces: InterfaceDefinition[];
  relationships: Relationship[];
  errors: ParseError[];
  success: boolean;
}
```

---

## Entity Relationships

```
┌─────────────────────┐
│  SupportedLanguage  │ (enum-like type)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   LanguageParser    │ (abstract base class)
└─────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────────┐ ┌──────────┐
│TypeScript│ │  Dart    │  (concrete implementations)
│ Parser   │ │ Parser   │
└──────────┘ └──────────┘
    │             │
    └──────┬──────┘
           ▼
┌─────────────────────┐
│   ParserRegistry    │ (manages parser instances)
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│    ParseResult      │
└─────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌──────────┐ ┌───────────────┐
│ Class    │ │  Interface    │
│Definition│ │  Definition   │
└──────────┘ └───────────────┘
```

---

## Parser Implementation Pattern

### Adding a New Language Parser

To add support for a new language (e.g., Kotlin), create a new parser that extends `LanguageParser`:

```typescript
// src/parsers/kotlin/KotlinParser.ts
import { LanguageParser } from '../LanguageParser';
import type { ParseResult, SupportedLanguage } from '../../shared/types';

export class KotlinParser extends LanguageParser {
  readonly language: SupportedLanguage = 'kotlin'; // Add to SupportedLanguage type
  readonly extensions = ['kt', 'kts'] as const;
  readonly displayName = 'Kotlin';
  
  parse(sourceCode: string, fileName: string, fileId?: string): ParseResult {
    // 1. Parse source code into AST
    // 2. Extract classes using ClassExtractor
    // 3. Extract interfaces using InterfaceExtractor
    // 4. Extract relationships using RelationshipAnalyzer
    // 5. Return ParseResult
  }
}
```

### Register in ParserRegistry

```typescript
// src/parsers/index.ts
import { ParserRegistry } from './ParserRegistry';
import { TypeScriptParser } from './typescript/TypeScriptParser';
import { DartParser } from './dart/DartParser';
import { KotlinParser } from './kotlin/KotlinParser'; // New parser

export const parserRegistry = new ParserRegistry();

// Register all parsers
parserRegistry.register(new TypeScriptParser());
parserRegistry.register(new DartParser());
parserRegistry.register(new KotlinParser()); // Add new parser
```

---

## State Changes

### FileTreeSlice (Existing)

No structural changes. Warning icon logic uses `detectLanguage()` utility function, no state needed.

### ParserSlice (Existing)

No structural changes. Dart parser results use same `ParseResult` type.

---

## Validation Rules

### File Name Validation (New Rules)

1. **Extension Required**: File name must contain a dot followed by extension
   - Valid: `MyClass.ts`, `Person.dart`, `config.json`
   - Invalid: `MyClass`, `.ts`, `file.`

2. **Name Before Extension**: Must have at least one character before the dot
   - Valid: `a.ts`, `MyClass.dart`
   - Invalid: `.ts`, `.dart`

3. **Extension Not Empty**: Must have characters after the last dot
   - Valid: `file.ts`, `file.test.ts`
   - Invalid: `file.`, `file.test.`

---

## State Transitions

### Language Detection Flow

```
File Created/Selected
        │
        ▼
┌──────────────────┐
│ detectLanguage() │
└──────────────────┘
        │
        ├─── typescript ──▶ Parse with TypeScriptParser
        │
        ├─── dart ──▶ Parse with DartParser
        │
        └─── unsupported ──▶ Skip parsing, show warning icon
```

### File Creation Validation Flow

```
User enters filename
        │
        ▼
┌──────────────────┐
│ validateItemName │ (existing validation)
└──────────────────┘
        │ valid
        ▼
┌──────────────────────┐
│ validateFileExtension │ (new validation)
└──────────────────────┘
        │ valid
        ▼
    Create File
```
