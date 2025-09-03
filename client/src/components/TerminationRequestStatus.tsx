"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Calendar,
    MessageSquare,
    FileText,
} from "lucide-react";

interface TerminationRequest {
    id: number;
    reason: string;
    requestDate: string;
    status: "Pending" | "Approved" | "Rejected";
    managerResponse?: string;
    responseDate?: string;
    lease: {
        id: number;
        property: {
            name: string;
            address: string;
        };
    };
}

interface TerminationRequestStatusProps {
    request: TerminationRequest;
    onCancelRequest?: (requestId: number) => void;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case "Pending":
            return {
                color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                icon: Clock,
                text: "Pending Review",
            };
        case "Approved":
            return {
                color: "bg-green-100 text-green-800 border-green-300",
                icon: CheckCircle,
                text: "Approved",
            };
        case "Rejected":
            return {
                color: "bg-red-100 text-red-800 border-red-300",
                icon: XCircle,
                text: "Rejected",
            };
        default:
            return {
                color: "bg-gray-100 text-gray-800 border-gray-300",
                icon: AlertCircle,
                text: status,
            };
    }
};

const TerminationRequestStatus: React.FC<TerminationRequestStatusProps> = ({
    request,
    onCancelRequest,
}) => {
    const statusConfig = getStatusConfig(request.status);
    const StatusIcon = statusConfig.icon;

    const getStatusMessage = () => {
        switch (request.status) {
            case "Pending":
                return "Your termination request is under review. You will be notified once the landlord responds.";
            case "Approved":
                return "Your termination request has been approved. Please follow the move-out instructions provided by your landlord.";
            case "Rejected":
                return "Your termination request has been rejected. Please contact your landlord for more information.";
            default:
                return "";
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Lease Termination Request
                            </h3>
                            <p className="text-sm text-gray-600">
                                {request.lease.property.name}
                            </p>
                        </div>
                    </div>
                    <Badge className={`${statusConfig.color} border flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.text}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Status Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-blue-900 mb-1">Status Update</h4>
                            <p className="text-blue-800 text-sm">{getStatusMessage()}</p>
                        </div>
                    </div>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Property</label>
                            <p className="text-gray-900">{request.lease.property.name}</p>
                            <p className="text-sm text-gray-500">{request.lease.property.address}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">Request Date</label>
                            <div className="flex items-center gap-2 text-gray-900">
                                <Calendar className="w-4 h-4" />
                                {new Date(request.requestDate).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-gray-600">Your Reason</label>
                            <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-gray-500 mt-1" />
                                <p className="text-gray-900 text-sm">{request.reason}</p>
                            </div>
                        </div>

                        {request.responseDate && (
                            <div>
                                <label className="text-sm font-medium text-gray-600">Response Date</label>
                                <div className="flex items-center gap-2 text-gray-900">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(request.responseDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Manager Response */}
                {request.managerResponse && (
                    <div className="border-t pt-4">
                        <label className="text-sm font-medium text-gray-600">Landlord Response</label>
                        <div className="mt-2 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-gray-500 mt-1" />
                                <p className="text-gray-900 text-sm">{request.managerResponse}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    {request.status === "Pending" && onCancelRequest && (
                        <Button
                            variant="outline"
                            onClick={() => onCancelRequest(request.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                            Cancel Request
                        </Button>
                    )}

                    {request.status === "Approved" && (
                        <Button className="bg-green-600 hover:bg-green-700">
                            View Move-out Instructions
                        </Button>
                    )}

                    {request.status === "Rejected" && (
                        <Button variant="outline">
                            Contact Landlord
                        </Button>
                    )}
                </div>

                {/* Timeline */}
                <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Request Timeline</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600">
                                Request submitted on {new Date(request.requestDate).toLocaleDateString("en-US")}
                            </span>
                        </div>

                        {request.status === "Pending" && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span className="text-gray-600">Waiting for landlord review...</span>
                            </div>
                        )}

                        {request.responseDate && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className={`w-2 h-2 rounded-full ${request.status === "Approved" ? "bg-green-500" : "bg-red-500"
                                    }`}></div>
                                <span className="text-gray-600">
                                    {request.status === "Approved" ? "Approved" : "Rejected"} on{" "}
                                    {new Date(request.responseDate).toLocaleDateString("en-US")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminationRequestStatus;
