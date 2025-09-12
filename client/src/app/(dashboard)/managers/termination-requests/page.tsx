"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertTriangle,
    Check,
    X,
    Calendar,
    DollarSign,
    MapPin,
    User,
    Clock
} from "lucide-react";
import { useGetAuthUserQuery } from "@/state/api";

// Mock data for termination requests across all properties
const mockTerminationRequests = [
    {
        id: 1,
        tenantName: "John Doe",
        tenantEmail: "john.doe@email.com",
        property: {
            id: 1,
            name: "Modern Downtown Apartment",
            address: "123 Main St, City Center"
        },
        leaseId: 1,
        requestDate: "2024-01-15",
        reason: "Job relocation to another city",
        status: "pending",
        requestedEndDate: "2024-03-01",
        monthlyRent: 1200,
        leaseEndDate: "2024-12-31",
        earlyTermination: true
    },
    {
        id: 2,
        tenantName: "Jane Smith",
        tenantEmail: "jane.smith@email.com",
        property: {
            id: 2,
            name: "Cozy Studio Apartment",
            address: "456 Oak Ave, Suburb"
        },
        leaseId: 2,
        requestDate: "2024-01-10",
        reason: "Personal family reasons",
        status: "approved",
        requestedEndDate: "2024-02-28",
        monthlyRent: 800,
        leaseEndDate: "2024-06-30",
        earlyTermination: true
    },
    {
        id: 3,
        tenantName: "Mike Johnson",
        tenantEmail: "mike.johnson@email.com",
        property: {
            id: 3,
            name: "Luxury Penthouse",
            address: "789 Hill St, Uptown"
        },
        leaseId: 3,
        requestDate: "2024-01-20",
        reason: "Purchased own home",
        status: "rejected",
        requestedEndDate: "2024-02-15",
        monthlyRent: 2500,
        leaseEndDate: "2024-08-31",
        earlyTermination: true
    }
];

const TerminationRequests = () => {
    const { data: authUser } = useGetAuthUserQuery();
    const [requests, setRequests] = useState(mockTerminationRequests);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    const handleApprove = (requestId: number) => {
        setRequests(prev =>
            prev.map(req =>
                req.id === requestId
                    ? { ...req, status: "approved" }
                    : req
            )
        );
    };

    const handleReject = (requestId: number) => {
        setRequests(prev =>
            prev.map(req =>
                req.id === requestId
                    ? { ...req, status: "rejected" }
                    : req
            )
        );
    };

    const filteredRequests = selectedStatus === "all"
        ? requests
        : requests.filter(req => req.status === selectedStatus);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-300";
            case "approved":
                return "bg-green-100 text-green-800 border-green-300";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const calculateDaysUntilEnd = (requestedEndDate: string) => {
        const today = new Date();
        const endDate = new Date(requestedEndDate);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="dashboard-container">
            <Header
                title="Termination Requests"
                subtitle="Review and manage lease termination requests from all your properties"
            />

            {/* Filter Tabs */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {["all", "pending", "approved", "rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedStatus === status
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
                                {status === "all"
                                    ? requests.length
                                    : requests.filter(req => req.status === status).length
                                }
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-6">
                {filteredRequests.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                No termination requests found
                            </h3>
                            <p className="text-gray-500">
                                {selectedStatus === "all"
                                    ? "No termination requests have been submitted yet."
                                    : `No ${selectedStatus} termination requests found.`
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredRequests.map((request) => (
                        <Card key={request.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            {request.tenantName}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {request.tenantEmail}
                                        </p>
                                    </div>
                                    <Badge className={getStatusColor(request.status)}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                {/* Property Info */}
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        {request.property.name}
                                    </h4>
                                    <p className="text-sm text-blue-600">{request.property.address}</p>
                                </div>

                                {/* Request Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Request Date</p>
                                            <p className="font-medium">
                                                {new Date(request.requestDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Requested End Date</p>
                                            <p className="font-medium">
                                                {new Date(request.requestedEndDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Monthly Rent</p>
                                            <p className="font-medium text-green-600">
                                                ${request.monthlyRent}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Early Termination Warning */}
                                {request.earlyTermination && (
                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                            <span className="text-yellow-800 font-medium text-sm">
                                                Early Termination Request
                                            </span>
                                        </div>
                                        <p className="text-yellow-700 text-sm mt-1">
                                            Lease ends on {new Date(request.leaseEndDate).toLocaleDateString()}.
                                            Early termination may require penalty fees.
                                        </p>
                                    </div>
                                )}

                                {/* Reason */}
                                <div className="mb-4">
                                    <h5 className="font-medium text-gray-700 mb-2">Termination Reason:</h5>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {request.reason}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                {request.status === "pending" && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            onClick={() => handleApprove(request.id)}
                                            className="bg-green-600 hover:bg-green-700 flex-1"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Approve Request
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(request.id)}
                                            variant="outline"
                                            className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Reject Request
                                        </Button>
                                    </div>
                                )}

                                {request.status === "approved" && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
                                        <p className="text-sm text-green-700 flex items-center gap-2">
                                            <Check className="w-4 h-4" />
                                            Request approved. Tenant has been notified.
                                        </p>
                                    </div>
                                )}

                                {request.status === "rejected" && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
                                        <p className="text-sm text-red-700 flex items-center gap-2">
                                            <X className="w-4 h-4" />
                                            Request rejected. Tenant has been notified.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default TerminationRequests;
