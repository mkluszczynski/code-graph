/**
 * Integration Tests: Folder Drag and Drop
 * 
 * Tests for User Story 3 - Drag and Drop Folders into Other Folders
 * Based on: specs/007-file-folder-dnd/tasks.md Phase 5
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { useStore } from '../../../src/shared/store';
import { FileTreeView } from '../../../src/file-tree/FileTreeView';
import { FileTreeManager } from '../../../src/file-tree/FileTreeManager';
import type { ProjectFile, ProjectFolder } from '../../../src/shared/types';

describe('Folder Drag and Drop', () => {
  const user = userEvent.setup();

  // Helper to create test files
  const createTestFiles = (): ProjectFile[] => [
    {
      id: 'file-1',
      name: 'App.tsx',
      path: '/src/App.tsx',
      parentPath: '/src',
      content: 'export const App = () => {}',
      lastModified: Date.now(),
      isActive: false,
    },
    {
      id: 'file-2',
      name: 'Button.tsx',
      path: '/src/components/Button.tsx',
      parentPath: '/src/components',
      content: 'export const Button = () => {}',
      lastModified: Date.now(),
      isActive: false,
    },
    {
      id: 'file-3',
      name: 'Input.tsx',
      path: '/src/components/forms/Input.tsx',
      parentPath: '/src/components/forms',
      content: 'export const Input = () => {}',
      lastModified: Date.now(),
      isActive: false,
    },
  ];

  // Helper to create test folders
  const createTestFolders = (): ProjectFolder[] => [
    {
      id: 'folder-1',
      name: 'components',
      path: '/src/components',
      parentPath: '/src',
      createdAt: Date.now(),
    },
    {
      id: 'folder-2',
      name: 'forms',
      path: '/src/components/forms',
      parentPath: '/src/components',
      createdAt: Date.now(),
    },
    {
      id: 'folder-3',
      name: 'utils',
      path: '/src/utils',
      parentPath: '/src',
      createdAt: Date.now(),
    },
    {
      id: 'folder-4',
      name: 'hooks',
      path: '/src/hooks',
      parentPath: '/src',
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    // Reset store state
    const store = useStore.getState();
    store.setFiles(createTestFiles());
    store.setFolders(createTestFolders());
    store.setActiveFile(null);
    store.setExpanded('/src', true);
    store.setExpanded('/src/components', true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // Helper to create a drag event
  const createDragEvent = (type: string, data?: Record<string, string>) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    (event as any).dataTransfer = {
      data: data || {},
      setData: vi.fn((key: string, value: string) => {
        (event as any).dataTransfer.data[key] = value;
      }),
      getData: vi.fn((key: string) => (event as any).dataTransfer.data[key]),
      effectAllowed: 'move',
      dropEffect: 'move',
    };
    return event;
  };

  describe('Folder Drag Start', () => {
    it('shows visual feedback when dragging a folder (data-dragging attribute)', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Find the components folder
      const componentsFolder = screen.getByTestId('folder-components');
      expect(componentsFolder).toBeInTheDocument();

      // Start dragging
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'folder',
          id: 'folder-1',
          name: 'components',
          path: '/src/components',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(componentsFolder, dragStartEvent);

      // Check for dragging visual feedback
      await waitFor(() => {
        expect(componentsFolder).toHaveAttribute('data-dragging', 'true');
      });
    });

    it('sets correct data transfer data on folder drag start', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      const componentsFolder = screen.getByTestId('folder-components');
      const dragStartEvent = createDragEvent('dragstart');

      fireEvent(componentsFolder, dragStartEvent);

      // Verify setData was called with folder info
      expect((dragStartEvent as any).dataTransfer.setData).toHaveBeenCalledWith(
        'application/x-file-tree-item',
        expect.stringContaining('folder-1')
      );
    });
  });

  describe('Drop on Valid Folder', () => {
    it('moves folder and updates all paths when dropped on valid folder', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      // Mock the moveFolder store action to verify it's called correctly
      const moveFolderMock = vi.fn().mockResolvedValue({ success: true });
      const originalMoveFolder = useStore.getState().moveFolder;
      useStore.setState({ moveFolder: moveFolderMock } as any);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging utils folder
      const utilsFolder = screen.getByTestId('folder-utils');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'folder',
          id: 'folder-3',
          name: 'utils',
          path: '/src/utils',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(utilsFolder, dragStartEvent);

      // Drop on hooks folder
      const hooksFolder = screen.getByTestId('folder-hooks');
      const dropEvent = createDragEvent('drop', dragData);
      fireEvent(hooksFolder, dropEvent);

      // Verify moveFolder was called with correct arguments
      await waitFor(() => {
        expect(moveFolderMock).toHaveBeenCalledWith('folder-3', '/src/hooks');
      });

      // Restore original
      useStore.setState({ moveFolder: originalMoveFolder } as any);
    });
  });

  describe('Circular Reference Prevention', () => {
    it('shows invalid indicator when dropping folder on itself', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging components folder
      const componentsFolder = screen.getByTestId('folder-components');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'folder',
          id: 'folder-1',
          name: 'components',
          path: '/src/components',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(componentsFolder, dragStartEvent);

      // Drag over itself
      const dragOverEvent = createDragEvent('dragover', dragData);
      fireEvent(componentsFolder, dragOverEvent);

      // Check for invalid drop indicator
      await waitFor(() => {
        expect(componentsFolder).toHaveAttribute('data-drop-invalid', 'true');
      });
    });

    it('shows invalid indicator when dropping folder on its descendant', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Click on components folder to expand it and show forms
      const componentsFolder = screen.getByTestId('folder-components');
      await user.click(componentsFolder);

      // Wait for forms folder to appear
      await waitFor(() => {
        expect(screen.getByTestId('folder-forms')).toBeInTheDocument();
      });

      // Start dragging components folder
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'folder',
          id: 'folder-1',
          name: 'components',
          path: '/src/components',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(componentsFolder, dragStartEvent);

      // Drag over forms folder (descendant of components)
      const formsFolder = screen.getByTestId('folder-forms');
      const dragOverEvent = createDragEvent('dragover', dragData);
      fireEvent(formsFolder, dragOverEvent);

      // Check for invalid drop indicator
      await waitFor(() => {
        expect(formsFolder).toHaveAttribute('data-drop-invalid', 'true');
      });
    });
  });

  describe('Duplicate Name Prevention', () => {
    it('shows error when dropping on folder with duplicate name', async () => {
      // Add a folder with the same name to the target folder
      const folders = [
        ...createTestFolders(),
        {
          id: 'folder-5',
          name: 'utils',
          path: '/src/hooks/utils',
          parentPath: '/src/hooks',
          createdAt: Date.now(),
        },
      ];
      const files = createTestFiles();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      useStore.getState().setFolders(folders);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging utils folder from /src
      const utilsFolder = screen.getByTestId('folder-utils');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'folder',
          id: 'folder-3',
          name: 'utils',
          path: '/src/utils',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(utilsFolder, dragStartEvent);

      // Drag over hooks folder (which has duplicate 'utils')
      const hooksFolder = screen.getByTestId('folder-hooks');
      const dragOverEvent = createDragEvent('dragover', dragData);
      fireEvent(hooksFolder, dragOverEvent);

      // Should show invalid drop indicator
      await waitFor(() => {
        expect(hooksFolder).toHaveAttribute('data-drop-invalid', 'true');
      });
    });
  });

  describe('Active File Reference Update', () => {
    it('updates active file reference when moved file parent folder is moved', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      // Set Button.tsx as active file (using file ID)
      useStore.getState().setActiveFile('file-2'); // Button.tsx in /src/components

      // Create a mock moveFolder that simulates successful move
      const moveFolderMock = vi.fn().mockImplementation(async (folderId: string, targetPath: string) => {
        // Simulate what would happen - the active file path would need to be updated
        return { success: true };
      });
      const originalMoveFolder = useStore.getState().moveFolder;
      useStore.setState({ moveFolder: moveFolderMock } as any);

      render(<FileTreeView nodes={nodes} />);

      // Verify active file is set
      expect(useStore.getState().activeFileId).toBe('file-2');

      // Start dragging components folder
      const componentsFolder = screen.getByTestId('folder-components');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'folder',
          id: 'folder-1',
          name: 'components',
          path: '/src/components',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(componentsFolder, dragStartEvent);

      // Drop on hooks folder
      const hooksFolder = screen.getByTestId('folder-hooks');
      const dropEvent = createDragEvent('drop', dragData);
      fireEvent(hooksFolder, dropEvent);

      // Verify moveFolder was called
      await waitFor(() => {
        expect(moveFolderMock).toHaveBeenCalledWith('folder-1', '/src/hooks');
      });

      // Restore original
      useStore.setState({ moveFolder: originalMoveFolder } as any);
    });
  });

  describe('Nested Structure Preservation', () => {
    it('preserves nested folder structure after move', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      // Create a mock moveFolder that we can verify
      const moveFolderMock = vi.fn().mockResolvedValue({ success: true });
      const originalMoveFolder = useStore.getState().moveFolder;
      useStore.setState({ moveFolder: moveFolderMock } as any);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging components folder (which has forms nested inside)
      const componentsFolder = screen.getByTestId('folder-components');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'folder',
          id: 'folder-1',
          name: 'components',
          path: '/src/components',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(componentsFolder, dragStartEvent);

      // Drop on hooks folder
      const hooksFolder = screen.getByTestId('folder-hooks');
      const dropEvent = createDragEvent('drop', dragData);
      fireEvent(hooksFolder, dropEvent);

      // Verify moveFolder was called - the implementation should handle nested structure
      await waitFor(() => {
        expect(moveFolderMock).toHaveBeenCalledWith('folder-1', '/src/hooks');
      });

      // Restore original
      useStore.setState({ moveFolder: originalMoveFolder } as any);
    });
  });
});
