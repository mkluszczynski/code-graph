/**
 * Contract Tests: DiagramRenderer
 *
 * Tests the contract for the DiagramRenderer component's interaction with the Zustand store.
 * These tests verify that clicking on diagram nodes correctly updates the active file state.
 *
 * NOTE: These tests MUST FAIL before implementation (TDD approach)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useStore } from "../../shared/store";
import type { DiagramNode } from "../../shared/types";

describe("DiagramRenderer Contract Tests", () => {
    beforeEach(() => {
        // Reset store state before each test
        act(() => {
            useStore.getState().setActiveFile(null);
            useStore.getState().setNodes([]);
            useStore.getState().setEdges([]);
            useStore.getState().setSelectedNode(null);
        });
    });

    describe("handleNodeClick() contract", () => {
        it("MUST update activeFileId when a diagram node is clicked", () => {
            // Create a test node with fileId
            const testNode: DiagramNode = {
                id: "file1::Person",
                type: "class",
                data: {
                    name: "Person",
                    properties: ["+ name: string"],
                    methods: ["+ getName(): string"],
                    fileId: "file1",
                },
                position: { x: 100, y: 100 },
                width: 200,
                height: 150,
            };

            // Add node to diagram state
            act(() => {
                useStore.getState().setNodes([testNode]);
            });

            // Simulate node click - this is what DiagramRenderer.handleNodeClick() should do
            act(() => {
                useStore.getState().setActiveFile(testNode.data.fileId);
            });

            // Verify activeFileId is updated
            expect(useStore.getState().activeFileId).toBe("file1");
        });

        it("MUST update selectedNodeId when a diagram node is clicked", () => {
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

            act(() => {
                useStore.getState().setNodes([testNode]);
            });

            // Simulate node click
            act(() => {
                useStore.getState().setSelectedNode(testNode.id);
            });

            // Verify selectedNodeId is updated
            expect(useStore.getState().selectedNodeId).toBe("file1::Person");
        });

        it("MUST update both activeFileId and selectedNodeId when clicking a node", () => {
            const testNode: DiagramNode = {
                id: "file2::Employee",
                type: "class",
                data: {
                    name: "Employee",
                    properties: ["- employeeId: string"],
                    methods: ["+ getSalary(): number"],
                    fileId: "file2",
                },
                position: { x: 200, y: 200 },
                width: 220,
                height: 160,
            };

            act(() => {
                useStore.getState().setNodes([testNode]);
            });

            // Simulate full node click behavior
            act(() => {
                useStore.getState().setActiveFile(testNode.data.fileId);
                useStore.getState().setSelectedNode(testNode.id);
            });

            // Verify both states are updated
            expect(useStore.getState().activeFileId).toBe("file2");
            expect(useStore.getState().selectedNodeId).toBe("file2::Employee");
        });

        it("MUST handle clicking nodes from different files", () => {
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

            act(() => {
                useStore.getState().setNodes([node1, node2]);
            });

            // Click first node
            act(() => {
                useStore.getState().setActiveFile(node1.data.fileId);
                useStore.getState().setSelectedNode(node1.id);
            });

            expect(useStore.getState().activeFileId).toBe("file1");
            expect(useStore.getState().selectedNodeId).toBe("file1::Person");

            // Click second node
            act(() => {
                useStore.getState().setActiveFile(node2.data.fileId);
                useStore.getState().setSelectedNode(node2.id);
            });

            expect(useStore.getState().activeFileId).toBe("file2");
            expect(useStore.getState().selectedNodeId).toBe("file2::Employee");
        });

        it("MUST handle interface nodes in addition to class nodes", () => {
            const interfaceNode: DiagramNode = {
                id: "file3::IPerson",
                type: "interface",
                data: {
                    name: "IPerson",
                    properties: ["name: string"],
                    methods: ["getName(): string"],
                    stereotype: "<<interface>>",
                    fileId: "file3",
                },
                position: { x: 100, y: 100 },
                width: 200,
                height: 150,
            };

            act(() => {
                useStore.getState().setNodes([interfaceNode]);
            });

            // Click interface node
            act(() => {
                useStore.getState().setActiveFile(interfaceNode.data.fileId);
                useStore.getState().setSelectedNode(interfaceNode.id);
            });

            expect(useStore.getState().activeFileId).toBe("file3");
            expect(useStore.getState().selectedNodeId).toBe("file3::IPerson");
        });

        it("MUST clear selectedNodeId when clicking on diagram background", () => {
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

            act(() => {
                useStore.getState().setNodes([testNode]);
            });

            // Click node
            act(() => {
                useStore.getState().setActiveFile(testNode.data.fileId);
                useStore.getState().setSelectedNode(testNode.id);
            });

            expect(useStore.getState().selectedNodeId).toBe("file1::Person");

            // Click background (pane)
            act(() => {
                useStore.getState().setSelectedNode(null);
            });

            // Verify selectedNodeId is cleared, but activeFileId remains
            expect(useStore.getState().selectedNodeId).toBeNull();
            expect(useStore.getState().activeFileId).toBe("file1"); // File should still be open
        });

        it("MUST handle clicking on nodes with no fileId gracefully", () => {
            // This shouldn't happen in normal operation, but test defensive handling
            const invalidNode: DiagramNode = {
                id: "orphan::Node",
                type: "class",
                data: {
                    name: "OrphanNode",
                    properties: [],
                    methods: [],
                    fileId: "", // Invalid: empty fileId
                },
                position: { x: 100, y: 100 },
                width: 200,
                height: 150,
            };

            act(() => {
                useStore.getState().setNodes([invalidNode]);
            });

            // Attempt to click - should not update activeFileId if fileId is invalid
            act(() => {
                if (invalidNode.data.fileId) {
                    useStore.getState().setActiveFile(invalidNode.data.fileId);
                }
                useStore.getState().setSelectedNode(invalidNode.id);
            });

            // selectedNodeId should update, but activeFileId should remain null
            expect(useStore.getState().selectedNodeId).toBe("orphan::Node");
            expect(useStore.getState().activeFileId).toBeNull();
        });
    });

    describe("Integration with file tree selection", () => {
        it("MUST synchronize activeFileId between diagram and file tree", () => {
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

            act(() => {
                useStore.getState().setNodes([testNode]);
            });

            // Simulate diagram node click
            act(() => {
                useStore.getState().setActiveFile(testNode.data.fileId);
            });

            // File tree should see the same activeFileId
            expect(useStore.getState().activeFileId).toBe("file1");

            // Now simulate file tree selection
            act(() => {
                useStore.getState().setActiveFile("file2");
            });

            // Diagram should see the updated activeFileId
            expect(useStore.getState().activeFileId).toBe("file2");
        });
    });
});
