/**
 * DeleteConfirmDialog Component
 *
 * A confirmation dialog for file deletion operations
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Name of the file or folder to delete */
    fileName: string;
    /** Number of files in folder (for folder deletion) */
    fileCount?: number;
    /** Callback when delete is confirmed */
    onConfirm: () => void;
    /** Callback when delete is cancelled */
    onCancel: () => void;
}

/**
 * DeleteConfirmDialog component
 *
 * Displays a confirmation dialog before deleting a file or folder
 */
export function DeleteConfirmDialog({
    open,
    fileName,
    fileCount,
    onConfirm,
    onCancel,
}: DeleteConfirmDialogProps) {
    const isFolder = fileCount !== undefined;
    const title = isFolder ? "Delete Folder?" : "Delete File?";

    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {isFolder ? (
                            <>
                                Are you sure you want to delete the folder{" "}
                                <strong>{fileName}</strong>
                                {fileCount > 0 ? (
                                    <> and all <strong>{fileCount} files</strong> inside it</>
                                ) : (
                                    ""
                                )}
                                ? This action cannot be undone.
                            </>
                        ) : (
                            <>
                                Are you sure you want to delete <strong>{fileName}</strong>? This
                                action cannot be undone.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
