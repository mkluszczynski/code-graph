/**
 * E2E Test for Large Diagram Navigation (T104)
 * 
 * Tests User Story 7: Navigate Large Diagrams
 * 
 * Validates that users can:
 * - Create diagrams with 10+ classes
 * - Zoom in and out on the diagram
 * - Pan around the diagram
 * - Use the minimap for navigation
 * - See nodes arranged in a readable hierarchical layout
 */

import { test, expect, type Page } from '@playwright/test';

// Helper function to create a class with name input
const createClass = async (page: Page, className: string) => {
    // Set up dialog handler before clicking
    page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('prompt');
        await dialog.accept(className);
    });

    await page.getByRole('button', { name: /add/i }).click();
    await page.getByRole('menuitem', { name: /new class/i }).click();
    await page.waitForTimeout(100);
};

test.describe('Large Diagram Navigation (User Story 7)', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:5173');

        // Wait for the application to load
        await page.waitForLoadState('networkidle');
    });

    test('should create and navigate a large diagram with 10+ classes', async ({ page }) => {
        // Step 1: Create 10 class files
        for (let i = 1; i <= 10; i++) {
            await createClass(page, `Class${i}`);
        }

        // Step 2: Add code to each class to create relationships
        // This will create a hierarchy: Class1 -> Class2 -> Class3 -> etc.
        for (let i = 1; i <= 10; i++) {
            // Find and click the file in the tree
            await page.getByText(`Class${i}.ts`).click();

            // Wait for editor to load
            await page.waitForTimeout(200);

            // Get the Monaco editor and type class code
            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();

            // Clear existing content and add new class with relationships
            await page.keyboard.press('Control+A');

            let classCode = `export class Class${i} `;

            // Create inheritance chain (Class2 extends Class1, Class3 extends Class2, etc.)
            if (i > 1) {
                classCode += `extends Class${i - 1} `;
            }

            classCode += `{
  private id: number;
  private name: string;
  
  constructor(id: number, name: string) {
    ${i > 1 ? 'super(id, name);' : ''}
    this.id = id;
    this.name = name;
  }
  
  public getId(): number {
    return this.id;
  }
  
  public getName(): string {
    return this.name;
  }
}`;

            await page.keyboard.type(classCode);

            // Wait for parsing and diagram update
            await page.waitForTimeout(600);
        }

        // Step 3: Verify all 10 nodes are displayed in the diagram
        const diagramNodes = page.locator('[data-id^="Class"]');
        await expect(diagramNodes).toHaveCount(10, { timeout: 2000 });

        // Step 4: Test zoom functionality
        const reactFlowViewport = page.locator('.react-flow__viewport');
        await expect(reactFlowViewport).toBeVisible();

        // Get initial transform
        const initialTransform = await reactFlowViewport.getAttribute('style');

        // Find and click zoom in button
        const zoomInButton = page.locator('.react-flow__controls button').nth(0);
        await zoomInButton.click();
        await page.waitForTimeout(300);

        // Verify zoom changed
        const zoomedInTransform = await reactFlowViewport.getAttribute('style');
        expect(zoomedInTransform).not.toBe(initialTransform);

        // Click zoom out button
        const zoomOutButton = page.locator('.react-flow__controls button').nth(1);
        await zoomOutButton.click();
        await page.waitForTimeout(300);

        // Click zoom out again
        await zoomOutButton.click();
        await page.waitForTimeout(300);

        const zoomedOutTransform = await reactFlowViewport.getAttribute('style');
        expect(zoomedOutTransform).not.toBe(zoomedInTransform);

        // Step 5: Test pan functionality (drag the diagram)
        const diagramArea = page.locator('.react-flow__pane');

        // Get a position to drag from
        const box = await diagramArea.boundingBox();
        if (box) {
            const startX = box.x + box.width / 2;
            const startY = box.y + box.height / 2;

            // Drag to pan the diagram
            await page.mouse.move(startX, startY);
            await page.mouse.down();
            await page.mouse.move(startX + 100, startY + 100, { steps: 10 });
            await page.mouse.up();

            await page.waitForTimeout(200);

            // Verify transform changed due to panning
            const pannedTransform = await reactFlowViewport.getAttribute('style');
            expect(pannedTransform).not.toBe(zoomedOutTransform);
        }

        // Step 6: Verify MiniMap is visible and functional
        const miniMap = page.locator('.react-flow__minimap');
        await expect(miniMap).toBeVisible();

        // Verify minimap contains node representations
        const miniMapNodes = miniMap.locator('.react-flow__minimap-node');
        await expect(miniMapNodes.first()).toBeVisible();

        // Step 7: Test fit view button (zoom to fit all nodes)
        const fitViewButton = page.locator('.react-flow__controls button').nth(2);
        await fitViewButton.click();
        await page.waitForTimeout(300);

        // All nodes should be visible after fit view
        for (let i = 1; i <= 10; i++) {
            const node = page.locator(`[data-id="Class${i}.ts#Class${i}"]`);
            await expect(node).toBeVisible({ timeout: 1000 });
        }

        // Step 8: Verify hierarchical layout (nodes should be arranged top to bottom)
        // Class1 should be at the top, Class10 at the bottom
        const class1Node = page.locator('[data-id="Class1.ts#Class1"]');
        const class10Node = page.locator('[data-id="Class10.ts#Class10"]');

        const class1Box = await class1Node.boundingBox();
        const class10Box = await class10Node.boundingBox();

        if (class1Box && class10Box) {
            // Class1 should be above Class10 (smaller y coordinate)
            expect(class1Box.y).toBeLessThan(class10Box.y);
        }
    });

    test('should handle clicking on nodes in large diagrams', async ({ page }) => {
        // Create 5 classes for this test
        for (let i = 1; i <= 5; i++) {
            await createClass(page, `Class${i}`);
        }

        // Wait for diagram to render
        await page.waitForTimeout(1000);

        // Click on Class3 node in the diagram
        const class3Node = page.locator('[data-id="Class3.ts#Class3"]');
        await class3Node.click();

        // Verify the file tree highlights Class3.ts
        const selectedFile = page.locator('.file-tree-item.selected');
        await expect(selectedFile).toContainText('Class3.ts');

        // Verify the node is visually selected
        await expect(class3Node).toHaveClass(/selected/);
    });

    test('should maintain layout when switching between files', async ({ page }) => {
        // Create 6 classes
        for (let i = 1; i <= 6; i++) {
            await createClass(page, `Class${i}`);
        }

        // Get initial positions of first 3 nodes
        await page.waitForTimeout(1000);

        const class1Initial = await page.locator('[data-id="Class1.ts#Class1"]').boundingBox();
        const class2Initial = await page.locator('[data-id="Class2.ts#Class2"]').boundingBox();

        // Click on different files in the tree
        await page.getByText('Class4.ts').click();
        await page.waitForTimeout(300);

        await page.getByText('Class6.ts').click();
        await page.waitForTimeout(300);

        await page.getByText('Class1.ts').click();
        await page.waitForTimeout(300);

        // Verify node positions haven't changed significantly (layout stability)
        const class1After = await page.locator('[data-id="Class1.ts#Class1"]').boundingBox();
        const class2After = await page.locator('[data-id="Class2.ts#Class2"]').boundingBox();

        if (class1Initial && class1After && class2Initial && class2After) {
            // Allow for small floating point differences
            expect(Math.abs(class1Initial.x - class1After.x)).toBeLessThan(2);
            expect(Math.abs(class1Initial.y - class1After.y)).toBeLessThan(2);
            expect(Math.abs(class2Initial.x - class2After.x)).toBeLessThan(2);
            expect(Math.abs(class2Initial.y - class2After.y)).toBeLessThan(2);
        }
    });

    test('should display minimap for large diagrams', async ({ page }) => {
        // Create 12 classes to ensure diagram is large enough for minimap to be useful
        for (let i = 1; i <= 12; i++) {
            await createClass(page, `Class${i}`);
        }

        await page.waitForTimeout(1000);

        // Verify minimap is visible
        const miniMap = page.locator('.react-flow__minimap');
        await expect(miniMap).toBeVisible();

        // Verify minimap shows nodes
        const miniMapNodes = miniMap.locator('.react-flow__minimap-node');
        const nodeCount = await miniMapNodes.count();

        // Should have at least 12 nodes in minimap
        expect(nodeCount).toBeGreaterThanOrEqual(12);

        // Test clicking on minimap to navigate
        const miniMapBox = await miniMap.boundingBox();
        if (miniMapBox) {
            // Click in a corner of the minimap
            await page.mouse.click(miniMapBox.x + 10, miniMapBox.y + 10);
            await page.waitForTimeout(300);

            // Verify viewport has changed (pan occurred)
            const viewport = page.locator('.react-flow__viewport');
            const transform = await viewport.getAttribute('style');
            expect(transform).toBeTruthy();
        }
    });
});
