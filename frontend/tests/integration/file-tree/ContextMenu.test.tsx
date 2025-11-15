/**
 * Integration tests for file tree context menu workflows
 *
 * Tests for context menu interactions (delete, rename, duplicate)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileTreeView } from "../../../src/file-tree/FileTreeView";
import { useStore } from "../../../src/shared/store";
import type { FileTreeNode } from "../../../src/file-tree/types";
import type { ProjectFile } from "../../../src/shared/types";

// Mock ProjectManager
vi.mock("../../../src/project-management/ProjectManager", () => {
    return {
        ProjectManager: class MockProjectManager {
            async deleteFile(id: string) {
                return Promise.resolve();
            }
            async updateFile(id: string, updates: any) {
                return Promise.resolve({ id, ...updates });
            }
        },
    };
});

describe("Context Menu Workflows", () => {
    beforeEach(() => {
        // Reset store state before each test
        const store = useStore.getState();
        store.setFiles([]);
        store.setActiveFile(null);
    });

    describe("Delete workflow", () => {
        it("should show context menu on right-click", async () => {
            const user = userEvent.setup();

            // Setup test file
            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Find the file button
            const fileButton = screen.getByTestId("file-test.ts");

            // Right-click to open context menu
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            // Context menu should appear with Delete option
            await waitFor(() => {
                expect(screen.getByText("Delete")).toBeTruthy();
            });
        });

        it("should show confirmation dialog when Delete is clicked", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click to open context menu
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            // Click Delete option
            await waitFor(() => {
                expect(screen.getByText("Delete")).toBeTruthy();
            });

            const deleteOption = screen.getByText("Delete");
            await user.click(deleteOption);

            // Confirmation dialog should appear
            await waitFor(() => {
                expect(screen.getByText("Delete File?")).toBeTruthy();
                expect(screen.getByText(/Are you sure you want to delete/)).toBeTruthy();
            });
        });

        it("should delete file when confirmed in dialog", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click and select Delete
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            await waitFor(() => {
                expect(screen.getByText("Delete")).toBeTruthy();
            });

            await user.click(screen.getByText("Delete"));

            // Wait for dialog and confirm
            await waitFor(() => {
                expect(screen.getByText("Delete File?")).toBeTruthy();
            });

            const confirmButton = screen.getByRole("button", { name: /delete/i });
            await user.click(confirmButton);

            // File should be removed from store
            await waitFor(() => {
                const state = useStore.getState();
                expect(state.files.find((f) => f.id === "test-file")).toBeUndefined();
            });
        });

        it("should cancel delete when Cancel is clicked in dialog", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click and select Delete
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            await waitFor(() => {
                expect(screen.getByText("Delete")).toBeTruthy();
            });

            await user.click(screen.getByText("Delete"));

            // Wait for dialog and cancel
            await waitFor(() => {
                expect(screen.getByText("Delete File?")).toBeTruthy();
            });

            const cancelButton = screen.getByRole("button", { name: /cancel/i });
            await user.click(cancelButton);

            // File should still exist in store
            const state = useStore.getState();
            expect(state.files.find((f) => f.id === "test-file")).toBeDefined();
        });
    });

    describe("Rename workflow", () => {
        it("should show Rename option in context menu", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click to open context menu
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            // Context menu should show Rename option
            await waitFor(() => {
                expect(screen.getByText("Rename")).toBeTruthy();
            });
        });

        it("should show input field when Rename is clicked", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click and select Rename
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            await waitFor(() => {
                expect(screen.getByText("Rename")).toBeTruthy();
            });

            await user.click(screen.getByText("Rename"));

            // Input field should appear with current filename
            await waitFor(() => {
                const input = screen.getByTestId("rename-input-test.ts") as HTMLInputElement;
                expect(input).toBeTruthy();
                expect(input.value).toBe("test.ts");
            });
        });

        it("should rename file when Enter is pressed", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click and select Rename
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            await waitFor(() => {
                expect(screen.getByText("Rename")).toBeTruthy();
            });

            await user.click(screen.getByText("Rename"));

            // Wait for input to appear
            await waitFor(() => {
                expect(screen.getByTestId("rename-input-test.ts")).toBeTruthy();
            });

            const input = screen.getByTestId("rename-input-test.ts") as HTMLInputElement;

            // Change the name and press Enter
            await user.clear(input);
            await user.type(input, "newname.ts");
            await user.keyboard("{Enter}");

            // File should be renamed in store
            await waitFor(() => {
                const state = useStore.getState();
                const renamedFile = state.files.find((f) => f.id === "test-file");
                expect(renamedFile?.name).toBe("newname.ts");
                expect(renamedFile?.path).toBe("/src/newname.ts");
            });
        });

        it("should cancel rename when Escape is pressed", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click and select Rename
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            await waitFor(() => {
                expect(screen.getByText("Rename")).toBeTruthy();
            });

            await user.click(screen.getByText("Rename"));

            // Wait for input to appear
            await waitFor(() => {
                expect(screen.getByTestId("rename-input-test.ts")).toBeTruthy();
            });

            const input = screen.getByTestId("rename-input-test.ts") as HTMLInputElement;

            // Change the name and press Escape
            await user.clear(input);
            await user.type(input, "newname.ts");
            await user.keyboard("{Escape}");

            // File name should remain unchanged
            const state = useStore.getState();
            const file_after = state.files.find((f) => f.id === "test-file");
            expect(file_after?.name).toBe("test.ts");
        });

        it("should show error message for invalid filename", async () => {
            const user = userEvent.setup();

            const file: ProjectFile = {
                id: "test-file",
                name: "test.ts",
                path: "/src/test.ts",
                content: "class Test {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file",
                            name: "test.ts",
                            path: "/src/test.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click and select Rename
            const fileButton = screen.getByTestId("file-test.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            await waitFor(() => {
                expect(screen.getByText("Rename")).toBeTruthy();
            });

            await user.click(screen.getByText("Rename"));

            // Wait for input to appear
            await waitFor(() => {
                expect(screen.getByTestId("rename-input-test.ts")).toBeTruthy();
            });

            const input = screen.getByTestId("rename-input-test.ts") as HTMLInputElement;

            // Try to rename with invalid characters
            await user.clear(input);
            await user.type(input, "test/invalid.ts");
            await user.keyboard("{Enter}");

            // Error message should appear
            await waitFor(() => {
                expect(screen.getByTestId("rename-error")).toBeTruthy();
                expect(screen.getByText(/Filename cannot contain/i)).toBeTruthy();
            });

            // File name should remain unchanged
            const state = useStore.getState();
            const file_after = state.files.find((f) => f.id === "test-file");
            expect(file_after?.name).toBe("test.ts");
        });

        it("should show error for duplicate filename", async () => {
            const user = userEvent.setup();

            const file1: ProjectFile = {
                id: "test-file-1",
                name: "test1.ts",
                path: "/src/test1.ts",
                content: "class Test1 {}",
                lastModified: Date.now(),
                isActive: false,
            };

            const file2: ProjectFile = {
                id: "test-file-2",
                name: "test2.ts",
                path: "/src/test2.ts",
                content: "class Test2 {}",
                lastModified: Date.now(),
                isActive: false,
            };

            useStore.getState().setFiles([file1, file2]);

            const nodes: FileTreeNode[] = [
                {
                    id: "src",
                    name: "src",
                    path: "/src",
                    type: "folder",
                    parentId: null,
                    children: [
                        {
                            id: "test-file-1",
                            name: "test1.ts",
                            path: "/src/test1.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                        {
                            id: "test-file-2",
                            name: "test2.ts",
                            path: "/src/test2.ts",
                            type: "file",
                            parentId: "src",
                            children: [],
                            extension: "ts",
                        },
                    ],
                },
            ];

            render(<FileTreeView nodes={nodes} />);

            // Right-click on test1.ts and select Rename
            const fileButton = screen.getByTestId("file-test1.ts");
            await user.pointer({ keys: "[MouseRight>]", target: fileButton });

            await waitFor(() => {
                expect(screen.getByText("Rename")).toBeTruthy();
            });

            await user.click(screen.getByText("Rename"));

            // Wait for input to appear
            await waitFor(() => {
                expect(screen.getByTestId("rename-input-test1.ts")).toBeTruthy();
            });

            const input = screen.getByTestId("rename-input-test1.ts") as HTMLInputElement;

            // Try to rename to test2.ts (duplicate)
            await user.clear(input);
            await user.type(input, "test2.ts");
            await user.keyboard("{Enter}");

            // Error message should appear
            await waitFor(() => {
                expect(screen.getByTestId("rename-error")).toBeTruthy();
                expect(screen.getByText(/already exists/i)).toBeTruthy();
            });

            // File name should remain unchanged
            const state = useStore.getState();
            const file_after = state.files.find((f) => f.id === "test-file-1");
            expect(file_after?.name).toBe("test1.ts");
        });
    });
});
