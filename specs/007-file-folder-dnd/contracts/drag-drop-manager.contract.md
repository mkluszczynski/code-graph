# Contract: DragDropManager

**Feature**: 007-file-folder-dnd  
**Module**: `frontend/src/file-tree/DragDropManager.ts`  
**Date**: 2025-11-29

## Purpose

Manages drag-and-drop state and operations for the file tree. Provides validation logic, drop target detection, and orchestrates move operations with the ProjectManager.

## Public Interface

```typescript
// ============================================================================
// Types
// ============================================================================

export type DragItemType = 'file' | 'folder';

export interface DragItem {
  type: DragItemType;
  id: string;           // fileId for files, folder path for folders
  path: string;         // Full path of the item
  parentPath: string;   // Parent folder path
  name: string;         // Item name for display
}

export interface DropTargetInfo {
  path: string;
  isValid: boolean;
  hoverStartTime: number;
  errorMessage?: string;
}

export type DropErrorCode = 
  | 'duplicate_name'
  | 'circular_reference'
  | 'same_location'
  | 'invalid_target';

export interface DropValidation {
  isValid: boolean;
  errorCode?: DropErrorCode;
  errorMessage?: string;
}

export interface MoveResult {
  success: boolean;
  newPath?: string;
  affectedPaths?: string[];
  error?: string;
}

// ============================================================================
// DragDropManager Class
// ============================================================================

export class DragDropManager {
  /**
   * Validates whether a drop operation is allowed
   * 
   * @param dragItem - The item being dragged
   * @param targetPath - Path of the target folder
   * @param existingNames - Names of items already in target folder
   * @returns Validation result with error details if invalid
   * 
   * @example
   * const validation = manager.validateDrop(
   *   { type: 'file', path: '/src/Button.ts', name: 'Button.ts' },
   *   '/src/components',
   *   ['App.tsx', 'Header.tsx']
   * );
   * // { isValid: true }
   * 
   * @example
   * const validation = manager.validateDrop(
   *   { type: 'file', path: '/src/App.tsx', name: 'App.tsx' },
   *   '/src/components',
   *   ['App.tsx', 'Header.tsx']
   * );
   * // { isValid: false, errorCode: 'duplicate_name', errorMessage: 'A file named "App.tsx" already exists in this folder' }
   */
  validateDrop(dragItem: DragItem, targetPath: string, existingNames: string[]): DropValidation;

  /**
   * Checks if a folder path is an ancestor of or same as another path
   * Used to prevent circular references when moving folders
   * 
   * @param ancestorPath - Potential ancestor folder path
   * @param descendantPath - Path to check against
   * @returns true if ancestorPath is an ancestor of descendantPath
   * 
   * @example
   * manager.isAncestorOrSame('/src/models', '/src/models/entities')
   * // true
   * 
   * @example
   * manager.isAncestorOrSame('/src/models', '/src/components')
   * // false
   */
  isAncestorOrSame(ancestorPath: string, descendantPath: string): boolean;

  /**
   * Computes the new path for an item after move
   * 
   * @param itemName - Name of the item being moved
   * @param targetFolderPath - Destination folder path
   * @returns Full path after move
   * 
   * @example
   * manager.computeNewPath('Button.ts', '/src/components')
   * // '/src/components/Button.ts'
   * 
   * @example
   * manager.computeNewPath('models', '/src/features')
   * // '/src/features/models'
   */
  computeNewPath(itemName: string, targetFolderPath: string): string;

  /**
   * Checks if item is already in the target folder
   * 
   * @param itemParentPath - Current parent path of the item
   * @param targetPath - Target folder path
   * @returns true if item is already in target folder
   * 
   * @example
   * manager.isSameLocation('/src/components', '/src/components')
   * // true
   */
  isSameLocation(itemParentPath: string, targetPath: string): boolean;
}
```

## Contract Tests

### CT-001: validateDrop returns valid for allowed file move

```typescript
test('validateDrop returns valid for allowed file move', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'file',
    id: 'file-1',
    path: '/src/Button.ts',
    parentPath: '/src',
    name: 'Button.ts'
  };
  
  const result = manager.validateDrop(dragItem, '/src/components', ['App.tsx']);
  
  expect(result.isValid).toBe(true);
  expect(result.errorCode).toBeUndefined();
});
```

### CT-002: validateDrop returns error for duplicate file name

