/**
 * FileTreeManager Contract Tests
 *
 * Tests the API contract for FileTreeManager module
 * Following TDD - these tests should FAIL before implementation
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { ProjectFile } from "../../shared/types";
import { FileTreeManager } from "../FileTreeManager";
import type { FileTreeNode } from "../types";

describe("FileTreeManager Contract Tests", () => {
  let fileTreeManager: FileTreeManager;
  let mockFiles: ProjectFile[];

  beforeEach(() => {
    fileTreeManager = new FileTreeManager();

    // Setup mock files for testing
    mockFiles = [
      {
        id: "file-1",
        name: "Person.ts",
        path: "/src/models/Person.ts",
        parentPath: "/src/models",
        content: "export class Person {}",
        lastModified: Date.now(),
        isActive: false,
      },
      {
        id: "file-2",
        name: "User.ts",
        path: "/src/models/User.ts",
        parentPath: "/src/models",
        content: "export class User {}",
        lastModified: Date.now(),
        isActive: false,
      },
      {
        id: "file-3",
        name: "App.tsx",
        path: "/src/App.tsx",
        parentPath: "/src",
        content: "export default function App() {}",
        lastModified: Date.now(),
        isActive: false,
      },
      {
        id: "file-4",
        name: "index.ts",
        path: "/src/index.ts",
        parentPath: "/src",
        content: "console.log('hello');",
        lastModified: Date.now(),
        isActive: false,
      },
      {
        id: "file-5",
        name: "UserService.ts",
        path: "/src/services/UserService.ts",
        parentPath: "/src/services",
        content: "export class UserService {}",
        lastModified: Date.now(),
        isActive: false,
      },
    ];
  });

  describe("buildTree() - Contract Test T031", () => {
    it("should build hierarchical tree from flat file list", () => {
      const tree = fileTreeManager.buildTree(mockFiles);

      // Should return array of root nodes
      expect(Array.isArray(tree)).toBe(true);
      expect(tree.length).toBeGreaterThan(0);

      // Should have root 'src' folder
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");
      expect(srcFolder).toBeDefined();
      expect(srcFolder?.type).toBe("folder");
      expect(srcFolder?.children).toBeDefined();
    });

    it("should create folder nodes for directory paths", () => {
      const tree = fileTreeManager.buildTree(mockFiles);
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");

      // Should have 'models' subfolder under 'src'
      const modelsFolder = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "models"
      );
      expect(modelsFolder).toBeDefined();
      expect(modelsFolder?.type).toBe("folder");

      // Should have 'services' subfolder under 'src'
      const servicesFolder = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "services"
      );
      expect(servicesFolder).toBeDefined();
      expect(servicesFolder?.type).toBe("folder");
    });

    it("should place files in correct folder nodes", () => {
      const tree = fileTreeManager.buildTree(mockFiles);
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");
      const modelsFolder = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "models"
      );

      // Models folder should contain Person.ts and User.ts
      expect(modelsFolder?.children.length).toBe(2);
      const personFile = modelsFolder?.children.find(
        (node: FileTreeNode) => node.name === "Person.ts"
      );
      const userFile = modelsFolder?.children.find(
        (node: FileTreeNode) => node.name === "User.ts"
      );

      expect(personFile).toBeDefined();
      expect(personFile?.type).toBe("file");
      expect(personFile?.id).toBe("file-1");

      expect(userFile).toBeDefined();
      expect(userFile?.type).toBe("file");
      expect(userFile?.id).toBe("file-2");
    });

    it("should handle files in root correctly", () => {
      const tree = fileTreeManager.buildTree(mockFiles);
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");

      // Should have App.tsx and index.ts directly under src
      const appFile = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "App.tsx"
      );
      const indexFile = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "index.ts"
      );

      expect(appFile).toBeDefined();
      expect(appFile?.type).toBe("file");
      expect(indexFile).toBeDefined();
      expect(indexFile?.type).toBe("file");
    });

    it("should set correct parentId for nodes", () => {
      const tree = fileTreeManager.buildTree(mockFiles);
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");
      const modelsFolder = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "models"
      );
      const personFile = modelsFolder?.children.find(
        (node: FileTreeNode) => node.name === "Person.ts"
      );

      // Root should have null parentId
      expect(srcFolder?.parentId).toBeNull();

      // Models folder should have src as parent
      expect(modelsFolder?.parentId).toBe(srcFolder?.id);

      // Person file should have models as parent
      expect(personFile?.parentId).toBe(modelsFolder?.id);
    });

    it("should extract file extension for file nodes", () => {
      const tree = fileTreeManager.buildTree(mockFiles);
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");
      const modelsFolder = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "models"
      );
      const personFile = modelsFolder?.children.find(
        (node: FileTreeNode) => node.name === "Person.ts"
      );
      const appFile = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "App.tsx"
      );

      expect(personFile?.extension).toBe("ts");
      expect(appFile?.extension).toBe("tsx");
    });

    it("should handle empty file list", () => {
      const tree = fileTreeManager.buildTree([]);
      expect(Array.isArray(tree)).toBe(true);
      expect(tree.length).toBe(0);
    });

    it("should set isExpanded to false for folders by default", () => {
      const tree = fileTreeManager.buildTree(mockFiles);
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");
      const modelsFolder = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "models"
      );

      expect(srcFolder?.isExpanded).toBe(false);
      expect(modelsFolder?.isExpanded).toBe(false);
    });

    it("should handle deeply nested paths", () => {
      const deepFiles: ProjectFile[] = [
        {
          id: "deep-1",
          name: "Deep.ts",
          path: "/src/a/b/c/d/Deep.ts",
          parentPath: "/src/a/b/c/d",
          content: "export class Deep {}",
          lastModified: Date.now(),
          isActive: false,
        },
      ];

      const tree = fileTreeManager.buildTree(deepFiles);
      const srcFolder = tree.find((node: FileTreeNode) => node.name === "src");
      const aFolder = srcFolder?.children.find(
        (node: FileTreeNode) => node.name === "a"
      );
      const bFolder = aFolder?.children.find(
        (node: FileTreeNode) => node.name === "b"
      );
      const cFolder = bFolder?.children.find(
        (node: FileTreeNode) => node.name === "c"
      );
      const dFolder = cFolder?.children.find(
        (node: FileTreeNode) => node.name === "d"
      );
      const deepFile = dFolder?.children.find(
        (node: FileTreeNode) => node.name === "Deep.ts"
      );

      expect(deepFile).toBeDefined();
      expect(deepFile?.type).toBe("file");
      expect(deepFile?.path).toBe("/src/a/b/c/d/Deep.ts");
    });
  });

  describe("findFileInTree() - Contract Test T032", () => {
    let tree: FileTreeNode[];

    beforeEach(() => {
      tree = fileTreeManager.buildTree(mockFiles);
    });

    it("should find file by ID in tree", () => {
      const file = fileTreeManager.findFileInTree(tree, "file-1");

      expect(file).toBeDefined();
      expect(file?.name).toBe("Person.ts");
      expect(file?.id).toBe("file-1");
      expect(file?.type).toBe("file");
    });

    it("should find nested files", () => {
      const userFile = fileTreeManager.findFileInTree(tree, "file-2");
      const userServiceFile = fileTreeManager.findFileInTree(tree, "file-5");

      expect(userFile).toBeDefined();
      expect(userFile?.name).toBe("User.ts");
      expect(userServiceFile).toBeDefined();
      expect(userServiceFile?.name).toBe("UserService.ts");
    });

    it("should return undefined for non-existent file ID", () => {
      const file = fileTreeManager.findFileInTree(tree, "non-existent-id");
      expect(file).toBeUndefined();
    });

    it("should search recursively through all folders", () => {
      const deepFile = fileTreeManager.findFileInTree(tree, "file-5");

      // File is nested in /src/services/
      expect(deepFile).toBeDefined();
      expect(deepFile?.path).toBe("/src/services/UserService.ts");
    });

    it("should handle empty tree", () => {
      const emptyTree: FileTreeNode[] = [];
      const file = fileTreeManager.findFileInTree(emptyTree, "file-1");
      expect(file).toBeUndefined();
    });

    it("should not return folder nodes when searching by file ID", () => {
      // Try to find a folder node by its generated ID
      const srcFolder = tree.find((node) => node.name === "src");
      const folderResult = fileTreeManager.findFileInTree(
        tree,
        srcFolder?.id || ""
      );

      // Should only return file nodes, not folders
      // (or return folder if fileId happens to match a folder ID, but typically we search for files)
      if (folderResult) {
        expect(folderResult.type).toBe("file");
      }
    });
  });
});
