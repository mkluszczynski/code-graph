# Research: Dart Language Support

**Feature**: 008-dart-language-support  
**Date**: 2025-11-29  
**Status**: Complete

## Research Questions

### RQ-001: Which Dart parsing library to use for browser-based parsing?

**Context**: Need a client-side Dart parser that can extract classes, properties, methods, and relationships for UML diagram generation. Must work in browser (no Node.js-only dependencies).

**Options Evaluated**:

#### Option 1: Tree-sitter with WASM (RECOMMENDED)

- **Packages**: `web-tree-sitter` (v0.25.10) + `tree-sitter-dart` (v1.0.0)
- **Bundle Size**: ~5.77 MB for web-tree-sitter + ~6.24 MB for tree-sitter-dart WASM
- **Browser Compatibility**: Full support via WebAssembly
- **Dart Syntax Coverage**: Complete Dart language spec coverage
- **Last Updated**: web-tree-sitter 2 months ago, tree-sitter-dart 3 years ago (grammar stable)
- **License**: MIT (web-tree-sitter), ISC (tree-sitter-dart)
- **Maintenance**: Active (tree-sitter project is well-maintained by GitHub)

**Pros**:
- Full Dart 3.x syntax support
- Proven incremental parsing (fast updates)
- Well-documented AST node types
- Same architecture used by VS Code, GitHub, etc.
- Graceful syntax error handling
- Can reuse pattern from TypeScript parser

**Cons**:
- Large bundle size (~12MB combined WASM files)
- Requires WASM loader configuration in Vite
- Initial parse slightly slower than native parsers

#### Option 2: Hand-written Regex-based Parser

- **Bundle Size**: ~10-20 KB (custom code only)
- **Browser Compatibility**: Full
- **Dart Syntax Coverage**: Partial (depends on implementation)

**Pros**:
- Minimal bundle size
- No external dependencies
- Full control over extraction logic

**Cons**:
- High implementation effort (weeks vs days)
- Incomplete syntax support (generics, complex expressions are hard)
- No graceful error handling
- Maintenance burden for Dart language changes
- Regex-based parsing is error-prone

#### Option 3: ANTLR4 with JavaScript Runtime

- **Packages**: `antlr4` + Dart grammar
- **Bundle Size**: ~150 KB runtime + ~100 KB grammar
- **Browser Compatibility**: Full

**Pros**:
- Smaller than tree-sitter
- Official Dart grammar available

**Cons**:
- Grammar not actively maintained for Dart 3.x
- More complex setup than tree-sitter
- Less community support for JavaScript target

**Decision**: **Tree-sitter with WASM** (Option 1)

**Rationale**:
1. Complete Dart 3.x syntax coverage out of the box
2. Consistent architecture with potential future language additions
3. Graceful error handling for syntax errors
4. Well-tested by GitHub's code analysis tools
5. Bundle size is acceptable for a desktop-class web app (can lazy-load)

**Alternatives Rejected**:
- Regex parser: Too error-prone and incomplete for real Dart code
- ANTLR4: Dart grammar not well-maintained for latest Dart versions

---

### RQ-002: How to structure parsers for extensibility?

**Context**: Need a unified parser architecture that:
1. Allows easy addition of new language support
2. Maintains consistent API across parsers
3. Enables language detection and routing
4. Supports both sync (TypeScript) and async (WASM) initialization

**Decision**: Create abstract `LanguageParser` base class with `ParserRegistry`

**Rationale**:
1. Abstract class provides template method pattern for parsers
2. Registry enables dynamic parser lookup by extension
3. `requiresInitialization` flag handles sync vs async parsers
4. Consistent interface simplifies useEditorController integration
5. Easy to add new languages: extend class, register parser

