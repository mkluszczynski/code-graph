/**
 * Integration tests for file creation workflow
 *
 * Tests for creating files via the CreateDialog component
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useStore } from "../../../src/shared/store";

// Mock ProjectManager for testing
vi.mock("../../../src/project-management/ProjectManager", () => {
  return {
    ProjectManager: class MockProjectManager {
      async initialize() {
        return Promise.resolve();
      }

      async createEmptyFile(name: string, parentPath: string) {
        const path = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;
        return Promise.resolve({
          id: crypto.randomUUID(),
          name,
          path,
          parentPath,
          content: "",
          lastModified: Date.now(),
          isActive: false,
        });
      }

      async getAllFiles() {
        return Promise.resolve([]);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async saveFile(_file: unknown) {
        return Promise.resolve();
      }
    },
  };
});

// Import components after mock is set up - will fail until component is created (TDD)
import { CreateDialog } from "../../../src/components/CreateDialog";

describe("Create File Integration", () => {
  beforeEach(() => {
    // Reset store state
    const store = useStore.getState();
    store.setFiles([]);
    store.setActiveFile(null);
  });

  it("creates empty file in src folder via dialog", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();

    render(
      <CreateDialog
        open={true}
        type="file"
        parentPath="/src"
        existingNames={[]}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    // Enter filename
    const input = screen.getByRole("textbox");
    await user.type(input, "utils.ts");

    // Submit
    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("utils.ts");
    });
  });

  it("creates file in nested folder", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateDialog
        open={true}
        type="file"
        parentPath="/src/components"
        existingNames={[]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "Button.tsx");

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Button.tsx");
    });
  });

  it("shows error when file name has no extension", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateDialog
        open={true}
        type="file"
        parentPath="/src"
        existingNames={[]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "helper"); // No extension

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Should show error for missing extension
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/extension/i)).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("prevents duplicate file names", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateDialog
        open={true}
        type="file"
        parentPath="/src"
        existingNames={["existing.ts", "another.ts"]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "existing.ts");

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Should show error
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/already exists/i)).toBeTruthy();
    });

    // onSubmit should NOT have been called
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("handles submission error gracefully", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Storage quota exceeded"));

    render(
      <CreateDialog
        open={true}
        type="file"
        parentPath="/src"
        existingNames={[]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "newfile.ts");

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/storage quota exceeded/i)).toBeTruthy();
    });
  });

  it("closes dialog when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <CreateDialog
        open={true}
        type="file"
        parentPath="/src"
        existingNames={[]}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("validates input before submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CreateDialog
        open={true}
        type="file"
        parentPath="/src"
        existingNames={[]}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    );

    // Try to submit with invalid characters
    const input = screen.getByRole("textbox");
    await user.type(input, "my/file.ts");

    const submitButton = screen.getByRole("button", { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/cannot contain/i)).toBeTruthy();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
