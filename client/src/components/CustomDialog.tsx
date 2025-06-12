import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CustomDialog: React.FC<CustomDialogProps> = ({
    open,
    onClose,
    title = "Dialog Title",
    description,
    content,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    showFooter = true,
    loading = false,
}: CustomDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-2xl shadow-lg px-6 py-5">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm text-gray-500">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="py-4 text-sm text-gray-700">{content}</div>

                {showFooter && (
                    <DialogFooter className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={onCancel || onClose}
                            className="rounded-lg"
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={loading}
                            className="rounded-lg"
                        >
                            {loading ? "Processing..." : confirmLabel}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CustomDialog;