**Structure**:
```
src/parsers/
├── index.ts                    # Public exports, creates parserRegistry
├── LanguageParser.ts           # Abstract base class
├── ParserRegistry.ts           # Parser management and routing
├── typescript/                 # TypeScript parser (moved from typescript-parser/)
│   ├── TypeScriptParser.ts     # Extends LanguageParser
│   ├── ClassExtractor.ts
│   ├── InterfaceExtractor.ts
│   ├── PropertyExtractor.ts
│   ├── MethodExtractor.ts
│   └── RelationshipAnalyzer.ts
├── dart/                       # Dart parser (new)
│   ├── DartParser.ts           # Extends LanguageParser
│   ├── ClassExtractor.ts
│   ├── InterfaceExtractor.ts
│   ├── PropertyExtractor.ts
│   ├── MethodExtractor.ts
│   └── RelationshipAnalyzer.ts
└── __tests__/
    ├── LanguageParser.test.ts
    ├── ParserRegistry.test.ts
    ├── typescript/
    └── dart/
```

**Abstract Class Design**:
```typescript
abstract class LanguageParser {
  // Required: Parser must define these
  abstract readonly language: SupportedLanguage;
  abstract readonly extensions: readonly string[];
  abstract readonly displayName: string;
  abstract parse(sourceCode: string, fileName: string, fileId?: string): ParseResult;
  
  // Optional: Default implementations provided
  canParse(fileName: string): boolean { /* checks extensions */ }
  async initialize(): Promise<void> { /* no-op by default */ }
  get requiresInitialization(): boolean { return false; }
}
```

---

### RQ-003: How to handle Dart-specific syntax differences?

**Context**: Dart has some syntax differences from TypeScript that affect parsing.

**Findings**:

| Dart Feature | TypeScript Equivalent | Handling |
|--------------|----------------------|----------|
| `class Person` | `class Person` | Same |
| `abstract class IService` | `interface IService` | Map to InterfaceDefinition |
| `final String name;` | `readonly name: string;` | Map to Property with isReadonly=true |
| `late String name;` | N/A | Treat as regular property |
| `String? name;` | `name?: string` | Map to optional property |
| `void greet(String name)` | `greet(name: string): void` | Same mapping |
| `String name = 'default';` | `name: string = 'default'` | Same mapping |
| `static const PI = 3.14;` | `static readonly PI = 3.14` | Same mapping |
| `extends BaseClass` | `extends BaseClass` | Same (inheritance) |
| `implements IInterface` | `implements IInterface` | Same (realization) |
| `with MixinClass` | N/A | Treat as additional implementation |
| Factory constructors | N/A | Ignore for UML purposes |
| Named constructors | N/A | Show as methods |

**Decision**: Map Dart constructs to existing shared types

**Rationale**:
1. Reuse existing ClassDefinition, InterfaceDefinition types
2. Dart's `abstract class` used as interface → map to InterfaceDefinition
3. `with` mixins → treat like `implements` (realization arrows)
4. Factory/named constructors → treat as methods for simplicity

---

### RQ-004: How to route to correct parser based on file extension?

**Context**: Need to detect file extension and call appropriate parser.

**Decision**: Use `ParserRegistry` for centralized parser management

```typescript
// src/parsers/ParserRegistry.ts
export class ParserRegistry {
  private parsers: Map<SupportedLanguage, LanguageParser> = new Map();
  private extensionMap: Map<string, LanguageParser> = new Map();
  
  register(parser: LanguageParser): void {
    this.parsers.set(parser.language, parser);
    for (const ext of parser.extensions) {
      this.extensionMap.set(ext.toLowerCase(), parser);
    }
  }
  
  getParserForFile(fileName: string): LanguageParser | undefined {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? this.extensionMap.get(ext) : undefined;
  }
  
  async parse(sourceCode: string, fileName: string, fileId?: string): Promise<ParseResult | null> {
    const parser = this.getParserForFile(fileName);
    if (!parser) return null;
    
    if (parser.requiresInitialization) {
      await parser.initialize();
    }
    
    return parser.parse(sourceCode, fileName, fileId);
  }
  
  canParse(fileName: string): boolean {
    return this.getParserForFile(fileName) !== undefined;
  }
}

// src/parsers/index.ts
export const parserRegistry = new ParserRegistry();
parserRegistry.register(new TypeScriptParser());
parserRegistry.register(new DartParser());
```

**Integration**: Modify `useEditorController.ts` to use registry:
```typescript
import { parserRegistry } from '../parsers';

// In parseAndUpdateDiagram:
const parseResult = await parserRegistry.parse(content, fileName, fileId);
if (!parseResult) {
  // Unsupported language - clear diagram
  updateDiagram([], []);
  return;
}
```

