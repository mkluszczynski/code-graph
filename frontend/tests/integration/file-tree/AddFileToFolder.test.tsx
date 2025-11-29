/**
 * Integration Tests: Add File to Folder via Context Menu
 * 
 * Tests for User Story 1 - Create File Inside Folder via Context Menu
 * Based on: specs/007-file-folder-dnd/tasks.md Phase 3
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { useStore } from '../../../src/shared/store';
import { FileTreePanel } from '../../../src/components/FileTreePanel';
import { FileTreeManager } from '../../../src/file-tree/FileTreeManager';
import { FileTreeView } from '../../../src/file-tree/FileTreeView';
import type { ProjectFile, ProjectFolder } from '../../../src/shared/types';

describe('Add File to Folder via Context Menu', () => {
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
  });

  it('shows "Add File" option when right-clicking on a folder', async () => {
    const files = createTestFiles();
    const folders = createTestFolders();
    const treeManager = new FileTreeManager();
    const nodes = treeManager.buildTree(files, folders);

    render(<FileTreeView nodes={nodes} />);

    // Find the components folder
    const componentsFolder = screen.getByTestId('folder-components');
    expect(componentsFolder).toBeInTheDocument();

    // Right-click on the folder
    fireEvent.contextMenu(componentsFolder);

    // Wait for context menu to appear
    await waitFor(() => {
      expect(screen.getByTestId('context-menu-add-file')).toBeInTheDocument();
    });

    // Verify "Add File" option is visible
    const addFileOption = screen.getByTestId('context-menu-add-file');
    expect(addFileOption).toHaveTextContent('Add File');
  });

  it('calls onAddFileToFolder callback with folder path when "Add File" is clicked', async () => {
    const files = createTestFiles();
    const folders = createTestFolders();
    const treeManager = new FileTreeManager();
    const nodes = treeManager.buildTree(files, folders);
    const mockCallback = vi.fn();

    render(<FileTreeView nodes={nodes} onAddFileToFolder={mockCallback} />);

    // Find the components folder
    const componentsFolder = screen.getByTestId('folder-components');

    // Right-click on the folder
    fireEvent.contextMenu(componentsFolder);

    // Wait for and click "Add File" option
    await waitFor(() => {
      expect(screen.getByTestId('context-menu-add-file')).toBeInTheDocument();
    });

    const addFileOption = screen.getByTestId('context-menu-add-file');
    await user.click(addFileOption);

    // Verify callback was called with correct folder path
    expect(mockCallback).toHaveBeenCalledWith('/src/components');
  });

  it('shows "Add File" option for nested folders', async () => {
    const files = createTestFiles();
    const folders: ProjectFolder[] = [
      ...createTestFolders(),
      {
        id: 'folder-3',
        name: 'hooks',
        path: '/src/components/hooks',
        parentPath: '/src/components',
        createdAt: Date.now(),
      },
    ];
    const treeManager = new FileTreeManager();
    const nodes = treeManager.buildTree(files, folders);

    // Set expanded folders to include components
    useStore.getState().setExpanded('/src', true);
    useStore.getState().setExpanded('/src/components', true);

    render(<FileTreeView nodes={nodes} />);

    // Click on components folder to expand it
    const componentsFolder = screen.getByTestId('folder-components');
    await user.click(componentsFolder);

    // Wait for nested folder to appear
    await waitFor(() => {
      expect(screen.getByTestId('folder-hooks')).toBeInTheDocument();
    });

    // Right-click on the nested hooks folder
    const hooksFolder = screen.getByTestId('folder-hooks');
    fireEvent.contextMenu(hooksFolder);

    // Wait for context menu to appear
    await waitFor(() => {
      expect(screen.getByTestId('context-menu-add-file')).toBeInTheDocument();
    });

    // Verify "Add File" option is visible
    const addFileOption = screen.getByTestId('context-menu-add-file');
    expect(addFileOption).toHaveTextContent('Add File');
  });

  it('does not show "Add File" option when right-clicking on a file', async () => {
    const files = createTestFiles();
    const folders = createTestFolders();
    const treeManager = new FileTreeManager();
    const nodes = treeManager.buildTree(files, folders);

    render(<FileTreeView nodes={nodes} />);

    // Find and right-click on a file
    const appFile = screen.getByTestId('file-App.tsx');
    fireEvent.contextMenu(appFile);

    // Wait for context menu to appear
    await waitFor(() => {
      // File context menu should have Rename option but NOT Add File
      expect(screen.getByTestId('context-menu-rename')).toBeInTheDocument();
    });

    // Verify "Add File" option is NOT present
    expect(screen.queryByTestId('context-menu-add-file')).not.toBeInTheDocument();
  });

  describe('FileTreePanel integration', () => {
    it('opens CreateDialog with correct folder path when "Add File" is clicked', async () => {
      // Set up the store with files and folders
      const store = useStore.getState();
      store.setFiles(createTestFiles());
      store.setFolders(createTestFolders());
      store.setExpanded('/src', true);

      render(<FileTreePanel 
        files={createTestFiles()} 
        isInitialized={true} 
        isCreatingFile={false} 
      />);

      // Wait for the file tree to render
      await waitFor(() => {
        expect(screen.getByTestId('folder-components')).toBeInTheDocument();
      });

      // Right-click on components folder
      const componentsFolder = screen.getByTestId('folder-components');
      fireEvent.contextMenu(componentsFolder);

      // Click "Add File" option
      await waitFor(() => {
        expect(screen.getByTestId('context-menu-add-file')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('context-menu-add-file'));

      // Dialog should open with components folder path
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(within(dialog).getByText(/\/src\/components/)).toBeInTheDocument();
      });
    });
  });
});
