"use client";

import React, { useState } from "react";
import Loading from "@/components/Loading";
import ManagerTerminationRequests from "@/components/ManagerTerminationRequests";
import Header from "@/components/Header";
import { useGetAuthUserQuery } from "@/state/api";

// Mock data - thay thế bằng API call thực
const mockTerminationRequests = [
    {
        id: 1,
        reason: "I need to relocate to another city for work reasons. My company has offered me a position that requires immediate relocation.",
        requestDate: "2025-08-28T10:00:00Z",
        status: "Pending" as const,
        lease: {
            id: 1,
            property: {
                id: 1,
                name: "Modern Downtown Apartment",
                address: "123 Main St, Downtown, City"
            },
            tenant: {
                name: "John Doe",
                email: "john.doe@email.com",
                phoneNumber: "+1-555-0123"
            },
            startDate: "2025-01-01T00:00:00Z",
            endDate: "2025-12-31T23:59:59Z",
            rent: 1200
        }
    },
    {
        id: 2,
        reason: "Due to personal financial difficulties, I can no longer afford the monthly rent. I've lost my job and need to find more affordable housing.",
        requestDate: "2025-08-25T14:30:00Z",
        status: "Approved" as const,
        managerResponse: "I understand your situation. You can terminate the lease with 30 days notice. Please schedule a move-out inspection and ensure the property is in good condition.",
        responseDate: "2025-08-27T09:15:00Z",
        lease: {
            id: 2,
            property: {
                id: 2,
                name: "Cozy Studio Apartment",
                address: "456 Oak Avenue, Midtown, City"
            },
            tenant: {
                name: "Jane Smith",
                email: "jane.smith@email.com",
                phoneNumber: "+1-555-0456"
            },
            startDate: "2024-06-01T00:00:00Z",
            endDate: "2025-05-31T23:59:59Z",
            rent: 900
        }
    },
    {
        id: 3,
        reason: "I want to terminate because I found a cheaper place elsewhere.",
        requestDate: "2025-08-20T16:45:00Z",
        status: "Rejected" as const,
        managerResponse: "Your lease agreement requires a 60-day notice and early termination fee. Finding cheaper housing is not grounds for breaking the lease without penalties as per section 8 of your lease agreement.",
        responseDate: "2025-08-22T11:20:00Z",
        lease: {
            id: 3,
            property: {
                id: 3,
                name: "Luxury Penthouse",
                address: "789 High St, Uptown, City"
            },
            tenant: {
                name: "Mike Johnson",
                email: "mike.johnson@email.com",
                phoneNumber: "+1-555-0789"
            },
            startDate: "2025-03-01T00:00:00Z",
            endDate: "2026-02-28T23:59:59Z",
            rent: 2500
        }
    },
    {
        id: 4,
        reason: "Family emergency requires me to move back to my home country immediately. My father is seriously ill and I need to take care of him.",
        requestDate: "2025-08-30T08:20:00Z",
        status: "Pending" as const,
        lease: {
            id: 4,
            property: {
                id: 4,
                name: "Garden View Apartment",
                address: "321 Garden Lane, Suburbs, City"
            },
            tenant: {
                name: "Sarah Wilson",
                email: "sarah.wilson@email.com",
                phoneNumber: "+1-555-0321"
            },
            startDate: "2024-12-01T00:00:00Z",
            endDate: "2025-11-30T23:59:59Z",
            rent: 1100
        }
    }
];

const ManagerTerminationRequestsPage = () => {
    const { data: authUser } = useGetAuthUserQuery();
    const [requests] = useState(mockTerminationRequests);
    const [isLoading] = useState(false);

    const handleApprove = (requestId: number, response: string) => {
        console.log(`Approving request ${requestId} with response:`, response);
        // Simulate API call to approve termination request
        // In real implementation, this would update the backend
    };

    const handleReject = (requestId: number, response: string) => {
        console.log(`Rejecting request ${requestId} with response:`, response);
        // Simulate API call to reject termination request
        // In real implementation, this would update the backend
    };

    if (isLoading) return <Loading />;

    return (
        <div className="dashboard-container">
            <Header
                title="Lease Termination Requests"
                subtitle="Review and respond to tenant termination requests"
            />

            <div className="mt-6">
                <ManagerTerminationRequests
                    requests={requests}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            </div>
        </div>
    );
};

export default ManagerTerminationRequestsPage;
