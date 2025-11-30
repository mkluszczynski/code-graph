/**
 * Integration tests for file creation with extension validation
 * Tests User Story 1: Create File with Custom Extension
 *
 * TDD: These tests are written FIRST and should FAIL until CreateDialog is updated
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateDialog } from '../../../src/components/CreateDialog';

describe('CreateDialog - File Extension Validation', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSubmit.mockResolvedValue(undefined);
    });

    describe('Accepts valid file extensions', () => {
        it('accepts .ts extension and submits', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'Person.ts');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith('Person.ts');
            });
        });

        it('accepts .dart extension and submits', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'Person.dart');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith('Person.dart');
            });
        });

        it('accepts .tsx extension and submits', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'Component.tsx');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith('Component.tsx');
            });
        });

        it('accepts any extension (e.g., .py, .js)', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'script.py');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith('script.py');
            });
        });
    });

    describe('Rejects files without extension', () => {
        it('shows error when file name has no extension', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'Person');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(/extension/i);
            });
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('shows error for extension-only filename', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, '.ts');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('shows error for trailing dot with no extension', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'file.');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toHaveTextContent(/extension/i);
            });
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    describe('Does NOT auto-add .ts extension', () => {
        it('does not auto-add .ts to filename without extension', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'MyClass');
            await user.click(screen.getByRole('button', { name: /create/i }));

            // Should show error, NOT submit with .ts added
            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });
            expect(mockOnSubmit).not.toHaveBeenCalled();
            // Specifically should NOT have been called with auto-added .ts
            expect(mockOnSubmit).not.toHaveBeenCalledWith('MyClass.ts');
        });
    });

    describe('Folder creation unchanged', () => {
        it('folders do not require extension', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="folder"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'components');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith('components');
            });
        });

        it('folders can have dots in name', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="folder"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');
            await user.type(input, 'my.folder.name');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith('my.folder.name');
            });
        });
    });

    describe('Error clearing', () => {
        it('clears error when user starts typing', async () => {
            const user = userEvent.setup();
            render(
                <CreateDialog
                    open={true}
                    type="file"
                    parentPath="/"
                    existingNames={[]}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />
            );

            const input = screen.getByRole('textbox');

            // Trigger error
            await user.type(input, 'NoExtension');
            await user.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(screen.getByRole('alert')).toBeInTheDocument();
            });

            // Start typing - error should clear
            await user.type(input, '.ts');

            await waitFor(() => {
                expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            });
        });
    });
});
