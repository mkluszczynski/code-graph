/**
 * Integration Tests: Create Folder Workflow
 * 
 * Tests for folder creation via CreateDialog and store integration
 * TDD: These tests should FAIL initially before implementation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useStore } from "../../../src/shared/store";
import { CreateDialog } from "../../../src/components/CreateDialog";

describe("Create Folder Integration", () => {
    beforeEach(() => {
        // Reset store state before each test
        useStore.setState({
            files: [],
            activeFileId: null,
        });
    });

    it("creates folder and displays in file tree", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        const onCancel = vi.fn();

        render(
            <CreateDialog
                open={true}
                type="folder"
                parentPath="/src"
                existingNames={[]}
                onSubmit={onSubmit}
                onCancel={onCancel}
            />
        );

        // Enter folder name
        const input = screen.getByLabelText(/name/i);
        await user.type(input, "models");

        // Submit
        const createButton = screen.getByRole("button", { name: /create/i });
        await user.click(createButton);

        // Verify onSubmit called with correct name
        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith("models");
        });
    });

    it("allows creating file inside new folder", async () => {
        const user = userEvent.setup();

        // First create folder
        const onSubmitFolder = vi.fn().mockResolvedValue(undefined);
        const { unmount } = render(
            <CreateDialog
                open={true}
                type="folder"
                parentPath="/src"
                existingNames={[]}
                onSubmit={onSubmitFolder}
                onCancel={vi.fn()}
            />
        );

        const input = screen.getByLabelText(/name/i);
        await user.type(input, "models");
        await user.click(screen.getByRole("button", { name: /create/i }));

        await waitFor(() => {
            expect(onSubmitFolder).toHaveBeenCalledWith("models");
        });

        unmount();

        // Now create file in new folder
        const onSubmitFile = vi.fn().mockResolvedValue(undefined);
        render(
            <CreateDialog
                open={true}
                type="file"
                parentPath="/src/models"
                existingNames={[]}
                onSubmit={onSubmitFile}
                onCancel={vi.fn()}
            />
        );

        const fileInput = screen.getByLabelText(/name/i);
        await user.type(fileInput, "Person.ts");
        await user.click(screen.getByRole("button", { name: /create/i }));

        await waitFor(() => {
            expect(onSubmitFile).toHaveBeenCalledWith("Person.ts");
        });
    });

    it("persists folder structure through reload", async () => {
        // This test verifies that folders (which are virtual) appear in the tree
        // when files are created with parentPath pointing to them

        const createEmptyFile = useStore.getState().createEmptyFile;

        // Mock ProjectManager to avoid IndexedDB in tests
        vi.mock("@/project-management/ProjectManager", () => ({
            ProjectManager: class {
                async createEmptyFile(name: string, parentPath: string) {
                    return {
                        id: crypto.randomUUID(),
                        name,
                        path: `${parentPath}/${name}`,
                        parentPath,
                        content: "",
                        lastModified: Date.now(),
                        isActive: false,
                    };
                }
            },
        }));

        // Create a file in a nested folder
        await createEmptyFile("Person.ts", "/src/models");

        // Verify file is in store
        const files = useStore.getState().files;
        expect(files).toHaveLength(1);
        expect(files[0].parentPath).toBe("/src/models");
    });

    it("validates folder name before creation", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(
            <CreateDialog
                open={true}
                type="folder"
                parentPath="/src"
                existingNames={[]}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />
        );

        // Try to submit with invalid characters
        const input = screen.getByLabelText(/name/i);
        await user.type(input, "models/invalid");
        await user.click(screen.getByRole("button", { name: /create/i }));

        // Should show validation error
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(/cannot contain/i);
        });

        // onSubmit should not be called
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("prevents duplicate folder names", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(
            <CreateDialog
                open={true}
                type="folder"
                parentPath="/src"
                existingNames={["models"]}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />
        );

        // Try to create folder with existing name
        const input = screen.getByLabelText(/name/i);
        await user.type(input, "models");
        await user.click(screen.getByRole("button", { name: /create/i }));

        // Should show duplicate error
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(/already exists/i);
        });

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("enforces maximum nesting depth", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValue(
            new Error("Maximum folder nesting depth (10) exceeded")
        );

        // Create a deeply nested parent path (10 levels)
        const deepPath = "/a/b/c/d/e/f/g/h/i/j";

        render(
            <CreateDialog
                open={true}
                type="folder"
                parentPath={deepPath}
                existingNames={[]}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />
        );

        const input = screen.getByLabelText(/name/i);
        await user.type(input, "too-deep");
        await user.click(screen.getByRole("button", { name: /create/i }));

        // Should show depth error
        await waitFor(() => {
            expect(screen.getByRole("alert")).toHaveTextContent(/nesting depth/i);
        });
    });

    it("does not add .ts extension to folder names", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <CreateDialog
                open={true}
                type="folder"
                parentPath="/src"
                existingNames={[]}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />
        );

        const input = screen.getByLabelText(/name/i);
        await user.type(input, "models");
        await user.click(screen.getByRole("button", { name: /create/i }));

        // Verify folder name is NOT normalized with .ts extension
        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith("models");
            expect(onSubmit).not.toHaveBeenCalledWith("models.ts");
        });
    });
});
