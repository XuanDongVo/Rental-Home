"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    CreditCard,
    Home
} from "lucide-react";
import {
    useGetPaymentsByLeaseQuery,
    useGetCurrentMonthPaymentStatusByLeaseQuery,
} from "@/state/api";

interface TenantPaymentDashboardProps {
    leaseId: number;
    tenantName: string;
}

export default function TenantPaymentDashboard({
    leaseId,
    tenantName
}: TenantPaymentDashboardProps) {
    const {
        data: payments = [],
        isLoading: paymentsLoading,
        error: paymentsError,
    } = useGetPaymentsByLeaseQuery(leaseId);

    const {
        data: currentPayment,
        isLoading: currentLoading,
        error: currentError,
    } = useGetCurrentMonthPaymentStatusByLeaseQuery(leaseId);

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
    const totalDue = payments.reduce((sum, p) => sum + p.amountDue, 0);
    const overduePayments = payments.filter(p => p.paymentStatus === "Overdue");
    const upcomingPayments = payments.filter(p => {
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate >= today && dueDate <= nextWeek && p.paymentStatus === "Pending";
    });

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
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Home className="h-6 w-6 text-blue-500" />
                        <h1 className="text-2xl font-bold">Welcome, {tenantName}!</h1>
                    </div>
                    <p className="text-gray-600">Here&apos;s your payment overview and history.</p>
                </CardContent>
            </Card>

            {/* Current Month Payment */}
            {currentPayment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Current Month Payment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600">Payment Status</p>
                                    {getStatusBadge(currentPayment.paymentStatus)}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Amount</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(currentPayment.amountDue)}
                                    </p>
                                </div>
                            </div>

                            {currentPayment.amountPaid > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Payment Progress</span>
                                        <span className="text-sm text-gray-600">
                                            {formatCurrency(currentPayment.amountPaid)} / {formatCurrency(currentPayment.amountDue)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${getPaymentProgress(currentPayment.amountPaid, currentPayment.amountDue)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentPayment.dueDate && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    Due: {formatDate(currentPayment.dueDate)}
                                </div>
                            )}

                            {currentPayment.paymentStatus !== "Paid" && (
                                <Button className="w-full">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Make Payment
                                </Button>
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
                                <p className="text-sm text-gray-600">Upcoming</p>
                                <p className="text-xl font-bold text-blue-600">{upcomingPayments.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment History */}
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
                            <p className="text-gray-500">No payment history available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments
                                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                                .map((payment) => (
                                    <div key={payment.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold">Monthly Rent</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Due: {formatDate(payment.dueDate)}
                                                </p>
                                            </div>
                                            {getStatusBadge(payment.paymentStatus)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
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
                                            <div className="mt-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm text-gray-600">Payment Progress</span>
                                                    <span className="text-sm text-gray-600">
                                                        {Math.round(getPaymentProgress(payment.amountPaid, payment.amountDue))}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1">
                                                    <div
                                                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                                        style={{ width: `${getPaymentProgress(payment.amountPaid, payment.amountDue)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {payment.paymentDate && (
                                            <div className="mt-2 text-sm text-green-600">
                                                ✓ Paid on {formatDate(payment.paymentDate)}
                                            </div>
                                        )}

                                        {payment.paymentStatus === "Overdue" && (
                                            <div className="mt-3">
                                                <Button variant="destructive" size="sm" className="w-full">
                                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                                    Pay Overdue Amount
                                                </Button>
                                            </div>
                                        )}

                                        {payment.paymentStatus === "Pending" && (
                                            <div className="mt-3">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                    Pay Now
                                                </Button>
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
