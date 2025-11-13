/**
 * AddButton Component
 *
 * Provides a dropdown button for creating new TypeScript files (classes or interfaces)
 */

import { Plus } from "lucide-react";
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
}

export function AddButton({
  onCreateClass,
  onCreateInterface,
}: AddButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add File
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onCreateClass}>New Class</DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateInterface}>
          New Interface
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
