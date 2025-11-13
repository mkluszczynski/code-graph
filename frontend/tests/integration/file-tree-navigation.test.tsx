/**
 * Integration Test: File Tree Navigation
 *
 * Tests the complete file tree rendering and selection workflow:
 * - File tree displays all project files in hierarchical structure
 * - Clicking on files updates activeFileId in store
 * - Selected file is visually highlighted
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileTreeView } from "../../src/file-tree/FileTreeView";
import { FileTreeManager } from "../../src/file-tree/FileTreeManager";
import { useStore } from "../../src/shared/store";
import type { ProjectFile } from "../../src/shared/types";

describe("Integration Test: File Tree Navigation", () => {
  let fileTreeManager: FileTreeManager;
  let mockFiles: ProjectFile[];

  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      files: [],
      activeFileId: null,
    });

    fileTreeManager = new FileTreeManager();

    // Create mock project files
    mockFiles = [
      {
        id: "file-1",
        name: "Person.ts",
        path: "/src/models/Person.ts",
        content: "export class Person {}",
        lastModified: Date.now(),
        isActive: false,
      },
      {
        id: "file-2",
        name: "User.ts",
        path: "/src/models/User.ts",
        content: "export class User {}",
        lastModified: Date.now(),
        isActive: false,
      },
      {
        id: "file-3",
        name: "App.tsx",
        path: "/src/App.tsx",
        content: "export default function App() {}",
        lastModified: Date.now(),
        isActive: false,
      },
      {
        id: "file-4",
        name: "UserService.ts",
        path: "/src/services/UserService.ts",
        content: "export class UserService {}",
        lastModified: Date.now(),
        isActive: false,
      },
    ];
  });

  it("should render file tree with all files in hierarchical structure", () => {
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // Should show root src folder
    expect(screen.getByText("src")).toBeInTheDocument();
  });

  it("should expand folders and show nested files when clicked", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // Initially, nested files should not be visible
    expect(screen.queryByText("Person.ts")).not.toBeInTheDocument();

    // Click on src folder to expand
    const srcFolder = screen.getByText("src");
    await user.click(srcFolder);

    // Now we should see direct children
    await waitFor(() => {
      expect(screen.getByText("App.tsx")).toBeInTheDocument();
    });

    // Click on models folder to expand
    await waitFor(() => {
      expect(screen.getByText("models")).toBeInTheDocument();
    });
    const modelsFolder = screen.getByText("models");
    await user.click(modelsFolder);

    // Now we should see Person.ts and User.ts
    await waitFor(() => {
      expect(screen.getByText("Person.ts")).toBeInTheDocument();
      expect(screen.getByText("User.ts")).toBeInTheDocument();
    });
  });

  it("should update activeFileId in store when file is clicked", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // Expand src folder
    const srcFolder = screen.getByText("src");
    await user.click(srcFolder);

    // Wait for App.tsx to appear
    await waitFor(() => {
      expect(screen.getByText("App.tsx")).toBeInTheDocument();
    });

    // Click on App.tsx
    const appFile = screen.getByText("App.tsx");
    await user.click(appFile);

    // Verify activeFileId is updated in store
    const state = useStore.getState();
    expect(state.activeFileId).toBe("file-3");
  });

  it("should highlight selected file visually", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // Expand src folder
    const srcFolder = screen.getByText("src");
    await user.click(srcFolder);

    // Wait for App.tsx to appear
    await waitFor(() => {
      expect(screen.getByText("App.tsx")).toBeInTheDocument();
    });

    // Click on App.tsx
    const appFile = screen.getByText("App.tsx");
    const appButton = appFile.closest("button");
    await user.click(appFile);

    // Verify the button has the active class
    await waitFor(() => {
      expect(appButton).toHaveClass("bg-accent");
    });
  });

  it("should switch selection between different files", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // Expand src and models folders
    await user.click(screen.getByText("src"));
    await waitFor(() => {
      expect(screen.getByText("models")).toBeInTheDocument();
    });
    await user.click(screen.getByText("models"));

    // Wait for files to appear
    await waitFor(() => {
      expect(screen.getByText("Person.ts")).toBeInTheDocument();
      expect(screen.getByText("User.ts")).toBeInTheDocument();
    });

    // Click on Person.ts
    await user.click(screen.getByText("Person.ts"));
    expect(useStore.getState().activeFileId).toBe("file-1");

    // Click on User.ts
    await user.click(screen.getByText("User.ts"));
    expect(useStore.getState().activeFileId).toBe("file-2");

    // Only User.ts should be highlighted now
    const personButton = screen.getByText("Person.ts").closest("button");
    const userButton = screen.getByText("User.ts").closest("button");
    expect(personButton).not.toHaveClass("font-medium");
    expect(userButton).toHaveClass("font-medium");
  });

  it("should call onFileSelect callback when file is clicked", async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} onFileSelect={onFileSelect} />);

    // Expand src folder
    await user.click(screen.getByText("src"));
    await waitFor(() => {
      expect(screen.getByText("App.tsx")).toBeInTheDocument();
    });

    // Click on App.tsx
    await user.click(screen.getByText("App.tsx"));

    // Verify callback was called with correct file ID
    expect(onFileSelect).toHaveBeenCalledWith("file-3");
  });

  it("should display files across multiple folder levels", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // Expand src folder
    await user.click(screen.getByText("src"));

    // Should see both direct files and folders
    await waitFor(() => {
      expect(screen.getByText("App.tsx")).toBeInTheDocument();
      expect(screen.getByText("models")).toBeInTheDocument();
      expect(screen.getByText("services")).toBeInTheDocument();
    });

    // Expand services folder
    await user.click(screen.getByText("services"));

    // Should see UserService.ts
    await waitFor(() => {
      expect(screen.getByText("UserService.ts")).toBeInTheDocument();
    });
  });
});
