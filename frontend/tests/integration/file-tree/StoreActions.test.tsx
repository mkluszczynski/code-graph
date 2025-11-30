/**
 * Integration tests for store file operations
 *
 * Tests for file management store actions (delete, rename, duplicate)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useStore } from "../../../src/shared/store";
import type { ProjectFile } from "../../../src/shared/types";

// Mock ProjectManager
const mockDeleteFile = vi.fn();
const mockUpdateFile = vi.fn();
const mockSaveFile = vi.fn();
vi.mock("../../../src/project-management/ProjectManager", () => {
    return {
        ProjectManager: class MockProjectManager {
            async deleteFile(id: string) {
                mockDeleteFile(id);
                // Simulate successful delete
                return Promise.resolve();
            }
            async updateFile(id: string, updates: Partial<ProjectFile>) {
                mockUpdateFile(id, updates);
                // Simulate successful update - return merged file
                return Promise.resolve({ id, ...updates } as ProjectFile);
            }
            async saveFile(file: ProjectFile) {
                mockSaveFile(file);
                // Simulate successful save
                return Promise.resolve();
            }
        },
    };
});

describe("Store File Operations", () => {
    beforeEach(() => {
        // Reset store state before each test
        const store = useStore.getState();
        store.setFiles([]);
        store.setActiveFile(null);
        store.setEditorContent("");
        store.setIsDirty(false);
        mockDeleteFile.mockClear();
        mockUpdateFile.mockClear();
        mockSaveFile.mockClear();
    });

    afterEach(() => {
        // Clean up
        mockDeleteFile.mockClear();
        mockUpdateFile.mockClear();
        mockSaveFile.mockClear();
    });

    describe("deleteFile action", () => {
        it("should delete a file from the store", async () => {
            // Add test files
            const file1: ProjectFile = {
                id: "file-1",
                name: "test1.ts",
                path: "/src/test1.ts",
                content: "class Test1 {}",
                lastModified: Date.now(),
                isActive: false,
            };
            const file2: ProjectFile = {
                id: "file-2",
                name: "test2.ts",
                path: "/src/test2.ts",
                content: "class Test2 {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file1, file2]);

            // Verify initial state
            let state = useStore.getState();
            expect(state.files.length).toBe(2);

            // Delete file1
            await state.deleteFile("file-1");

            // Verify file was removed
            state = useStore.getState();
            expect(state.files.length).toBe(1);
            expect(state.files[0].id).toBe("file-2");
            expect(state.files.find((f) => f.id === "file-1")).toBeUndefined();
        });

        it("should close editor tab when active file is deleted", async () => {
            const file: ProjectFile = {
                id: "active-file",
                name: "active.ts",
                path: "/src/active.ts",
                content: "class Active {}",
                lastModified: Date.now(),
                isActive: true,
            };

            useStore.getState().setFiles([file]);
            useStore.getState().setActiveFile("active-file");
            useStore.getState().setEditorContent("class Active {}");

            // Verify initial state
            let state = useStore.getState();
            expect(state.activeFileId).toBe("active-file");
            expect(state.editorContent).toBe("class Active {}");

            // Delete active file
            await state.deleteFile("active-file");

            // Verify editor was closed
            state = useStore.getState();
            expect(state.activeFileId).toBeNull();
            expect(state.editorContent).toBe("");
            expect(state.isDirty).toBe(false);
        });

        it("should not affect other files when deleting one file", async () => {
            const file1: ProjectFile = {
                id: "file-1",
                name: "test1.ts",
                path: "/src/test1.ts",
                content: "class Test1 {}",
                lastModified: Date.now(),
                isActive: false,
            };
            const file2: ProjectFile = {
                id: "file-2",
                name: "test2.ts",
                path: "/src/test2.ts",
                content: "class Test2 {}",
                lastModified: Date.now(),
                isActive: false,
            };
            const file3: ProjectFile = {
                id: "file-3",
                name: "test3.ts",
                path: "/src/test3.ts",
                content: "class Test3 {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file1, file2, file3]);
            useStore.getState().setActiveFile("file-2");

            // Delete file1 (not active)
            await useStore.getState().deleteFile("file-1");

            // Verify file2 and file3 remain, and file2 is still active
            const state = useStore.getState();
            expect(state.files.length).toBe(2);
            expect(state.files.find((f) => f.id === "file-2")).toBeDefined();
            expect(state.files.find((f) => f.id === "file-3")).toBeDefined();
            expect(state.activeFileId).toBe("file-2");
        });

        it("should handle deleting non-existent file gracefully", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Mock ProjectManager to throw error for non-existent file
            const { ProjectManager } = await import("../../../src/project-management/ProjectManager");
            const originalDeleteFile = ProjectManager.prototype.deleteFile;
            ProjectManager.prototype.deleteFile = vi.fn().mockRejectedValueOnce(
                new Error("File with ID non-existent not found")
            );

            // Attempt to delete non-existent file
            // This should throw an error from ProjectManager
            await expect(useStore.getState().deleteFile("non-existent")).rejects.toThrow();

            // Restore original method
            ProjectManager.prototype.deleteFile = originalDeleteFile;

            // Verify original file is still there
            const state = useStore.getState();
            expect(state.files.length).toBe(1);
            expect(state.files[0].id).toBe("file-1");
        });
    });

    describe("renameFile action", () => {
        it("should rename a file successfully", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "OldName.ts",
                path: "/src/OldName.ts",
                content: "class OldName {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Rename the file
            await useStore.getState().renameFile("file-1", "NewName.ts");

            // Verify file was renamed
            const state = useStore.getState();
            const renamedFile = state.files.find((f) => f.id === "file-1");
            expect(renamedFile).toBeDefined();
            expect(renamedFile?.name).toBe("NewName.ts");
            expect(renamedFile?.path).toBe("/src/NewName.ts");
        });

        it("should reject empty filename", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Attempt to rename to empty string
            await expect(useStore.getState().renameFile("file-1", "")).rejects.toThrow(
                "File name cannot be empty"
            );

            // Verify file name unchanged
            const state = useStore.getState();
            expect(state.files[0].name).toBe("test.ts");
        });

        it("should reject filename with invalid characters", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Attempt to rename with invalid characters
            await expect(useStore.getState().renameFile("file-1", "test/invalid.ts")).rejects.toThrow(
                "File name cannot contain"
            );

            // Verify file name unchanged
            const state = useStore.getState();
            expect(state.files[0].name).toBe("test.ts");
        });

        it("should reject duplicate filename in same directory", async () => {
            const file1: ProjectFile = {
                id: "file-1",
                name: "test1.ts",
                path: "/src/test1.ts",
                content: "class Test1 {}",
                lastModified: Date.now(),
                isActive: false,
            };
            const file2: ProjectFile = {
                id: "file-2",
                name: "test2.ts",
                path: "/src/test2.ts",
                content: "class Test2 {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file1, file2]);

            // Attempt to rename file1 to test2.ts (duplicate)
            await expect(useStore.getState().renameFile("file-1", "test2.ts")).rejects.toThrow(
                'A file named "test2.ts" already exists'
            );

            // Verify file1 name unchanged
            const state = useStore.getState();
            const unchangedFile = state.files.find((f) => f.id === "file-1");
            expect(unchangedFile?.name).toBe("test1.ts");
        });

        it("should allow renaming to same name (no-op)", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Rename to same name (should succeed)
            await expect(useStore.getState().renameFile("file-1", "test.ts")).resolves.not.toThrow();

            // Verify file still exists with same name
            const state = useStore.getState();
            expect(state.files[0].name).toBe("test.ts");
        });

        it("should handle renaming non-existent file", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Attempt to rename non-existent file
            await expect(useStore.getState().renameFile("non-existent", "NewName.ts")).rejects.toThrow(
                "not found"
            );

            // Verify original file unchanged
            const state = useStore.getState();
            expect(state.files[0].name).toBe("test.ts");
        });

        it("should update path correctly when renaming", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "Component.tsx",
                path: "/src/components/Component.tsx",
                content: "export const Component = () => {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Rename the file
            await useStore.getState().renameFile("file-1", "MyComponent.tsx");

            // Verify path was updated correctly
            const state = useStore.getState();
            const renamedFile = state.files.find((f) => f.id === "file-1");
            expect(renamedFile?.name).toBe("MyComponent.tsx");
            expect(renamedFile?.path).toBe("/src/components/MyComponent.tsx");
        });
    });

    describe("duplicateFile action", () => {
        it("should duplicate a file with 'copy' suffix", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "MyClass.ts",
                path: "/src/MyClass.ts",
                content: "class MyClass {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Duplicate the file
            const result = await useStore.getState().duplicateFile("file-1");

            // Verify operation succeeded
            expect(result.success).toBe(true);
            expect(result.newFileId).toBeDefined();

            // Verify duplicate was created with correct name
            const state = useStore.getState();
            expect(state.files.length).toBe(2);

            const duplicateFile = state.files.find((f) => f.id === result.newFileId);
            expect(duplicateFile).toBeDefined();
            expect(duplicateFile?.name).toBe("MyClass copy.ts");
            expect(duplicateFile?.path).toBe("/src/MyClass copy.ts");
            expect(duplicateFile?.content).toBe("class MyClass {}");
            expect(duplicateFile?.isActive).toBe(false);
        });

        it("should increment copy number when duplicate exists", async () => {
            const file1: ProjectFile = {
                id: "file-1",
                name: "MyClass.ts",
                path: "/src/MyClass.ts",
                content: "class MyClass {}",
                lastModified: Date.now(),
                isActive: false,
            };
            const file2: ProjectFile = {
                id: "file-2",
                name: "MyClass copy.ts",
                path: "/src/MyClass copy.ts",
                content: "class MyClass {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file1, file2]);

            // Duplicate the original file (should become "MyClass copy 2.ts")
            const result = await useStore.getState().duplicateFile("file-1");

            // Verify operation succeeded
            expect(result.success).toBe(true);

            // Verify duplicate has incremented name
            const state = useStore.getState();
            expect(state.files.length).toBe(3);

            const duplicateFile = state.files.find((f) => f.id === result.newFileId);
            expect(duplicateFile?.name).toBe("MyClass copy 2.ts");
            expect(duplicateFile?.path).toBe("/src/MyClass copy 2.ts");
        });

        it("should preserve file content when duplicating", async () => {
            const originalContent = `class ComplexClass {
  constructor(public name: string) {}
  
  greet() {
    console.log(\`Hello, \${this.name}\`);
  }
}`;

            const file: ProjectFile = {
                id: "file-1",
                name: "ComplexClass.ts",
                path: "/src/ComplexClass.ts",
                content: originalContent,
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Duplicate the file
            const result = await useStore.getState().duplicateFile("file-1");

            // Verify content was preserved
            const state = useStore.getState();
            const duplicateFile = state.files.find((f) => f.id === result.newFileId);
            expect(duplicateFile?.content).toBe(originalContent);
        });

        it("should handle duplicating file in nested directory", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "Component.tsx",
                path: "/src/components/ui/Component.tsx",
                content: "export const Component = () => {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Duplicate the file
            const result = await useStore.getState().duplicateFile("file-1");

            // Verify path was constructed correctly
            const state = useStore.getState();
            const duplicateFile = state.files.find((f) => f.id === result.newFileId);
            expect(duplicateFile?.name).toBe("Component copy.tsx");
            expect(duplicateFile?.path).toBe("/src/components/ui/Component copy.tsx");
        });

        it("should handle duplicating non-existent file", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Attempt to duplicate non-existent file
            const result = await useStore.getState().duplicateFile("non-existent");

            // Verify operation failed
            expect(result.success).toBe(false);
            expect(result.error).toContain("not found");

            // Verify no new file was created
            const state = useStore.getState();
            expect(state.files.length).toBe(1);
        });

        it("should create new unique ID for duplicate", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            // Duplicate the file
            const result = await useStore.getState().duplicateFile("file-1");

            // Verify new ID is different from original
            expect(result.newFileId).toBeDefined();
            expect(result.newFileId).not.toBe("file-1");

            // Verify both files exist with different IDs
            const state = useStore.getState();
            expect(state.files.length).toBe(2);
            expect(state.files[0].id).toBe("file-1");
            expect(state.files[1].id).toBe(result.newFileId);
        });

        it("should not activate duplicated file", async () => {
            const file: ProjectFile = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: true,
            };

            useStore.getState().setFiles([file]);
            useStore.getState().setActiveFile("file-1");

            // Duplicate the active file
            const result = await useStore.getState().duplicateFile("file-1");

            // Verify original file is still active
            const state = useStore.getState();
            expect(state.activeFileId).toBe("file-1");

            // Verify duplicate is not active
            const duplicateFile = state.files.find((f) => f.id === result.newFileId);
            expect(duplicateFile?.isActive).toBe(false);
        });
    });
});
