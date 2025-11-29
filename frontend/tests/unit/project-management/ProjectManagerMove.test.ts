/**
 * Contract Tests: ProjectManager Move Operations
 *
 * Tests for file and folder move operations in ProjectManager
 * Based on: specs/007-file-folder-dnd/contracts/project-manager-move.contract.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectManager } from '../../../src/project-management/ProjectManager';
import { FileExistsError, StorageError } from '../../../src/shared/types/errors';
import 'fake-indexeddb/auto';

describe('ProjectManager Move Operations', () => {
  let projectManager: ProjectManager;
  let testDbName: string;

  beforeEach(async () => {
    // Create unique database name for each test to avoid conflicts
    testDbName = `test-move-ops-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    projectManager = new ProjectManager(testDbName);
    await projectManager.initialize();
  });

  // No afterEach cleanup needed - each test uses unique DB name

  describe('moveFile', () => {
    // CT-011: moveFile successfully moves file to new folder
    it('CT-011: successfully moves file to new folder', async () => {
      // Create initial file
      const file = await projectManager.createEmptyFile('Button.ts', '/src');

      // Move to new folder
      const movedFile = await projectManager.moveFile(file.id, '/src/components');

      expect(movedFile.path).toBe('/src/components/Button.ts');
      expect(movedFile.parentPath).toBe('/src/components');
      expect(movedFile.name).toBe('Button.ts');
      expect(movedFile.id).toBe(file.id); // ID unchanged
    });

    // CT-012: moveFile throws FileExistsError for duplicate name
    it('CT-012: throws FileExistsError for duplicate name', async () => {
      // Create file at source
      const file = await projectManager.createEmptyFile('Button.ts', '/src');
      // Create file with same name at target
      await projectManager.createEmptyFile('Button.ts', '/src/components');

      await expect(projectManager.moveFile(file.id, '/src/components'))
        .rejects.toThrow(FileExistsError);
    });

    // CT-013: moveFile preserves file content
    it('CT-013: preserves file content', async () => {
      // Create file with content
      const file = await projectManager.createEmptyFile('Button.ts', '/src');
      await projectManager.updateFile(file.id, { content: 'export const Button = () => {}' });

      // Move file
      const movedFile = await projectManager.moveFile(file.id, '/src/components');

      expect(movedFile.content).toBe('export const Button = () => {}');
    });

    // CT-017: moveFile throws StorageError for non-existent file
    it('CT-017: throws StorageError for non-existent file', async () => {
      await expect(projectManager.moveFile('non-existent-id', '/src/components'))
        .rejects.toThrow(StorageError);
    });

    // CT-022: moveFile to root folder works correctly
    it('CT-022: moves file to root folder correctly', async () => {
      const file = await projectManager.createEmptyFile('Config.ts', '/src/components');

      const movedFile = await projectManager.moveFile(file.id, '/');

      expect(movedFile.path).toBe('/Config.ts');
      expect(movedFile.parentPath).toBe('/');
    });
  });

  describe('moveFolder', () => {
    // CT-014: moveFolder moves folder and all contents
    it('CT-014: moves folder and all contents', async () => {
      // Create folder with files
      await projectManager.createFolder('models', '/src');
      await projectManager.createEmptyFile('User.ts', '/src/models');
      await projectManager.createEmptyFile('Product.ts', '/src/models');

      // Create target folder
      await projectManager.createFolder('features', '/src');

      // Move folder
      const result = await projectManager.moveFolder('/src/models', '/src/features');

      expect(result.newPath).toBe('/src/features/models');
      expect(result.affectedFileCount).toBe(2);

      // Verify files moved
      const user = await projectManager.getFileByPath('/src/features/models/User.ts');
      expect(user).not.toBeNull();
      expect(user?.parentPath).toBe('/src/features/models');
    });

    // CT-015: moveFolder updates nested folder paths
    it('CT-015: updates nested folder paths', async () => {
      // Create nested folder structure
      await projectManager.createFolder('models', '/src');
      await projectManager.createFolder('entities', '/src/models');
      await projectManager.createEmptyFile('Base.ts', '/src/models/entities');

      // Create target folder
      await projectManager.createFolder('features', '/src');

      // Move top folder
      const result = await projectManager.moveFolder('/src/models', '/src/features');

      expect(result.affectedFolderCount).toBe(2); // models + entities
      expect(result.affectedFileCount).toBe(1);

      // Verify nested folder moved
      const entitiesFolder = await projectManager.getFolderByPath('/src/features/models/entities');
      expect(entitiesFolder).toBeDefined();

      // Verify nested file moved
      const baseFile = await projectManager.getFileByPath('/src/features/models/entities/Base.ts');
      expect(baseFile).not.toBeNull();
    });

    // CT-016: moveFolder throws FileExistsError for duplicate folder name
    it('CT-016: throws FileExistsError for duplicate folder name', async () => {
      // Create source folder
      await projectManager.createFolder('models', '/src');
      // Create folder with same name at target
      await projectManager.createFolder('features', '/src');
      await projectManager.createFolder('models', '/src/features');

      await expect(projectManager.moveFolder('/src/models', '/src/features'))
        .rejects.toThrow(FileExistsError);
    });
  });

  describe('nameExistsInFolder', () => {
    // CT-018: nameExistsInFolder returns true for existing file
    it('CT-018: returns true for existing file', async () => {
      await projectManager.createEmptyFile('Button.ts', '/src/components');

      const exists = await projectManager.nameExistsInFolder('Button.ts', '/src/components');
      expect(exists).toBe(true);
    });

    // CT-019: nameExistsInFolder returns true for existing folder
    it('CT-019: returns true for existing folder', async () => {
      await projectManager.createFolder('utils', '/src/components');

      const exists = await projectManager.nameExistsInFolder('utils', '/src/components');
      expect(exists).toBe(true);
    });

    // CT-020: nameExistsInFolder returns false for non-existent name
    it('CT-020: returns false for non-existent name', async () => {
      const exists = await projectManager.nameExistsInFolder('NonExistent.ts', '/src/components');
      expect(exists).toBe(false);
    });
  });

  describe('getItemNamesInFolder', () => {
    // CT-021: getItemNamesInFolder returns all items
    it('CT-021: returns all items', async () => {
      await projectManager.createEmptyFile('Button.ts', '/src/components');
      await projectManager.createEmptyFile('Header.tsx', '/src/components');
      await projectManager.createFolder('utils', '/src/components');

      const names = await projectManager.getItemNamesInFolder('/src/components');

      expect(names).toContain('Button.ts');
      expect(names).toContain('Header.tsx');
      expect(names).toContain('utils');
      expect(names.length).toBe(3);
    });
  });
});
