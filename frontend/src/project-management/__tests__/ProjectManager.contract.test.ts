/**
 * Contract Tests for ProjectManager
 *
 * Tests based on: specs/001-uml-graph-visualizer/contracts/project-manager.contract.md
 * User Story 1: Create Class or Interface via Add Button
 *
 * NOTE: These tests should FAIL initially (TDD approach)
 */

import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FileExistsError,
  InvalidFileNameError,
} from "../../shared/types/errors";
import { ProjectManager } from "../ProjectManager";

describe("ProjectManager Contract Tests - User Story 1", () => {
  let projectManager: ProjectManager;
  let testDbName: string;

  beforeEach(async () => {
    // Create a unique database name for each test to ensure isolation
    testDbName = `test-db-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;
    projectManager = new ProjectManager(testDbName);
    await projectManager.initialize();
  });

  afterEach(async () => {
    // No cleanup needed - each test uses a unique database
  });

  describe("T019: Contract test for createFile('class')", () => {
    it("should create a new class file with proper template", async () => {
      const file = await projectManager.createFile("Person", "class");

      // Verify file structure
      expect(file).toMatchObject({
        name: "Person.ts",
        path: "/src/Person.ts",
        isActive: false,
      });

      // Verify ID is generated
      expect(file.id).toBeDefined();
      expect(typeof file.id).toBe("string");
      expect(file.id.length).toBeGreaterThan(0);

      // Verify timestamp
      expect(file.lastModified).toBeDefined();
      expect(typeof file.lastModified).toBe("number");
      expect(file.lastModified).toBeLessThanOrEqual(Date.now());

      // Verify content has class template
      expect(file.content).toContain("export class Person");
      expect(file.content).toMatch(/export\s+class\s+Person\s*\{/);
    });

    it("should persist class file to IndexedDB", async () => {
      const file = await projectManager.createFile("MyClass", "class");

      // Retrieve directly from database to verify persistence
      const retrieved = await projectManager.getFile(file.id);
      expect(retrieved).toEqual(file);
    });

    it("should throw FileExistsError for duplicate file names", async () => {
      await projectManager.createFile("Person", "class");

      await expect(
        projectManager.createFile("Person", "class")
      ).rejects.toThrow(FileExistsError);
    });

    it("should throw InvalidFileNameError for invalid characters", async () => {
      const invalidNames = [
        "My/Class",
        "My\\Class",
        "My:Class",
        "My*Class",
        'My"Class',
        "My<Class",
        "My>Class",
        "My|Class",
      ];

      for (const name of invalidNames) {
        await expect(projectManager.createFile(name, "class")).rejects.toThrow(
          InvalidFileNameError
        );
      }
    });

    it("should throw InvalidFileNameError for empty file name", async () => {
      await expect(projectManager.createFile("", "class")).rejects.toThrow(
        InvalidFileNameError
      );
    });

    it("should auto-append .ts extension if not provided", async () => {
      const file = await projectManager.createFile("MyClass.ts", "class");
      expect(file.name).toBe("MyClass.ts");

      const file2 = await projectManager.createFile("AnotherClass", "class");
      expect(file2.name).toBe("AnotherClass.ts");
    });
  });

  describe("T020: Contract test for createFile('interface')", () => {
    it("should create a new interface file with proper template", async () => {
      const file = await projectManager.createFile("IUser", "interface");

      // Verify file structure
      expect(file).toMatchObject({
        name: "IUser.ts",
        path: "/src/IUser.ts",
        isActive: false,
      });

      // Verify ID and timestamp
      expect(file.id).toBeDefined();
      expect(file.lastModified).toBeDefined();

      // Verify content has interface template
      expect(file.content).toContain("export interface IUser");
      expect(file.content).toMatch(/export\s+interface\s+IUser\s*\{/);
    });

    it("should persist interface file to IndexedDB", async () => {
      const file = await projectManager.createFile("IProduct", "interface");

      const retrieved = await projectManager.getFile(file.id);
      expect(retrieved).toEqual(file);
    });

    it("should throw FileExistsError for duplicate interface names", async () => {
      await projectManager.createFile("IUser", "interface");

      await expect(
        projectManager.createFile("IUser", "interface")
      ).rejects.toThrow(FileExistsError);
    });
  });

  describe("T021: Contract test for getAllFiles()", () => {
    it("should return empty array when no files exist", async () => {
      const files = await projectManager.getAllFiles();
      expect(files).toEqual([]);
    });

    it("should return all files in alphabetical order by path", async () => {
      await projectManager.createFile("Zoo", "class");
      await projectManager.createFile("Alpha", "interface");
      await projectManager.createFile("Beta", "class");

      const files = await projectManager.getAllFiles();

      expect(files).toHaveLength(3);
      expect(files[0].name).toBe("Alpha.ts");
      expect(files[1].name).toBe("Beta.ts");
      expect(files[2].name).toBe("Zoo.ts");
    });

    it("should include all file properties", async () => {
      await projectManager.createFile("Test", "class");
      const files = await projectManager.getAllFiles();

      expect(files[0]).toHaveProperty("id");
      expect(files[0]).toHaveProperty("name");
      expect(files[0]).toHaveProperty("path");
      expect(files[0]).toHaveProperty("content");
      expect(files[0]).toHaveProperty("lastModified");
      expect(files[0]).toHaveProperty("isActive");
    });

    it("should handle files created in different order", async () => {
      await projectManager.createFile("Charlie", "class");
      await projectManager.createFile("Alpha", "interface");
      await projectManager.createFile("Bravo", "class");

      const files = await projectManager.getAllFiles();

      // Should be sorted by path, not creation order
      expect(files.map((f: { name: string }) => f.name)).toEqual([
        "Alpha.ts",
        "Bravo.ts",
        "Charlie.ts",
      ]);
    });
  });

  describe("Additional ProjectManager tests for completeness", () => {
    it("should handle getFile() with non-existent ID", async () => {
      const file = await projectManager.getFile("non-existent-id");
      expect(file).toBeNull();
    });

    it("should create unique IDs for each file", async () => {
      const file1 = await projectManager.createFile("Class1", "class");
      const file2 = await projectManager.createFile("Class2", "class");

      expect(file1.id).not.toBe(file2.id);
    });

    it("should set isActive to false for newly created files", async () => {
      const file = await projectManager.createFile("Test", "class");
      expect(file.isActive).toBe(false);
    });
  });
});
