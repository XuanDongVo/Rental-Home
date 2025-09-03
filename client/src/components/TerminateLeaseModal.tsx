"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, DollarSign, FileText } from "lucide-react";
import { Lease } from "@/types/prismaTypes";
import { toast } from "sonner";

interface TerminateLeaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    lease: Lease;
    onSuccess?: () => void;
}

const TerminateLeaseModal: React.FC<TerminateLeaseModalProps> = ({
    isOpen,
    onClose,
    lease,
    onSuccess,
}) => {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for lease termination");
            return;
        }

        setIsSubmitting(true);

        // Simulate API call to create termination request
        setTimeout(() => {
            toast.success("Lease termination request submitted successfully! You will be notified when the landlord responds.");
            onSuccess?.();
            onClose();
            setReason("");
            setShowConfirmation(false);
            setIsSubmitting(false);
        }, 2000);
    };

    const calculateRemainingDays = () => {
        const today = new Date();
        const endDate = new Date(lease.endDate);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const isEarlyTermination = () => {
        const today = new Date();
        const endDate = new Date(lease.endDate);
        return today < endDate;
    };

    const handleClose = () => {
        setReason("");
        setShowConfirmation(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                {!showConfirmation ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Terminate Lease Agreement
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to terminate this lease agreement?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Lease Info */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-600" />
                                    <span className="font-medium">Lease Information</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Start Date:</span>
                                        <p className="font-medium">
                                            {new Date(lease.startDate).toLocaleDateString("en-US")}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">End Date:</span>
                                        <p className="font-medium">
                                            {new Date(lease.endDate).toLocaleDateString("en-US")}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Monthly Rent:</span>
                                        <p className="font-medium text-green-600">
                                            ${lease.rent}/month
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Days Remaining:</span>
                                        <p className="font-medium">
                                            {calculateRemainingDays()} days
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Early Termination Warning */}
                            {isEarlyTermination() && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        <span className="font-medium text-yellow-800">
                                            Early Termination Notice
                                        </span>
                                    </div>
                                    <p className="text-yellow-700 text-sm">
                                        Terminating the lease early may incur penalty fees
                                        according to the lease terms. Please contact your landlord for more details.
                                    </p>
                                </div>
                            )}

                            {/* Reason Input */}
                            <div className="space-y-2">
                                <Label htmlFor="reason">
                                    Reason for Termination <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Please provide the reason for terminating your lease agreement..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => setShowConfirmation(true)}
                                disabled={!reason.trim()}
                            >
                                Continue
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Confirm Lease Termination
                            </DialogTitle>
                            <DialogDescription>
                                This request will be sent to your landlord for review and approval.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 mb-2">
                                    Next Steps:
                                </h4>
                                <ul className="text-blue-700 text-sm space-y-1">
                                    <li>• Request will be sent to your landlord</li>
                                    <li>• Landlord will review and respond within 3-5 days</li>
                                    <li>• You will receive notification about the decision</li>
                                    <li>• If approved, you&apos;ll get move-out instructions</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-3 rounded">
                                <p className="text-sm text-gray-700">
                                    <strong>Reason:</strong> {reason}
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmation(false)}
                                disabled={isSubmitting}
                            >
                                Go Back
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting Request..." : "Submit Termination Request"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TerminateLeaseModal;
