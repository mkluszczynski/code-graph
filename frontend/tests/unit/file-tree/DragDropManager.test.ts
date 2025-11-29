/**
 * Contract Tests: DragDropManager
 * 
 * Tests for drag-and-drop validation and utility functions
 * Based on: specs/007-file-folder-dnd/contracts/drag-drop-manager.contract.md
 */

import { describe, it, expect } from 'vitest';
import { DragDropManager } from '../../../src/file-tree/DragDropManager';
import type { DragItem } from '../../../src/file-tree/DragDropManager';

describe('DragDropManager', () => {
  describe('validateDrop', () => {
    // CT-001: validateDrop returns valid for allowed file move
    it('CT-001: returns valid for allowed file move', () => {
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

    // CT-002: validateDrop returns error for duplicate file name
    it('CT-002: returns error for duplicate file name', () => {
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

    // CT-003: validateDrop returns error for circular folder reference
    it('CT-003: returns error for circular folder reference', () => {
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

    // CT-004: validateDrop returns error when dropping folder onto itself
    it('CT-004: returns error when dropping folder onto itself', () => {
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

    // CT-005: validateDrop returns same_location for no-op moves
    it('CT-005: returns same_location for no-op moves', () => {
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

    // CT-008: validateDrop allows folder move to sibling folder
    it('CT-008: allows folder move to sibling folder', () => {
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

    // CT-009: validateDrop allows moving folder to parent folder
    it('CT-009: allows moving folder to parent folder', () => {
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

    // CT-010: validateDrop handles moving to root folder
    it('CT-010: handles moving to root folder', () => {
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
  });

  describe('isAncestorOrSame', () => {
    // CT-006: isAncestorOrSame correctly identifies ancestors
    it('CT-006: correctly identifies ancestors', () => {
      const manager = new DragDropManager();

      expect(manager.isAncestorOrSame('/src', '/src/models')).toBe(true);
      expect(manager.isAncestorOrSame('/src/models', '/src/models/entities')).toBe(true);
      expect(manager.isAncestorOrSame('/src/models', '/src/models')).toBe(true);
      expect(manager.isAncestorOrSame('/src/models', '/src/components')).toBe(false);
      expect(manager.isAncestorOrSame('/src/models', '/src/modelz')).toBe(false); // Not a prefix match
    });
  });

  describe('computeNewPath', () => {
    // CT-007: computeNewPath generates correct paths
    it('CT-007: generates correct paths', () => {
      const manager = new DragDropManager();

      expect(manager.computeNewPath('Button.ts', '/src/components')).toBe('/src/components/Button.ts');
      expect(manager.computeNewPath('models', '/src/features')).toBe('/src/features/models');
      expect(manager.computeNewPath('App.tsx', '/')).toBe('/App.tsx');
    });
  });

  describe('isSameLocation', () => {
    it('returns true when item is already in target folder', () => {
      const manager = new DragDropManager();

      expect(manager.isSameLocation('/src/components', '/src/components')).toBe(true);
    });

    it('returns false when item is in different folder', () => {
      const manager = new DragDropManager();

      expect(manager.isSameLocation('/src', '/src/components')).toBe(false);
      expect(manager.isSameLocation('/src/components', '/')).toBe(false);
    });
  });
});
