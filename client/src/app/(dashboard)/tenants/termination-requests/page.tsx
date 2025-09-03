"use client";

import React, { useState } from "react";
import Loading from "@/components/Loading";
import TerminationRequestStatus from "@/components/TerminationRequestStatus";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { AlertCircle, Plus } from "lucide-react";
import Link from "next/link";

// Mock data - thay thế bằng API call thực
const mockTerminationRequests = [
    {
        id: 1,
        reason: "I need to relocate to another city for work reasons. My company has offered me a position that requires immediate relocation and I need to move by the end of next month.",
        requestDate: "2025-08-28T10:00:00Z",
        status: "Pending" as const,
        lease: {
            id: 1,
            property: {
                name: "Modern Downtown Apartment",
                address: "123 Main St, Downtown, City"
            }
        }
    },
    {
        id: 2,
        reason: "Due to personal financial difficulties, I can no longer afford the monthly rent. I've recently lost my job and need to find more affordable housing options.",
        requestDate: "2025-08-20T14:30:00Z",
        status: "Approved" as const,
        managerResponse: "I understand your situation and approve your early termination request. Please ensure the property is cleaned and schedule a final inspection before your move-out date. Your security deposit will be returned within 30 days after inspection.",
        responseDate: "2025-08-25T09:15:00Z",
        lease: {
            id: 2,
            property: {
                name: "Cozy Studio Apartment",
                address: "456 Oak Avenue, Midtown, City"
            }
        }
    }
];

const TenantTerminationRequestsPage = () => {
    const { data: authUser } = useGetAuthUserQuery();
    const [requests] = useState(mockTerminationRequests);
    const [isLoading] = useState(false);

    const handleCancelRequest = (requestId: number) => {
        console.log(`Cancelling termination request ${requestId}`);
        // Simulate API call to cancel termination request
        // In real implementation, this would update the backend
    };

    if (isLoading) return <Loading />;

    const pendingRequests = requests.filter(req => req.status === "Pending");
    const completedRequests = requests.filter(req => req.status !== "Pending");

    return (
        <div className="dashboard-container">
            <Header
                title="My Termination Requests"
                subtitle="Track the status of your lease termination requests"
            />

            <div className="mt-6 space-y-6">
                {/* No requests state */}
                {requests.length === 0 && (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Termination Requests
                        </h3>
                        <p className="text-gray-600 mb-6">
                            You haven&apos;t submitted any lease termination requests yet.
                        </p>
                        <Link href="/tenants/residences">
                            <Button className="bg-primary-600 hover:bg-primary-700">
                                <Plus className="w-4 h-4 mr-2" />
                                View My Residences
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Pending requests (priority) */}
                {pendingRequests.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Pending Review ({pendingRequests.length})
                            </h2>
                        </div>
                        {pendingRequests.map((request) => (
                            <TerminationRequestStatus
                                key={request.id}
                                request={request}
                                onCancelRequest={handleCancelRequest}
                            />
                        ))}
                    </div>
                )}

                {/* Completed requests */}
                {completedRequests.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Request History ({completedRequests.length})
                        </h2>
                        {completedRequests.map((request) => (
                            <TerminationRequestStatus
                                key={request.id}
                                request={request}
                            />
                        ))}
                    </div>
                )}

                {/* Help section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">
                                Need Help with Lease Termination?
                            </h3>
                            <p className="text-blue-800 text-sm mb-3">
                                If you need to terminate your lease, you can submit a request directly from your residence page.
                                Your landlord will review and respond within 3-5 business days.
                            </p>
                            <div className="flex gap-2">
                                <Link href="/tenants/residences">
                                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                                        Go to Residences
                                    </Button>
                                </Link>
                                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantTerminationRequestsPage;
