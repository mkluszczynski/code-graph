# Quickstart: Dart Language Support

**Feature**: 008-dart-language-support  
**Date**: 2025-11-29  

## Prerequisites

- Node.js 20+ LTS
- pnpm package manager
- VS Code (recommended)

## Setup

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Install New Dependencies (for Dart parser)

```bash
pnpm add web-tree-sitter
# Note: tree-sitter-dart WASM will be generated or downloaded during build
```

### 3. Configure WASM Files

Create postinstall script in `package.json`:

```json
{
  "scripts": {
    "postinstall": "cp node_modules/web-tree-sitter/tree-sitter.wasm public/wasm/"
  }
}
```

### 4. Create WASM Directory

```bash
mkdir -p public/wasm
```

### 5. Download tree-sitter-dart WASM

Either generate from grammar or download pre-built:

```bash
# Option A: Download pre-built (if available)
curl -L https://github.com/AnjaliManolworker/tree-sitter-dart/releases/latest/download/tree-sitter-dart.wasm -o public/wasm/tree-sitter-dart.wasm

# Option B: Build from source (requires emscripten)
npx tree-sitter build --wasm node_modules/tree-sitter-dart
mv tree-sitter-dart.wasm public/wasm/
```

## Development Workflow

### Run Dev Server

```bash
pnpm dev
```

### Run Tests

```bash
# All tests
pnpm test

# Specific test file
pnpm test -- src/dart-parser/__tests__/DartParser.test.ts

# Watch mode
pnpm test -- --watch
```

### Run E2E Tests

```bash
pnpm test:e2e
```

## Key Files to Modify/Create

### Phase 0: Create Unified Parsers Module

| File | Change |
|------|--------|
| `src/parsers/LanguageParser.ts` | **NEW**: Abstract base class for all parsers |
| `src/parsers/ParserRegistry.ts` | **NEW**: Parser lookup and management |
| `src/parsers/index.ts` | **NEW**: Public exports |
| `src/parsers/typescript/TypeScriptParser.ts` | **MOVE**: From `typescript-parser/`, extend LanguageParser |
| `src/parsers/typescript/ClassExtractor.ts` | **MOVE**: From `typescript-parser/` |
| `src/parsers/typescript/InterfaceExtractor.ts` | **MOVE**: From `typescript-parser/` |
| `src/parsers/typescript/PropertyExtractor.ts` | **MOVE**: From `typescript-parser/` |
| `src/parsers/typescript/MethodExtractor.ts` | **MOVE**: From `typescript-parser/` |
| `src/parsers/typescript/RelationshipAnalyzer.ts` | **MOVE**: From `typescript-parser/` |

### User Story 1: Custom File Extensions

| File | Change |
|------|--------|
| `src/components/CreateDialog.tsx` | Remove auto-.ts extension, add extension validation |
| `src/file-tree/FileOperations.ts` | Add `validateFileExtension()` function |

### User Story 2: Dart Parser

| File | Change |
|------|--------|
| `src/parsers/dart/DartParser.ts` | **NEW**: Extends LanguageParser, uses tree-sitter |
| `src/parsers/dart/ClassExtractor.ts` | **NEW**: Dart class extraction |
| `src/parsers/dart/InterfaceExtractor.ts` | **NEW**: Abstract class extraction |
| `src/parsers/dart/PropertyExtractor.ts` | **NEW**: Dart property extraction |
| `src/parsers/dart/MethodExtractor.ts` | **NEW**: Dart method extraction |
| `src/parsers/dart/RelationshipAnalyzer.ts` | **NEW**: Relationship extraction |
| `src/code-editor/useEditorController.ts` | Use ParserRegistry instead of direct imports |

### User Story 3: Unsupported Language Warning

| File | Change |
|------|--------|
| `src/file-tree/FileTreeView.tsx` | Add warning icon with tooltip |
| `src/shared/types/index.ts` | Add `SupportedLanguage` type |

## Migration: Moving TypeScript Parser

