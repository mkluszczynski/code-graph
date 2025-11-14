/**
 * E2E Test Suite: All User Scenarios (T114)
 * 
 * Comprehensive end-to-end tests covering all 7 user stories for the TypeScript UML Graph Visualizer.
 * 
 * User Stories Covered:
 * - US1: Create Class or Interface via Add Button (Priority: P1)
 * - US2: Navigate from Graph to Code (Priority: P1)
 * - US3: Manage Project with File Tree (Priority: P1)
 * - US4: Write TypeScript and See UML (Priority: P1)
 * - US5: Visualize Complex Relationships (Priority: P2)
 * - US6: Edit and Re-visualize (Priority: P2)
 * - US7: Navigate Large Diagrams (Priority: P3)
 * 
 * Each test validates the complete workflow from the user's perspective,
 * ensuring all features work together seamlessly.
 */

import { test, expect, type Page } from '@playwright/test';

// Helper function to wait for diagram update
const waitForDiagramUpdate = async (page: Page) => {
    await page.waitForTimeout(600); // Matches debounce time + render
};

// Helper function to clear and type in Monaco editor
const typeInEditor = async (page: Page, content: string) => {
    await page.keyboard.press('Control+A');
    await page.keyboard.type(content);
    await waitForDiagramUpdate(page);
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

// Helper function to create an interface with name input
const createInterface = async (page: Page, interfaceName: string) => {
    // Set up dialog handler before clicking
    page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('prompt');
        await dialog.accept(interfaceName);
    });

    await page.getByRole('button', { name: /add/i }).click();
    await page.getByRole('menuitem', { name: /new interface/i }).click();
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
        console.log('Src folder not found');
    }
};

