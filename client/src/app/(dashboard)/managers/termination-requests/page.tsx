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
import {
    useGetAuthUserQuery,
    useGetManagerTerminationRequestsQuery,
    useUpdateTerminationRequestStatusMutation
} from "@/state/api";

const TerminationRequests = () => {
    const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
    const {
        data: requests = [],
        isLoading: requestsLoading,
        error: requestsError
    } = useGetManagerTerminationRequestsQuery({});
    const [updateRequestStatus] = useUpdateTerminationRequestStatusMutation();
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    const handleApprove = async (requestId: number) => {
        try {
            await updateRequestStatus({
                id: requestId.toString(),
                status: "approved"
            }).unwrap();
        } catch (error) {
            console.error("Failed to approve request:", error);
        }
    };

    const handleReject = async (requestId: number) => {
        try {
            await updateRequestStatus({
                id: requestId.toString(),
                status: "rejected"
            }).unwrap();
        } catch (error) {
            console.error("Failed to reject request:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                    </Badge>
                );
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                        <X className="w-3 h-3 mr-1" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                        {status}
                    </Badge>
                );
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const calculateDaysFromNow = (dateString: string) => {
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const filteredRequests = selectedStatus === "all"
        ? requests
        : requests.filter((req: any) => req.status === selectedStatus);

    // Add loading state
    if (authLoading || requestsLoading) {
        return (
            <div className="dashboard-container">
                <Header
                    title="Termination Requests"
                    subtitle="Review and manage lease termination requests from all your properties"
                />
                <Loading />
            </div>
        );
    }

    // Add error state
    if (requestsError) {
        return (
            <div className="dashboard-container">
                <Header
                    title="Termination Requests"
                    subtitle="Review and manage lease termination requests from all your properties"
                />
                <Card>
                    <CardContent className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-600 mb-2">
                            Error Loading Requests
                        </h3>
                        <p className="text-red-500">
                            Failed to load termination requests. Please try again.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                                    : requests.filter((req: any) => req.status === status).length
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
                    filteredRequests.map((request: any) => (
                        <Card key={request.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <User className="w-5 h-5" />
                                            {request.lease?.tenant?.name || 'Unknown Tenant'}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {request.lease?.tenant?.email || 'No email'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Request ID: #{request.id}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(request.status)}
                                        <p className="text-xs text-gray-500 mt-1">
                                            Submitted: {new Date(request.requestedDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                {/* Property Info */}
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        {request.lease?.property?.name || 'Property Name'}
                                    </h4>
                                    <p className="text-sm text-blue-600 mb-2">
                                        {request.lease?.property?.address || 'Address not available'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-blue-700 font-medium">Lease ID:</span> {request.leaseId}
                                        </div>
                                        <div>
                                            <span className="text-blue-700 font-medium">Property ID:</span> {request.lease?.property?.id}
                                        </div>
                                    </div>
                                </div>

                                {/* Request Timeline */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <Calendar className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">Request Date</p>
                                        <p className="font-medium text-sm">
                                            {new Date(request.requestedDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">Requested End Date</p>
                                        <p className="font-medium text-sm">
                                            {request.requestedEndDate
                                                ? new Date(request.requestedEndDate).toLocaleDateString()
                                                : 'Not specified'
                                            }
                                        </p>
                                        {request.requestedEndDate && (
                                            <p className="text-xs text-blue-600">
                                                {calculateDaysFromNow(request.requestedEndDate)} days from now
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">Monthly Rent</p>
                                        <p className="font-medium text-sm text-green-600">
                                            {formatCurrency(request.lease?.rent || 0)}
                                        </p>
                                    </div>

                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                                        <p className="text-xs text-gray-500">Estimated Penalty</p>
                                        <p className={`font-medium text-sm ${request.estimatedPenalty > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(request.estimatedPenalty || 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Early Termination Alert */}
                                {request.isEarlyTermination && (
                                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                            <div className="flex-1">
                                                <h5 className="text-yellow-800 font-medium text-sm mb-1">
                                                    Early Termination Request
                                                </h5>
                                                <p className="text-yellow-700 text-sm">
                                                    Original lease ends on <strong>{new Date(request.lease?.endDate).toLocaleDateString()}</strong>
                                                </p>
                                                <p className="text-yellow-700 text-sm">
                                                    Tenant wants to terminate <strong>
                                                        {Math.ceil((new Date(request.lease?.endDate).getTime() - new Date(request.requestedEndDate).getTime()) / (1000 * 60 * 60 * 24))} days early
                                                    </strong>
                                                </p>
                                                {request.estimatedPenalty > 0 && (
                                                    <p className="text-yellow-800 text-sm font-medium mt-2">
                                                        💰 Penalty Fee: {formatCurrency(request.estimatedPenalty)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Termination Reason */}
                                <div className="mb-4">
                                    <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Termination Reason:
                                    </h5>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {request.reason}
                                        </p>
                                    </div>
                                </div>

                                {/* Emergency Category */}
                                {request.emergencyCategory && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <h5 className="text-red-800 font-medium text-sm flex items-center gap-2 mb-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            Emergency Category
                                        </h5>
                                        <p className="text-red-700 text-sm font-medium">
                                            {request.emergencyCategory.toUpperCase()}
                                        </p>
                                        <p className="text-red-600 text-xs mt-1">
                                            This request may qualify for penalty waiver or reduced fees.
                                        </p>
                                    </div>
                                )}

                                {/* Manager Response */}
                                {request.managerResponse && (
                                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h5 className="text-blue-800 font-medium text-sm mb-2">Manager Response:</h5>
                                        <p className="text-blue-700 text-sm">
                                            {request.managerResponse}
                                        </p>
                                        {request.responseDate && (
                                            <p className="text-blue-600 text-xs mt-2">
                                                Responded on: {new Date(request.responseDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons for Pending Requests */}
                                {request.status.toLowerCase() === "pending" && (
                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => handleApprove(request.id)}
                                                className="bg-green-600 hover:bg-green-700 flex-1 py-3"
                                                size="lg"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Approve Request
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(request.id)}
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50 flex-1 py-3"
                                                size="lg"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Reject Request
                                            </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            Tenant will be automatically notified of your decision
                                        </p>
                                    </div>
                                )}

                                {/* Status Information for Completed Requests */}
                                {request.status.toLowerCase() === "approved" && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Check className="w-5 h-5 text-green-600" />
                                            <h5 className="text-green-800 font-medium">Request Approved</h5>
                                        </div>
                                        <p className="text-green-700 text-sm mb-2">
                                            Tenant has been notified of the approval.
                                        </p>
                                        {request.approvedEndDate && (
                                            <p className="text-green-700 text-sm">
                                                <strong>Approved End Date:</strong> {new Date(request.approvedEndDate).toLocaleDateString()}
                                            </p>
                                        )}
                                        {request.finalPenaltyFee && (
                                            <p className="text-green-700 text-sm">
                                                <strong>Final Penalty:</strong> {formatCurrency(request.finalPenaltyFee)}
                                            </p>
                                        )}
                                        {request.responseDate && (
                                            <p className="text-green-600 text-xs mt-2">
                                                Approved on: {new Date(request.responseDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {request.status.toLowerCase() === "rejected" && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <X className="w-5 h-5 text-red-600" />
                                            <h5 className="text-red-800 font-medium">Request Rejected</h5>
                                        </div>
                                        <p className="text-red-700 text-sm mb-2">
                                            Tenant has been notified of the rejection.
                                        </p>
                                        {request.rejectionReason && (
                                            <div className="bg-red-100 p-3 rounded mt-2">
                                                <p className="text-red-800 text-sm font-medium mb-1">Rejection Reason:</p>
                                                <p className="text-red-700 text-sm">
                                                    {request.rejectionReason}
                                                </p>
                                            </div>
                                        )}
                                        {request.responseDate && (
                                            <p className="text-red-600 text-xs mt-2">
                                                Rejected on: {new Date(request.responseDate).toLocaleDateString()}
                                            </p>
                                        )}
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
