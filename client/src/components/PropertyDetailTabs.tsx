"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useGetPaymentsQuery,
    useGetPropertyLeasesQuery,
} from "@/state/api";
import { Lease } from "@/types/prismaTypes";
import TenantPaymentInterface from "./TenantPaymentInterface";
import {
    ArrowDownToLine,
    Check,
    Download,
    Calendar,
    DollarSign,
    User,
    Eye,
    AlertTriangle,
    FileText,
    MapPin,
} from "lucide-react";
import Image from "next/image";
import TerminateLeaseModal from "./TerminateLeaseModal";

interface PropertyDetailTabsProps {
    propertyId: number;
    userType: "manager" | "tenant";
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

// Mock termination requests data
const mockTerminationRequests = [
    {
        id: 1,
        tenantName: "John Doe",
        leaseId: 1,
        requestDate: "2024-01-15",
        reason: "Job relocation",
        status: "pending",
        requestedEndDate: "2024-03-01",
    },
    {
        id: 2,
        tenantName: "Jane Smith",
        leaseId: 2,
        requestDate: "2024-01-10",
        reason: "Personal reasons",
        status: "approved",
        requestedEndDate: "2024-02-28",
    },
];

const PropertyDetailTabs: React.FC<PropertyDetailTabsProps> = ({
    propertyId,
    userType,
}) => {
    const { data: leases, isLoading: leasesLoading } =
        useGetPropertyLeasesQuery(propertyId);
    const { data: payments, isLoading: paymentsLoading } =
        useGetPaymentsQuery(propertyId);

    const [terminationRequests] = useState(mockTerminationRequests);
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);

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

    const handleApproveTermination = (requestId: number) => {
        // Mock approval logic
        console.log(`Approving termination request ${requestId}`);
    };

    const handleRejectTermination = (requestId: number) => {
        // Mock rejection logic
        console.log(`Rejecting termination request ${requestId}`);
    };