---

### RQ-005: How to handle file extension validation in CreateDialog?

**Context**: Current CreateDialog auto-adds `.ts` extension. Need to require explicit extension.

**Decision**: Modify CreateDialog validation to:
1. Require filename to include a dot and extension
2. Remove `normalizeFileName()` call that adds `.ts`
3. Validate extension is not empty (e.g., reject "file.")

**Validation Rules**:
```typescript
function validateFileExtension(name: string): FileValidationResult {
  const trimmed = name.trim();
  
  // Must have at least one character before the dot
  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex <= 0) {
    return { isValid: false, error: 'File name must include an extension (e.g., .ts, .dart)' };
  }
  
  // Must have extension after the dot
  const extension = trimmed.slice(dotIndex + 1);
  if (extension.length === 0) {
    return { isValid: false, error: 'File extension cannot be empty' };
  }
  
  return { isValid: true };
}
```

---

### RQ-006: How to display warning icons for unsupported files?

**Context**: Need visual indicator for files with unsupported extensions.

**Decision**: Add warning icon in FileTreeView with tooltip, use ParserRegistry

**Implementation**:
1. Use `AlertTriangle` icon from Lucide React (already in project)
2. Use shadcn/ui `Tooltip` component for hover message
3. Check `parserRegistry.canParse(file.name)` in render

**UI Placement**: Icon appears after file name, before any actions

```tsx
import { parserRegistry } from '../parsers';

{!parserRegistry.canParse(node.name) && (
  <Tooltip>
    <TooltipTrigger asChild>
      <AlertTriangle 
        className="h-4 w-4 text-amber-500 shrink-0" 
        aria-label="Language not supported for diagram visualization"
      />
    </TooltipTrigger>
    <TooltipContent>
      Language not supported for diagram visualization
    </TooltipContent>
  </Tooltip>
)}
```

---

## Best Practices Identified

### Tree-sitter WASM Setup with Vite

1. **Copy WASM files to public directory** via postinstall script
2. **Configure Vite** to exclude fs from bundle:
   ```typescript
   // vite.config.ts
   resolve: {
     alias: {
       fs: false
     }
   }
   ```
3. **Lazy load parser** to avoid blocking initial render:
   ```typescript
   const loadDartParser = async () => {
     await Parser.init({
       locateFile: (file) => `/wasm/${file}`
     });
     const Dart = await Parser.Language.load('/wasm/tree-sitter-dart.wasm');
     return { Parser, Dart };
   };
   ```

### Parser Module Pattern

Follow existing TypeScript parser patterns:
1. Export single `parse()` function from main module
2. Internal extractors are not exported
3. Return `ParseResult` type for consistency
4. Use `performanceMonitor` for timing
5. Handle errors gracefully, return error in result

### Test Patterns

1. **Contract tests**: Test each extractor in isolation
2. **Integration tests**: Test parser + DiagramGenerator together
3. **E2E tests**: Test full user workflows
4. Use same test fixtures pattern as TypeScript parser

---

## Implementation Recommendations

1. **Phase 0 (Pre-requisite)**: Create unified `parsers/` module
   - Create `LanguageParser` abstract class
   - Create `ParserRegistry` 
   - Move TypeScript parser to `parsers/typescript/`
   - Update all imports across codebase
   - Verify all existing tests pass (regression)

2. **Phase 1 (US1)**: Modify CreateDialog and FileOperations - no parser changes

3. **Phase 2 (US2)**: Implement Dart parser
   - Create `DartParser` extending `LanguageParser`
   - Implement extractors using tree-sitter
   - Register in `parserRegistry`

4. **Phase 3 (US3)**: Add warning icons to FileTreeView using `parserRegistry.canParse()`

5. **Phase 4**: Integration testing and polish

**Estimated Effort**: 4-6 days for full implementation (including migration)

---

## References

- [web-tree-sitter npm](https://www.npmjs.com/package/web-tree-sitter)
- [tree-sitter-dart npm](https://www.npmjs.com/package/tree-sitter-dart)
- [Dart Language Specification](https://dart.dev/guides/language/spec)
- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
