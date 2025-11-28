/**
 * Integration Tests: Rename Folder Workflow
 * 
 * Tests for folder renaming with recursive file path updates
 * TDD: These tests should FAIL initially before implementation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useStore } from "../../../src/shared/store";
import type { ProjectFile } from "../../../src/shared/types";

describe("Rename Folder Integration", () => {
    beforeEach(() => {
        // Reset store state
        useStore.setState({
            files: [],
            activeFileId: null,
            editorContent: "",
            isDirty: false,
        });
    });

    it("renames folder and updates tree", async () => {
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
        ];

        useStore.setState({ files });

        // Mock ProjectManager
        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async updateFolderPaths() {
                    return 2; // 2 files updated
                }
            },
        }));

        const renameFolder = useStore.getState().renameFolder;
        const result = await renameFolder("/src/models", "/src/entities");

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(2);
        expect(result.newPath).toBe("/src/entities");

        // Verify files have updated paths
        const updatedFiles = useStore.getState().files;
        expect(updatedFiles[0].path).toBe("/src/entities/Person.ts");
        expect(updatedFiles[0].parentPath).toBe("/src/entities");
        expect(updatedFiles[1].path).toBe("/src/entities/Employee.ts");
        expect(updatedFiles[1].parentPath).toBe("/src/entities");
    });

    it("updates all file paths within folder", async () => {
        // Add files with nested structure
        const files: ProjectFile[] = [
            {
                id: "1",
                name: "Person.ts",
                path: "/src/models/Person.ts",
                parentPath: "/src/models",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
            {
                id: "2",
                name: "Employee.ts",
                path: "/src/models/base/Employee.ts",
                parentPath: "/src/models/base",
                content: "",
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

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async updateFolderPaths() {
                    return 2;
                }
            },
        }));

        const renameFolder = useStore.getState().renameFolder;
        await renameFolder("/src/models", "/src/entities");

        const updatedFiles = useStore.getState().files;

        // First two files should have updated paths
        expect(updatedFiles[0].path).toBe("/src/entities/Person.ts");
        expect(updatedFiles[1].path).toBe("/src/entities/base/Employee.ts");
        expect(updatedFiles[1].parentPath).toBe("/src/entities/base");

        // Third file should be unchanged
        expect(updatedFiles[2].path).toBe("/src/utils.ts");
        expect(updatedFiles[2].parentPath).toBe("/src");
    });

    it("keeps editor open with updated path", async () => {
        // Set up active file inside folder being renamed
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

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async updateFolderPaths() {
                    return 1;
                }
            },
        }));

        const renameFolder = useStore.getState().renameFolder;
        await renameFolder("/src/models", "/src/entities");

        // Editor should still be open
        const state = useStore.getState();
        expect(state.activeFileId).toBe("1");
        expect(state.editorContent).toBe("class Person {}");

        // File path should be updated
        const activeFile = state.files.find((f) => f.id === "1");
        expect(activeFile?.path).toBe("/src/entities/Person.ts");
    });

    it("validates new folder name", async () => {
        const files: ProjectFile[] = [
            {
                id: "1",
                name: "Person.ts",
                path: "/src/models/Person.ts",
                parentPath: "/src/models",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        const renameFolder = useStore.getState().renameFolder;

        // Try to rename with invalid characters
        const result = await renameFolder("/src/models", "/src/invalid<name>");

        expect(result.success).toBe(false);
        expect(result.error).toContain("cannot contain");
    });

    it("prevents duplicate folder names", async () => {
        const files: ProjectFile[] = [
            {
                id: "1",
                name: "Person.ts",
                path: "/src/models/Person.ts",
                parentPath: "/src/models",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
            {
                id: "2",
                name: "utils.ts",
                path: "/src/entities/utils.ts",
                parentPath: "/src/entities",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        const renameFolder = useStore.getState().renameFolder;

        // Try to rename to existing folder name
        const result = await renameFolder("/src/models", "/src/entities");

        expect(result.success).toBe(false);
        expect(result.error).toContain("already exists");
    });

    it("rolls back on failure", async () => {
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

        // Mock ProjectManager to throw error
        const { ProjectManager } = await import("../../../src/project-management/ProjectManager");
        const updateSpy = vi.spyOn(ProjectManager.prototype, "updateFolderPaths")
            .mockRejectedValue(new Error("Database error"));

        const renameFolder = useStore.getState().renameFolder;
        const result = await renameFolder("/src/models", "/src/entities");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Database error");

        // Verify files are unchanged (rollback successful)
        const remainingFiles = useStore.getState().files;
        expect(remainingFiles).toHaveLength(1);
        expect(remainingFiles[0].path).toBe("/src/models/Person.ts");
        expect(remainingFiles[0].parentPath).toBe("/src/models");

        updateSpy.mockRestore();
    });

    it("handles empty folder rename", async () => {
        // Empty folders have no files, but rename should still succeed
        useStore.setState({ files: [] });

        const renameFolder = useStore.getState().renameFolder;
        const result = await renameFolder("/src/models", "/src/entities");

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(0);
        expect(result.newPath).toBe("/src/entities");
    });

    it("updates parentPath for nested folders", async () => {
        const files: ProjectFile[] = [
            {
                id: "1",
                name: "Base.ts",
                path: "/src/models/base/Base.ts",
                parentPath: "/src/models/base",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
            {
                id: "2",
                name: "Advanced.ts",
                path: "/src/models/base/advanced/Advanced.ts",
                parentPath: "/src/models/base/advanced",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async updateFolderPaths() {
                    return 2;
                }
            },
        }));

        const renameFolder = useStore.getState().renameFolder;
        await renameFolder("/src/models", "/src/entities");

        const updatedFiles = useStore.getState().files;
        expect(updatedFiles[0].path).toBe("/src/entities/base/Base.ts");
        expect(updatedFiles[0].parentPath).toBe("/src/entities/base");
        expect(updatedFiles[1].path).toBe("/src/entities/base/advanced/Advanced.ts");
        expect(updatedFiles[1].parentPath).toBe("/src/entities/base/advanced");
    });
});
