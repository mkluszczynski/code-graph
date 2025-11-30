/**
 * CreateDialog Component
 *
 * Dialog component for creating new files or folders with inline validation,
 * keyboard navigation, and accessibility support.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { CreateItemType } from "../file-tree/types";
import { validateItemName, validateFileExtension } from "../file-tree/FileOperations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface CreateDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Type of item to create */
  type: CreateItemType;
  /** Parent folder path where item will be created */
  parentPath: string;
  /** Existing item names in the parent folder (for duplicate detection) */
  existingNames: string[];
  /** Called when user confirms creation with valid name */
  onSubmit: (name: string) => Promise<void>;
  /** Called when user cancels dialog */
  onCancel: () => void;
}

/**
 * CreateDialog component for creating files or folders
 */
export function CreateDialog({
  open,
  type,
  parentPath,
  existingNames,
  onSubmit,
  onCancel,
}: CreateDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = "create-dialog-error";

  // Reset state and focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Use microtask to avoid setState in synchronous render
      queueMicrotask(() => {
        setName("");
        setError(null);
        setIsSubmitting(false);
      });

      // Small delay to ensure dialog is rendered
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Clear error when user types
    if (error) {
      setError(null);
    }
  }, [error]);

  const validateAndSubmit = useCallback(async () => {
    // Get the trimmed name
    const trimmedName = name.trim();

    // Validate empty input BEFORE other validation
    if (!trimmedName) {
      const itemLabel = type === "file" ? "File" : "Folder";
      setError(`${itemLabel} name cannot be empty`);
      inputRef.current?.focus();
      return;
    }

    // For files: validate extension is present (no auto-adding .ts)
    if (type === "file") {
      const extensionValidation = validateFileExtension(trimmedName);
      if (!extensionValidation.isValid) {
        setError(extensionValidation.error || "Invalid file extension");
        inputRef.current?.focus();
        return;
      }
    }

    // Use trimmed name directly (no normalization)
    const finalName = trimmedName;

    // Validate the final name for other rules (invalid characters, length, etc.)
    const validation = validateItemName(finalName, type);
    if (!validation.isValid) {
      setError(validation.error || "Invalid name");
      inputRef.current?.focus();
      return;
    }

    // Check for duplicates
    if (existingNames.includes(finalName)) {
      const itemLabel = type === "file" ? "file" : "folder";
      setError(`A ${itemLabel} with this name already exists`);
      inputRef.current?.focus();
      return;
    }

    // Submit
    setIsSubmitting(true);
    try {
      await onSubmit(finalName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  }, [name, type, existingNames, onSubmit]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    validateAndSubmit();
  }, [validateAndSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !isSubmitting) {
      e.preventDefault();
      onCancel();
    }
  }, [isSubmitting, onCancel]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      onCancel();
    }
  }, [isSubmitting, onCancel]);

  const title = type === "file" ? "New File" : "New Folder";
  const description = `The ${type} will be created in ${parentPath}`;
  const placeholder = type === "file" ? "e.g., MyClass.ts or Person.dart" : "Enter folder name";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-labelledby="create-dialog-title"
        aria-describedby="create-dialog-description"
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
        onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
      >
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <DialogHeader>
            <DialogTitle id="create-dialog-title">{title}</DialogTitle>
            <DialogDescription id="create-dialog-description">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                ref={inputRef}
                value={name}
                onChange={handleNameChange}
                placeholder={placeholder}
                disabled={isSubmitting}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? errorId : undefined}
              />
              {error && (
                <p
                  id={errorId}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
