"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetAuthUserQuery } from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import EnhancedTerminationRequest from "@/components/EnhancedTerminationRequest";
import { useSubmitTerminationRequestMutation } from "@/state/api";

export default function TerminationRequestPage() {
    const searchParams = useSearchParams();
    const leaseId = searchParams.get('leaseId');
    const propertyId = searchParams.get('propertyId');
    const monthlyRent = searchParams.get('monthlyRent');

    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();
    const [submitTerminationRequest, { isLoading: isSubmitting }] = useSubmitTerminationRequestMutation();

    if (isAuthLoading) {
        return <Loading />;
    }

    if (!authUser || authUser.userRole !== 'tenant') {
        return <div>Unauthorized - Tenant only</div>;
    }

    if (!leaseId || !propertyId || !monthlyRent) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header
                    title="Termination Request"
                    subtitle="Invalid information"
                />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-red-500">
                            Missing information: leaseId, propertyId or monthlyRent
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const handleSubmitRequest = async (data: any) => {
        try {
            await submitTerminationRequest({
                leaseId: parseInt(leaseId!),
                reason: data.reason || 'Lease termination request',
                requestedEndDate: data.requestedEndDate,
                tenantCognitoId: authUser.cognitoInfo.userId,
            }).unwrap();

            // Redirect to residence page after successful submission
            window.location.href = '/tenants/residences';
        } catch (error) {
            console.error('Error submitting termination request:', error);
            alert('An error occurred. Please try again.');
        }
    };

    const handleCancel = () => {
        // Go back to previous page or residences
        window.history.back();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* <Header
                title="Termination Request"
                subtitle="Submit lease termination request"
            /> */}
            <main className="container mx-auto px-4 py-8">
                <EnhancedTerminationRequest
                    propertyId={propertyId}
                    leaseId={leaseId}
                    monthlyRent={parseInt(monthlyRent)}
                    onSubmit={handleSubmitRequest}
                    onCancel={handleCancel}
                />
            </main>
        </div>
    );
}
