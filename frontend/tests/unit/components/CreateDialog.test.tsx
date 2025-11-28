/**
 * Contract tests for CreateDialog component
 *
 * Tests for the file/folder creation dialog with inline validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import will fail until component is created - this is TDD
import { CreateDialog } from "../../../src/components/CreateDialog";

describe("CreateDialog", () => {
  const defaultProps = {
    open: true,
    type: "file" as const,
    parentPath: "/src",
    existingNames: ["existing.ts"],
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders dialog when open is true", () => {
      render(<CreateDialog {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("does not render dialog when open is false", () => {
      render(<CreateDialog {...defaultProps} open={false} />);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("displays correct title for file type", () => {
      render(<CreateDialog {...defaultProps} type="file" />);
      expect(screen.getByText("New File")).toBeTruthy();
    });

    it("displays correct title for folder type", () => {
      render(<CreateDialog {...defaultProps} type="folder" />);
      expect(screen.getByText("New Folder")).toBeTruthy();
    });

    it("displays parent path in description", () => {
      render(<CreateDialog {...defaultProps} parentPath="/src/components" />);
      expect(screen.getByText(/\/src\/components/)).toBeTruthy();
    });
  });

  describe("Input Behavior", () => {
    it("focuses input on dialog open", async () => {
      render(<CreateDialog {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        expect(document.activeElement).toBe(input);
      });
    });

    it("clears input value when dialog opens", async () => {
      const { rerender } = render(<CreateDialog {...defaultProps} open={false} />);

      rerender(<CreateDialog {...defaultProps} open={true} />);

      await waitFor(() => {
        const input = screen.getByRole("textbox") as HTMLInputElement;
        expect(input.value).toBe("");
      });
    });

    it("updates input value on user typing", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await user.type(input, "MyFile");

      expect(input.value).toBe("MyFile");
    });

    it("clears error message when user types", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      // Submit empty to trigger error
      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
      });

      // Type something to clear error
      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      await waitFor(() => {
        expect(screen.queryByRole("alert")).toBeNull();
      });
    });
  });

  describe("Validation", () => {
    it("shows error for empty name on submit", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getByText(/cannot be empty/i)).toBeTruthy();
      });
    });

    it("shows error for invalid characters on submit", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test/file.ts");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getByText(/cannot contain/i)).toBeTruthy();
      });
    });

    it("shows error for duplicate name on submit", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} existingNames={["existing.ts"]} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "existing.ts");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getByText(/already exists/i)).toBeTruthy();
      });
    });

    it("does not close dialog when validation fails", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeTruthy();
      });

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it("keeps focus on input after validation error", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        expect(document.activeElement).toBe(input);
      });
    });
  });

  describe("Submission", () => {
    it("calls onSubmit with trimmed name", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "  MyFile.ts  ");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith("MyFile.ts");
      });
    });

    it("normalizes filename with .ts extension when missing", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} type="file" />);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyFile");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith("MyFile.ts");
      });
    });

    it("does not normalize folder names", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} type="folder" />);

      const input = screen.getByRole("textbox");
      await user.type(input, "components");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith("components");
      });
    });

    it("disables inputs during submission", async () => {
      const user = userEvent.setup();
      const slowSubmit = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<CreateDialog {...defaultProps} onSubmit={slowSubmit} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyFile.ts");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      // Check that input is disabled during submission
      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });

    it("shows loading state on Create button", async () => {
      const user = userEvent.setup();
      const slowSubmit = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<CreateDialog {...defaultProps} onSubmit={slowSubmit} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyFile.ts");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeTruthy();
      });
    });

    it("closes dialog after successful submission", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const { rerender } = render(<CreateDialog {...defaultProps} onSubmit={onSubmit} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyFile.ts");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      // Dialog should close (caller handles this by setting open=false)
      rerender(<CreateDialog {...defaultProps} open={false} onSubmit={onSubmit} />);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("shows error and keeps dialog open on submission failure", async () => {
      const user = userEvent.setup();
      const failingSubmit = vi.fn().mockRejectedValue(new Error("Storage error"));
      render(<CreateDialog {...defaultProps} onSubmit={failingSubmit} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyFile.ts");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getByText(/storage error/i)).toBeTruthy();
      });

      expect(screen.getByRole("dialog")).toBeTruthy();
    });
  });

  describe("Keyboard Navigation", () => {
    it("submits form on Enter key", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyFile.ts{Enter}");

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith("MyFile.ts");
      });
    });

    it("cancels dialog on Escape key", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      await user.keyboard("{Escape}");

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it("prevents close during submission", async () => {
      const user = userEvent.setup();
      const slowSubmit = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<CreateDialog {...defaultProps} onSubmit={slowSubmit} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "MyFile.ts");

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      // Try to escape during submission
      await user.keyboard("{Escape}");

      // Dialog should still be visible
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has accessible dialog title", () => {
      render(<CreateDialog {...defaultProps} type="file" />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleName("New File");
    });

    it("has accessible dialog description", () => {
      render(<CreateDialog {...defaultProps} parentPath="/src" />);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleDescription(/will be created in \/src/i);
    });

    it("marks input as invalid when error exists", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        expect(input).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("associates error message with input via aria-describedby", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        const describedBy = input.getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();

        const errorElement = document.getElementById(describedBy!);
        expect(errorElement).toBeTruthy();
        expect(errorElement?.textContent).toMatch(/cannot be empty/i);
      });
    });

    it("announces error with role=\"alert\"", async () => {
      const user = userEvent.setup();
      render(<CreateDialog {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
      });
    });
  });
});