```typescript
test('validateDrop returns error for duplicate file name', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'file',
    id: 'file-1',
    path: '/src/Button.ts',
    parentPath: '/src',
    name: 'Button.ts'
  };
  
  const result = manager.validateDrop(dragItem, '/src/components', ['Button.ts', 'App.tsx']);
  
  expect(result.isValid).toBe(false);
  expect(result.errorCode).toBe('duplicate_name');
  expect(result.errorMessage).toBe('A file named "Button.ts" already exists in this folder');
});
```

### CT-003: validateDrop returns error for circular folder reference

```typescript
test('validateDrop returns error for circular folder reference', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'folder',
    id: '/src/models',
    path: '/src/models',
    parentPath: '/src',
    name: 'models'
  };
  
  // Trying to drop /src/models into /src/models/entities
  const result = manager.validateDrop(dragItem, '/src/models/entities', []);
  
  expect(result.isValid).toBe(false);
  expect(result.errorCode).toBe('circular_reference');
  expect(result.errorMessage).toBe('Cannot move a folder into itself or its subfolders');
});
```

### CT-004: validateDrop returns error when dropping folder onto itself

```typescript
test('validateDrop returns error when dropping folder onto itself', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'folder',
    id: '/src/models',
    path: '/src/models',
    parentPath: '/src',
    name: 'models'
  };
  
  const result = manager.validateDrop(dragItem, '/src/models', []);
  
  expect(result.isValid).toBe(false);
  expect(result.errorCode).toBe('circular_reference');
});
```

### CT-005: validateDrop returns same_location for no-op moves

```typescript
test('validateDrop returns same_location for no-op moves', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'file',
    id: 'file-1',
    path: '/src/components/Button.ts',
    parentPath: '/src/components',
    name: 'Button.ts'
  };
  
  const result = manager.validateDrop(dragItem, '/src/components', ['Button.ts', 'App.tsx']);
  
  expect(result.isValid).toBe(false);
  expect(result.errorCode).toBe('same_location');
});
```

### CT-006: isAncestorOrSame correctly identifies ancestors

```typescript
test('isAncestorOrSame correctly identifies ancestors', () => {
  const manager = new DragDropManager();
  
  expect(manager.isAncestorOrSame('/src', '/src/models')).toBe(true);
  expect(manager.isAncestorOrSame('/src/models', '/src/models/entities')).toBe(true);
  expect(manager.isAncestorOrSame('/src/models', '/src/models')).toBe(true);
  expect(manager.isAncestorOrSame('/src/models', '/src/components')).toBe(false);
  expect(manager.isAncestorOrSame('/src/models', '/src/modelz')).toBe(false); // Not a prefix match
});
```

### CT-007: computeNewPath generates correct paths

```typescript
test('computeNewPath generates correct paths', () => {
  const manager = new DragDropManager();
  
  expect(manager.computeNewPath('Button.ts', '/src/components')).toBe('/src/components/Button.ts');
  expect(manager.computeNewPath('models', '/src/features')).toBe('/src/features/models');
  expect(manager.computeNewPath('App.tsx', '/')).toBe('/App.tsx');
});
```

### CT-008: validateDrop allows folder move to sibling folder

```typescript
test('validateDrop allows folder move to sibling folder', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'folder',
    id: '/src/models',
    path: '/src/models',
    parentPath: '/src',
    name: 'models'
  };
  
  // Moving /src/models into /src/features
  const result = manager.validateDrop(dragItem, '/src/features', ['utils']);
  
  expect(result.isValid).toBe(true);
});
```

### CT-009: validateDrop allows moving folder to parent folder

```typescript
test('validateDrop allows moving folder to parent folder', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'folder',
    id: '/src/features/models',
    path: '/src/features/models',
    parentPath: '/src/features',
    name: 'models'
  };
  
  // Moving /src/features/models to /src
  const result = manager.validateDrop(dragItem, '/src', ['features', 'components']);
  
  expect(result.isValid).toBe(true);
});
```

### CT-010: validateDrop handles root folder moves

```typescript
test('validateDrop handles moving to root folder', () => {
  const manager = new DragDropManager();
  const dragItem: DragItem = {
    type: 'file',
    id: 'file-1',
    path: '/src/components/Button.ts',
    parentPath: '/src/components',
    name: 'Button.ts'
  };
  
  const result = manager.validateDrop(dragItem, '/', ['src']);
  
  expect(result.isValid).toBe(true);
});
```

## Performance Requirements

| Operation | Target | Notes |
|-----------|--------|-------|
| validateDrop | <5ms | Pure function, no I/O |
| isAncestorOrSame | <1ms | Simple string comparison |
| computeNewPath | <1ms | String concatenation |

## Error Handling

- All validation errors return structured `DropValidation` objects
- No exceptions thrown for validation failures
- Error messages are user-friendly and actionable
