# API Contracts: Dart Language Support

**Feature**: 008-dart-language-support  
**Date**: 2025-11-29  
**Status**: Complete

## Abstract Parser Contracts

### LanguageParser (Abstract Base Class)

Abstract base class that all language parsers must implement.

```typescript
/**
 * Abstract base class for language-specific parsers.
 * Extend this class to add support for new programming languages.
 */
abstract class LanguageParser {
  /** Unique language identifier */
  abstract readonly language: SupportedLanguage;
  
  /** File extensions this parser handles (without dot, lowercase) */
  abstract readonly extensions: readonly string[];
  
  /** Human-readable language name for UI display */
  abstract readonly displayName: string;
  
  /**
   * Parses source code and extracts UML entities.
   */
  abstract parse(sourceCode: string, fileName: string, fileId?: string): ParseResult;
  
  /**
   * Checks if this parser can handle a file based on its extension.
   */
  canParse(fileName: string): boolean;
  
  /**
   * Optional: Initialize parser resources (e.g., load WASM modules).
   */
  async initialize(): Promise<void>;
  
  /**
   * Whether the parser requires async initialization.
   */
  get requiresInitialization(): boolean;
}
```

**Contract Tests**:

| Test ID | Method | Input | Expected Output | Notes |
|---------|--------|-------|-----------------|-------|
| LP-001 | `canParse` | `Person.ts` (TypeScript parser) | `true` | |
| LP-002 | `canParse` | `Person.dart` (TypeScript parser) | `false` | |
| LP-003 | `canParse` | `Person.TS` (TypeScript parser) | `true` | Case insensitive |
| LP-004 | `canParse` | `Person.dart` (Dart parser) | `true` | |
| LP-005 | `canParse` | `Person.ts` (Dart parser) | `false` | |
| LP-006 | `requiresInitialization` | TypeScript parser | `false` | Uses built-in ts |
| LP-007 | `requiresInitialization` | Dart parser | `true` | Needs WASM load |
| LP-008 | `initialize` | Dart parser | Resolves, WASM loaded | |

---

### ParserRegistry

Manages parser instances and routes files to correct parsers.

```typescript
/**
 * Registry for language parsers.
 */
class ParserRegistry {
  register(parser: LanguageParser): void;
  getParser(language: SupportedLanguage): LanguageParser | undefined;
  getParserForFile(fileName: string): LanguageParser | undefined;
  async parse(sourceCode: string, fileName: string, fileId?: string): Promise<ParseResult | null>;
  canParse(fileName: string): boolean;
  getAllParsers(): LanguageParser[];
  getSupportedExtensions(): string[];
}
```

**Contract Tests**:

| Test ID | Method | Input | Expected Output | Notes |
|---------|--------|-------|-----------------|-------|
| PR-001 | `register` | TypeScriptParser instance | No error, parser stored | |
| PR-002 | `getParser` | `'typescript'` | TypeScriptParser instance | |
| PR-003 | `getParser` | `'kotlin'` (not registered) | `undefined` | |
| PR-004 | `getParserForFile` | `Person.ts` | TypeScriptParser instance | |
| PR-005 | `getParserForFile` | `Person.dart` | DartParser instance | |
| PR-006 | `getParserForFile` | `script.py` | `undefined` | |
| PR-007 | `canParse` | `Person.ts` | `true` | |
| PR-008 | `canParse` | `script.py` | `false` | |
| PR-009 | `getSupportedExtensions` | - | `['ts', 'tsx', 'dart']` | |
| PR-010 | `parse` | Valid TS code, `file.ts` | ParseResult from TypeScriptParser | |
| PR-011 | `parse` | Valid Dart code, `file.dart` | ParseResult from DartParser | |
| PR-012 | `parse` | Any code, `file.py` | `null` | No parser for .py |

---

## Parser Implementation Contracts

### TypeScriptParser (extends LanguageParser)

Concrete implementation for TypeScript/TSX files.

```typescript
class TypeScriptParser extends LanguageParser {
  readonly language = 'typescript';
  readonly extensions = ['ts', 'tsx'] as const;
  readonly displayName = 'TypeScript';
  
  parse(sourceCode: string, fileName: string, fileId?: string): ParseResult;
}
```

**Contract Tests**: (Existing tests from TypeScript parser remain unchanged)

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| TS-001 | Empty string | `{ classes: [], ..., success: true }` | |
| TS-002 | `class Person {}` | 1 class named "Person" | |
| TS-003 | `interface IService {}` | 1 interface named "IService" | |

---

### DartParser (extends LanguageParser)

Main entry point for Dart code parsing.

