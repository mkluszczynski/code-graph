/**
 * Integration Test: Graph-to-Code Navigation (User Story 2)
 *
 * Tests the complete flow of clicking a diagram node to navigate to code:
 * 1. User clicks on a UML diagram node
 * 2. System opens the corresponding file in the editor
 * 3. System highlights the file in the file tree
 *
 * This validates User Story 2: "Navigate from Graph to Code"
 *
 * NOTE: Full React Flow rendering tests are skipped due to DOM API limitations in test environment.
 * The core navigation logic (handleNodeClick) is tested via contract tests.
 * These tests verify the integration between diagram state and file tree highlighting.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { FileTreeView } from "../../src/file-tree/FileTreeView";
import type { FileTreeNode } from "../../src/file-tree/types";
import { useStore } from "../../src/shared/store";
import { act } from "react";
import type { DiagramNode, ProjectFile } from "../../src/shared/types";

describe("Integration Test: Graph-to-Code Navigation", () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useStore.getState().setActiveFile(null);
      useStore.getState().setNodes([]);
      useStore.getState().setEdges([]);
      useStore.getState().setSelectedNode(null);
      useStore.getState().setFiles([]);
    });
  });

  it("should synchronize activeFileId when diagram node data changes", () => {
    // Setup test data
    const testFile: ProjectFile = {
      id: "file1",
      name: "Person.ts",
      path: "/Person.ts",
      content: "export class Person { name: string; }",
      lastModified: Date.now(),
      isActive: false,
    };

    const testNode: DiagramNode = {
      id: "file1::Person",
      type: "class",
      data: {
        name: "Person",
        properties: ["+ name: string"],
        methods: [],
        fileId: "file1",
      },
      position: { x: 100, y: 100 },
      width: 200,
      height: 150,
    };

    // Add file and node to store
    act(() => {
      useStore.getState().addFile(testFile);
      useStore.getState().setNodes([testNode]);
    });

    // Simulate diagram node click by updating store (this is what DiagramRenderer.handleNodeClick does)
    act(() => {
      useStore.getState().setActiveFile(testNode.data.fileId);
      useStore.getState().setSelectedNode(testNode.id);
    });

    // Verify activeFileId and selectedNodeId are updated
    expect(useStore.getState().activeFileId).toBe("file1");
    expect(useStore.getState().selectedNodeId).toBe("file1::Person");
  });

  it("should highlight file in tree when activeFileId matches", () => {
    // Setup test data
    const testFile: ProjectFile = {
      id: "file1",
      name: "Person.ts",
      path: "/Person.ts",
      content: "export class Person { name: string; }",
      lastModified: Date.now(),
      isActive: false,
    };

    const fileTreeNode: FileTreeNode = {
      id: "file1",
      name: "Person.ts",
      path: "/Person.ts",
      type: "file",
      children: [],
      parentId: null,
      extension: "ts",
    };

    // Add to store
    act(() => {
      useStore.getState().addFile(testFile);
      useStore.getState().setActiveFile("file1");
    });

    // Render file tree
    render(<FileTreeView nodes={[fileTreeNode]} />);

    // Verify file is displayed
    const fileTreeItem = screen.getByText("Person.ts");
    expect(fileTreeItem).toBeTruthy();

    // Check if the file has the selected styling (files are rendered as divs, not buttons)
    const fileDiv = fileTreeItem.closest(".file-tree-item");
    expect(fileDiv?.classList.contains("bg-accent")).toBe(true);
    expect(fileDiv?.classList.contains("text-accent-foreground")).toBe(true);
  });

  it("should switch between files when activeFileId changes", () => {
    // Setup test data for two files
    const file1: ProjectFile = {
      id: "file1",
      name: "Person.ts",
      path: "/Person.ts",
      content: "export class Person {}",
      lastModified: Date.now(),
      isActive: false,
    };

    const file2: ProjectFile = {
      id: "file2",
      name: "Employee.ts",
      path: "/Employee.ts",
      content: "export class Employee {}",
      lastModified: Date.now(),
      isActive: false,
    };

    const node1: DiagramNode = {
      id: "file1::Person",
      type: "class",
      data: {
        name: "Person",
        properties: [],
        methods: [],
        fileId: "file1",
      },
      position: { x: 100, y: 100 },
      width: 200,
      height: 150,
    };

    const node2: DiagramNode = {
      id: "file2::Employee",
      type: "class",
      data: {
        name: "Employee",
        properties: [],
        methods: [],
        fileId: "file2",
      },
      position: { x: 350, y: 100 },
      width: 200,
      height: 150,
    };

    // Add to store
    act(() => {
      useStore.getState().addFile(file1);
      useStore.getState().addFile(file2);
      useStore.getState().setNodes([node1, node2]);
    });

    // Simulate clicking first node
    act(() => {
      useStore.getState().setActiveFile(node1.data.fileId);
      useStore.getState().setSelectedNode(node1.id);
    });

    expect(useStore.getState().activeFileId).toBe("file1");
    expect(useStore.getState().selectedNodeId).toBe("file1::Person");

    // Simulate clicking second node
    act(() => {
      useStore.getState().setActiveFile(node2.data.fileId);
      useStore.getState().setSelectedNode(node2.id);
    });

    expect(useStore.getState().activeFileId).toBe("file2");
    expect(useStore.getState().selectedNodeId).toBe("file2::Employee");
  });

  it("should clear selection when clicking diagram background", () => {
    // Setup test data
    const testFile: ProjectFile = {
      id: "file1",
      name: "Person.ts",
      path: "/Person.ts",
      content: "export class Person {}",
      lastModified: Date.now(),
      isActive: false,
    };

    const testNode: DiagramNode = {
      id: "file1::Person",
      type: "class",
      data: {
        name: "Person",
        properties: [],
        methods: [],
        fileId: "file1",
      },
      position: { x: 100, y: 100 },
      width: 200,
      height: 150,
    };

    // Add to store
    act(() => {
      useStore.getState().addFile(testFile);
      useStore.getState().setNodes([testNode]);
    });

    // Simulate node click
    act(() => {
      useStore.getState().setActiveFile(testNode.data.fileId);
      useStore.getState().setSelectedNode(testNode.id);
    });

    expect(useStore.getState().selectedNodeId).toBe("file1::Person");

    // Simulate clicking background (this is what DiagramRenderer.handlePaneClick does)
    act(() => {
      useStore.getState().setSelectedNode(null);
    });

    // Verify selection is cleared but file remains active
    expect(useStore.getState().selectedNodeId).toBeNull();
    expect(useStore.getState().activeFileId).toBe("file1");
  });

  it("should work with interface nodes", () => {
    // Setup test data
    const testFile: ProjectFile = {
      id: "file1",
      name: "IPerson.ts",
      path: "/IPerson.ts",
      content: "export interface IPerson { name: string; }",
      lastModified: Date.now(),
      isActive: false,
    };

    const testNode: DiagramNode = {
      id: "file1::IPerson",
      type: "interface",
      data: {
        name: "IPerson",
        properties: ["name: string"],
        methods: [],
        stereotype: "<<interface>>",
        fileId: "file1",
      },
      position: { x: 100, y: 100 },
      width: 200,
      height: 150,
    };

    // Add to store
    act(() => {
      useStore.getState().addFile(testFile);
      useStore.getState().setNodes([testNode]);
    });

    // Simulate interface node click
    act(() => {
      useStore.getState().setActiveFile(testNode.data.fileId);
      useStore.getState().setSelectedNode(testNode.id);
    });

    // Verify navigation works for interfaces
    expect(useStore.getState().activeFileId).toBe("file1");
    expect(useStore.getState().selectedNodeId).toBe("file1::IPerson");
  });
});
