/**
 * Integration Tests: Unsupported Language Warning
 *
 * Tests for warning icon display on files with unsupported extensions.
 * T050: Integration test for warning icon display
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FileTreeView } from '../../../src/file-tree/FileTreeView';
import type { FileTreeNode } from '../../../src/file-tree/types';

// Mock the store
vi.mock('../../../src/shared/store', () => ({
    useStore: vi.fn(() => ({
        activeFileId: null,
        openFile: vi.fn(),
        renameFile: vi.fn(),
        deleteFile: vi.fn(),
        duplicateFile: vi.fn(),
        renameFolder: vi.fn(),
        deleteFolder: vi.fn(),
        duplicateFolder: vi.fn(),
        moveFile: vi.fn(),
        moveFolder: vi.fn(),
        dragState: null,
        dropTarget: null,
        startDrag: vi.fn(),
        updateDropTarget: vi.fn(),
        endDrag: vi.fn(),
        cancelDrag: vi.fn(),
        expanded: { '/src': true },
        setExpanded: vi.fn(),
    })),
}));

describe('Unsupported Language Warning Icon', () => {
    const createFileNode = (name: string, parentId: string | null = null): FileTreeNode => ({
        id: `file-${name}`,
        name,
        type: 'file' as const,
        path: `/src/${name}`,
        children: [],
        parentId,
    });

    const createFolderNode = (name: string, children: FileTreeNode[]): FileTreeNode => ({
        id: `folder-${name}`,
        name,
        type: 'folder' as const,
        path: `/src/${name}`,
        children,
        parentId: null,
    });

    describe('Supported file extensions', () => {
        it('should NOT show warning icon for .ts files', () => {
            const nodes: FileTreeNode[] = [createFileNode('Person.ts')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            // Find the file item
            const fileItem = screen.getByTestId('file-Person.ts');
            expect(fileItem).toBeInTheDocument();

            // Should NOT have warning icon
            const warningIcon = fileItem.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).not.toBeInTheDocument();
        });

        it('should NOT show warning icon for .tsx files', () => {
            const nodes: FileTreeNode[] = [createFileNode('Component.tsx')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const fileItem = screen.getByTestId('file-Component.tsx');
            const warningIcon = fileItem.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).not.toBeInTheDocument();
        });

        it('should NOT show warning icon for .dart files', () => {
            const nodes: FileTreeNode[] = [createFileNode('Person.dart')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const fileItem = screen.getByTestId('file-Person.dart');
            const warningIcon = fileItem.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).not.toBeInTheDocument();
        });
    });

    describe('Unsupported file extensions', () => {
        it('should show warning icon for .py files', () => {
            const nodes: FileTreeNode[] = [createFileNode('script.py')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const fileItem = screen.getByTestId('file-script.py');
            expect(fileItem).toBeInTheDocument();

            const warningIcon = fileItem.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).toBeInTheDocument();
        });

        it('should show warning icon for .js files', () => {
            const nodes: FileTreeNode[] = [createFileNode('script.js')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const fileItem = screen.getByTestId('file-script.js');
            const warningIcon = fileItem.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).toBeInTheDocument();
        });

        it('should show warning icon for .json files', () => {
            const nodes: FileTreeNode[] = [createFileNode('config.json')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const fileItem = screen.getByTestId('file-config.json');
            const warningIcon = fileItem.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).toBeInTheDocument();
        });

        it('should show warning icon for .md files', () => {
            const nodes: FileTreeNode[] = [createFileNode('README.md')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const fileItem = screen.getByTestId('file-README.md');
            const warningIcon = fileItem.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).toBeInTheDocument();
        });

        it('should have accessible label on warning icon', () => {
            const nodes: FileTreeNode[] = [createFileNode('script.py')];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const warningIcon = screen.getByTestId('unsupported-warning');
            expect(warningIcon).toHaveAttribute('aria-label');
            expect(warningIcon.getAttribute('aria-label')).toMatch(/not supported|unsupported/i);
        });
    });

    describe('Mixed file types in folder', () => {
        it('should show warning only on unsupported files within a folder', () => {
            const nodes: FileTreeNode[] = [
                createFolderNode('src', [
                    createFileNode('Person.ts', 'folder-src'),
                    createFileNode('script.py', 'folder-src'),
                    createFileNode('Person.dart', 'folder-src'),
                    createFileNode('config.json', 'folder-src'),
                ]),
            ];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            // Expand folder by clicking on it
            const folder = screen.getByTestId('folder-src');
            folder.click();

            // Supported files should NOT have warning
            const tsFile = screen.getByTestId('file-Person.ts');
            expect(tsFile.querySelector('[data-testid="unsupported-warning"]')).not.toBeInTheDocument();

            const dartFile = screen.getByTestId('file-Person.dart');
            expect(dartFile.querySelector('[data-testid="unsupported-warning"]')).not.toBeInTheDocument();

            // Unsupported files should have warning
            const pyFile = screen.getByTestId('file-script.py');
            expect(pyFile.querySelector('[data-testid="unsupported-warning"]')).toBeInTheDocument();

            const jsonFile = screen.getByTestId('file-config.json');
            expect(jsonFile.querySelector('[data-testid="unsupported-warning"]')).toBeInTheDocument();
        });
    });

    describe('No warning on folders', () => {
        it('should NOT show warning icon on folders', () => {
            const nodes: FileTreeNode[] = [
                createFolderNode('unsupported-folder', []),
            ];

            render(
                <FileTreeView
                    nodes={nodes}
                    onAddFileToFolder={vi.fn()}
                />
            );

            const folder = screen.getByTestId('folder-unsupported-folder');
            const warningIcon = folder.querySelector('[data-testid="unsupported-warning"]');
            expect(warningIcon).not.toBeInTheDocument();
        });
    });
});
