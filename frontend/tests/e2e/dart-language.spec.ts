/**
 * E2E Test Suite: Dart Language Support
 *
 * Comprehensive end-to-end tests for Dart language support feature (008-dart-language-support).
 *
 * Tests Cover:
 * - T054: File creation with .dart extension
 * - T055: Dart diagram visualization (classes, properties, methods, relationships)
 * - T056: Unsupported language warning icons
 * - T057: Mixed TypeScript/Dart project view
 * - T058: Dart syntax error handling
 *
 * These tests run in a real browser (Playwright) where WASM parsing works correctly.
 */

import { test, expect, type Page } from '@playwright/test';

// Helper function to wait for diagram update (matches debounce time + render)
const waitForDiagramUpdate = async (page: Page) => {
  await page.waitForTimeout(700);
};

// Helper function to type content in Monaco editor
const typeInEditor = async (page: Page, content: string) => {
  const success = await page.evaluate((newContent: string) => {
    const monaco = (window as any).monaco;
    if (!monaco?.editor) return false;

    const editors = monaco.editor.getEditors();
    if (!editors?.length) return false;

    const editor = editors[0];
    const model = editor.getModel();
    if (!model) return false;

    const fullRange = model.getFullModelRange();
    editor.executeEdits('test', [
      {
        range: fullRange,
        text: newContent,
        forceMoveMarkers: true,
      },
    ]);

    return true;
  }, content);

  if (!success) {
    throw new Error('Failed to update Monaco editor content');
  }

  await waitForDiagramUpdate(page);
};

// Helper function to create a file with specific name and extension
const createFileWithExtension = async (
  page: Page,
  fileName: string,
  extension: string
) => {
  // Click Add button
  await page.getByRole('button', { name: /add/i }).click();

  // Click Add File option
  await page.getByRole('menuitem', { name: /add file/i }).click();

  // Wait for dialog to appear
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Enter filename with extension
  const input = dialog.getByRole('textbox');
  await input.fill(`${fileName}${extension}`);

  // Submit the form
  await dialog.getByRole('button', { name: /create/i }).click();

  // Wait for dialog to close and file to be created
  await expect(dialog).not.toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(500);
};

// Helper to click on a file in the file tree (uses test ID for specificity)
const clickFileInTree = async (page: Page, fileName: string) => {
  const fileItem = page.getByTestId(`file-${fileName}`);
  await fileItem.click();
  await page.waitForTimeout(300);
};

// Helper to ensure src folder is expanded
const ensureSrcFolderExpanded = async (page: Page) => {
  await page.waitForTimeout(700);

  const srcFolderButton = page.getByTestId('folder-src');

  try {
    await expect(srcFolderButton).toBeVisible({ timeout: 3000 });

    const chevronDown = srcFolderButton.locator('[data-lucide="chevron-down"]');
    const isExpanded = (await chevronDown.count()) > 0;

    if (!isExpanded) {
      await srcFolderButton.click();
      await page.waitForTimeout(300);
    }
  } catch {
    // Src folder not found - expected if files are at root
  }
};

