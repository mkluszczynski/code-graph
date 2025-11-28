/**
 * AddButton Component
 *
 * Provides a dropdown button for creating new files or folders
 */

import { File, Folder, Loader2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface AddButtonProps {
  /** Callback when "Add File" is selected */
  onAddFile: () => void;
  /** Callback when "Add Folder" is selected */
  onAddFolder: () => void;
  /** Whether an operation is in progress */
  isLoading?: boolean;
}

export function AddButton({
  onAddFile,
  onAddFolder,
  isLoading = false,
}: AddButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Creating..." : "Add File"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onAddFile} disabled={isLoading}>
          <File className="h-4 w-4 mr-2" aria-hidden="true" />
          Add File
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddFolder} disabled={isLoading}>
          <Folder className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
