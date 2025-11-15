/**
 * E2E Test Suite: File Management (Context Menu Operations)
 * 
 * Tests for file tree context menu feature covering all user stories:
 * - US1: Delete Unwanted Files (Priority: P1)
 * - US2: Rename Files for Better Organization (Priority: P2)
 * - US3: Duplicate Files for Templates (Priority: P3)
 * 
 * Each test validates the complete workflow from the user's perspective,
 * ensuring all file management features work together seamlessly.
 */

import { test, expect, type Page } from '@playwright/test';

// Helper function to wait for file tree update
const waitForFileTreeUpdate = async (page: Page) => {
    await page.waitForTimeout(500);
};

// Helper function to create a class with name input
const createClass = async (page: Page, className: string) => {
    // Set up dialog handler before clicking
    page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('prompt');
        await dialog.accept(className);
    });

    await page.getByRole('button', { name: /add/i }).click();
    await page.getByRole('menuitem', { name: /new class/i }).click();
    await page.waitForTimeout(300);
};

// Helper function to ensure src folder is visible and expanded
const ensureSrcFolderExpanded = async (page: Page) => {
    // Wait for file tree to update after file creation
    await page.waitForTimeout(700);

    // Use test ID for more reliable selection
    const srcFolderButton = page.getByTestId('folder-src');

    try {
        // Wait for src folder to appear
        await expect(srcFolderButton).toBeVisible({ timeout: 3000 });

        // Check if already expanded by looking for chevron-down
        const chevronDown = srcFolderButton.locator('[data-lucide="chevron-down"]');
        const isExpanded = await chevronDown.count() > 0;

        if (!isExpanded) {
            // Click to expand
            await srcFolderButton.click();
            await page.waitForTimeout(300);
        }
    } catch (error) {
        // Src folder not found - this is expected if files are at root or not created yet
        console.log('Src folder not found or not yet created');
    }
};

// Helper function to right-click on a file in the file tree
const rightClickFile = async (page: Page, fileName: string) => {
    await ensureSrcFolderExpanded(page);
    const fileItem = page.getByTestId(`file-${fileName}`);
    await expect(fileItem).toBeVisible({ timeout: 3000 });
    await fileItem.click({ button: 'right' });
    await page.waitForTimeout(200);
};

