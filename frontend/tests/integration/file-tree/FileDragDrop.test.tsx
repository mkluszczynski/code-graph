/**
 * Integration Tests: File Drag and Drop
 * 
 * Tests for User Story 2 - Drag and Drop Files into Folders
 * Based on: specs/007-file-folder-dnd/tasks.md Phase 4
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { useStore } from '../../../src/shared/store';
import { FileTreeView } from '../../../src/file-tree/FileTreeView';
import { FileTreeManager } from '../../../src/file-tree/FileTreeManager';
import type { ProjectFile, ProjectFolder } from '../../../src/shared/types';

describe('File Drag and Drop', () => {
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
      name: 'index.ts',
      path: '/src/index.ts',
      parentPath: '/src',
      content: 'export * from "./App"',
      lastModified: Date.now(),
      isActive: false,
    },
    {
      id: 'file-3',
      name: 'Button.tsx',
      path: '/src/components/Button.tsx',
      parentPath: '/src/components',
      content: 'export const Button = () => {}',
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
      name: 'utils',
      path: '/src/utils',
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

  describe('Drag Start', () => {
    it('shows visual feedback when dragging a file (data-dragging attribute)', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Find the App.tsx file
      const appFile = screen.getByTestId('file-App.tsx');
      expect(appFile).toBeInTheDocument();

      // Start dragging
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(appFile, dragStartEvent);

      // Check for dragging visual feedback
      await waitFor(() => {
        expect(appFile).toHaveAttribute('data-dragging', 'true');
      });
    });

    it('sets correct data transfer data on drag start', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      const appFile = screen.getByTestId('file-App.tsx');
      const dragStartEvent = createDragEvent('dragstart');
      
      fireEvent(appFile, dragStartEvent);

      // Verify setData was called with file info
      expect((dragStartEvent as any).dataTransfer.setData).toHaveBeenCalledWith(
        'application/x-file-tree-item',
        expect.stringContaining('file-1')
      );
    });
  });

  describe('Drag Over Folder', () => {
    it('shows drop indicator when dragging over a folder (data-drop-target attribute)', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging App.tsx
      const appFile = screen.getByTestId('file-App.tsx');
      const dragStartEvent = createDragEvent('dragstart', {
        'application/x-file-tree-item': JSON.stringify({
          type: 'file',
          id: 'file-1',
          name: 'App.tsx',
          path: '/src/App.tsx',
          parentPath: '/src',
        }),
      });
      fireEvent(appFile, dragStartEvent);

      // Drag over components folder
      const componentsFolder = screen.getByTestId('folder-components');
      const dragOverEvent = createDragEvent('dragover');
      fireEvent(componentsFolder, dragOverEvent);

      // Check for drop target indicator
      await waitFor(() => {
        expect(componentsFolder).toHaveAttribute('data-drop-target', 'true');
      });
    });

    it('shows invalid drop indicator when dragging to same location', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Click to expand components folder to see Button.tsx
      const componentsFolder = screen.getByTestId('folder-components');
      await user.click(componentsFolder);

      // Wait for Button.tsx to be visible
      await waitFor(() => {
        expect(screen.getByTestId('file-Button.tsx')).toBeInTheDocument();
      });

      // Start dragging Button.tsx (already in components)
      const buttonFile = screen.getByTestId('file-Button.tsx');
      const dragStartEvent = createDragEvent('dragstart', {
        'application/x-file-tree-item': JSON.stringify({
          type: 'file',
          id: 'file-3',
          name: 'Button.tsx',
          path: '/src/components/Button.tsx',
          parentPath: '/src/components',
        }),
      });
      fireEvent(buttonFile, dragStartEvent);

      // Drag over components folder (same location)
      const dragOverEvent = createDragEvent('dragover');
      fireEvent(componentsFolder, dragOverEvent);

      // Check for invalid drop indicator
      await waitFor(() => {
        expect(componentsFolder).toHaveAttribute('data-drop-invalid', 'true');
      });
    });
  });

  describe('Drop on Folder', () => {
    it('updates file path when dropped on valid folder', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      // Mock the moveFile store action to verify it's called correctly
      const moveFileMock = vi.fn().mockResolvedValue({ success: true });
      const originalMoveFile = useStore.getState().moveFile;
      useStore.setState({ moveFile: moveFileMock } as any);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging App.tsx
      const appFile = screen.getByTestId('file-App.tsx');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'file',
          id: 'file-1',
          name: 'App.tsx',
          path: '/src/App.tsx',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(appFile, dragStartEvent);

      // Drop on utils folder
      const utilsFolder = screen.getByTestId('folder-utils');
      const dropEvent = createDragEvent('drop', dragData);
      fireEvent(utilsFolder, dropEvent);

      // Verify moveFile was called with correct arguments
      await waitFor(() => {
        expect(moveFileMock).toHaveBeenCalledWith('file-1', '/src/utils');
      });

      // Restore original
      useStore.setState({ moveFile: originalMoveFile } as any);
    });

    it('shows error when dropping on folder with duplicate name', async () => {
      // Add a file with the same name to the target folder
      const files = [
        ...createTestFiles(),
        {
          id: 'file-duplicate',
          name: 'App.tsx',
          path: '/src/utils/App.tsx',
          parentPath: '/src/utils',
          content: 'duplicate',
          lastModified: Date.now(),
          isActive: false,
        },
      ];
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      useStore.getState().setFiles(files);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging App.tsx from /src
      const appFile = screen.getByTestId('file-App.tsx');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'file',
          id: 'file-1',
          name: 'App.tsx',
          path: '/src/App.tsx',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(appFile, dragStartEvent);

      // Drag over utils folder (which has duplicate)
      const utilsFolder = screen.getByTestId('folder-utils');
      const dragOverEvent = createDragEvent('dragover', dragData);
      fireEvent(utilsFolder, dragOverEvent);

      // Should show invalid drop indicator
      await waitFor(() => {
        expect(utilsFolder).toHaveAttribute('data-drop-invalid', 'true');
      });
    });
  });

  describe('Drag Cancel', () => {
    it('cancels drag operation when Escape is pressed', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging
      const appFile = screen.getByTestId('file-App.tsx');
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(appFile, dragStartEvent);

      // Verify dragging started
      await waitFor(() => {
        expect(appFile).toHaveAttribute('data-dragging', 'true');
      });

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Verify drag was cancelled
      await waitFor(() => {
        expect(appFile).not.toHaveAttribute('data-dragging', 'true');
      });
    });

    it('clears drop indicators when drag ends', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Start dragging
      const appFile = screen.getByTestId('file-App.tsx');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'file',
          id: 'file-1',
          name: 'App.tsx',
          path: '/src/App.tsx',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(appFile, dragStartEvent);

      // Drag over folder
      const componentsFolder = screen.getByTestId('folder-components');
      const dragOverEvent = createDragEvent('dragover', dragData);
      fireEvent(componentsFolder, dragOverEvent);

      // Verify drop target is shown
      await waitFor(() => {
        expect(componentsFolder).toHaveAttribute('data-drop-target', 'true');
      });

      // End drag
      const dragEndEvent = createDragEvent('dragend');
      fireEvent(appFile, dragEndEvent);

      // Verify indicators are cleared
      await waitFor(() => {
        expect(componentsFolder).not.toHaveAttribute('data-drop-target', 'true');
        expect(appFile).not.toHaveAttribute('data-dragging', 'true');
      });
    });
  });

  describe('Auto-expand on Hover', () => {
    it('auto-expands collapsed folder after 500ms hover', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      render(<FileTreeView nodes={nodes} />);

      // Verify folder is collapsed (no children visible)
      expect(screen.queryByTestId('file-Button.tsx')).not.toBeInTheDocument();

      // Start dragging
      const appFile = screen.getByTestId('file-App.tsx');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'file',
          id: 'file-1',
          name: 'App.tsx',
          path: '/src/App.tsx',
          parentPath: '/src',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(appFile, dragStartEvent);

      // Drag enter components folder
      const componentsFolder = screen.getByTestId('folder-components');
      const dragEnterEvent = createDragEvent('dragenter', dragData);
      fireEvent(componentsFolder, dragEnterEvent);

      // Wait for auto-expand (500ms timer + some buffer)
      // Using real timers since fake timers cause issues with React state updates
      await waitFor(() => {
        expect(screen.getByTestId('file-Button.tsx')).toBeInTheDocument();
      }, { timeout: 1500 });
    });
  });

  describe('Drop at Root Level', () => {
    it('moves file to root level when dropped on root folder', async () => {
      const files = createTestFiles();
      const folders = createTestFolders();
      const treeManager = new FileTreeManager();
      const nodes = treeManager.buildTree(files, folders);

      // Mock the moveFile store action to verify it's called correctly
      const moveFileMock = vi.fn().mockResolvedValue({ success: true });
      const originalMoveFile = useStore.getState().moveFile;
      useStore.setState({ moveFile: moveFileMock } as any);

      render(<FileTreeView nodes={nodes} />);

      // Click to expand components folder to see Button.tsx
      const componentsFolder = screen.getByTestId('folder-components');
      await user.click(componentsFolder);

      // Wait for Button.tsx to be visible
      await waitFor(() => {
        expect(screen.getByTestId('file-Button.tsx')).toBeInTheDocument();
      });

      // Start dragging Button.tsx from components folder
      const buttonFile = screen.getByTestId('file-Button.tsx');
      const dragData = {
        'application/x-file-tree-item': JSON.stringify({
          type: 'file',
          id: 'file-3',
          name: 'Button.tsx',
          path: '/src/components/Button.tsx',
          parentPath: '/src/components',
        }),
      };
      const dragStartEvent = createDragEvent('dragstart', dragData);
      fireEvent(buttonFile, dragStartEvent);

      // Drop on src folder (root)
      const srcFolder = screen.getByTestId('folder-src');
      const dropEvent = createDragEvent('drop', dragData);
      fireEvent(srcFolder, dropEvent);

      // Verify moveFile was called with correct arguments
      await waitFor(() => {
        expect(moveFileMock).toHaveBeenCalledWith('file-3', '/src');
      });

      // Restore original
      useStore.setState({ moveFile: originalMoveFile } as any);
    });
  });
});
