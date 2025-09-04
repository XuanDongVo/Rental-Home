"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ScrollText,
    DollarSign,
    User,
    Eye,
    AlertTriangle,
    FileText,
    Clock,
    Calendar,
    Home,
    Download,
} from "lucide-react";
import { useGetPropertyLeasesQuery, useGetPaymentsQuery } from "@/state/api";
import { Lease } from "@/types/prismaTypes";

interface ManagerPropertyTabsProps {
    propertyId: number;
}

const getLeaseStatusColor = (lease: Lease) => {
    const now = new Date();
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);

    if (now < startDate) {
        return "bg-blue-100 text-blue-800 border-blue-300";
    } else if (now >= startDate && now <= endDate) {
        return "bg-green-100 text-green-800 border-green-300";
    } else {
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
};

const getLeaseStatusText = (lease: Lease) => {
    const now = new Date();
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);

    if (now < startDate) {
        return "Upcoming";
    } else if (now >= startDate && now <= endDate) {
        return "Active";
    } else {
        return "Expired";
    }
};

// Fake data for demonstration
const mockLeases = [
    {
        id: 1,
        tenantId: 101,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        rent: 1500,
        tenant: {
            name: "John Smith",
            email: "john.smith@email.com",
            phone: "+1 (555) 123-4567"
        }
    },
    {
        id: 2,
        tenantId: 102,
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        rent: 1400,
        tenant: {
            name: "Sarah Johnson",
            email: "sarah.johnson@email.com",
            phone: "+1 (555) 987-6543"
        }
    },
    {
        id: 3,
        tenantId: 103,
        startDate: "2022-06-01",
        endDate: "2023-05-31",
        rent: 1300,
        tenant: {
            name: "Mike Chen",
            email: "mike.chen@email.com",
            phone: "+1 (555) 456-7890"
        }
    }
];

const mockPayments = [
    { id: 1, leaseId: 1, amount: 1500, dueDate: "2024-09-01", paidDate: "2024-09-01", paymentStatus: "Paid" },
    { id: 2, leaseId: 1, amount: 1500, dueDate: "2024-08-01", paidDate: "2024-08-02", paymentStatus: "Paid" },
    { id: 3, leaseId: 1, amount: 1500, dueDate: "2024-07-01", paidDate: "2024-07-01", paymentStatus: "Paid" },
    { id: 4, leaseId: 1, amount: 1500, dueDate: "2024-06-01", paidDate: null, paymentStatus: "Late" },
    { id: 5, leaseId: 2, amount: 1400, dueDate: "2023-12-01", paidDate: "2023-12-01", paymentStatus: "Paid" },
    { id: 6, leaseId: 2, amount: 1400, dueDate: "2023-11-01", paidDate: "2023-11-03", paymentStatus: "Paid" },
    { id: 7, leaseId: 3, amount: 1300, dueDate: "2023-05-01", paidDate: "2023-05-01", paymentStatus: "Paid" }
];

