/**
 * Integration Tests: Delete Folder Workflow
 * 
 * Tests for folder deletion with recursive file deletion
 * TDD: These tests should FAIL initially before implementation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useStore } from "../../../src/shared/store";
import type { ProjectFile } from "../../../src/shared/types";

// Mock ProjectManager at module level
vi.mock("@/project-management/ProjectManager", () => ({
    ProjectManager: class {
        async deleteFolderContents() {
            return 2; // 2 files deleted
        }
        async deleteFolder() {
            return; // void
        }
    },
}));

describe("Delete Folder Integration", () => {
    beforeEach(() => {
        // Reset store state
        useStore.setState({
            files: [],
            activeFileId: null,
            editorContent: "",
            isDirty: false,
        });
    });

    it("deletes empty folder", async () => {
        // Empty folders are virtual, so this tests the deletion of a folder
        // when it contains no files
        const deleteFolder = useStore.getState().deleteFolder;

        const result = await deleteFolder("/src/empty-folder");

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(0);
    });

    it("deletes folder with files recursively", async () => {
        // Add files to store
        const files: ProjectFile[] = [
            {
                id: "1",
                name: "Person.ts",
                path: "/src/models/Person.ts",
                parentPath: "/src/models",
                content: "class Person {}",
                lastModified: Date.now(),
                isActive: false,
            },
            {
                id: "2",
                name: "Employee.ts",
                path: "/src/models/Employee.ts",
                parentPath: "/src/models",
                content: "class Employee {}",
                lastModified: Date.now(),
                isActive: false,
            },
            {
                id: "3",
                name: "utils.ts",
                path: "/src/utils.ts",
                parentPath: "/src",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        const deleteFolder = useStore.getState().deleteFolder;
        const result = await deleteFolder("/src/models");

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(2);

        // Verify files are removed from store
        const remainingFiles = useStore.getState().files;
        expect(remainingFiles).toHaveLength(1);
        expect(remainingFiles[0].path).toBe("/src/utils.ts");
    });

    it("closes editor when active file is deleted", async () => {
        // Add file to store and set as active
        const file: ProjectFile = {
            id: "1",
            name: "Person.ts",
            path: "/src/models/Person.ts",
            parentPath: "/src/models",
            content: "class Person {}",
            lastModified: Date.now(),
            isActive: true,
        };

        useStore.setState({
            files: [file],
            activeFileId: "1",
            editorContent: "class Person {}",
            isDirty: false,
        });

        const deleteFolder = useStore.getState().deleteFolder;
        await deleteFolder("/src/models");

        // Verify editor is closed
        const state = useStore.getState();
        expect(state.activeFileId).toBeNull();
        expect(state.editorContent).toBe("");
        expect(state.isDirty).toBe(false);
    });

    it("clears diagram when active file is deleted", async () => {
        const file: ProjectFile = {
            id: "1",
            name: "Person.ts",
            path: "/src/models/Person.ts",
            parentPath: "/src/models",
            content: "class Person {}",
            lastModified: Date.now(),
            isActive: true,
        };

        useStore.setState({
            files: [file],
            activeFileId: "1",
            nodes: [
                {
                    id: "Person",
                    type: "class",
                    data: { name: "Person", properties: [], methods: [], fileId: "1" },
                    position: { x: 0, y: 0 },
                    width: 200,
                    height: 100,
                },
            ],
            edges: [],
        });

        const deleteFolder = useStore.getState().deleteFolder;
        await deleteFolder("/src/models");

        // Verify diagram is cleared (will be handled by editor controller)
        const state = useStore.getState();
        expect(state.activeFileId).toBeNull();
    });

    it("shows confirmation for non-empty folders", async () => {
        // This test verifies UI behavior - confirmation dialog should show
        // when deleting a folder with contents

        // We test this by checking that DeleteConfirmDialog accepts
        // a fileCount prop for folder deletion

        const { DeleteConfirmDialog } = await import("../../../src/file-tree/DeleteConfirmDialog");
        const user = userEvent.setup();

        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <DeleteConfirmDialog
                open={true}
                fileName="models"
                fileCount={5}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );

        // Should show folder-specific message with file count
        expect(screen.getByText(/5 files/i)).toBeTruthy();

        // Click confirm
        const confirmButton = screen.getByRole("button", { name: /delete/i });
        await user.click(confirmButton);

        expect(onConfirm).toHaveBeenCalled();
    });

    it("rolls back on IndexedDB failure", async () => {
        const files: ProjectFile[] = [
            {
                id: "1",
                name: "Person.ts",
                path: "/src/models/Person.ts",
                parentPath: "/src/models",
                content: "class Person {}",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        // Spy on ProjectManager's deleteFolderContents and make it throw
        const { ProjectManager } = await import("../../../src/project-management/ProjectManager");
        const deleteSpy = vi.spyOn(ProjectManager.prototype, "deleteFolderContents")
            .mockRejectedValue(new Error("Database error"));

        const deleteFolder = useStore.getState().deleteFolder;
        const result = await deleteFolder("/src/models");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Database error");

        // Verify files are still in store (rollback successful)
        const remainingFiles = useStore.getState().files;
        expect(remainingFiles).toHaveLength(1);
        expect(remainingFiles[0].id).toBe("1");

        // Clean up spy
        deleteSpy.mockRestore();
    });

    it("handles nested folder deletion", async () => {
        const files: ProjectFile[] = [
            {
                id: "1",
                name: "Person.ts",
                path: "/src/models/base/Person.ts",
                parentPath: "/src/models/base",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
            {
                id: "2",
                name: "Employee.ts",
                path: "/src/models/Employee.ts",
                parentPath: "/src/models",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        const deleteFolder = useStore.getState().deleteFolder;
        const result = await deleteFolder("/src/models");

        // Should delete both files (including nested)
        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(2);

        const remainingFiles = useStore.getState().files;
        expect(remainingFiles).toHaveLength(0);
    });
});
