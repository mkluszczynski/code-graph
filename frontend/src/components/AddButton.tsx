/**
 * AddButton Component
 *
 * Provides a dropdown button for creating new TypeScript files (classes or interfaces)
 */

import { Loader2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface AddButtonProps {
  onCreateClass: () => void;
  onCreateInterface: () => void;
  isLoading?: boolean;
}

export function AddButton({
  onCreateClass,
  onCreateInterface,
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
        <DropdownMenuItem onClick={onCreateClass} disabled={isLoading}>
          New Class
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateInterface} disabled={isLoading}>
          New Interface
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
