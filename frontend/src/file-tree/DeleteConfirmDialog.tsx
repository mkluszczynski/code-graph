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
    /** Name of the file to delete */
    fileName: string;
    /** Callback when delete is confirmed */
    onConfirm: () => void;
    /** Callback when delete is cancelled */
    onCancel: () => void;
}

/**
 * DeleteConfirmDialog component
 *
 * Displays a confirmation dialog before deleting a file
 */
export function DeleteConfirmDialog({
    open,
    fileName,
    onConfirm,
    onCancel,
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete File?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{fileName}</strong>? This
                        action cannot be undone.
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