    if (leasesLoading || paymentsLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-full">
            <Tabs defaultValue="tenants" className="w-full">
                <TabsList className={`grid w-full ${userType === "manager" ? "grid-cols-3" : "grid-cols-3"}`}>
                    <TabsTrigger value="tenants" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {userType === "manager" ? "Tenants" : "Lease Details"}
                    </TabsTrigger>
                    <TabsTrigger value="leases" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {userType === "manager" ? "Lease Management" : "Payment History"}
                    </TabsTrigger>
                    <TabsTrigger value="termination" className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Termination Requests
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tenants" className="space-y-4">
                    {userType === "manager" ? (
                        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Tenants Overview</h2>
                                    <p className="text-sm text-gray-500">
                                        Manage and view all tenants for this property.
                                    </p>
                                </div>
                                <div>
                                    <button
                                        className="bg-white border border-gray-300 text-gray-700 py-2
                  px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        <span>Download All</span>
                                    </button>
                                </div>
                            </div>
                            <hr className="mt-4 mb-1" />
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tenant</TableHead>
                                            <TableHead>Lease Period</TableHead>
                                            <TableHead>Monthly Rent</TableHead>
                                            <TableHead>Current Month Status</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leases?.map((lease) => (
                                            <TableRow key={lease.id} className="h-24">
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <Image
                                                            src="/landing-i1.png"
                                                            alt={lease.tenant.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full"
                                                        />
                                                        <div>
                                                            <div className="font-semibold">
                                                                {lease.tenant.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {lease.tenant.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        {new Date(lease.startDate).toLocaleDateString()} -
                                                    </div>
                                                    <div>{new Date(lease.endDate).toLocaleDateString()}</div>
                                                </TableCell>
                                                <TableCell>${lease.rent.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getCurrentMonthPaymentStatus(lease.id) === "Paid"
                                                            ? "bg-green-100 text-green-800 border-green-300"
                                                            : "bg-red-100 text-red-800 border-red-300"
                                                            }`}
                                                    >
                                                        {getCurrentMonthPaymentStatus(lease.id) === "Paid" && (
                                                            <Check className="w-4 h-4 inline-block mr-1" />
                                                        )}
                                                        {getCurrentMonthPaymentStatus(lease.id)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{lease.tenant.phoneNumber}</TableCell>
                                                <TableCell>
                                                    <button
                                                        className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex 
                          items-center justify-center font-semibold hover:bg-primary-700 hover:text-primary-50"
                                                    >
                                                        <ArrowDownToLine className="w-4 h-4 mr-1" />
                                                        Download Agreement
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Your Lease Details</h2>
                                    <p className="text-sm text-gray-500">
                                        View your current lease information and status.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {leases?.map((lease) => (
                                    <div
                                        key={lease.id}
                                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-primary-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        Lease Agreement #{lease.id}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        Current lease for this property
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={getLeaseStatusColor(lease)}>
                                                {getLeaseStatusText(lease)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <p className="font-medium">Start Date</p>
                                                    <p className="text-gray-600">
                                                        {new Date(lease.startDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <p className="font-medium">End Date</p>
                                                    <p className="text-gray-600">
                                                        {new Date(lease.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <DollarSign className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <p className="font-medium">Monthly Rent</p>
                                                    <p className="text-gray-600">${lease.rent.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">
                                                    Payment Status:
                                                </span>
                                                <Badge
                                                    className={
                                                        getCurrentMonthPaymentStatus(lease.id) === "Paid"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }
                                                >
                                                    {getCurrentMonthPaymentStatus(lease.id)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <ArrowDownToLine className="w-4 h-4 mr-1" />
                                                Download Agreement
                                            </Button>
                                            <Button
                                                onClick={() => setIsTerminateModalOpen(true)}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                                <AlertTriangle className="w-4 h-4 mr-1" />
                                                Request Termination
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {(!leases || leases.length === 0) && (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No lease found for this property</p>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="leases" className="space-y-4">
                    {userType === "manager" ? (
                        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Lease Management</h2>
                                    <p className="text-sm text-gray-500">
                                        Monitor and manage all lease agreements for this property.
                                    </p>
                                </div>
                                <Button className="flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export Leases
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {leases?.map((lease) => (
                                    <div
                                        key={lease.id}
                                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src="/landing-i1.png"
                                                    alt={lease.tenant.name}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-full"
                                                />
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {lease.tenant.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {lease.tenant.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={getLeaseStatusColor(lease)}>
                                                {getLeaseStatusText(lease)}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span>
                                                    {new Date(lease.startDate).toLocaleDateString()} -{" "}
                                                    {new Date(lease.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <DollarSign className="w-4 h-4 text-gray-500" />
                                                <span>${lease.rent.toFixed(2)}/month</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <span>{lease.tenant.phoneNumber}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">
                                                    Payment Status:
                                                </span>
                                                <Badge
                                                    className={
                                                        getCurrentMonthPaymentStatus(lease.id) === "Paid"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }
                                                >
                                                    {getCurrentMonthPaymentStatus(lease.id)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Eye className="w-4 h-4 mr-1" />
                                                View Details
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <ArrowDownToLine className="w-4 h-4 mr-1" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {(!leases || leases.length === 0) && (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No leases found for this property</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-8">
                            {leases && leases.length > 0 ? (
                                leases.map((lease) => (
                                    <TenantPaymentInterface
                                        key={lease.id}
                                        leaseId={lease.id}
                                        tenantName={lease.tenant?.firstName + ' ' + lease.tenant?.lastName || 'Unknown Tenant'}
                                        propertyName={`Property #${propertyId}`}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No active lease found for payment</p>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="termination" className="space-y-4">
                    {userType === "manager" ? (
                        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Termination Requests</h2>
                                    <p className="text-sm text-gray-500">
                                        Review and manage lease termination requests for this property.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {terminationRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {request.tenantName}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Lease ID: {request.leaseId}
                                                </p>
                                            </div>
                                            <Badge
                                                className={
                                                    request.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : request.status === "approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                }
                                            >
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Request Date:</p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(request.requestDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    Requested End Date:
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(request.requestedEndDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                                            <p className="text-sm text-gray-600">{request.reason}</p>
                                        </div>

                                        {request.status === "pending" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleApproveTermination(request.id)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                    size="sm"
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleRejectTermination(request.id)}
                                                    variant="outline"
                                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                                    size="sm"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {terminationRequests.length === 0 && (
                                <div className="text-center py-8">
                                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        No termination requests for this property
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Termination Requests</h2>
                                    <p className="text-sm text-gray-500">
                                        Submit and track your lease termination requests.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setIsTerminateModalOpen(true)}
                                    className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Request Termination
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {terminationRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    Termination Request #{request.id}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Submitted on {new Date(request.requestDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge
                                                className={
                                                    request.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : request.status === "approved"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                }
                                            >
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    Requested End Date:
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(request.requestedEndDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Status:</p>
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {request.status === "pending"
                                                        ? "Under Review"
                                                        : request.status === "approved"
                                                            ? "Approved"
                                                            : "Rejected"
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                                            <p className="text-sm text-gray-600">{request.reason}</p>
                                        </div>

                                        {request.status === "pending" && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                                <p className="text-sm text-blue-700">
                                                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                                                    Your request is being reviewed by the property manager.
                                                </p>
                                            </div>
                                        )}

                                        {request.status === "approved" && (
                                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                                <p className="text-sm text-green-700">
                                                    <Check className="w-4 h-4 inline mr-1" />
                                                    Your termination request has been approved.
                                                </p>
                                            </div>
                                        )}

                                        {request.status === "rejected" && (
                                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                                <p className="text-sm text-red-700">
                                                    Your termination request has been rejected. Please contact the property manager for more information.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {terminationRequests.length === 0 && (
                                <div className="text-center py-8">
                                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">
                                        No termination requests found
                                    </p>
                                    <Button
                                        onClick={() => setIsTerminateModalOpen(true)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Submit Termination Request
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Termination Modal for Tenants */}
            {userType === "tenant" && isTerminateModalOpen && leases && leases.length > 0 && (
                <TerminateLeaseModal
                    isOpen={isTerminateModalOpen}
                    onClose={() => setIsTerminateModalOpen(false)}
                    lease={leases[0]}
                    onSuccess={() => {
                        setIsTerminateModalOpen(false);
                        // You can add additional success handling here
                    }}
                />
            )}
        </div>
    );
};

export default PropertyDetailTabs;
