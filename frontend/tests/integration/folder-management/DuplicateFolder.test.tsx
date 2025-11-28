/**
 * Integration Tests: Duplicate Folder Workflow
 * 
 * Tests for folder duplication with recursive file copying
 * TDD: These tests should FAIL initially before implementation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useStore } from "../../../src/shared/store";
import type { ProjectFile } from "../../../src/shared/types";

describe("Duplicate Folder Integration", () => {
    beforeEach(() => {
        // Reset store state
        useStore.setState({
            files: [],
            activeFileId: null,
            editorContent: "",
            isDirty: false,
        });
    });

    it("duplicates folder with unique name", async () => {
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
        ];

        useStore.setState({ files });

        // Mock ProjectManager
        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async duplicateFolderContents() {
                    return ["new-id-1"]; // Returns new file IDs
                }
            },
        }));

        const duplicateFolder = useStore.getState().duplicateFolder;
        const result = await duplicateFolder("/src/models");

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(1);
        expect(result.newPath).toBe("/src/models copy");
    });

    it("copies all files recursively", async () => {
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
                name: "Base.ts",
                path: "/src/models/base/Base.ts",
                parentPath: "/src/models/base",
                content: "class Base {}",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async duplicateFolderContents() {
                    return ["new-id-1", "new-id-2"];
                }
            },
        }));

        const duplicateFolder = useStore.getState().duplicateFolder;
        const result = await duplicateFolder("/src/models");

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(2);

        // Verify both original and copied files exist
        const allFiles = useStore.getState().files;
        expect(allFiles).toHaveLength(4); // 2 original + 2 duplicated

        // Check original files still exist
        expect(allFiles.some((f) => f.path === "/src/models/Person.ts")).toBe(true);
        expect(allFiles.some((f) => f.path === "/src/models/base/Base.ts")).toBe(true);

        // Check duplicated files exist with "copy" suffix
        expect(allFiles.some((f) => f.path === "/src/models copy/Person.ts")).toBe(true);
        expect(allFiles.some((f) => f.path === "/src/models copy/base/Base.ts")).toBe(true);
    });

    it("generates unique file IDs", async () => {
        const originalFile: ProjectFile = {
            id: "original-1",
            name: "Person.ts",
            path: "/src/models/Person.ts",
            parentPath: "/src/models",
            content: "class Person {}",
            lastModified: Date.now(),
            isActive: false,
        };

        useStore.setState({ files: [originalFile] });

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async duplicateFolderContents() {
                    return ["new-unique-id"];
                }
            },
        }));

        const duplicateFolder = useStore.getState().duplicateFolder;
        await duplicateFolder("/src/models");

        const allFiles = useStore.getState().files;
        const duplicatedFile = allFiles.find((f) => f.path === "/src/models copy/Person.ts");

        // Verify new file has unique ID
        expect(duplicatedFile).toBeDefined();
        expect(duplicatedFile?.id).not.toBe("original-1");
    });

    it("generates unique folder name when copy exists", async () => {
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
                name: "Helper.ts",
                path: "/src/models copy/Helper.ts",
                parentPath: "/src/models copy",
                content: "",
                lastModified: Date.now(),
                isActive: false,
            },
        ];

        useStore.setState({ files });

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async duplicateFolderContents() {
                    return ["new-id"];
                }
            },
        }));

        const duplicateFolder = useStore.getState().duplicateFolder;
        const result = await duplicateFolder("/src/models");

        // Should generate "models copy 2" since "models copy" exists
        expect(result.newPath).toBe("/src/models copy 2");
    });

    it("preserves file content in duplicates", async () => {
        const originalContent = `
class Person {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}
`;
        const file: ProjectFile = {
            id: "1",
            name: "Person.ts",
            path: "/src/models/Person.ts",
            parentPath: "/src/models",
            content: originalContent,
            lastModified: Date.now(),
            isActive: false,
        };

        useStore.setState({ files: [file] });

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async duplicateFolderContents() {
                    return ["new-id"];
                }
            },
        }));

        const duplicateFolder = useStore.getState().duplicateFolder;
        await duplicateFolder("/src/models");

        const allFiles = useStore.getState().files;
        const duplicatedFile = allFiles.find((f) => f.path === "/src/models copy/Person.ts");

        expect(duplicatedFile?.content).toBe(originalContent);
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
        const duplicateSpy = vi.spyOn(ProjectManager.prototype, "duplicateFolderContents")
            .mockRejectedValue(new Error("Database error"));

        const duplicateFolder = useStore.getState().duplicateFolder;
        const result = await duplicateFolder("/src/models");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Database error");

        // Verify only original file exists (no partial duplicates)
        const remainingFiles = useStore.getState().files;
        expect(remainingFiles).toHaveLength(1);
        expect(remainingFiles[0].path).toBe("/src/models/Person.ts");

        duplicateSpy.mockRestore();
    });

    it("handles empty folder duplication", async () => {
        // Empty folders have no files
        useStore.setState({ files: [] });

        const duplicateFolder = useStore.getState().duplicateFolder;
        const result = await duplicateFolder("/src/models");

        expect(result.success).toBe(true);
        expect(result.affectedCount).toBe(0);
        expect(result.newPath).toBe("/src/models copy");
    });

    it("handles storage quota exceeded error", async () => {
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

        // Mock ProjectManager to throw quota error
        const { ProjectManager } = await import("../../../src/project-management/ProjectManager");
        const duplicateSpy = vi.spyOn(ProjectManager.prototype, "duplicateFolderContents")
            .mockRejectedValue(new Error("QuotaExceededError: Storage quota exceeded"));

        const duplicateFolder = useStore.getState().duplicateFolder;
        const result = await duplicateFolder("/src/models");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Storage quota exceeded");

        duplicateSpy.mockRestore();
    });

    it("updates lastModified timestamp on duplicated files", async () => {
        const originalTime = Date.now() - 10000; // 10 seconds ago
        const file: ProjectFile = {
            id: "1",
            name: "Person.ts",
            path: "/src/models/Person.ts",
            parentPath: "/src/models",
            content: "",
            lastModified: originalTime,
            isActive: false,
        };

        useStore.setState({ files: [file] });

        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async duplicateFolderContents() {
                    return ["new-id"];
                }
            },
        }));

        const duplicateFolder = useStore.getState().duplicateFolder;
        await duplicateFolder("/src/models");

        const allFiles = useStore.getState().files;
        const duplicatedFile = allFiles.find((f) => f.path === "/src/models copy/Person.ts");

        // Duplicated file should have newer timestamp
        expect(duplicatedFile?.lastModified).toBeGreaterThan(originalTime);
    });
});
