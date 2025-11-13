/**
 * Integration Test: Create File Workflow
 *
 * Tests the complete flow: Add button → file creation → store update
 * Task: T030 [US1]
 */

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { ProjectManager } from "../../src/project-management/ProjectManager";
import { useStore } from "../../src/shared/store";

describe("Create File Integration Test (T030)", () => {
  let projectManager: ProjectManager;
  let testDbName: string;

  beforeEach(async () => {
    // Reset store
    useStore.setState({
      files: [],
      activeFileId: null,
    });

    // Create isolated database for each test
    testDbName = `test-db-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;
    projectManager = new ProjectManager(testDbName);
    await projectManager.initialize();
  });

  it("should create class file and update store", async () => {
    // Simulate user clicking Add button → New Class
    const file = await projectManager.createFile("Employee", "class");

    // Verify file was created
    expect(file).toBeDefined();
    expect(file.name).toBe("Employee.ts");
    expect(file.content).toContain("export class Employee");

    // Simulate updating the store (as the hook would do)
    useStore.getState().addFile(file);

    // Verify store was updated
    const storeFiles = useStore.getState().files;
    expect(storeFiles).toHaveLength(1);
    expect(storeFiles[0].id).toBe(file.id);
    expect(storeFiles[0].name).toBe("Employee.ts");
  });

  it("should create interface file and update store", async () => {
    // Simulate user clicking Add button → New Interface
    const file = await projectManager.createFile("IProduct", "interface");

    // Verify file was created
    expect(file).toBeDefined();
    expect(file.name).toBe("IProduct.ts");
    expect(file.content).toContain("export interface IProduct");

    // Simulate updating the store (as the hook would do)
    useStore.getState().addFile(file);

    // Verify store was updated
    const storeFiles = useStore.getState().files;
    expect(storeFiles).toHaveLength(1);
    expect(storeFiles[0].id).toBe(file.id);
    expect(storeFiles[0].name).toBe("IProduct.ts");
  });

  it("should handle multiple file creations", async () => {
    // Create multiple files
    const classFile = await projectManager.createFile("User", "class");
    const interfaceFile = await projectManager.createFile("IUser", "interface");
    const classFile2 = await projectManager.createFile("Admin", "class");

    // Update store
    useStore.getState().addFile(classFile);
    useStore.getState().addFile(interfaceFile);
    useStore.getState().addFile(classFile2);

    // Verify all files are in store
    const storeFiles = useStore.getState().files;
    expect(storeFiles).toHaveLength(3);

    // Verify files are correctly stored
    expect(storeFiles.find((f) => f.name === "User.ts")).toBeDefined();
    expect(storeFiles.find((f) => f.name === "IUser.ts")).toBeDefined();
    expect(storeFiles.find((f) => f.name === "Admin.ts")).toBeDefined();
  });

  it("should preserve file creation order in store", async () => {
    const file1 = await projectManager.createFile("Alpha", "class");
    const file2 = await projectManager.createFile("Beta", "interface");
    const file3 = await projectManager.createFile("Gamma", "class");

    useStore.getState().addFile(file1);
    useStore.getState().addFile(file2);
    useStore.getState().addFile(file3);

    const storeFiles = useStore.getState().files;

    // Files should be added in the order they were created
    expect(storeFiles[0].name).toBe("Alpha.ts");
    expect(storeFiles[1].name).toBe("Beta.ts");
    expect(storeFiles[2].name).toBe("Gamma.ts");
  });

  it("should persist files to IndexedDB and reload them", async () => {
    // Create files
    await projectManager.createFile("Person", "class");
    await projectManager.createFile("IAnimal", "interface");

    // Simulate app restart - create new ProjectManager instance with same DB
    const newProjectManager = new ProjectManager(testDbName);
    await newProjectManager.initialize();

    // Load files
    const files = await newProjectManager.getAllFiles();

    // Verify files were persisted
    expect(files).toHaveLength(2);
    expect(files.find((f) => f.name === "Person.ts")).toBeDefined();
    expect(files.find((f) => f.name === "IAnimal.ts")).toBeDefined();

    // Update store with loaded files
    useStore.getState().setFiles(files);

    // Verify store has correct files
    expect(useStore.getState().files).toHaveLength(2);
  });
});