const ManagerPropertyTabs: React.FC<ManagerPropertyTabsProps> = ({ propertyId }) => {
    // Use fake data for demonstration
    const leases = mockLeases;
    const payments = mockPayments;
    const leasesLoading = false;
    const paymentsLoading = false;

    const getCurrentMonthPaymentStatus = (leaseId: number) => {
        const currentDate = new Date();
        const currentMonthPayment = payments?.find(
            (payment) =>
                payment.leaseId === leaseId &&
                new Date(payment.dueDate).getMonth() === currentDate.getMonth() &&
                new Date(payment.dueDate).getFullYear() === currentDate.getFullYear()
        );
        return currentMonthPayment?.paymentStatus || "Not Paid";
    };

    const getActiveLease = () => {
        if (!leases) return null;
        const now = new Date();
        return leases.find(lease => {
            const startDate = new Date(lease.startDate);
            const endDate = new Date(lease.endDate);
            return now >= startDate && now <= endDate;
        });
    };

    const getLeaseHistory = () => {
        if (!leases) return [];
        // Sort by start date, most recent first
        return [...leases].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    };

    if (leasesLoading || paymentsLoading) {
        return <div>Loading...</div>;
    }

    const activeLease = getActiveLease();
    const leaseHistory = getLeaseHistory();

    return (
        <div className="w-full">
            <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="current" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Current Tenant
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <ScrollText className="w-4 h-4" />
                        Lease History
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Payment History
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: Current Tenant - Hiển thị tenant hiện tại đang thuê */}

                {/* Current Tenant Tab */}
                <TabsContent value="current" className="space-y-4">
                    <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Current Tenant</h2>
                                <p className="text-sm text-gray-500">
                                    👤 View active lease and current tenant information for this property.
                                </p>
                            </div>
                        </div>

                        {activeLease ? (
                            <div className="border rounded-lg p-6 bg-green-50 border-green-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold">{activeLease.tenant?.name || "N/A"}</h3>
                                            <p className="text-gray-600">{activeLease.tenant?.email || "N/A"}</p>
                                            <p className="text-sm text-gray-500">Tenant ID: {activeLease.tenantId}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                                        Active Lease
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">Lease Start</span>
                                        </div>
                                        <p className="font-semibold">{new Date(activeLease.startDate).toLocaleDateString()}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">Lease End</span>
                                        </div>
                                        <p className="font-semibold">{new Date(activeLease.endDate).toLocaleDateString()}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">Monthly Rent</span>
                                        </div>
                                        <p className="font-semibold text-green-600">${activeLease.rent}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">Payment Status</span>
                                        </div>
                                        <p className={`font-semibold ${getCurrentMonthPaymentStatus(activeLease.id) === "Paid"
                                            ? "text-green-600"
                                            : "text-red-600"
                                            }`}>
                                            {getCurrentMonthPaymentStatus(activeLease.id)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Lease Details
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        <User className="w-4 h-4 mr-2" />
                                        Contact Tenant
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Documents
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Property Available</h3>
                                <p className="text-gray-500 mb-4">This property is currently vacant and available for rent.</p>
                                <Button className="bg-primary-600 hover:bg-primary-700">
                                    List Property for Rent
                                </Button>
                            </div>
                        )}

                        {/* Previous Tenants Quick Reference */}
                        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Previous Tenants</h3>
                                    <p className="text-sm text-gray-500">Quick reference to past tenants</p>
                                </div>
                                <Button variant="outline" size="sm">
                                    View Full History →
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {leaseHistory.filter(lease => activeLease?.id !== lease.id).map((lease) => (
                                    <div key={lease.id} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{lease.tenant?.name}</h4>
                                                    <p className="text-sm text-gray-500">{lease.tenant?.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={getLeaseStatusColor(lease)}>
                                                    {getLeaseStatusText(lease)}
                                                </Badge>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(lease.startDate).getFullYear()} - {new Date(lease.endDate).getFullYear()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-between items-center text-sm border-t pt-3">
                                            <span className="text-gray-600">
                                                Duration: {Math.ceil((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                            </span>
                                            <span className="font-medium text-green-600">${lease.rent}/month</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {leaseHistory.filter(lease => activeLease?.id !== lease.id).length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 text-sm">No previous tenants for this property</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: Lease History - Hiển thị lịch sử tất cả tenant cũ */}
                <TabsContent value="history" className="space-y-4">
                    <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Lease History</h2>
                                <p className="text-sm text-gray-500">
                                    📜 Complete history of all tenants and leases for this property (current + past)
                                </p>
                            </div>
                            <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export History
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {leaseHistory.map((lease, index) => {
                                const isActive = activeLease?.id === lease.id;
                                const statusColor = getLeaseStatusColor(lease);
                                const statusText = getLeaseStatusText(lease);

                                return (
                                    <div key={lease.id} className={`border rounded-lg p-6 ${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-100'
                                                        }`}>
                                                        <User className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-gray-600'
                                                            }`} />
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">1</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{lease.tenant?.name || "N/A"}</h3>
                                                    <p className="text-gray-600">{lease.tenant?.email || "N/A"}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={statusColor}>
                                                {statusText}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Duration</p>
                                                <p className="font-medium">
                                                    {Math.ceil((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Monthly Rent</p>
                                                <p className="font-medium text-green-600">${lease.rent}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Revenue</p>
                                                <p className="font-medium text-green-600">
                                                    ${(lease.rent * Math.ceil((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-1" />
                                                View Details
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <FileText className="w-4 h-4 mr-1" />
                                                View Contract
                                            </Button>
                                            {!isActive && (
                                                <Button variant="outline" size="sm">
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Download Records
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {leaseHistory.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <ScrollText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Lease History</h3>
                                    <p className="text-gray-500">This property hasn&apos;t had any tenants yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 3: Payment History - Hiển thị lịch sử thanh toán của tất cả tenant */}
                <TabsContent value="payments" className="space-y-4">
                    <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Payment History</h2>
                                <p className="text-sm text-gray-500">
                                    💰 Track all rent payments and financial records for this property (all tenants)
                                </p>
                            </div>
                            <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export Payments
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {payments && payments.length > 0 ? (
                                payments.map((payment) => (
                                    <div key={payment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${payment.paymentStatus === "Paid" ? "bg-green-500" : "bg-red-500"
                                                    }`} />
                                                <div>
                                                    <p className="font-medium">
                                                        {leases?.find(l => l.id === payment.leaseId)?.tenant?.name || "Unknown Tenant"}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                                                        {payment.paidDate && ` • Paid: ${new Date(payment.paidDate).toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">${payment.amount}</p>
                                                <Badge className={
                                                    payment.paymentStatus === "Paid"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }>
                                                    {payment.paymentStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payment Records</h3>
                                    <p className="text-gray-500">No payment history available for this property.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ManagerPropertyTabs;