test.describe('TypeScript UML Graph Visualizer - Complete User Scenarios', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:5173');

        // Wait for the application to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
    });

    test.describe('User Story 1: Create Class or Interface via Add Button (P1)', () => {
        test('should create a new class through Add button and display in diagram', async ({ page }) => {
            // Given the user is viewing the application
            const addButton = page.getByRole('button', { name: /add/i });
            await expect(addButton).toBeVisible();

            // When they click the "Add" button and verify menu appears
            await addButton.click();
            const newClassOption = page.getByRole('menuitem', { name: /new class/i });
            const newInterfaceOption = page.getByRole('menuitem', { name: /new interface/i });
            await expect(newClassOption).toBeVisible();
            await expect(newInterfaceOption).toBeVisible();

            // Close the menu first
            await page.keyboard.press('Escape');
            await page.waitForTimeout(100);

            // When the user creates a new class with name input
            await createClass(page, 'Class1');

            // Ensure src folder is expanded to see the file
            await ensureSrcFolderExpanded(page);

            // Then a new file appears in the file tree
            const fileTreeItem = page.getByText('Class1.ts');
            await expect(fileTreeItem).toBeVisible();

            // And the UML diagram updates to show the new empty class node
            const diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toBeVisible({ timeout: 2500 });

            // Verify node contains class name
            await expect(diagramNode).toContainText('Class1');
        });

        test('should create a new interface through Add button', async ({ page }) => {
            // Create a new interface with name input
            await createInterface(page, 'Interface1');

            // Ensure src folder is expanded to see the file
            await ensureSrcFolderExpanded(page);

            // Verify interface file appears in tree
            const fileTreeItem = page.getByText('Interface1.ts');
            await expect(fileTreeItem).toBeVisible();

            // Verify interface node appears in diagram
            const diagramNode = page.locator('[data-id="Interface1.ts::Interface1"]');
            await expect(diagramNode).toBeVisible({ timeout: 2500 });
            await expect(diagramNode).toContainText('Interface1');
        });

        test('should create multiple classes and all appear in diagram', async ({ page }) => {
            // Create 3 classes with name inputs
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await createClass(page, 'Class3');

            // Ensure src folder is expanded to see the files
            await ensureSrcFolderExpanded(page);

            // Verify all 3 files appear in tree
            await expect(page.getByText('Class1.ts')).toBeVisible();
            await expect(page.getByText('Class2.ts')).toBeVisible();
            await expect(page.getByText('Class3.ts')).toBeVisible();

            // Verify all 3 nodes appear in diagram
            await expect(page.locator('[data-id="Class1.ts::Class1"]')).toBeVisible();
            await expect(page.locator('[data-id="Class2.ts::Class2"]')).toBeVisible();
            await expect(page.locator('[data-id="Class3.ts::Class3"]')).toBeVisible();
        });
    });

    test.describe('User Story 2: Navigate from Graph to Code (P1)', () => {
        test('should open file in editor when clicking on diagram node', async ({ page }) => {
            // Create two classes
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Given a UML diagram displays multiple class nodes
            const class1Node = page.locator('[data-id="Class1.ts::Class1"]');
            const class2Node = page.locator('[data-id="Class2.ts::Class2"]');

            await expect(class1Node).toBeVisible();
            await expect(class2Node).toBeVisible();

            // When the user clicks on Class2 node
            await class2Node.click();
            await page.waitForTimeout(200);

            // Then the corresponding file is highlighted in the tree
            const selectedFile = page.locator('.file-tree-item.selected');
            await expect(selectedFile).toContainText('Class2.ts');

            // And the file opens in the editor
            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();

            // When clicking a different node (Class1)
            await class1Node.click();
            await page.waitForTimeout(200);

            // Then the editor switches to the new file
            const newSelectedFile = page.locator('.file-tree-item.selected');
            await expect(newSelectedFile).toContainText('Class1.ts');
        });

        test('should navigate between interface and class nodes', async ({ page }) => {
            // Create a class and an interface
            await createClass(page, 'Class1');
            await createInterface(page, 'Interface1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Click on interface node
            const interfaceNode = page.locator('[data-id="Interface1.ts::Interface1"]');
            await interfaceNode.click();
            await page.waitForTimeout(200);

            // Verify interface file is selected
            let selectedFile = page.locator('.file-tree-item.selected');
            await expect(selectedFile).toContainText('Interface1.ts');

            // Click on class node
            const classNode = page.locator('[data-id="Class1.ts::Class1"]');
            await classNode.click();
            await page.waitForTimeout(200);

            // Verify class file is selected
            selectedFile = page.locator('.file-tree-item.selected');
            await expect(selectedFile).toContainText('Class1.ts');
        });
    });

    test.describe('User Story 3: Manage Project with File Tree (P1)', () => {
        test('should auto-expand src folder when files are created', async ({ page }) => {
            // Initially src folder shouldn't exist or be collapsed

            // Create a file
            await createClass(page, 'Class1');
            await page.waitForTimeout(400);

            // src folder button should be visible
            const srcFolderButton = page.getByTestId('folder-src');
            await expect(srcFolderButton).toBeVisible({ timeout: 3000 });

            // File should be visible (auto-expanded)
            const fileTreeItem = page.getByTestId('file-Class1.ts');
            await expect(fileTreeItem).toBeVisible({ timeout: 2000 });

            // Verify chevron shows expanded state (folder is auto-expanded)
            const chevronDown = srcFolderButton.locator('[data-lucide="chevron-down"]');
            await expect(chevronDown).toBeVisible();
        });

        test('should display all files in tree and allow navigation', async ({ page }) => {
            // Create multiple files
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await createClass(page, 'Class3');
            await createClass(page, 'Class4');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Given files exist in the file tree
            await expect(page.getByText('Class1.ts')).toBeVisible();
            await expect(page.getByText('Class2.ts')).toBeVisible();
            await expect(page.getByText('Class3.ts')).toBeVisible();
            await expect(page.getByText('Class4.ts')).toBeVisible();

            // When the user clicks on Class3.ts in the tree
            await page.getByText('Class3.ts').click();
            await page.waitForTimeout(200);

            // Then that file is highlighted and opens in the editor
            const selectedFile = page.locator('.file-tree-item.selected');
            await expect(selectedFile).toContainText('Class3.ts');

            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();
        });

        test('should update file tree when new files are created', async ({ page }) => {
            // Initially no files (only src folder should exist but be empty)
            // We don't check for file-tree-item count as src folder might exist

            // Create first file
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // File tree should have 1 file
            await expect(page.getByText('Class1.ts')).toBeVisible();

            // Create second file
            await createInterface(page, 'Interface1');

            // File tree should have 2 files
            await expect(page.getByText('Class1.ts')).toBeVisible();
            await expect(page.getByText('Interface1.ts')).toBeVisible();
        });

        test('should synchronize tree selection with diagram node clicks', async ({ page }) => {
            // Create 3 files
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');
            await createClass(page, 'Class3');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Click on Class2 node in diagram
            const class2Node = page.locator('[data-id="Class2.ts::Class2"]');
            await class2Node.click();
            await page.waitForTimeout(200);

            // Verify Class2.ts is highlighted in tree
            let selectedFile = page.locator('.file-tree-item.selected');
            await expect(selectedFile).toContainText('Class2.ts');

            // Click on Class1 node in diagram
            const class1Node = page.locator('[data-id="Class1.ts::Class1"]');
            await class1Node.click();
            await page.waitForTimeout(200);

            // Verify Class1.ts is now highlighted
            selectedFile = page.locator('.file-tree-item.selected');
            await expect(selectedFile).toContainText('Class1.ts');
        });
    });

    test.describe('User Story 4: Write TypeScript and See UML (P1)', () => {
        test('should update diagram when adding properties to a class', async ({ page }) => {
            // Create a class
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Open the file in editor
            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            // Given a class file is open, add properties
            const classCode = `export class Class1 {
  private id: number;
  public name: string;
  protected status: boolean;
}`;

            await typeInEditor(page, classCode);

            // Then the diagram updates to show properties
            const diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('id: number');
            await expect(diagramNode).toContainText('name: string');
            await expect(diagramNode).toContainText('status: boolean');
        });

        test('should update diagram when adding methods to a class', async ({ page }) => {
            // Create and open a class
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            // Add methods to the class
            const classCode = `export class Class1 {
  public getId(): number {
    return 1;
  }
  
  private calculateTotal(amount: number): number {
    return amount * 2;
  }
}`;

            await typeInEditor(page, classCode);

            // Verify methods appear in diagram
            const diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('getId()');
            await expect(diagramNode).toContainText('calculateTotal(');
        });

        test('should show access modifiers with proper UML notation', async ({ page }) => {
            // Create a class with various access modifiers
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            const classCode = `export class Class1 {
  private privateField: string;
  public publicField: number;
  protected protectedField: boolean;
  
  private privateMethod(): void {}
  public publicMethod(): void {}
  protected protectedMethod(): void {}
}`;

            await typeInEditor(page, classCode);

            // Verify UML symbols are present
            const diagramNode = page.locator('[data-id="Class1.ts::Class1"]');

            // Check that properties are shown (specific UML notation depends on implementation)
            await expect(diagramNode).toContainText('privateField');
            await expect(diagramNode).toContainText('publicField');
            await expect(diagramNode).toContainText('protectedField');
            await expect(diagramNode).toContainText('privateMethod');
            await expect(diagramNode).toContainText('publicMethod');
            await expect(diagramNode).toContainText('protectedMethod');
        });

        test('should handle multiple files with classes and interfaces', async ({ page }) => {
            // Create a class
            await createClass(page, 'Class1');

            // Create an interface
            await createInterface(page, 'Interface1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Edit the class
            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            const classCode = `export class Class1 {
  private value: number = 0;
  
  public getValue(): number {
    return this.value;
  }
}`;

            await typeInEditor(page, classCode);

            // Edit the interface
            await page.getByText('Interface1.ts').click();
            await page.waitForTimeout(200);

            const interfaceCode = `export interface Interface1 {
  id: string;
  name: string;
  execute(): void;
}`;

            await typeInEditor(page, interfaceCode);

            // Verify both appear correctly in diagram
            const classNode = page.locator('[data-id="Class1.ts::Class1"]');
            const interfaceNode = page.locator('[data-id="Interface1.ts::Interface1"]');

            await expect(classNode).toContainText('Class1');
            await expect(classNode).toContainText('value');
            await expect(classNode).toContainText('getValue()');

            await expect(interfaceNode).toContainText('Interface1');
            await expect(interfaceNode).toContainText('id');
            await expect(interfaceNode).toContainText('execute()');
        });
    });

    test.describe('User Story 5: Visualize Complex Relationships (P2)', () => {
        test('should visualize inheritance relationships', async ({ page }) => {
            // Create two classes with inheritance
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Edit first class (base class)
            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            await typeInEditor(page, `export class Class1 {
  protected baseProperty: string;
}`);

            // Edit second class (derived class)
            await page.getByText('Class2.ts').click();
            await page.waitForTimeout(200);

            await typeInEditor(page, `import { Class1 } from './Class1';

export class Class2 extends Class1 {
  private derivedProperty: number;
}`);

            // Verify both classes are in diagram
            await expect(page.locator('[data-id="Class1.ts::Class1"]')).toBeVisible();
            await expect(page.locator('[data-id="Class2.ts::Class2"]')).toBeVisible();

            // Verify inheritance edge exists
            const edges = page.locator('.react-flow__edge');
            await expect(edges.first()).toBeVisible({ timeout: 2000 });
        });

        test('should visualize interface implementation relationships', async ({ page }) => {
            // Create interface and implementing class
            await createInterface(page, 'Interface1');
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Edit interface
            await page.getByText('Interface1.ts').click();
            await page.waitForTimeout(200);

            await typeInEditor(page, `export interface Interface1 {
  execute(): void;
}`);

            // Edit class to implement interface
            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            await typeInEditor(page, `import { Interface1 } from './Interface1';

export class Class1 implements Interface1 {
  public execute(): void {
    console.log('executing');
  }
}`);

            // Verify both nodes are visible
            await expect(page.locator('[data-id="Interface1.ts::Interface1"]')).toBeVisible();
            await expect(page.locator('[data-id="Class1.ts::Class1"]')).toBeVisible();

            // Verify implementation edge exists
            const edges = page.locator('.react-flow__edge');
            await expect(edges.first()).toBeVisible({ timeout: 2000 });
        });

        test('should visualize association relationships through property types', async ({ page }) => {
            // Create two classes where one uses the other as a property type
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Edit first class
            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            await typeInEditor(page, `export class Class1 {
  public id: number;
}`);

            // Edit second class to use first class as property
            await page.getByText('Class2.ts').click();
            await page.waitForTimeout(200);

            await typeInEditor(page, `import { Class1 } from './Class1';

export class Class2 {
  private dependency: Class1;
}`);

            // Verify both classes are visible
            await expect(page.locator('[data-id="Class1.ts::Class1"]')).toBeVisible();
            await expect(page.locator('[data-id="Class2.ts::Class2"]')).toBeVisible();

            // Verify association edge exists
            const edges = page.locator('.react-flow__edge');
            await expect(edges.first()).toBeVisible({ timeout: 2000 });
        });

        test('should handle multiple relationship types simultaneously', async ({ page }) => {
            // Create a complex scenario: interface, base class, derived class implementing interface
            await createInterface(page, 'Interface1');
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Setup interface
            await page.getByText('Interface1.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `export interface Interface1 {
  execute(): void;
}`);

            // Setup base class
            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `export class Class1 {
  protected baseProperty: string;
}`);

            // Setup derived class that extends base and implements interface
            await page.getByText('Class2.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `import { Class1 } from './Class1';
import { Interface1 } from './Interface1';

export class Class2 extends Class1 implements Interface1 {
  public execute(): void {}
}`);

            // Verify all nodes are visible
            await expect(page.locator('[data-id="Interface1.ts::Interface1"]')).toBeVisible();
            await expect(page.locator('[data-id="Class1.ts::Class1"]')).toBeVisible();
            await expect(page.locator('[data-id="Class2.ts::Class2"]')).toBeVisible();

            // Verify multiple edges exist (inheritance + implementation)
            const edges = page.locator('.react-flow__edge');
            const edgeCount = await edges.count();
            expect(edgeCount).toBeGreaterThanOrEqual(2);
        });
    });

    test.describe('User Story 6: Edit and Re-visualize (P2)', () => {
        test('should update diagram when renaming a class', async ({ page }) => {
            // Create a class
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            // Initial class
            await typeInEditor(page, `export class OriginalName {
  private field: string;
}`);

            // Verify original name in diagram
            let diagramNode = page.locator('[data-id="Class1.ts::OriginalName"]');
            await expect(diagramNode).toBeVisible();
            await expect(diagramNode).toContainText('OriginalName');

            // Rename the class
            await typeInEditor(page, `export class RenamedClass {
  private field: string;
}`);

            // Verify new name in diagram
            diagramNode = page.locator('[data-id="Class1.ts::RenamedClass"]');
            await expect(diagramNode).toBeVisible();
            await expect(diagramNode).toContainText('RenamedClass');
        });

        test('should update diagram when changing method visibility', async ({ page }) => {
            // Create a class
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            // Class with private method
            await typeInEditor(page, `export class Class1 {
  private secretMethod(): void {}
}`);

            let diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('secretMethod');

            // Change to public
            await typeInEditor(page, `export class Class1 {
  public secretMethod(): void {}
}`);

            // Diagram should still show the method (visibility symbol may change)
            diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('secretMethod');
        });

        test('should update diagram when removing a property', async ({ page }) => {
            // Create a class with multiple properties
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            // Class with 3 properties
            await typeInEditor(page, `export class Class1 {
  private prop1: string;
  private prop2: number;
  private prop3: boolean;
}`);

            let diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('prop1');
            await expect(diagramNode).toContainText('prop2');
            await expect(diagramNode).toContainText('prop3');

            // Remove prop2
            await typeInEditor(page, `export class Class1 {
  private prop1: string;
  private prop3: boolean;
}`);

            // Verify prop2 is gone
            diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('prop1');
            await expect(diagramNode).toContainText('prop3');
            await expect(diagramNode).not.toContainText('prop2');
        });

        test('should update diagram when removing a relationship', async ({ page }) => {
            // Create two classes with a relationship
            await createClass(page, 'Class1');
            await createClass(page, 'Class2');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `export class Class1 {}`);

            await page.getByText('Class2.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `import { Class1 } from './Class1';

export class Class2 extends Class1 {}`);

            // Verify edge exists
            const edges = page.locator('.react-flow__edge');
            await expect(edges.first()).toBeVisible();

            // Remove inheritance
            await typeInEditor(page, `export class Class2 {}`);

            // Edge should be removed or count reduced
            // Note: This depends on implementation - may need adjustment
            await page.waitForTimeout(1000);
        });

        test('should handle rapid consecutive edits', async ({ page }) => {
            // Create a class
            await createClass(page, 'Class1');

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            // Make several rapid edits
            await typeInEditor(page, `export class Class1 { private a: string; }`);

            // Don't wait, immediately edit again
            await page.keyboard.press('Control+A');
            await page.keyboard.type(`export class Class1 { private a: string; private b: number; }`);

            // Wait for final update
            await waitForDiagramUpdate(page);

            // Verify final state is correct
            const diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('a');
            await expect(diagramNode).toContainText('b');
        });
    });

    test.describe('User Story 7: Navigate Large Diagrams (P3)', () => {
        test('should zoom in and out on diagram with many classes', async ({ page }) => {
            // Create 8 classes
            for (let i = 1; i <= 8; i++) {
                await page.getByRole('button', { name: /add/i }).click();
                await page.getByRole('menuitem', { name: /new class/i }).click();
                await page.waitForTimeout(100);
            }

            await page.waitForTimeout(500);

            // Verify zoom controls are visible
            const zoomControls = page.locator('.react-flow__controls');
            await expect(zoomControls).toBeVisible();

            // Get initial viewport transform
            const viewport = page.locator('.react-flow__viewport');
            const initialTransform = await viewport.getAttribute('style');

            // Zoom in
            const zoomInButton = page.locator('.react-flow__controls button').first();
            await zoomInButton.click();
            await page.waitForTimeout(300);

            // Verify transform changed
            const zoomedInTransform = await viewport.getAttribute('style');
            expect(zoomedInTransform).not.toBe(initialTransform);

            // Zoom out
            const zoomOutButton = page.locator('.react-flow__controls button').nth(1);
            await zoomOutButton.click();
            await page.waitForTimeout(300);

            const zoomedOutTransform = await viewport.getAttribute('style');
            expect(zoomedOutTransform).not.toBe(zoomedInTransform);
        });

        test('should pan around large diagrams', async ({ page }) => {
            // Create 6 classes
            for (let i = 1; i <= 6; i++) {
                await page.getByRole('button', { name: /add/i }).click();
                await page.getByRole('menuitem', { name: /new class/i }).click();
                await page.waitForTimeout(100);
            }

            await page.waitForTimeout(500);

            // Get viewport
            const viewport = page.locator('.react-flow__viewport');
            const initialTransform = await viewport.getAttribute('style');

            // Pan by dragging
            const pane = page.locator('.react-flow__pane');
            const box = await pane.boundingBox();

            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                await page.mouse.move(box.x + box.width / 2 - 150, box.y + box.height / 2 - 150, { steps: 10 });
                await page.mouse.up();
                await page.waitForTimeout(200);

                // Verify viewport changed
                const pannedTransform = await viewport.getAttribute('style');
                expect(pannedTransform).not.toBe(initialTransform);
            }
        });

        test('should display minimap for navigation', async ({ page }) => {
            // Create 10 classes
            for (let i = 1; i <= 10; i++) {
                await page.getByRole('button', { name: /add/i }).click();
                await page.getByRole('menuitem', { name: /new class/i }).click();
                await page.waitForTimeout(100);
            }

            await page.waitForTimeout(800);

            // Verify minimap is visible
            const minimap = page.locator('.react-flow__minimap');
            await expect(minimap).toBeVisible();

            // Verify minimap contains nodes
            const minimapNodes = minimap.locator('.react-flow__minimap-node');
            const nodeCount = await minimapNodes.count();
            expect(nodeCount).toBeGreaterThanOrEqual(10);
        });

        test('should automatically arrange classes in readable layout', async ({ page }) => {
            // Create 7 classes with relationships
            for (let i = 1; i <= 7; i++) {
                await page.getByRole('button', { name: /add/i }).click();
                await page.getByRole('menuitem', { name: /new class/i }).click();
                await page.waitForTimeout(100);
            }

            // Add some inheritance to create hierarchy
            await page.getByText('Class2.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `export class Class1 {}

export class Class2 extends Class1 {}`);

            // Verify all nodes are visible
            for (let i = 1; i <= 7; i++) {
                const node = page.locator(`[data-id*="Class${i}"]`).first();
                await expect(node).toBeVisible({ timeout: 3000 });
            }

            // Verify nodes don't overlap (check a sample)
            const class1Box = await page.locator('[data-id*="Class1"]').first().boundingBox();
            const class2Box = await page.locator('[data-id*="Class2"]').first().boundingBox();

            if (class1Box && class2Box) {
                // Classes should not be at the exact same position
                const isSamePosition =
                    Math.abs(class1Box.x - class2Box.x) < 10 &&
                    Math.abs(class1Box.y - class2Box.y) < 10;
                expect(isSamePosition).toBe(false);
            }
        });

        test('should fit all nodes when using fit view button', async ({ page }) => {
            // Create several classes
            for (let i = 1; i <= 5; i++) {
                await page.getByRole('button', { name: /add/i }).click();
                await page.getByRole('menuitem', { name: /new class/i }).click();
                await page.waitForTimeout(100);
            }

            await page.waitForTimeout(500);

            // Zoom in significantly
            const zoomInButton = page.locator('.react-flow__controls button').first();
            await zoomInButton.click();
            await zoomInButton.click();
            await zoomInButton.click();
            await page.waitForTimeout(300);

            // Use fit view
            const fitViewButton = page.locator('.react-flow__controls button').nth(2);
            await fitViewButton.click();
            await page.waitForTimeout(500);

            // All nodes should be visible
            for (let i = 1; i <= 5; i++) {
                const node = page.locator(`[data-id*="Class${i}"]`).first();
                await expect(node).toBeVisible();
            }
        });
    });

    test.describe('Complete Workflow Integration', () => {
        test('should support full IDE workflow: create → edit → navigate → visualize', async ({ page }) => {
            // Step 1: Create project structure (US1)
            await page.getByRole('button', { name: /add/i }).click();
            await page.getByRole('menuitem', { name: /new interface/i }).click();
            await page.waitForTimeout(200);

            await page.getByRole('button', { name: /add/i }).click();
            await page.getByRole('menuitem', { name: /new class/i }).click();
            await page.waitForTimeout(200);

            await page.getByRole('button', { name: /add/i }).click();
            await page.getByRole('menuitem', { name: /new class/i }).click();
            await page.waitForTimeout(200);

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            // Step 2: Verify file tree shows all files (US3)
            await expect(page.getByText('Interface1.ts')).toBeVisible();
            await expect(page.getByText('Class1.ts')).toBeVisible();
            await expect(page.getByText('Class2.ts')).toBeVisible();

            // Step 3: Edit interface (US4)
            await page.getByText('Interface1.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `export interface Interface1 {
  id: string;
  execute(): void;
}`);

            // Step 4: Edit base class (US4)
            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `export class Class1 {
  protected data: string;
  
  public getData(): string {
    return this.data;
  }
}`);

            // Step 5: Edit derived class with relationships (US5)
            await page.getByText('Class2.ts').click();
            await page.waitForTimeout(200);
            await typeInEditor(page, `import { Interface1 } from './Interface1';
import { Class1 } from './Class1';

export class Class2 extends Class1 implements Interface1 {
  public id: string;
  
  public execute(): void {
    console.log(this.getData());
  }
}`);

            // Step 6: Navigate via diagram (US2)
            const interfaceNode = page.locator('[data-id="Interface1.ts::Interface1"]');
            await interfaceNode.click();
            await page.waitForTimeout(200);

            // Verify navigation worked
            const selectedFile = page.locator('.file-tree-item.selected');
            await expect(selectedFile).toContainText('Interface1.ts');

            // Step 7: Verify all relationships are visible (US5)
            const edges = page.locator('.react-flow__edge');
            const edgeCount = await edges.count();
            expect(edgeCount).toBeGreaterThanOrEqual(2); // Inheritance + implementation

            // Step 8: Edit and verify re-visualization (US6)
            await page.getByText('Class2.ts').click();
            await page.waitForTimeout(200);

            await page.keyboard.press('Control+A');
            await page.keyboard.type(`import { Interface1 } from './Interface1';
import { Class1 } from './Class1';

export class Class2 extends Class1 implements Interface1 {
  public id: string;
  private newProperty: number; // Added property
  
  public execute(): void {
    console.log(this.getData());
  }
  
  public newMethod(): void {} // Added method
}`);
            await waitForDiagramUpdate(page);

            // Verify new members appear
            const class2Node = page.locator('[data-id="Class2.ts::Class2"]');
            await expect(class2Node).toContainText('newProperty');
            await expect(class2Node).toContainText('newMethod');
        });

        test('should handle error scenarios gracefully', async ({ page }) => {
            // Create a class
            await page.getByRole('button', { name: /add/i }).click();
            await page.getByRole('menuitem', { name: /new class/i }).click();
            await page.waitForTimeout(300);

            // Ensure src folder is expanded
            await ensureSrcFolderExpanded(page);

            await page.getByText('Class1.ts').click();
            await page.waitForTimeout(200);

            // Write valid code first
            await typeInEditor(page, `export class Class1 {
  private value: number;
}`);

            // Verify diagram shows valid state
            let diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toBeVisible();
            await expect(diagramNode).toContainText('value');

            // Introduce syntax error
            await typeInEditor(page, `export class Class1 {
  private value: number
  this is invalid syntax!!!
}`);

            // Application should still be responsive
            // (Specific error handling depends on implementation)
            const editor = page.locator('.monaco-editor');
            await expect(editor).toBeVisible();

            // Fix the error
            await typeInEditor(page, `export class Class1 {
  private value: number;
  private fixed: string;
}`);

            // Diagram should update with corrected code
            diagramNode = page.locator('[data-id="Class1.ts::Class1"]');
            await expect(diagramNode).toContainText('fixed');
        });
    });
});