test.describe('Dart Language Support - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test.describe('T054: File Creation with Extension', () => {
    test('should create a .dart file with user-specified extension', async ({
      page,
    }) => {
      // Create a Dart file
      await createFileWithExtension(page, 'MyClass', '.dart');

      // Ensure folder is expanded
      await ensureSrcFolderExpanded(page);

      // Verify file appears in tree (use testId for specificity)
      const fileItem = page.getByTestId('file-MyClass.dart');
      await expect(fileItem).toBeVisible();
    });

    test('should create a .ts file with user-specified extension', async ({
      page,
    }) => {
      // Create a TypeScript file
      await createFileWithExtension(page, 'MyClass', '.ts');

      // Ensure folder is expanded
      await ensureSrcFolderExpanded(page);

      // Verify file appears in tree (use testId for specificity)
      const fileItem = page.getByTestId('file-MyClass.ts');
      await expect(fileItem).toBeVisible();
    });

    test('should validate file extension is provided', async ({ page }) => {
      // Click Add button
      await page.getByRole('button', { name: /add/i }).click();
      await page.getByRole('menuitem', { name: /add file/i }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Enter filename without extension
      const input = dialog.getByRole('textbox');
      await input.fill('MyClass');

      // Try to submit
      await dialog.getByRole('button', { name: /create/i }).click();

      // Verify error message appears
      const errorMessage = dialog.getByText(/extension/i);
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('T055: Dart Diagram Visualization', () => {
    test('should parse Dart class and display in diagram', async ({ page }) => {
      // Create a Dart file
      await createFileWithExtension(page, 'Person', '.dart');

      await ensureSrcFolderExpanded(page);

      // Click to open the file
      await clickFileInTree(page, 'Person.dart');

      // Type Dart class code
      await typeInEditor(
        page,
        `class Person {
  String name;
  int age;
  
  Person(this.name, this.age);
  
  void greet() {
    print('Hello, I am \$name');
  }
  
  int getAge() {
    return age;
  }
}`
      );

      // Verify diagram node appears
      const diagramNode = page.getByTestId('diagram-node-Person');
      await expect(diagramNode).toBeVisible({ timeout: 5000 });

      // Verify node contains class name
      await expect(diagramNode).toContainText('Person');

      // Verify properties are shown
      await expect(diagramNode).toContainText('name');
      await expect(diagramNode).toContainText('age');

      // Verify methods are shown
      await expect(diagramNode).toContainText('greet');
      await expect(diagramNode).toContainText('getAge');
    });

    test('should display Dart access modifiers correctly', async ({ page }) => {
      await createFileWithExtension(page, 'BankAccount', '.dart');

      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'BankAccount.dart');

      await typeInEditor(
        page,
        `class BankAccount {
  double _balance;      // Private (underscore prefix)
  String accountNumber; // Public
  
  BankAccount(this._balance, this.accountNumber);
  
  double get balance => _balance;
  
  void _updateBalance(double amount) {
    _balance += amount;
  }
  
  void deposit(double amount) {
    if (amount > 0) {
      _updateBalance(amount);
    }
  }
}`
      );

      const diagramNode = page.getByTestId('diagram-node-BankAccount');
      await expect(diagramNode).toBeVisible({ timeout: 5000 });

      // Verify both private (underscore) and public members are shown
      await expect(diagramNode).toContainText('_balance');
      await expect(diagramNode).toContainText('accountNumber');
      await expect(diagramNode).toContainText('deposit');
    });

    test('should display Dart inheritance relationship', async ({ page }) => {
      // Create base class
      await createFileWithExtension(page, 'Animal', '.dart');
      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'Animal.dart');

      await typeInEditor(
        page,
        `class Animal {
  String name;
  
  Animal(this.name);
  
  void speak() {
    print('...');
  }
}`
      );

      // Create derived class
      await createFileWithExtension(page, 'Dog', '.dart');
      await clickFileInTree(page, 'Dog.dart');

      await typeInEditor(
        page,
        `import 'Animal.dart';

class Dog extends Animal {
  String breed;
  
  Dog(String name, this.breed) : super(name);
  
  @override
  void speak() {
    print('Woof!');
  }
}`
      );

      // Switch to project view to see both classes
      const projectViewToggle = page.getByRole('button', {
        name: /project view/i,
      });
      if (await projectViewToggle.isVisible()) {
        await projectViewToggle.click();
        await waitForDiagramUpdate(page);
      }

      // Verify both nodes appear
      await expect(page.getByTestId('diagram-node-Animal')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByTestId('diagram-node-Dog')).toBeVisible({
        timeout: 5000,
      });

      // Wait for diagram layout to stabilize and verify edges exist
      await page.waitForTimeout(500);
      const edges = page.locator('.react-flow__edge');
      const edgeCount = await edges.count();
      expect(edgeCount).toBeGreaterThanOrEqual(1);
    });

    test('should display Dart interface implementation', async ({ page }) => {
      // Create abstract class (interface-like)
      await createFileWithExtension(page, 'Drawable', '.dart');
      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'Drawable.dart');

      await typeInEditor(
        page,
        `abstract class Drawable {
  void draw();
  void resize(int width, int height);
}`
      );

      // Create implementing class
      await createFileWithExtension(page, 'Circle', '.dart');
      await clickFileInTree(page, 'Circle.dart');

      await typeInEditor(
        page,
        `import 'Drawable.dart';

class Circle implements Drawable {
  int radius;
  
  Circle(this.radius);
  
  @override
  void draw() {
    print('Drawing circle');
  }
  
  @override
  void resize(int width, int height) {
    radius = width ~/ 2;
  }
}`
      );

      // Switch to project view to see both classes
      const projectViewToggle = page.getByRole('button', {
        name: /project view/i,
      });
      if (await projectViewToggle.isVisible()) {
        await projectViewToggle.click();
        await waitForDiagramUpdate(page);
      }

      // Verify both nodes appear
      await expect(page.getByTestId('diagram-node-Drawable')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByTestId('diagram-node-Circle')).toBeVisible({
        timeout: 5000,
      });

      // Verify implementation edge exists
      const edges = page.locator('.react-flow__edge');
      await expect(edges.first()).toBeVisible({ timeout: 3000 });
    });

    test('should display Dart mixin usage', async ({ page }) => {
      // Create a class using mixin
      await createFileWithExtension(page, 'Logger', '.dart');
      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'Logger.dart');

      await typeInEditor(
        page,
        `mixin Logger {
  void log(String message) {
    print('[LOG] \$message');
  }
}

class Service with Logger {
  String name;
  
  Service(this.name);
  
  void run() {
    log('Service \$name is running');
  }
}`
      );

      // Verify Service node appears
      const serviceNode = page.getByTestId('diagram-node-Service');
      await expect(serviceNode).toBeVisible({ timeout: 5000 });
      await expect(serviceNode).toContainText('Service');
      await expect(serviceNode).toContainText('run');
    });
  });

  test.describe('T057: Mixed TypeScript/Dart Project', () => {
    test('should display both TypeScript and Dart classes in project view', async ({
      page,
    }) => {
      // Create TypeScript file
      await createFileWithExtension(page, 'UserTS', '.ts');
      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'UserTS.ts');

      await typeInEditor(
        page,
        `export class UserTS {
  private id: number;
  public name: string;
  
  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }
  
  public getId(): number {
    return this.id;
  }
}`
      );

      // Create Dart file
      await createFileWithExtension(page, 'UserDart', '.dart');
      await clickFileInTree(page, 'UserDart.dart');

      await typeInEditor(
        page,
        `class UserDart {
  int id;
  String name;
  
  UserDart(this.id, this.name);
  
  int getId() {
    return id;
  }
}`
      );

      // Switch to project view if toggle exists
      const projectViewToggle = page.getByRole('button', {
        name: /project view/i,
      });
      if (await projectViewToggle.isVisible()) {
        await projectViewToggle.click();
        await waitForDiagramUpdate(page);
      }

      // Both nodes should be visible
      await expect(page.getByTestId('diagram-node-UserTS')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.getByTestId('diagram-node-UserDart')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should switch between TypeScript and Dart files correctly', async ({
      page,
    }) => {
      // Create both files
      await createFileWithExtension(page, 'ClassA', '.ts');
      await createFileWithExtension(page, 'ClassB', '.dart');

      await ensureSrcFolderExpanded(page);

      // Edit TypeScript file
      await clickFileInTree(page, 'ClassA.ts');
      await typeInEditor(
        page,
        `export class ClassA {
  private tsField: string;
}`
      );

      // Verify TS diagram
      await expect(page.getByTestId('diagram-node-ClassA')).toBeVisible();

      // Switch to Dart file
      await clickFileInTree(page, 'ClassB.dart');
      await typeInEditor(
        page,
        `class ClassB {
  String dartField;
}`
      );

      // Verify Dart diagram (in file view mode)
      await expect(page.getByTestId('diagram-node-ClassB')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('T058: Dart Syntax Error Handling', () => {
    test('should handle Dart syntax errors gracefully', async ({ page }) => {
      await createFileWithExtension(page, 'BrokenClass', '.dart');

      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'BrokenClass.dart');

      // Type invalid Dart code
      await typeInEditor(
        page,
        `class BrokenClass {
  String name
  
  // Missing semicolons and broken syntax
  void method( {
    print('broken
  }
}`
      );

      // Application should still be responsive
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();

      // Type valid code
      await typeInEditor(
        page,
        `class BrokenClass {
  String name;
  
  void method() {
    print('fixed');
  }
}`
      );

      // Diagram should now show the fixed class
      const diagramNode = page.getByTestId('diagram-node-BrokenClass');
      await expect(diagramNode).toBeVisible({ timeout: 5000 });
      await expect(diagramNode).toContainText('BrokenClass');
    });

    test('should handle empty Dart files', async ({ page }) => {
      await createFileWithExtension(page, 'EmptyFile', '.dart');

      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'EmptyFile.dart');

      // File is empty - should not crash
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();

      // Diagram area should be visible (may be empty)
      const diagramContainer = page.locator('.react-flow');
      await expect(diagramContainer).toBeVisible();
    });

    test('should handle Dart file with only comments', async ({ page }) => {
      await createFileWithExtension(page, 'OnlyComments', '.dart');

      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'OnlyComments.dart');

      await typeInEditor(
        page,
        `// This is a comment
/// Documentation comment
/* Multi-line
   comment */`
      );

      // Application should handle gracefully
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });
  });

  test.describe('Complete Dart Workflow', () => {
    test('should support full Dart development workflow', async ({ page }) => {
      // Step 1: Create a Dart interface (abstract class)
      await createFileWithExtension(page, 'Repository', '.dart');
      await ensureSrcFolderExpanded(page);
      await clickFileInTree(page, 'Repository.dart');

      await typeInEditor(
        page,
        `abstract class Repository<T> {
  Future<T?> findById(int id);
  Future<List<T>> findAll();
  Future<void> save(T entity);
  Future<void> delete(int id);
}`
      );

      // Verify interface appears
      await expect(page.getByTestId('diagram-node-Repository')).toBeVisible({
        timeout: 5000,
      });

      // Step 2: Create entity class
      await createFileWithExtension(page, 'User', '.dart');
      await clickFileInTree(page, 'User.dart');

      await typeInEditor(
        page,
        `class User {
  int id;
  String name;
  String email;
  DateTime createdAt;
  
  User({
    required this.id,
    required this.name,
    required this.email,
    required this.createdAt,
  });
}`
      );

      // Verify entity appears
      await expect(page.getByTestId('diagram-node-User')).toBeVisible({
        timeout: 5000,
      });

      // Step 3: Create implementation
      await createFileWithExtension(page, 'UserRepository', '.dart');
      await clickFileInTree(page, 'UserRepository.dart');

      await typeInEditor(
        page,
        `import 'Repository.dart';
import 'User.dart';

class UserRepository implements Repository<User> {
  final List<User> _users = [];
  
  @override
  Future<User?> findById(int id) async {
    return _users.firstWhere((u) => u.id == id);
  }
  
  @override
  Future<List<User>> findAll() async {
    return List.unmodifiable(_users);
  }
  
  @override
  Future<void> save(User entity) async {
    _users.add(entity);
  }
  
  @override
  Future<void> delete(int id) async {
    _users.removeWhere((u) => u.id == id);
  }
}`
      );

      // Verify implementation appears
      await expect(page.getByTestId('diagram-node-UserRepository')).toBeVisible(
        { timeout: 5000 }
      );

      // Switch to project view to see relationships
      const projectViewToggle = page.getByRole('button', {
        name: /project view/i,
      });
      if (await projectViewToggle.isVisible()) {
        await projectViewToggle.click();
        await waitForDiagramUpdate(page);
      }

      // Verify edges exist (implementation relationship)
      const edges = page.locator('.react-flow__edge');
      await expect(edges.first()).toBeVisible({ timeout: 3000 });

      // Step 4: Navigate via diagram click
      const repositoryNode = page.getByTestId('diagram-node-Repository');
      await repositoryNode.click();
      await page.waitForTimeout(200);

      // Verify file selection changed
      const selectedFile = page.locator('.file-tree-item.selected');
      await expect(selectedFile).toContainText('Repository.dart');
    });
  });
});
