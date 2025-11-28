/**
 * Unit Tests: Folder Operations
 * 
 * Tests for folder utility functions (path manipulation, validation, name generation)
 * TDD: These tests should FAIL initially before implementation
 */

import { describe, it, expect } from "vitest";
import type { ProjectFile } from "../../../src/shared/types";
import {
    getFilesInFolder,
    validateFolderDepth,
    generateDuplicateFolderName,
    getParentPath,
    updatePathForRename,
    MAX_FOLDER_DEPTH,
} from "../../../src/file-tree/FolderOperations";

describe("FolderOperations", () => {
    describe("getFilesInFolder", () => {
        it("returns files whose path starts with folder path", () => {
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
                    path: "/src/models/Employee.ts",
                    parentPath: "/src/models",
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

            const result = getFilesInFolder(files, "/src/models");
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe("Person.ts");
            expect(result[1].name).toBe("Employee.ts");
        });

        it("returns empty array for empty folder", () => {
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

            const result = getFilesInFolder(files, "/src/components");
            expect(result).toHaveLength(0);
        });

        it("includes nested files recursively", () => {
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
                    path: "/src/models/nested/Employee.ts",
                    parentPath: "/src/models/nested",
                    content: "",
                    lastModified: Date.now(),
                    isActive: false,
                },
            ];

            const result = getFilesInFolder(files, "/src/models");
            expect(result).toHaveLength(2);
            expect(result.some((f: ProjectFile) => f.path === "/src/models/nested/Employee.ts")).toBe(true);
        });

        it("does not include files in sibling folders", () => {
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
                    name: "Button.tsx",
                    path: "/src/components/Button.tsx",
                    parentPath: "/src/components",
                    content: "",
                    lastModified: Date.now(),
                    isActive: false,
                },
            ];

            const result = getFilesInFolder(files, "/src/models");
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe("Person.ts");
        });

        it("handles folder path with trailing slash", () => {
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

            const result = getFilesInFolder(files, "/src/models/");
            expect(result).toHaveLength(1);
        });
    });

    describe("validateFolderDepth", () => {
        it("allows folders up to max depth", () => {
            const path = "/a/b/c/d/e/f/g/h/i/j"; // 10 levels
            const result = validateFolderDepth(path, 10);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it("rejects folders exceeding max depth", () => {
            const path = "/a/b/c/d/e/f/g/h/i/j/k"; // 11 levels
            const result = validateFolderDepth(path, 10);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("Maximum folder nesting depth");
            expect(result.error).toContain("10");
        });

        it("uses default depth of 10 when not specified", () => {
            const path = "/a/b/c/d/e/f/g/h/i/j/k"; // 11 levels
            const result = validateFolderDepth(path);
            expect(result.isValid).toBe(false);
        });

        it("handles root level folder", () => {
            const result = validateFolderDepth("/src");
            expect(result.isValid).toBe(true);
        });

        it("uses exported MAX_FOLDER_DEPTH constant", () => {
            expect(MAX_FOLDER_DEPTH).toBe(10);
        });
    });

    describe("generateDuplicateFolderName", () => {
        it('returns "name copy" for first duplicate', () => {
            const result = generateDuplicateFolderName("models", []);
            expect(result).toBe("models copy");
        });

        it('returns "name copy 2" when "name copy" exists', () => {
            const result = generateDuplicateFolderName("models", ["models copy"]);
            expect(result).toBe("models copy 2");
        });

        it("finds next available number", () => {
            const existing = ["models copy", "models copy 2", "models copy 3"];
            const result = generateDuplicateFolderName("models", existing);
            expect(result).toBe("models copy 4");
        });

        it("skips gaps in numbering", () => {
            const existing = ["models copy", "models copy 3"];
            const result = generateDuplicateFolderName("models", existing);
            expect(result).toBe("models copy 2");
        });

        it("handles folders with spaces in name", () => {
            const result = generateDuplicateFolderName("my models", []);
            expect(result).toBe("my models copy");
        });
    });

    describe("getParentPath", () => {
        it("returns parent folder path", () => {
            expect(getParentPath("/src/models/Person.ts")).toBe("/src/models");
        });

        it('returns "/" for root-level items', () => {
            expect(getParentPath("/src")).toBe("/");
        });

        it("handles paths with trailing slash", () => {
            expect(getParentPath("/src/models/")).toBe("/src");
        });

        it("handles nested paths correctly", () => {
            expect(getParentPath("/src/models/nested/deep/file.ts")).toBe(
                "/src/models/nested/deep"
            );
        });
    });

    describe("updatePathForRename", () => {
        it("replaces folder prefix in path", () => {
            const result = updatePathForRename(
                "/src/models/Person.ts",
                "/src/models",
                "/src/entities"
            );
            expect(result).toBe("/src/entities/Person.ts");
        });

        it("handles nested paths correctly", () => {
            const result = updatePathForRename(
                "/src/models/nested/Employee.ts",
                "/src/models",
                "/src/entities"
            );
            expect(result).toBe("/src/entities/nested/Employee.ts");
        });

        it("returns original path if folder prefix doesn't match", () => {
            const result = updatePathForRename(
                "/src/components/Button.tsx",
                "/src/models",
                "/src/entities"
            );
            expect(result).toBe("/src/components/Button.tsx");
        });

        it("handles root folder rename", () => {
            const result = updatePathForRename(
                "/old/file.ts",
                "/old",
                "/new"
            );
            expect(result).toBe("/new/file.ts");
        });
    });
});
