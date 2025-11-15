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
import "@testing-library/jest-dom/vitest";
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

    // Initially, Person.ts inside models folder should not be visible
    expect(screen.queryByTestId("file-Person.ts")).toBeNull();

    // src folder should be auto-expanded, so App.tsx and models folder should be visible
    await waitFor(() => {
      expect(screen.getByTestId("file-App.tsx")).toBeInTheDocument();
      expect(screen.getByTestId("folder-models")).toBeInTheDocument();
    });

    // Click on models folder to expand
    const modelsFolder = screen.getByTestId("folder-models");
    await user.click(modelsFolder);

    // Now we should see Person.ts and User.ts
    await waitFor(() => {
      expect(screen.getByTestId("file-Person.ts")).toBeInTheDocument();
      expect(screen.getByTestId("file-User.ts")).toBeInTheDocument();
    });
  });

  it("should update activeFileId in store when file is clicked", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // src folder should be auto-expanded, wait for App.tsx
    await waitFor(() => {
      expect(screen.getByTestId("file-App.tsx")).toBeInTheDocument();
    });

    // Click on App.tsx
    const appFile = screen.getByTestId("file-App.tsx");
    await user.click(appFile);

    // Verify activeFileId is updated in store
    const state = useStore.getState();
    expect(state.activeFileId).toBe("file-3");
  });

  it("should highlight selected file visually", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // src folder should be auto-expanded, wait for App.tsx
    await waitFor(() => {
      expect(screen.getByTestId("file-App.tsx")).toBeInTheDocument();
    });

    // Click on App.tsx
    const appFile = screen.getByTestId("file-App.tsx");
    await user.click(appFile);

    // Verify the button has the active class
    await waitFor(() => {
      expect(appFile).toHaveClass("selected");
    });
  });

  it("should switch selection between different files", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // Expand models folder (src should be auto-expanded)
    await waitFor(() => {
      expect(screen.getByTestId("folder-models")).toBeInTheDocument();
    });
    await user.click(screen.getByTestId("folder-models"));

    // Wait for files to appear
    await waitFor(() => {
      expect(screen.getByTestId("file-Person.ts")).toBeInTheDocument();
      expect(screen.getByTestId("file-User.ts")).toBeInTheDocument();
    });

    // Click on Person.ts
    await user.click(screen.getByTestId("file-Person.ts"));
    expect(useStore.getState().activeFileId).toBe("file-1");

    // Click on User.ts
    await user.click(screen.getByTestId("file-User.ts"));
    expect(useStore.getState().activeFileId).toBe("file-2");

    // Only User.ts should be highlighted now
    const personButton = screen.getByTestId("file-Person.ts");
    const userButton = screen.getByTestId("file-User.ts");
    expect(personButton).not.toHaveClass("selected");
    expect(userButton).toHaveClass("selected");
  });

  it("should call onFileSelect callback when file is clicked", async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} onFileSelect={onFileSelect} />);

    // Wait for src folder to auto-expand and App.tsx to appear
    await waitFor(() => {
      expect(screen.getByTestId("file-App.tsx")).toBeInTheDocument();
    });

    // Click on App.tsx
    await user.click(screen.getByTestId("file-App.tsx"));

    // Verify callback was called with correct file ID
    expect(onFileSelect).toHaveBeenCalledWith("file-3");
  });

  it("should display files across multiple folder levels", async () => {
    const user = userEvent.setup();
    const tree = fileTreeManager.buildTree(mockFiles);
    render(<FileTreeView nodes={tree} />);

    // src folder should be auto-expanded, should see both direct files and folders
    await waitFor(() => {
      expect(screen.getByTestId("file-App.tsx")).toBeInTheDocument();
      expect(screen.getByTestId("folder-models")).toBeInTheDocument();
      expect(screen.getByTestId("folder-services")).toBeInTheDocument();
    });

    // Expand services folder
    await user.click(screen.getByTestId("folder-services"));

    await waitFor(() => {
      expect(screen.getByTestId("file-UserService.ts")).toBeInTheDocument();
    });
  });
});