```typescript
/**
 * Parses Dart source code and extracts class and interface definitions.
 *
 * @param sourceCode - Dart source code to parse
 * @param fileName - Name of the file (for error reporting)
 * @param fileId - Unique file identifier (for entity references)
 * @returns ParseResult containing classes, interfaces, and any errors
 * 
 * @example
 * const result = parse('class Person { String name; }', 'Person.dart', 'file-123');
 * // result.classes[0].name === 'Person'
 * // result.classes[0].properties[0].name === 'name'
 */
function parse(sourceCode: string, fileName: string, fileId?: string): ParseResult;
```

**Contract Tests**:

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| DP-001 | Empty string | `{ classes: [], interfaces: [], relationships: [], errors: [], success: true }` | |
| DP-002 | `class Person {}` | 1 class named "Person" with empty properties/methods | |
| DP-003 | `class Person { String name; }` | 1 class with 1 property | |
| DP-004 | `class Person { void greet() {} }` | 1 class with 1 method | |
| DP-005 | `abstract class IService {}` | 1 interface (not class) | |
| DP-006 | `class Child extends Parent {}` | 1 class with extendsClass="Parent" | |
| DP-007 | `class Impl implements IService {}` | 1 class with implementsInterfaces=["IService"] | |
| DP-008 | `class Mixed with Mixin1, Mixin2 {}` | 1 class with implementsInterfaces=["Mixin1", "Mixin2"] | |
| DP-009 | Syntax error code | `success: false`, errors array populated | |
| DP-010 | Multiple classes | Multiple classes in result | |

---

### ClassExtractor.extractClassInfo()

Extracts class information from a tree-sitter class_declaration node.

```typescript
/**
 * Extracts ClassDefinition from a Dart class declaration AST node.
 *
 * @param node - Tree-sitter node of type 'class_declaration'
 * @param fileName - Source file name
 * @param fileId - File identifier for entity references
 * @returns ClassDefinition with properties, methods, and relationships
 */
function extractClassInfo(node: DartNode, fileName: string, fileId: string): ClassDefinition;
```

**Contract Tests**:

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| CE-001 | `class Person {}` | name="Person", isAbstract=false | |
| CE-002 | `abstract class Service {}` | name="Service", isAbstract=true | Returns InterfaceDefinition |
| CE-003 | `class _Private {}` | name="_Private", visibility reflected | Private class |
| CE-004 | `class Generic<T> {}` | typeParameters=["T"] | |
| CE-005 | `class Multi<T, K extends Object> {}` | typeParameters=["T", "K extends Object"] | |

---

### PropertyExtractor.extractProperties()

Extracts properties from a Dart class body.

```typescript
/**
 * Extracts Property array from Dart class body.
 *
 * @param classBody - Tree-sitter node of class body
 * @returns Array of Property definitions
 */
function extractProperties(classBody: DartNode): Property[];
```

**Contract Tests**:

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| PE-001 | `String name;` | type="String", isReadonly=false | |
| PE-002 | `final int age;` | type="int", isReadonly=true | |
| PE-003 | `static String id;` | isStatic=true | |
| PE-004 | `String? nickname;` | type="String?" | Nullable |
| PE-005 | `late String data;` | type="String" | late ignored |
| PE-006 | `String name = 'default';` | defaultValue="'default'" | |
| PE-007 | `_privateField` | visibility="private" | |
| PE-008 | `const PI = 3.14;` | isReadonly=true, isStatic=true | |

---

### MethodExtractor.extractMethods()

Extracts methods from a Dart class body.

```typescript
/**
 * Extracts Method array from Dart class body.
 *
 * @param classBody - Tree-sitter node of class body
 * @returns Array of Method definitions
 */
function extractMethods(classBody: DartNode): Method[];
```

**Contract Tests**:

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| ME-001 | `void greet() {}` | name="greet", returnType="void" | |
| ME-002 | `String getName() => name;` | returnType="String" | Arrow function |
| ME-003 | `Future<void> fetchData() async {}` | returnType="Future<void>", isAsync=true | |
| ME-004 | `static void helper() {}` | isStatic=true | |
| ME-005 | `void _private() {}` | visibility="private" | |
| ME-006 | `void greet(String name, int age)` | 2 parameters | |
| ME-007 | `void greet({String? name})` | optional named parameter | |
| ME-008 | `void greet([int count = 0])` | optional positional parameter | |

---

### RelationshipAnalyzer.extractRelationships()

Extracts relationships between classes/interfaces.

