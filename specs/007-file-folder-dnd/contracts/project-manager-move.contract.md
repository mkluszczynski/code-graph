# Contract: ProjectManager Move Operations

**Feature**: 007-file-folder-dnd  
**Module**: `frontend/src/project-management/ProjectManager.ts`  
**Date**: 2025-11-29

## Purpose

Extends the existing ProjectManager with move operations for files and folders. Provides atomic persistence to IndexedDB with automatic rollback on failure.

## Public Interface Extensions

```typescript
// Add to existing ProjectManager class

/**
 * Move a file to a new folder location
 * 
 * @param fileId - ID of the file to move
 * @param targetFolderPath - Path of the destination folder
 * @returns The updated file with new path
 * @throws FileExistsError if a file with the same name exists at target
 * @throws StorageError if file not found or database operation fails
 * 
 * @example
 * const updatedFile = await projectManager.moveFile('file-uuid', '/src/components');
 * // updatedFile.path = '/src/components/Button.ts'
 * // updatedFile.parentPath = '/src/components'
 */
async moveFile(fileId: string, targetFolderPath: string): Promise<ProjectFile>;

/**
 * Move a folder and all its contents to a new parent folder
 * Uses a single IndexedDB transaction for atomicity
 * 
 * @param sourceFolderPath - Path of the folder to move
 * @param targetFolderPath - Path of the destination parent folder
 * @returns Object with new path and count of affected items
 * @throws FileExistsError if a folder with the same name exists at target
 * @throws StorageError if folder not found or database operation fails
 * 
 * @example
 * const result = await projectManager.moveFolder('/src/models', '/src/features');
 * // result.newPath = '/src/features/models'
 * // result.affectedFileCount = 5
 * // result.affectedFolderCount = 2
 */
async moveFolder(sourceFolderPath: string, targetFolderPath: string): Promise<{
  newPath: string;
  affectedFileCount: number;
  affectedFolderCount: number;
}>;

/**
 * Check if a name exists at a given folder path
 * Checks both files and folders
 * 
 * @param name - Name to check for
 * @param parentPath - Folder path to check in
 * @returns true if name exists, false otherwise
 * 
 * @example
 * const exists = await projectManager.nameExistsInFolder('Button.ts', '/src/components');
 * // true if /src/components/Button.ts exists
 */
async nameExistsInFolder(name: string, parentPath: string): Promise<boolean>;

/**
 * Get all items (files and folders) in a folder
 * Used for duplicate name checking
 * 
 * @param folderPath - Folder path to list
 * @returns Array of names in the folder
 * 
 * @example
 * const names = await projectManager.getItemNamesInFolder('/src/components');
 * // ['Button.ts', 'Header.tsx', 'utils']
 */
async getItemNamesInFolder(folderPath: string): Promise<string[]>;
```

## Contract Tests

### CT-011: moveFile successfully moves file to new folder

```typescript
test('moveFile successfully moves file to new folder', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  // Create initial file
  const file = await pm.createEmptyFile('Button.ts', '/src');
  
  // Move to new folder
  const movedFile = await pm.moveFile(file.id, '/src/components');
  
  expect(movedFile.path).toBe('/src/components/Button.ts');
  expect(movedFile.parentPath).toBe('/src/components');
  expect(movedFile.name).toBe('Button.ts');
  expect(movedFile.id).toBe(file.id); // ID unchanged
});
```

### CT-012: moveFile throws FileExistsError for duplicate name

```typescript
test('moveFile throws FileExistsError for duplicate name', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  // Create file at source
  const file = await pm.createEmptyFile('Button.ts', '/src');
  // Create file with same name at target
  await pm.createEmptyFile('Button.ts', '/src/components');
  
  await expect(pm.moveFile(file.id, '/src/components'))
    .rejects.toThrow(FileExistsError);
});
```

### CT-013: moveFile preserves file content

```typescript
test('moveFile preserves file content', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  // Create file with content
  const file = await pm.createEmptyFile('Button.ts', '/src');
  await pm.updateFile(file.id, { content: 'export const Button = () => {}' });
  
  // Move file
  const movedFile = await pm.moveFile(file.id, '/src/components');
  
  expect(movedFile.content).toBe('export const Button = () => {}');
});
```

### CT-014: moveFolder moves folder and all contents

