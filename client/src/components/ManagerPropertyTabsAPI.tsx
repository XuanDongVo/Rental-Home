"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Phone, Mail, User, Home, DollarSign } from "lucide-react";
import PaymentManagement from "./PaymentManagement";
import {
    useGetPropertySummaryQuery,
    useGetLeaseHistoryByPropertyQuery,
    useGetPaymentHistoryByPropertyQuery,
    useGetPreviousTenantsForPropertyQuery,
} from "@/state/api";

interface ManagerPropertyTabsAPIProps {
    propertyId: number;
}

export default function ManagerPropertyTabsAPI({ propertyId }: ManagerPropertyTabsAPIProps) {
    // Use Redux Toolkit Query hooks
    const {
        data: summary,
        isLoading: summaryLoading,
        error: summaryError,
    } = useGetPropertySummaryQuery(propertyId);

    console.log("Property Summary:", summary);

    const {
        data: leaseHistory = [],
        isLoading: historyLoading,
        error: historyError,
    } = useGetLeaseHistoryByPropertyQuery(propertyId);

    const {
        data: paymentHistory = [],
        isLoading: paymentsLoading,
        error: paymentsError,
    } = useGetPaymentHistoryByPropertyQuery(propertyId);

    const {
        data: previousTenants = [],
        isLoading: previousLoading,
        error: previousError,
    } = useGetPreviousTenantsForPropertyQuery({ propertyId, limit: 5 });

    const isLoading = summaryLoading || historyLoading || paymentsLoading || previousLoading;
    const error = summaryError || historyError || paymentsError || previousError;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading property data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error loading data. Please try again.</div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const statusColors = {
            "Paid": "bg-green-100 text-green-800",
            "Not Paid": "bg-red-100 text-red-800",
            "Late": "bg-orange-100 text-orange-800",
            "Pending": "bg-yellow-100 text-yellow-800"
        };
        return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
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

    return (
        <div className="w-full">
            <Tabs defaultValue="current-tenant" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="current-tenant">Current Tenant</TabsTrigger>
                    <TabsTrigger value="lease-history">Lease History</TabsTrigger>
                    <TabsTrigger value="payment-history">Payment History</TabsTrigger>
                    <TabsTrigger value="payment-management">Payment Management</TabsTrigger>
                </TabsList>

                <TabsContent value="current-tenant" className="space-y-4">
                    {summary?.isVacant ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Home className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Property is Vacant</h3>
                                <p className="text-gray-500 text-center">
                                    No active lease for this property at the moment.
                                </p>
                                <Button className="mt-4" variant="outline">
                                    Find New Tenant
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {/* Current Tenant Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Current Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {summary?.currentLease && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-semibold">{summary.currentLease.tenant.name}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-4 w-4" />
                                                            {summary.currentLease.tenant.email}
                                                        </div>
                                                        {summary.currentLease.tenant.phoneNumber && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-4 w-4" />
                                                                {summary.currentLease.tenant.phoneNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className={getStatusBadge(summary.currentPaymentStatus)}>
                                                    {summary.currentPaymentStatus}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                                <div>
                                                    <p className="text-sm text-gray-600">Lease Period</p>
                                                    <p className="font-medium">
                                                        {formatDate(summary.currentLease.startDate)} - {formatDate(summary.currentLease.endDate)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Monthly Rent</p>
                                                    <p className="font-medium">{formatCurrency(summary.currentLease.rent)}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-4">
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    Send Message
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    View Payments
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Previous Tenants Section */}
                            {previousTenants.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CalendarDays className="h-5 w-5" />
                                            Previous Tenants
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {previousTenants.map((lease) => (
                                                <div key={lease.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <h4 className="font-medium">{lease.tenant.name}</h4>
                                                        <p className="text-sm text-gray-600">{lease.tenant.email}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">{formatCurrency(lease.rent)}</p>
                                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                                            View History
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="lease-history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                All Lease History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {leaseHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No lease history available</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {leaseHistory.map((lease) => {
                                        const now = new Date();
                                        const startDate = new Date(lease.startDate);
                                        const endDate = new Date(lease.endDate);
                                        const isActive = now >= startDate && now <= endDate;
                                        const isUpcoming = now < startDate;

                                        return (
                                            <div key={lease.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-semibold">{lease.tenant.name}</h3>
                                                        <p className="text-sm text-gray-600">{lease.tenant.email}</p>
                                                    </div>
                                                    <Badge
                                                        className={
                                                            isActive
                                                                ? "bg-green-100 text-green-800"
                                                                : isUpcoming
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                        }
                                                    >
                                                        {isActive ? "Active" : isUpcoming ? "Upcoming" : "Expired"}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-600">Start Date</p>
                                                        <p className="font-medium">{formatDate(lease.startDate)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">End Date</p>
                                                        <p className="font-medium">{formatDate(lease.endDate)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Monthly Rent</p>
                                                        <p className="font-medium">{formatCurrency(lease.rent)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment-history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Payment History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No payment history available</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paymentHistory.map((payment) => (
                                        <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{payment.lease.tenant.name}</p>
                                                <p className="text-sm text-gray-600">Due: {formatDate(payment.dueDate)}</p>
                                                {payment.paymentDate && (
                                                    <p className="text-xs text-gray-500">Paid: {formatDate(payment.paymentDate)}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(payment.amountDue)}</p>
                                                {payment.amountPaid !== payment.amountDue && (
                                                    <p className="text-sm text-gray-600">Paid: {formatCurrency(payment.amountPaid)}</p>
                                                )}
                                                <Badge className={getStatusBadge(payment.paymentStatus)}>
                                                    {payment.paymentStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment-management" className="space-y-4">
                    <PaymentManagement propertyId={propertyId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