```bash
# 1. Create new parsers directory structure
mkdir -p src/parsers/typescript
mkdir -p src/parsers/dart

# 2. Move TypeScript parser files
mv src/typescript-parser/TypeScriptParser.ts src/parsers/typescript/
mv src/typescript-parser/ClassExtractor.ts src/parsers/typescript/
mv src/typescript-parser/InterfaceExtractor.ts src/parsers/typescript/
mv src/typescript-parser/PropertyExtractor.ts src/parsers/typescript/
mv src/typescript-parser/MethodExtractor.ts src/parsers/typescript/
mv src/typescript-parser/RelationshipAnalyzer.ts src/parsers/typescript/

# 3. Update imports in moved files (relative paths change)

# 4. Update imports across codebase
# - src/code-editor/useEditorController.ts
# - src/diagram-visualization/ImportResolver.ts
# - Any test files

# 5. Delete old typescript-parser directory after migration verified
rm -rf src/typescript-parser
```

## Testing Checklist

### Contract Tests (Unit)

- [ ] LanguageParser.canParse() for various extensions
- [ ] ParserRegistry.register() and lookup methods
- [ ] ParserRegistry.parse() routing
- [ ] DartParser.parse() with valid Dart code
- [ ] DartParser.parse() with syntax errors
- [ ] TypeScriptParser still works after migration (regression)
- [ ] ClassExtractor with various class patterns
- [ ] PropertyExtractor with Dart property syntax
- [ ] MethodExtractor with Dart method syntax
- [ ] validateFileExtension() edge cases

### Integration Tests

- [ ] Create .dart file, verify diagram generation
- [ ] Create .ts file, verify diagram generation (regression)
- [ ] Create unsupported file, verify warning icon
- [ ] Mixed TypeScript and Dart files in project view

### E2E Tests

- [ ] Full workflow: Create .dart file with class
- [ ] Full workflow: View diagram for Dart file
- [ ] Full workflow: Warning icon for .py file
- [ ] Extension validation error messages

## Vite Configuration

Add to `vite.config.ts` if fs resolution issue occurs:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      fs: false
    }
  },
  optimizeDeps: {
    exclude: ['web-tree-sitter']
  }
});
```

## Common Issues

### "Can't resolve 'fs'"

Solution: Add `fs: false` to Vite resolve config.

### WASM file not found

Solution: Ensure `public/wasm/` directory exists and contains both:
- `tree-sitter.wasm`
- `tree-sitter-dart.wasm`

### Parser initialization slow

Solution: Lazy-load parser on first .dart file, show loading indicator.

## Performance Targets

| Metric | Target |
|--------|--------|
| File creation | <5s (SC-001) |
| Diagram update (10 entities) | <200ms (SC-002) |
| Warning icon display | Instant (SC-003) |
| Tooltip appearance | <200ms (SC-004) |

## Definition of Done

- [ ] All contract tests pass (LanguageParser, ParserRegistry, both parsers)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] TypeScript parser works after migration (regression tests)
- [ ] Bundle size impact documented
- [ ] Performance targets met
- [ ] Old `typescript-parser/` directory removed

## Adding New Language Support (Future)

To add support for a new language (e.g., Kotlin):

1. **Create parser directory**: `src/parsers/kotlin/`
2. **Implement parser class** extending `LanguageParser`:
   ```typescript
   // src/parsers/kotlin/KotlinParser.ts
   export class KotlinParser extends LanguageParser {
     readonly language = 'kotlin';
     readonly extensions = ['kt', 'kts'] as const;
     readonly displayName = 'Kotlin';
     
     parse(sourceCode: string, fileName: string, fileId?: string): ParseResult {
       // Implementation
     }
   }
   ```
3. **Add extractors**: `ClassExtractor.ts`, `PropertyExtractor.ts`, etc.
4. **Register parser** in `src/parsers/index.ts`:
   ```typescript
   parserRegistry.register(new KotlinParser());
   ```
5. **Update types**: Add `'kotlin'` to `SupportedLanguage` type
6. **Add tests**: Contract and integration tests for new parser
