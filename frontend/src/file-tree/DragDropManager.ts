/**
 * DragDropManager
 *
 * Manages drag-and-drop validation and utility functions for file tree operations.
 * Based on: specs/007-file-folder-dnd/contracts/drag-drop-manager.contract.md
 */

import type { DropValidation } from '../shared/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Type of item being dragged
 */
export type DragItemType = 'file' | 'folder';

/**
 * Represents an item being dragged in the file tree
 */
export interface DragItem {
  /** Type of item being dragged */
  type: DragItemType;
  /** ID of the item (fileId for files, folder path for folders) */
  id: string;
  /** Full path of the item */
  path: string;
  /** Parent folder path */
  parentPath: string;
  /** Display name of the item */
  name: string;
}

// ============================================================================
// DragDropManager Class
// ============================================================================

/**
 * Manages drag-and-drop state and operations for the file tree.
 * Provides validation logic, drop target detection, and path computation.
 */
export class DragDropManager {
  /**
   * Validates whether a drop operation is allowed
   *
   * @param dragItem - The item being dragged
   * @param targetPath - Path of the target folder
   * @param existingNames - Names of items already in target folder
   * @returns Validation result with error details if invalid
   */
  validateDrop(
    dragItem: DragItem,
    targetPath: string,
    existingNames: string[]
  ): DropValidation {
    // Check same location first (no-op move)
    if (this.isSameLocation(dragItem.parentPath, targetPath)) {
      return {
        isValid: false,
        errorCode: 'same_location',
      };
    }

    // Check circular reference for folders
    if (dragItem.type === 'folder' && this.isAncestorOrSame(dragItem.path, targetPath)) {
      return {
        isValid: false,
        errorCode: 'circular_reference',
        errorMessage: 'Cannot move a folder into itself or its subfolders',
      };
    }

    // Check duplicate name
    if (existingNames.includes(dragItem.name)) {
      return {
        isValid: false,
        errorCode: 'duplicate_name',
        errorMessage: `A ${dragItem.type} named "${dragItem.name}" already exists in this folder`,
      };
    }

    return { isValid: true };
  }

  /**
   * Checks if a folder path is an ancestor of or same as another path.
   * Used to prevent circular references when moving folders.
   *
   * @param ancestorPath - Potential ancestor folder path
   * @param descendantPath - Path to check against
   * @returns true if ancestorPath is an ancestor of or same as descendantPath
   */
  isAncestorOrSame(ancestorPath: string, descendantPath: string): boolean {
    if (ancestorPath === descendantPath) {
      return true;
    }
    // Ensure we're checking for a proper path prefix, not just string prefix
    // e.g., "/src/models" should not match "/src/modelz"
    return descendantPath.startsWith(ancestorPath + '/');
  }

  /**
   * Computes the new path for an item after move
   *
   * @param itemName - Name of the item being moved
   * @param targetFolderPath - Destination folder path
   * @returns Full path after move
   */
  computeNewPath(itemName: string, targetFolderPath: string): string {
    if (targetFolderPath === '/') {
      return `/${itemName}`;
    }
    return `${targetFolderPath}/${itemName}`;
  }

  /**
   * Checks if item is already in the target folder
   *
   * @param itemParentPath - Current parent path of the item
   * @param targetPath - Target folder path
   * @returns true if item is already in target folder
   */
  isSameLocation(itemParentPath: string, targetPath: string): boolean {
    return itemParentPath === targetPath;
  }
}
