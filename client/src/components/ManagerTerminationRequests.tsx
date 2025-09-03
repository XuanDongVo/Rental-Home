"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    MessageSquare,
    Calendar,
    User,
    Home,
    AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

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
            id: number;
            name: string;
            address: string;
        };
        tenant: {
            name: string;
            email: string;
            phoneNumber: string;
        };
        startDate: string;
        endDate: string;
        rent: number;
    };
}

interface ManagerTerminationRequestsProps {
    requests: TerminationRequest[];
    onApprove?: (requestId: number, response: string) => void;
    onReject?: (requestId: number, response: string) => void;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case "Pending":
            return {
                color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                icon: Clock,
            };
        case "Approved":
            return {
                color: "bg-green-100 text-green-800 border-green-300",
                icon: CheckCircle,
            };
        case "Rejected":
            return {
                color: "bg-red-100 text-red-800 border-red-300",
                icon: XCircle,
            };
        default:
            return {
                color: "bg-gray-100 text-gray-800 border-gray-300",
                icon: Clock,
            };
    }
};

const ManagerTerminationRequests: React.FC<ManagerTerminationRequestsProps> = ({
    requests,
    onApprove,
    onReject,
}) => {
    const [selectedRequest, setSelectedRequest] = useState<TerminationRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [response, setResponse] = useState("");
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

    const pendingRequests = requests.filter(req => req.status === "Pending");
    const processedRequests = requests.filter(req => req.status !== "Pending");

    const handleViewDetails = (request: TerminationRequest) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
        setActionType(null);
        setResponse("");
    };

    const handleApprove = (request: TerminationRequest) => {
        setSelectedRequest(request);
        setActionType("approve");
        setIsModalOpen(true);
        setResponse("");
    };

    const handleReject = (request: TerminationRequest) => {
        setSelectedRequest(request);
        setActionType("reject");
        setIsModalOpen(true);
        setResponse("");
    };

    const handleSubmitResponse = () => {
        if (!selectedRequest) return;

        if (actionType === "approve") {
            onApprove?.(selectedRequest.id, response);
            toast.success("Termination request approved");
        } else if (actionType === "reject") {
            onReject?.(selectedRequest.id, response);
            toast.success("Termination request rejected");
        }

        setIsModalOpen(false);
        setSelectedRequest(null);
        setResponse("");
        setActionType(null);
    };

    const calculateRemainingDays = (endDate: string) => {
        const today = new Date();
        const end = new Date(endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-600 text-sm font-medium">Pending Review</div>
                    <div className="text-yellow-800 text-2xl font-bold">{pendingRequests.length}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 text-sm font-medium">Approved</div>
                    <div className="text-green-800 text-2xl font-bold">
                        {requests.filter(req => req.status === "Approved").length}
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-600 text-sm font-medium">Rejected</div>
                    <div className="text-red-800 text-2xl font-bold">
                        {requests.filter(req => req.status === "Rejected").length}
                    </div>
                </div>
            </div>

            {/* Pending Requests (Priority) */}
            {pendingRequests.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Pending Termination Requests
                        </h2>
                        <p className="text-yellow-100 text-sm">
                            These requests require your immediate attention
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tenant</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Lease Info</TableHead>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead>Days Remaining</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map((request) => (
                                    <TableRow key={request.id} className="h-20">
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {request.lease.tenant.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.lease.tenant.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Home className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <div className="font-medium">{request.lease.property.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.lease.property.address}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm space-y-1">
                                                <div>Rent: <span className="font-semibold">${request.lease.rent}/month</span></div>
                                                <div className="text-gray-500">
                                                    {new Date(request.lease.startDate).toLocaleDateString()} -
                                                    {new Date(request.lease.endDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                {new Date(request.requestDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {calculateRemainingDays(request.lease.endDate)} days
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewDetails(request)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleApprove(request)}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleReject(request)}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* All Requests */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-4">
                    <h2 className="text-xl font-bold text-white">All Termination Requests</h2>
                    <p className="text-gray-200 text-sm">Complete history of termination requests</p>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Request Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Response Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((request) => {
                                const statusConfig = getStatusConfig(request.status);
                                const StatusIcon = statusConfig.icon;

                                return (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{request.lease.tenant.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.lease.tenant.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{request.lease.property.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    {request.lease.property.address}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(request.requestDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${statusConfig.color} border flex items-center gap-1 w-fit`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {request.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {request.responseDate
                                                ? new Date(request.responseDate).toLocaleDateString()
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewDetails(request)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal for viewing/responding to requests */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl">
                    {selectedRequest && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    {actionType ?
                                        `${actionType === "approve" ? "Approve" : "Reject"} Termination Request` :
                                        "Termination Request Details"
                                    }
                                </DialogTitle>
                                <DialogDescription>
                                    {actionType ?
                                        `Provide your response for ${selectedRequest.lease.tenant.name}'s request` :
                                        `Request from ${selectedRequest.lease.tenant.name}`
                                    }
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Request Details */}
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Property</label>
                                            <p className="font-medium">{selectedRequest.lease.property.name}</p>
                                            <p className="text-sm text-gray-500">{selectedRequest.lease.property.address}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Tenant</label>
                                            <p className="font-medium">{selectedRequest.lease.tenant.name}</p>
                                            <p className="text-sm text-gray-500">{selectedRequest.lease.tenant.email}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Tenant&apos;s Reason</label>
                                        <p className="mt-1 text-gray-900">{selectedRequest.reason}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Request Date</label>
                                            <p>{new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Days Remaining</label>
                                            <p>{calculateRemainingDays(selectedRequest.lease.endDate)} days</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Response Section */}
                                {actionType && (
                                    <div className="space-y-2">
                                        <Label htmlFor="response">
                                            Your Response {actionType === "reject" && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Textarea
                                            id="response"
                                            placeholder={actionType === "approve" ?
                                                "Provide move-out instructions and any additional information..." :
                                                "Please explain why this request is being rejected..."
                                            }
                                            value={response}
                                            onChange={(e) => setResponse(e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                )}

                                {/* Previous Response (if viewing completed request) */}
                                {!actionType && selectedRequest.managerResponse && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-600">Your Previous Response</label>
                                        <div className="bg-blue-50 p-3 rounded border">
                                            <p className="text-gray-900">{selectedRequest.managerResponse}</p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Responded on {selectedRequest.responseDate && new Date(selectedRequest.responseDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                    {actionType ? "Cancel" : "Close"}
                                </Button>
                                {actionType && (
                                    <Button
                                        onClick={handleSubmitResponse}
                                        disabled={actionType === "reject" && !response.trim()}
                                        className={actionType === "approve" ?
                                            "bg-green-600 hover:bg-green-700" :
                                            "bg-red-600 hover:bg-red-700"
                                        }
                                    >
                                        {actionType === "approve" ? "Approve Request" : "Reject Request"}
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManagerTerminationRequests;