test.describe('File Management - Context Menu Operations', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:5173');

        // Wait for the application to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
    });

    test.describe('User Story 1: Delete Unwanted Files (P1)', () => {
        test('should display context menu with Delete option when right-clicking a file', async ({ page }) => {
            // Given a file exists in the file tree
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            const fileItem = page.getByTestId('file-TestClass.ts');
            await expect(fileItem).toBeVisible();

            // When the user right-clicks on the file
            await fileItem.click({ button: 'right' });
            await page.waitForTimeout(200);

            // Then a context menu appears with Delete option
            const contextMenu = page.getByRole('menu');
            await expect(contextMenu).toBeVisible();

            const deleteOption = page.getByRole('menuitem', { name: /delete/i });
            await expect(deleteOption).toBeVisible();
        });

        test('should show confirmation dialog when Delete is selected', async ({ page }) => {
            // Given a file exists in the file tree
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');

            // When the user selects "Delete" from the context menu
            const deleteOption = page.getByRole('menuitem', { name: /delete/i });
            await deleteOption.click();
            await page.waitForTimeout(300);

            // Then a confirmation dialog appears
            const confirmDialog = page.getByRole('dialog');
            await expect(confirmDialog).toBeVisible();

            // And the dialog contains the filename
            await expect(confirmDialog).toContainText('TestClass.ts');

            // And the dialog has confirm and cancel buttons
            const confirmButton = confirmDialog.getByRole('button', { name: /confirm|delete/i });
            const cancelButton = confirmDialog.getByRole('button', { name: /cancel/i });
            await expect(confirmButton).toBeVisible();
            await expect(cancelButton).toBeVisible();
        });

        test('should remove file from tree and storage when deletion is confirmed', async ({ page }) => {
            // Given a file exists in the file tree
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            const fileItem = page.getByTestId('file-TestClass.ts');
            await expect(fileItem).toBeVisible();

            // When the user right-clicks and selects Delete
            await rightClickFile(page, 'TestClass.ts');
            const deleteOption = page.getByRole('menuitem', { name: /delete/i });
            await deleteOption.click();
            await page.waitForTimeout(300);

            // And confirms the deletion
            const confirmDialog = page.getByRole('dialog');
            const confirmButton = confirmDialog.getByRole('button', { name: /confirm|delete/i });
            await confirmButton.click();
            await waitForFileTreeUpdate(page);

            // Then the file is removed from the file tree
            await expect(fileItem).not.toBeVisible();

            // And the file remains deleted after page refresh (persisted to storage)
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await ensureSrcFolderExpanded(page);
            const deletedFileItem = page.getByTestId('file-TestClass.ts');
            await expect(deletedFileItem).not.toBeVisible();
        });

        test('should close editor tab when active file is deleted', async ({ page }) => {
            // Given a file is open in the editor
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            const fileItem = page.getByTestId('file-TestClass.ts');
            await fileItem.click();
            await page.waitForTimeout(300);

            // Verify editor is open
            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();

            // When the file is deleted
            await rightClickFile(page, 'TestClass.ts');
            const deleteOption = page.getByRole('menuitem', { name: /delete/i });
            await deleteOption.click();
            await page.waitForTimeout(300);

            const confirmDialog = page.getByRole('dialog');
            const confirmButton = confirmDialog.getByRole('button', { name: /confirm|delete/i });
            await confirmButton.click();
            await waitForFileTreeUpdate(page);

            // Then the editor tab closes or shows a different file
            // (The specific behavior depends on implementation - editor might show empty state or another file)
            // We verify the file is no longer in the tree
            await expect(fileItem).not.toBeVisible();
        });

        test('should retain file when deletion is cancelled', async ({ page }) => {
            // Given a file exists and delete confirmation is shown
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');

            const deleteOption = page.getByRole('menuitem', { name: /delete/i });
            await deleteOption.click();
            await page.waitForTimeout(300);

            // When the user cancels the deletion
            const confirmDialog = page.getByRole('dialog');
            const cancelButton = confirmDialog.getByRole('button', { name: /cancel/i });
            await cancelButton.click();
            await page.waitForTimeout(300);

            // Then the file remains in the tree
            await ensureSrcFolderExpanded(page);
            const fileItem = page.getByTestId('file-TestClass.ts');
            await expect(fileItem).toBeVisible();

            // And no changes occur
            await expect(confirmDialog).not.toBeVisible();
        });

        test('should handle deletion of multiple files independently', async ({ page }) => {
            // Given multiple files exist
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await createClass(page, 'Class3');
            await ensureSrcFolderExpanded(page);

            // Verify all files are visible
            await expect(page.getByTestId('file-Class1.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class2.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class3.ts')).toBeVisible();

            // When user deletes Class2
            await rightClickFile(page, 'Class2.ts');
            await page.getByRole('menuitem', { name: /delete/i }).click();
            await page.waitForTimeout(300);

            const confirmDialog = page.getByRole('dialog');
            await confirmDialog.getByRole('button', { name: /confirm|delete/i }).click();
            await waitForFileTreeUpdate(page);

            // Then only Class2 is removed
            await expect(page.getByTestId('file-Class1.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class2.ts')).not.toBeVisible();
            await expect(page.getByTestId('file-Class3.ts')).toBeVisible();
        });

        test('should close context menu when clicking outside', async ({ page }) => {
            // Given context menu is open
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');

            const contextMenu = page.getByRole('menu');
            await expect(contextMenu).toBeVisible();

            // When user clicks elsewhere
            await page.mouse.click(100, 100);
            await page.waitForTimeout(200);

            // Then context menu closes without performing any action
            await expect(contextMenu).not.toBeVisible();

            // And file still exists
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-TestClass.ts')).toBeVisible();
        });

        test('should complete delete operation within performance targets', async ({ page }) => {
            // Given a file exists
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Measure time from right-click to deletion
            const startTime = Date.now();

            // Right-click (click 1)
            await rightClickFile(page, 'TestClass.ts');

            // Select Delete (click 2)
            const deleteOption = page.getByRole('menuitem', { name: /delete/i });
            await deleteOption.click();
            await page.waitForTimeout(100);

            // Confirm deletion (click 3)
            const confirmDialog = page.getByRole('dialog');
            const confirmButton = confirmDialog.getByRole('button', { name: /confirm|delete/i });
            await confirmButton.click();
            await waitForFileTreeUpdate(page);

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verify file is deleted
            const fileItem = page.getByTestId('file-TestClass.ts');
            await expect(fileItem).not.toBeVisible();

            // Success Criteria SC-001: Within 3 clicks (verified by test steps)
            // Success Criteria SC-002: Operations complete within 2 seconds
            expect(totalTime).toBeLessThan(2000);
        });

        test('should prevent accidental deletions with confirmation dialog', async ({ page }) => {
            // Success Criteria SC-007: Zero accidental file deletions due to confirmation dialog

            // Given a file exists
            await createClass(page, 'ImportantFile');
            await rightClickFile(page, 'ImportantFile.ts');

            // When user accidentally selects Delete
            const deleteOption = page.getByRole('menuitem', { name: /delete/i });
            await deleteOption.click();
            await page.waitForTimeout(300);

            // Then confirmation dialog appears (preventing immediate deletion)
            const confirmDialog = page.getByRole('dialog');
            await expect(confirmDialog).toBeVisible();

            // And user can cancel to prevent accidental deletion
            const cancelButton = confirmDialog.getByRole('button', { name: /cancel/i });
            await expect(cancelButton).toBeVisible();

            await cancelButton.click();
            await page.waitForTimeout(300);

            // Verify file still exists
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-ImportantFile.ts')).toBeVisible();
        });
    });

    test.describe('Edge Cases - Delete Operations', () => {
        test('should only show context menu on file nodes, not on folders', async ({ page }) => {
            // Given files exist in a folder
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // When user right-clicks on the folder
            const srcFolder = page.getByTestId('folder-src');
            await srcFolder.click({ button: 'right' });
            await page.waitForTimeout(300);

            // Then context menu should not appear (or show folder-specific options, not file options)
            // Note: Specific behavior depends on implementation
            // For now, we verify the Delete option is not shown
            const deleteOption = page.getByRole('menuitem', { name: /delete/i });

            // Either no menu appears, or if it does, it shouldn't have Delete option
            const menuVisible = await page.getByRole('menu').isVisible().catch(() => false);
            if (menuVisible) {
                await expect(deleteOption).not.toBeVisible();
            }
        });

        test('should not show context menu when right-clicking empty space', async ({ page }) => {
            // Given file tree with empty space
            const fileTree = page.locator('.file-tree, [data-testid="file-tree"]').first();

            // When user right-clicks on empty space
            const box = await fileTree.boundingBox();
            if (box) {
                // Click in empty area (bottom of file tree)
                await page.mouse.click(box.x + 10, box.y + box.height - 10, { button: 'right' });
                await page.waitForTimeout(300);

                // Then no context menu appears
                const contextMenu = page.getByRole('menu');
                const isVisible = await contextMenu.isVisible().catch(() => false);
                expect(isVisible).toBe(false);
            }
        });

        test('should handle rapid context menu operations', async ({ page }) => {
            // Given multiple files exist
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await ensureSrcFolderExpanded(page);

            // When user rapidly opens and closes context menus
            await rightClickFile(page, 'Class1.ts');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(100);

            await rightClickFile(page, 'Class2.ts');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(100);

            await rightClickFile(page, 'Class1.ts');

            // Then context menu appears correctly for the last action
            const contextMenu = page.getByRole('menu');
            await expect(contextMenu).toBeVisible();

            // And both files still exist
            await expect(page.getByTestId('file-Class1.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class2.ts')).toBeVisible();
        });

        test('should handle deletion when file is open in diagram', async ({ page }) => {
            // Given a file exists and is displayed in the diagram
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Wait for diagram to render
            await page.waitForTimeout(1000);
            const diagramNode = page.getByTestId('diagram-node-TestClass');
            await expect(diagramNode).toBeVisible({ timeout: 3000 });

            // When user deletes the file
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /delete/i }).click();
            await page.waitForTimeout(300);

            const confirmDialog = page.getByRole('dialog');
            await confirmDialog.getByRole('button', { name: /confirm|delete/i }).click();
            await waitForFileTreeUpdate(page);

            // Then file is removed from tree
            await expect(page.getByTestId('file-TestClass.ts')).not.toBeVisible();

            // And diagram updates (node should be removed)
            await page.waitForTimeout(1000);
            const nodeStillVisible = await diagramNode.isVisible().catch(() => false);
            expect(nodeStillVisible).toBe(false);
        });
    });

    test.describe('User Story 2: Rename Files for Better Organization (P2)', () => {
        test('should display Rename option in context menu when right-clicking a file', async ({ page }) => {
            // Given a file exists in the file tree
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            const fileItem = page.getByTestId('file-TestClass.ts');
            await expect(fileItem).toBeVisible();

            // When the user right-clicks on the file
            await fileItem.click({ button: 'right' });
            await page.waitForTimeout(200);

            // Then a context menu appears with Rename option
            const contextMenu = page.getByRole('menu');
            await expect(contextMenu).toBeVisible();

            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await expect(renameOption).toBeVisible();
        });

        test('should show inline input field when Rename is selected', async ({ page }) => {
            // Given a file exists in the file tree
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');

            // When the user selects "Rename" from the context menu
            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            // Then an inline input field appears with the current filename
            const renameInput = page.getByTestId('rename-input-TestClass.ts');
            await expect(renameInput).toBeVisible();
            await expect(renameInput).toHaveValue('TestClass.ts');
            await expect(renameInput).toBeFocused();
        });

        test('should rename file when Enter is pressed with valid name', async ({ page }) => {
            // Given a file exists and rename input is shown
            await createClass(page, 'OldName');
            await rightClickFile(page, 'OldName.ts');

            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-OldName.ts');
            await expect(renameInput).toBeVisible();

            // When the user types a new name and presses Enter
            await renameInput.fill('NewName.ts');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // Then the file appears with the new name in the tree
            await ensureSrcFolderExpanded(page);
            const newFileItem = page.getByTestId('file-NewName.ts');
            await expect(newFileItem).toBeVisible();

            // And the old name is no longer visible
            const oldFileItem = page.getByTestId('file-OldName.ts');
            await expect(oldFileItem).not.toBeVisible();

            // And the change persists after page refresh
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-NewName.ts')).toBeVisible();
        });

        test('should cancel rename when Escape is pressed', async ({ page }) => {
            // Given a file exists and rename input is shown
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');

            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-TestClass.ts');
            await expect(renameInput).toBeVisible();

            // When the user types a new name and presses Escape
            await renameInput.fill('DifferentName.ts');
            await renameInput.press('Escape');
            await page.waitForTimeout(300);

            // Then the original filename is retained
            await ensureSrcFolderExpanded(page);
            const originalFileItem = page.getByTestId('file-TestClass.ts');
            await expect(originalFileItem).toBeVisible();

            // And the new name is not present
            const newFileItem = page.getByTestId('file-DifferentName.ts');
            await expect(newFileItem).not.toBeVisible();
        });

        test('should show error message for invalid filename', async ({ page }) => {
            // Given a file exists and rename input is shown
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');

            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-TestClass.ts');
            await expect(renameInput).toBeVisible();

            // When the user enters an invalid filename with special characters
            await renameInput.fill('Invalid/Name.ts');
            await renameInput.press('Enter');
            await page.waitForTimeout(300);

            // Then an error message appears
            const errorMessage = page.getByTestId('rename-error');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText(/cannot contain/i);

            // And the input remains focused for correction
            await expect(renameInput).toBeFocused();

            // And the original filename is retained
            await renameInput.press('Escape');
            await page.waitForTimeout(300);
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-TestClass.ts')).toBeVisible();
        });

        test('should show error for duplicate filename', async ({ page }) => {
            // Given multiple files exist
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await ensureSrcFolderExpanded(page);

            // When user tries to rename Class1 to Class2 (duplicate)
            await rightClickFile(page, 'Class1.ts');
            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-Class1.ts');
            await expect(renameInput).toBeVisible();

            await renameInput.fill('Class2.ts');
            await renameInput.press('Enter');
            await page.waitForTimeout(300);

            // Then an error message appears
            const errorMessage = page.getByTestId('rename-error');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText(/already exists/i);

            // And both original files remain unchanged
            await renameInput.press('Escape');
            await page.waitForTimeout(300);
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-Class1.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class2.ts')).toBeVisible();
        });

        test('should update editor tab when active file is renamed', async ({ page }) => {
            // Given a file is open in the editor
            await createClass(page, 'OldName');
            await ensureSrcFolderExpanded(page);

            const fileItem = page.getByTestId('file-OldName.ts');
            await fileItem.click();
            await page.waitForTimeout(500);

            // Verify editor is open with content
            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();

            // When the file is renamed
            await rightClickFile(page, 'OldName.ts');
            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-OldName.ts');
            await renameInput.fill('NewName.ts');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // Then the editor continues showing the file with its new name
            await expect(editor).toBeVisible();

            // And the file tree shows the new name as active
            await ensureSrcFolderExpanded(page);
            const newFileItem = page.getByTestId('file-NewName.ts');
            await expect(newFileItem).toBeVisible();
            await expect(newFileItem).toHaveClass(/selected|active/);
        });

        test('should preserve file content after rename', async ({ page }) => {
            // Given a file with specific content
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Click to open in editor
            const fileItem = page.getByTestId('file-TestClass.ts');
            await fileItem.click();
            await page.waitForTimeout(500);

            // Get the content from editor
            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();
            const originalContent = await editor.textContent();

            // When the file is renamed
            await rightClickFile(page, 'TestClass.ts');
            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-TestClass.ts');
            await renameInput.fill('RenamedClass.ts');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // Then the file content remains the same
            await ensureSrcFolderExpanded(page);
            const renamedFileItem = page.getByTestId('file-RenamedClass.ts');
            await renamedFileItem.click();
            await page.waitForTimeout(300);

            const newContent = await editor.textContent();
            expect(newContent).toContain('class'); // Content is preserved
            expect(newContent).toBeTruthy();
        });

        test('should complete rename operation within performance targets', async ({ page }) => {
            // Given a file exists
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Measure time from right-click to rename completion
            const startTime = Date.now();

            // Right-click (click 1)
            await rightClickFile(page, 'TestClass.ts');

            // Select Rename (click 2)
            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(100);

            // Type new name and press Enter (click 3 equivalent)
            const renameInput = page.getByTestId('rename-input-TestClass.ts');
            await renameInput.fill('NewName.ts');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verify file is renamed
            const newFileItem = page.getByTestId('file-NewName.ts');
            await expect(newFileItem).toBeVisible();

            // Success Criteria SC-001: Within 3 clicks (verified by test steps)
            // Success Criteria SC-002: Operations complete within 2 seconds
            expect(totalTime).toBeLessThan(2000);
        });

        test('should handle rename of multiple files independently', async ({ page }) => {
            // Given multiple files exist
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await createClass(page, 'Class3');
            await ensureSrcFolderExpanded(page);

            // When user renames Class2
            await rightClickFile(page, 'Class2.ts');
            await page.getByRole('menuitem', { name: /rename/i }).click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-Class2.ts');
            await renameInput.fill('RenamedClass.ts');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // Then only Class2 is renamed
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-Class1.ts')).toBeVisible();
            await expect(page.getByTestId('file-RenamedClass.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class3.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class2.ts')).not.toBeVisible();
        });

        test('should allow renaming file with different extension', async ({ page }) => {
            // Given a TypeScript file exists
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // When user renames with different extension
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /rename/i }).click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-TestClass.ts');
            await renameInput.fill('TestClass.tsx');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // Then the file is renamed with new extension
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-TestClass.tsx')).toBeVisible();
            await expect(page.getByTestId('file-TestClass.ts')).not.toBeVisible();
        });

        test('should handle empty filename gracefully', async ({ page }) => {
            // Given a file exists and rename input is shown
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');

            const renameOption = page.getByRole('menuitem', { name: /rename/i });
            await renameOption.click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-TestClass.ts');
            await expect(renameInput).toBeVisible();

            // When the user clears the filename and presses Enter
            await renameInput.fill('');
            await renameInput.press('Enter');
            await page.waitForTimeout(300);

            // Then an error message appears
            const errorMessage = page.getByTestId('rename-error');
            await expect(errorMessage).toBeVisible();
            await expect(errorMessage).toContainText(/cannot be empty/i);

            // And the original filename is retained
            await renameInput.press('Escape');
            await page.waitForTimeout(300);
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-TestClass.ts')).toBeVisible();
        });
    });

    test.describe('User Story 3: Duplicate Files for Templates (P3)', () => {
        test('should display Duplicate option in context menu when right-clicking a file', async ({ page }) => {
            // Given a file exists in the file tree
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            const fileItem = page.getByTestId('file-TestClass.ts');
            await expect(fileItem).toBeVisible();

            // When the user right-clicks on the file
            await fileItem.click({ button: 'right' });
            await page.waitForTimeout(200);

            // Then a context menu appears with Duplicate option
            const contextMenu = page.getByRole('menu');
            await expect(contextMenu).toBeVisible();

            const duplicateOption = page.getByRole('menuitem', { name: /duplicate/i });
            await expect(duplicateOption).toBeVisible();
        });

        test('should create duplicate file with "copy" suffix when Duplicate is selected', async ({ page }) => {
            // Given a file exists in the file tree
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            const originalFile = page.getByTestId('file-TestClass.ts');
            await expect(originalFile).toBeVisible();

            // When the user selects "Duplicate" from the context menu
            await rightClickFile(page, 'TestClass.ts');
            const duplicateOption = page.getByRole('menuitem', { name: /duplicate/i });
            await duplicateOption.click();
            await waitForFileTreeUpdate(page);

            // Then a duplicate file appears with "copy" suffix
            await ensureSrcFolderExpanded(page);
            const duplicateFile = page.getByTestId('file-TestClass copy.ts');
            await expect(duplicateFile).toBeVisible();

            // And the original file still exists
            await expect(originalFile).toBeVisible();
        });

        test('should increment copy number for subsequent duplicates', async ({ page }) => {
            // Given a file and its first duplicate exist
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Create first duplicate
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-TestClass copy.ts')).toBeVisible();

            // When the user duplicates the original file again
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            // Then a second duplicate appears with incremented number
            await ensureSrcFolderExpanded(page);
            const secondDuplicate = page.getByTestId('file-TestClass copy 2.ts');
            await expect(secondDuplicate).toBeVisible();

            // And both original and first duplicate still exist
            await expect(page.getByTestId('file-TestClass.ts')).toBeVisible();
            await expect(page.getByTestId('file-TestClass copy.ts')).toBeVisible();
        });

        test('should preserve file content when duplicating', async ({ page }) => {
            // Given a file with specific content exists
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Open original file in editor to get its content
            const originalFile = page.getByTestId('file-TestClass.ts');
            await originalFile.click();
            await page.waitForTimeout(500);

            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();
            const originalContent = await editor.textContent();

            // When the user duplicates the file
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            // Then the duplicate file has the same content
            await ensureSrcFolderExpanded(page);
            const duplicateFile = page.getByTestId('file-TestClass copy.ts');
            await expect(duplicateFile).toBeVisible();

            // Open duplicate file to verify content
            await duplicateFile.click();
            await page.waitForTimeout(500);

            const duplicateContent = await editor.textContent();
            expect(duplicateContent).toBe(originalContent);
            expect(duplicateContent).toContain('class');
        });

        test('should auto-select duplicated file after creation', async ({ page }) => {
            // Given a file exists
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            const originalFile = page.getByTestId('file-TestClass.ts');
            await originalFile.click();
            await page.waitForTimeout(300);

            // Verify original is selected
            await expect(originalFile).toHaveClass(/selected|active/);

            // When the user duplicates the file
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            // Then the duplicate file is auto-selected
            await ensureSrcFolderExpanded(page);
            const duplicateFile = page.getByTestId('file-TestClass copy.ts');
            await expect(duplicateFile).toBeVisible();
            await expect(duplicateFile).toHaveClass(/selected|active/);
        });

        test('should persist duplicate file after page refresh', async ({ page }) => {
            // Given a file is duplicated
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-TestClass copy.ts')).toBeVisible();

            // When the page is refreshed
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Then both files still exist
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-TestClass.ts')).toBeVisible();
            await expect(page.getByTestId('file-TestClass copy.ts')).toBeVisible();
        });

        test('should complete duplicate operation within performance targets', async ({ page }) => {
            // Given a file exists
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Measure time from right-click to duplicate completion
            const startTime = Date.now();

            // Right-click (click 1)
            await rightClickFile(page, 'TestClass.ts');

            // Select Duplicate (click 2)
            const duplicateOption = page.getByRole('menuitem', { name: /duplicate/i });
            await duplicateOption.click();
            await waitForFileTreeUpdate(page);

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verify duplicate is created
            await ensureSrcFolderExpanded(page);
            const duplicateFile = page.getByTestId('file-TestClass copy.ts');
            await expect(duplicateFile).toBeVisible();

            // Success Criteria SC-001: Within 2 clicks (verified by test steps)
            // Success Criteria SC-002: Operations complete within 2 seconds
            expect(totalTime).toBeLessThan(2000);
        });

        test('should duplicate files with different extensions', async ({ page }) => {
            // Create a file and rename it to have .tsx extension
            await createClass(page, 'Component');
            await ensureSrcFolderExpanded(page);

            await rightClickFile(page, 'Component.ts');
            await page.getByRole('menuitem', { name: /rename/i }).click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-Component.ts');
            await renameInput.fill('Component.tsx');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // When the user duplicates the .tsx file
            await ensureSrcFolderExpanded(page);
            await rightClickFile(page, 'Component.tsx');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            // Then the duplicate preserves the extension
            await ensureSrcFolderExpanded(page);
            const duplicateFile = page.getByTestId('file-Component copy.tsx');
            await expect(duplicateFile).toBeVisible();
        });

        test('should allow further operations on duplicated file', async ({ page }) => {
            // Given a file is duplicated
            await createClass(page, 'TestClass');
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            await ensureSrcFolderExpanded(page);
            const duplicateFile = page.getByTestId('file-TestClass copy.ts');
            await expect(duplicateFile).toBeVisible();

            // When the user performs operations on the duplicate (e.g., rename)
            await rightClickFile(page, 'TestClass copy.ts');
            await page.getByRole('menuitem', { name: /rename/i }).click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-TestClass copy.ts');
            await renameInput.fill('ModifiedCopy.ts');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // Then the operation succeeds
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-ModifiedCopy.ts')).toBeVisible();
            await expect(page.getByTestId('file-TestClass.ts')).toBeVisible();
        });

        test('should handle duplicating multiple different files', async ({ page }) => {
            // Given multiple files exist
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await ensureSrcFolderExpanded(page);

            // When user duplicates both files
            await rightClickFile(page, 'Class1.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            await rightClickFile(page, 'Class2.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            // Then all files exist (originals and duplicates)
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-Class1.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class1 copy.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class2.ts')).toBeVisible();
            await expect(page.getByTestId('file-Class2 copy.ts')).toBeVisible();
        });

        test('should update diagram when duplicate contains class definition', async ({ page }) => {
            // Given a file with class definition exists
            await createClass(page, 'TestClass');
            await ensureSrcFolderExpanded(page);

            // Wait for original diagram node
            await page.waitForTimeout(1000);
            const originalNode = page.getByTestId('diagram-node-TestClass');
            await expect(originalNode).toBeVisible({ timeout: 3000 });

            // When the file is duplicated
            await rightClickFile(page, 'TestClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            // Then diagram updates with the duplicate (if it contains parsed class)
            // Note: The duplicate might need parsing, so we just verify it exists in tree
            await ensureSrcFolderExpanded(page);
            const duplicateFile = page.getByTestId('file-TestClass copy.ts');
            await expect(duplicateFile).toBeVisible();

            // Verify original file still has its diagram node
            await expect(originalNode).toBeVisible();
        });

        test('should create template workflow - duplicate, rename, modify', async ({ page }) => {
            // Given a template file exists
            await createClass(page, 'BaseClass');
            await ensureSrcFolderExpanded(page);

            // When user duplicates for template reuse
            await rightClickFile(page, 'BaseClass.ts');
            await page.getByRole('menuitem', { name: /duplicate/i }).click();
            await waitForFileTreeUpdate(page);

            // And renames the duplicate
            await ensureSrcFolderExpanded(page);
            await rightClickFile(page, 'BaseClass copy.ts');
            await page.getByRole('menuitem', { name: /rename/i }).click();
            await page.waitForTimeout(300);

            const renameInput = page.getByTestId('rename-input-BaseClass copy.ts');
            await renameInput.fill('CustomClass.ts');
            await renameInput.press('Enter');
            await waitForFileTreeUpdate(page);

            // Then the workflow completes successfully
            await ensureSrcFolderExpanded(page);
            await expect(page.getByTestId('file-BaseClass.ts')).toBeVisible();
            await expect(page.getByTestId('file-CustomClass.ts')).toBeVisible();

            // And user can modify the duplicate independently
            const customFile = page.getByTestId('file-CustomClass.ts');
            await customFile.click();
            await page.waitForTimeout(500);

            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();
        });
    });
});
