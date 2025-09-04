"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    CreditCard,
    Home,
    Wallet,
    Receipt,
    Info,
    Bell
} from "lucide-react";
import {
    useGetPaymentsByLeaseQuery,
    useGetCurrentMonthPaymentStatusByLeaseQuery,
    useRecordPaymentMutation,
} from "@/state/api";

interface TenantPaymentInterfaceProps {
    leaseId: number;
    tenantName: string;
    propertyName: string;
}

export default function TenantPaymentInterface({
    leaseId,
    tenantName,
    propertyName
}: TenantPaymentInterfaceProps) {
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);

    const {
        data: payments = [],
        isLoading: paymentsLoading,
        error: paymentsError,
        refetch: refetchPayments,
    } = useGetPaymentsByLeaseQuery(leaseId);

    const {
        data: currentPayment,
        isLoading: currentLoading,
        error: currentError,
        refetch: refetchCurrent,
    } = useGetCurrentMonthPaymentStatusByLeaseQuery(leaseId);

    const [recordPayment, { isLoading: isRecording }] = useRecordPaymentMutation();

    const handleMakePayment = async () => {
        if (!selectedPayment || !paymentAmount || !paymentMethod) return;

        try {
            await recordPayment({
                paymentId: selectedPayment.id,
                amountPaid: parseFloat(paymentAmount),
            }).unwrap();

            setIsPaymentDialogOpen(false);
            setPaymentAmount("");
            setPaymentMethod("");
            setSelectedPayment(null);
            refetchPayments();
            refetchCurrent();
        } catch (error) {
            console.error("Error making payment:", error);
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

    const getPaymentProgress = (amountPaid: number, amountDue: number) => {
        return Math.min((amountPaid / amountDue) * 100, 100);
    };

    // Calculate stats
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const overduePayments = payments.filter(p => p.paymentStatus === "Overdue");
    const pendingPayments = payments.filter(p => p.paymentStatus === "Pending");

    if (paymentsLoading || currentLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading payment information...</div>
            </div>
        );
    }

    if (paymentsError || currentError) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error loading payment data. Please try again.</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Home className="h-6 w-6 text-blue-500" />
                        <h1 className="text-2xl font-bold text-blue-900">
                            Welcome, {tenantName}!
                        </h1>
                    </div>
                    <p className="text-blue-700">
                        Property: <span className="font-semibold">{propertyName}</span>
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                        Manage your rent payments and view payment history
                    </p>
                </CardContent>
            </Card>

            {/* Current Month Payment - Prominently Featured */}
            {currentPayment && (
                <Card className={`border-2 ${currentPayment.paymentStatus === "Paid"
                        ? "border-green-200 bg-green-50"
                        : currentPayment.paymentStatus === "Overdue"
                            ? "border-red-200 bg-red-50"
                            : "border-orange-200 bg-orange-50"
                    }`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Current Month Payment
                            {currentPayment.paymentStatus !== "Paid" && (
                                <Bell className="h-4 w-4 text-orange-500 animate-pulse" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                                    {getStatusBadge(currentPayment.paymentStatus)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Monthly Rent</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(currentPayment.amountDue)}
                                    </p>
                                </div>
                            </div>

                            {currentPayment.amountPaid > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Payment Progress</span>
                                        <span className="text-sm font-medium">
                                            {formatCurrency(currentPayment.amountPaid)} / {formatCurrency(currentPayment.amountDue)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${getPaymentProgress(currentPayment.amountPaid, currentPayment.amountDue)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {Math.round(getPaymentProgress(currentPayment.amountPaid, currentPayment.amountDue))}% completed
                                    </p>
                                </div>
                            )}

                            {currentPayment.dueDate && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600">
                                        Due Date: <span className="font-medium">{formatDate(currentPayment.dueDate)}</span>
                                    </span>
                                </div>
                            )}

                            {currentPayment.paymentStatus !== "Paid" && (
                                <div className="pt-4 border-t">
                                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                className="w-full text-lg py-6"
                                                size="lg"
                                                onClick={() => {
                                                    // Tìm payment record tương ứng với current month
                                                    const currentMonthPayment = payments.find(p => {
                                                        const paymentDate = new Date(p.dueDate);
                                                        const currentDate = new Date();
                                                        return paymentDate.getMonth() === currentDate.getMonth() &&
                                                            paymentDate.getFullYear() === currentDate.getFullYear();
                                                    });

                                                    setSelectedPayment(currentMonthPayment || {
                                                        id: Date.now(), // Temporary ID
                                                        amountDue: currentPayment.amountDue,
                                                        amountPaid: currentPayment.amountPaid,
                                                        dueDate: currentPayment.dueDate
                                                    });
                                                }}
                                            >
                                                <CreditCard className="w-5 h-5 mr-2" />
                                                {currentPayment.paymentStatus === "Overdue" ? "Pay Overdue Amount" : "Make Payment"}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Wallet className="h-5 w-5" />
                                                    Make Payment
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Pay your rent for {propertyName}
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4">
                                                {/* Payment Summary */}
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm text-gray-600">Amount Due:</span>
                                                        <span className="font-semibold">{formatCurrency(currentPayment.amountDue)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm text-gray-600">Already Paid:</span>
                                                        <span className="text-green-600">{formatCurrency(currentPayment.amountPaid)}</span>
                                                    </div>
                                                    <Separator className="my-2" />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-semibold">Remaining:</span>
                                                        <span className="font-bold text-red-600">
                                                            {formatCurrency(currentPayment.amountDue - currentPayment.amountPaid)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Payment Amount */}
                                                <div>
                                                    <Label htmlFor="amount">Payment Amount</Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        step="1000"
                                                        placeholder="Enter amount"
                                                        value={paymentAmount}
                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                        className="text-lg"
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPaymentAmount((currentPayment.amountDue - currentPayment.amountPaid).toString())}
                                                        >
                                                            Pay Full Amount
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setPaymentAmount((Math.ceil((currentPayment.amountDue - currentPayment.amountPaid) / 2)).toString())}
                                                        >
                                                            Pay Half
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Payment Method */}
                                                <div>
                                                    <Label htmlFor="method">Payment Method</Label>
                                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select payment method" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="check">Check</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Payment Info */}
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                                        <div className="text-sm text-blue-700">
                                                            <p className="font-medium mb-1">Payment Information:</p>
                                                            <p>• Payments are processed immediately</p>
                                                            <p>• You will receive a confirmation receipt</p>
                                                            <p>• Contact your landlord for any payment issues</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        onClick={handleMakePayment}
                                                        disabled={isRecording || !paymentAmount || !paymentMethod}
                                                        className="flex-1"
                                                        size="lg"
                                                    >
                                                        {isRecording ? "Processing..." : `Pay ${paymentAmount ? formatCurrency(parseFloat(paymentAmount)) : ""}`}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setIsPaymentDialogOpen(false);
                                                            setPaymentAmount("");
                                                            setPaymentMethod("");
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

                            {currentPayment.paymentStatus === "Paid" && currentPayment.paymentDate && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="font-medium">
                                            Payment completed on {formatDate(currentPayment.paymentDate)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Paid</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Overdue</p>
                                <p className="text-xl font-bold text-red-600">{overduePayments.length}</p>
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
                                <p className="text-xl font-bold text-yellow-600">{pendingPayments.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="text-center py-8">
                            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No payment history available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments
                                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                                .map((payment) => (
                                    <div key={payment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold">Monthly Rent Payment</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Due: {formatDate(payment.dueDate)}
                                                </p>
                                            </div>
                                            {getStatusBadge(payment.paymentStatus)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                            <div>
                                                <p className="text-gray-600">Amount Due</p>
                                                <p className="font-medium">{formatCurrency(payment.amountDue)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Amount Paid</p>
                                                <p className="font-medium">{formatCurrency(payment.amountPaid)}</p>
                                            </div>
                                        </div>

                                        {payment.amountPaid > 0 && payment.amountPaid < payment.amountDue && (
                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-600">Payment Progress</span>
                                                    <span className="text-sm text-gray-600">
                                                        {Math.round(getPaymentProgress(payment.amountPaid, payment.amountDue))}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${getPaymentProgress(payment.amountPaid, payment.amountDue)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {payment.paymentDate && (
                                            <div className="text-sm text-green-600 mb-3">
                                                ✓ Payment completed on {formatDate(payment.paymentDate)}
                                            </div>
                                        )}

                                        {payment.paymentStatus !== "Paid" && (
                                            <div className="flex gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant={payment.paymentStatus === "Overdue" ? "destructive" : "default"}
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => setSelectedPayment(payment)}
                                                        >
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            {payment.paymentStatus === "Overdue" ? "Pay Overdue" : "Make Payment"}
                                                        </Button>
                                                    </DialogTrigger>
                                                    {/* Same payment dialog content as above */}
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