```typescript
test('moveFolder moves folder and all contents', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  // Create folder with files
  await pm.createFolder('models', '/src');
  await pm.createEmptyFile('User.ts', '/src/models');
  await pm.createEmptyFile('Product.ts', '/src/models');
  
  // Move folder
  const result = await pm.moveFolder('/src/models', '/src/features');
  
  expect(result.newPath).toBe('/src/features/models');
  expect(result.affectedFileCount).toBe(2);
  
  // Verify files moved
  const user = await pm.getFileByPath('/src/features/models/User.ts');
  expect(user).not.toBeNull();
  expect(user?.parentPath).toBe('/src/features/models');
});
```

### CT-015: moveFolder updates nested folder paths

```typescript
test('moveFolder updates nested folder paths', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  // Create nested folder structure
  await pm.createFolder('models', '/src');
  await pm.createFolder('entities', '/src/models');
  await pm.createEmptyFile('Base.ts', '/src/models/entities');
  
  // Move top folder
  const result = await pm.moveFolder('/src/models', '/src/features');
  
  expect(result.affectedFolderCount).toBe(2); // models + entities
  expect(result.affectedFileCount).toBe(1);
  
  // Verify nested folder moved
  const entitiesFolder = await pm.getFolderByPath('/src/features/models/entities');
  expect(entitiesFolder).toBeDefined();
  
  // Verify nested file moved
  const baseFile = await pm.getFileByPath('/src/features/models/entities/Base.ts');
  expect(baseFile).not.toBeNull();
});
```

### CT-016: moveFolder throws FileExistsError for duplicate folder name

```typescript
test('moveFolder throws FileExistsError for duplicate folder name', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  // Create source folder
  await pm.createFolder('models', '/src');
  // Create folder with same name at target
  await pm.createFolder('models', '/src/features');
  
  await expect(pm.moveFolder('/src/models', '/src/features'))
    .rejects.toThrow(FileExistsError);
});
```

### CT-017: moveFile throws StorageError for non-existent file

```typescript
test('moveFile throws StorageError for non-existent file', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  await expect(pm.moveFile('non-existent-id', '/src/components'))
    .rejects.toThrow(StorageError);
});
```

### CT-018: nameExistsInFolder returns true for existing file

```typescript
test('nameExistsInFolder returns true for existing file', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  await pm.createEmptyFile('Button.ts', '/src/components');
  
  const exists = await pm.nameExistsInFolder('Button.ts', '/src/components');
  expect(exists).toBe(true);
});
```

### CT-019: nameExistsInFolder returns true for existing folder

```typescript
test('nameExistsInFolder returns true for existing folder', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  await pm.createFolder('utils', '/src/components');
  
  const exists = await pm.nameExistsInFolder('utils', '/src/components');
  expect(exists).toBe(true);
});
```

### CT-020: nameExistsInFolder returns false for non-existent name

```typescript
test('nameExistsInFolder returns false for non-existent name', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  const exists = await pm.nameExistsInFolder('NonExistent.ts', '/src/components');
  expect(exists).toBe(false);
});
```

### CT-021: getItemNamesInFolder returns all items

```typescript
test('getItemNamesInFolder returns all items', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  await pm.createEmptyFile('Button.ts', '/src/components');
  await pm.createEmptyFile('Header.tsx', '/src/components');
  await pm.createFolder('utils', '/src/components');
  
  const names = await pm.getItemNamesInFolder('/src/components');
  
  expect(names).toContain('Button.ts');
  expect(names).toContain('Header.tsx');
  expect(names).toContain('utils');
  expect(names.length).toBe(3);
});
```

### CT-022: moveFile to root folder works correctly

```typescript
test('moveFile to root folder works correctly', async () => {
  const pm = new ProjectManager();
  await pm.initialize();
  
  const file = await pm.createEmptyFile('Config.ts', '/src/components');
  
  const movedFile = await pm.moveFile(file.id, '/');
  
  expect(movedFile.path).toBe('/Config.ts');
  expect(movedFile.parentPath).toBe('/');
});
```

## Performance Requirements

| Operation | Target | Notes |
|-----------|--------|-------|
| moveFile | <500ms | Single record update |
| moveFolder (10 files) | <1000ms | Transaction with multiple updates |
| moveFolder (50 files) | <3000ms | Larger transaction |
| nameExistsInFolder | <50ms | Index lookup |

## Transaction Guarantees

- All folder moves are atomic (all-or-nothing)
- IndexedDB transaction abort on any error
- File content is never lost during move
- Timestamps updated to reflect move time
