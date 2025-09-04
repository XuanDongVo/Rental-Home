"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle,
    User,
    Clock
} from "lucide-react";
import {
    useGetPaymentsByPropertyQuery,
    useRecordPaymentMutation,
    useCheckOverduePaymentsMutation,
} from "@/state/api";

interface PaymentManagementProps {
    propertyId: number;
}

export default function PaymentManagement({ propertyId }: PaymentManagementProps) {
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [recordAmount, setRecordAmount] = useState("");
    const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);

    const {
        data: payments = [],
        isLoading,
        error,
        refetch,
    } = useGetPaymentsByPropertyQuery(propertyId);

    const [recordPayment, { isLoading: isRecording }] = useRecordPaymentMutation();
    const [checkOverdue, { isLoading: isCheckingOverdue }] = useCheckOverduePaymentsMutation();

    const handleRecordPayment = async () => {
        if (!selectedPayment || !recordAmount) return;

        try {
            await recordPayment({
                paymentId: selectedPayment.id,
                amountPaid: parseFloat(recordAmount),
            }).unwrap();

            setIsRecordDialogOpen(false);
            setRecordAmount("");
            setSelectedPayment(null);
            refetch();
        } catch (error) {
            console.error("Error recording payment:", error);
        }
    };

    const handleCheckOverdue = async () => {
        try {
            await checkOverdue().unwrap();
            refetch();
        } catch (error) {
            console.error("Error checking overdue payments:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            "Paid": { className: "bg-green-100 text-green-800", icon: CheckCircle },
            "Pending": { className: "bg-yellow-100 text-yellow-800", icon: Clock },
            "PartiallyPaid": { className: "bg-blue-100 text-blue-800", icon: DollarSign },
            "Overdue": { className: "bg-red-100 text-red-800", icon: AlertTriangle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
        const Icon = config.icon;

        return (
            <Badge className={config.className}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </Badge>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Group payments by status
    const overduePayments = payments.filter(p => p.paymentStatus === "Overdue");
    const pendingPayments = payments.filter(p => p.paymentStatus === "Pending");
    const paidPayments = payments.filter(p => p.paymentStatus === "Paid");
    const partialPayments = payments.filter(p => p.paymentStatus === "PartiallyPaid");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading payment data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error loading payments. Please try again.</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{overduePayments.length}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Partial</p>
                                <p className="text-2xl font-bold text-blue-600">{partialPayments.length}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Paid</p>
                                <p className="text-2xl font-bold text-green-600">{paidPayments.length}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    onClick={handleCheckOverdue}
                    disabled={isCheckingOverdue}
                    variant="outline"
                >
                    {isCheckingOverdue ? "Checking..." : "Check Overdue Payments"}
                </Button>
            </div>

            {/* Payments List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No payments found for this property</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <div key={payment.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <User className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <h3 className="font-semibold">{payment.lease.tenant.name}</h3>
                                                <p className="text-sm text-gray-600">{payment.lease.tenant.email}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(payment.paymentStatus)}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Due Date</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(payment.dueDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Amount Due</p>
                                            <p className="font-medium">{formatCurrency(payment.amountDue)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Amount Paid</p>
                                            <p className="font-medium">{formatCurrency(payment.amountPaid)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Remaining</p>
                                            <p className="font-medium text-red-600">
                                                {formatCurrency(payment.amountDue - payment.amountPaid)}
                                            </p>
                                        </div>
                                    </div>

                                    {payment.paymentDate && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            Paid on: {formatDate(payment.paymentDate)}
                                        </div>
                                    )}

                                    {payment.paymentStatus !== "Paid" && (
                                        <div className="mt-3 flex gap-2">
                                            <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setSelectedPayment(payment)}
                                                    >
                                                        Record Payment
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Record Payment</DialogTitle>
                                                        <DialogDescription>
                                                            Record a payment for {selectedPayment?.lease.tenant.name}
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label>Payment Amount</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Enter amount"
                                                                value={recordAmount}
                                                                onChange={(e) => setRecordAmount(e.target.value)}
                                                            />
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Remaining: {selectedPayment && formatCurrency(selectedPayment.amountDue - selectedPayment.amountPaid)}
                                                            </p>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={handleRecordPayment}
                                                                disabled={isRecording || !recordAmount}
                                                                className="flex-1"
                                                            >
                                                                {isRecording ? "Recording..." : "Record Payment"}
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsRecordDialogOpen(false);
                                                                    setRecordAmount("");
                                                                    setSelectedPayment(null);
                                                                }}
                                                                className="flex-1"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