```typescript
/**
 * Analyzes parsed classes and interfaces to extract relationships.
 *
 * @param classes - Array of ClassDefinitions
 * @param interfaces - Array of InterfaceDefinitions  
 * @returns Array of Relationship objects
 */
function extractRelationships(
  classes: ClassDefinition[],
  interfaces: InterfaceDefinition[]
): Relationship[];
```

**Contract Tests**:

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| RA-001 | Child extends Parent | Inheritance relationship | |
| RA-002 | Impl implements IService | Realization relationship | |
| RA-003 | Class with Mixin | Realization relationship | Mixin as interface |
| RA-004 | Class with property of another class type | Association relationship | |
| RA-005 | No relationships | Empty array | |

---

## Utility Contracts

### detectLanguage()

Detects language from file extension.

```typescript
/**
 * Detects the programming language from a filename.
 *
 * @param fileName - Name of the file including extension
 * @returns SupportedLanguage enum value
 * 
 * @example
 * detectLanguage('Person.ts')     // 'typescript'
 * detectLanguage('Person.dart')   // 'dart'
 * detectLanguage('script.py')     // 'unsupported'
 */
function detectLanguage(fileName: string): SupportedLanguage;
```

**Contract Tests**:

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| LD-001 | `Person.ts` | `'typescript'` | |
| LD-002 | `Person.tsx` | `'typescript'` | |
| LD-003 | `Person.dart` | `'dart'` | |
| LD-004 | `script.py` | `'unsupported'` | |
| LD-005 | `script.js` | `'unsupported'` | |
| LD-006 | `Makefile` | `'unsupported'` | No extension |
| LD-007 | `file.TS` | `'typescript'` | Case insensitive |
| LD-008 | `file.DART` | `'dart'` | Case insensitive |

---

### isSupportedLanguage()

Checks if a file has a supported language.

```typescript
/**
 * Checks if a file's language is supported for diagram visualization.
 *
 * @param fileName - Name of the file including extension
 * @returns true if language is supported, false otherwise
 */
function isSupportedLanguage(fileName: string): boolean;
```

**Contract Tests**:

| Test ID | Input | Expected Output |
|---------|-------|-----------------|
| SL-001 | `Person.ts` | `true` |
| SL-002 | `Person.dart` | `true` |
| SL-003 | `script.py` | `false` |
| SL-004 | `Makefile` | `false` |

---

### validateFileExtension()

Validates that a filename includes a proper extension.

```typescript
/**
 * Validates that a filename includes a valid extension.
 *
 * @param name - Filename to validate
 * @returns FileValidationResult with isValid and optional error
 */
function validateFileExtension(name: string): FileValidationResult;
```

**Contract Tests**:

| Test ID | Input | Expected Output | Notes |
|---------|-------|-----------------|-------|
| VE-001 | `Person.ts` | `{ isValid: true }` | |
| VE-002 | `Person.dart` | `{ isValid: true }` | |
| VE-003 | `file.test.ts` | `{ isValid: true }` | Multiple dots |
| VE-004 | `Person` | `{ isValid: false, error: 'must include an extension' }` | |
| VE-005 | `.ts` | `{ isValid: false, error: '...' }` | Extension only |
| VE-006 | `file.` | `{ isValid: false, error: 'extension cannot be empty' }` | |
| VE-007 | `  file.ts  ` | `{ isValid: true }` | Whitespace trimmed |

---

## Integration Points

### useEditorController Integration

```typescript
// In parseAndUpdateDiagram():
import { parserRegistry } from '../parsers';

// Use ParserRegistry instead of direct parser imports
const parseResult = await parserRegistry.parse(content, fileName, fileId);

if (!parseResult) {
  // Unsupported language - clear diagram
  updateDiagram([], []);
  return;
}

// Continue with diagram generation...
```

### FileTreeView Integration

```tsx
// In file node render:
import { parserRegistry } from '../parsers';

{!parserRegistry.canParse(node.name) && (
  <Tooltip>
    <TooltipTrigger>
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    </TooltipTrigger>
    <TooltipContent>
      Language not supported for diagram visualization
    </TooltipContent>
  </Tooltip>
)}
```

### CreateDialog Integration

```typescript
// In validateAndSubmit():
const extensionValid = validateFileExtension(finalName);
if (!extensionValid.isValid) {
  setError(extensionValid.error);
  return;
}
```

---

## Parser Module Structure

```typescript
// src/parsers/index.ts - Public API
export { LanguageParser } from './LanguageParser';
export { ParserRegistry, parserRegistry } from './ParserRegistry';
export { TypeScriptParser } from './typescript/TypeScriptParser';
export { DartParser } from './dart/DartParser';

// Re-export for convenience
export { detectLanguage, isSupportedLanguage } from './utils';
```
