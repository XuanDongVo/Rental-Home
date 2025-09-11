"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useGetAuthUserQuery } from "@/state/api";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import PropertyTerminationSettings from "@/components/PropertyTerminationSettings";

export default function TerminationPoliciesPage() {
    const params = useParams();
    const propertyId = params.id as string;

    const { data: authUser, isLoading: isAuthLoading } = useGetAuthUserQuery();

    if (isAuthLoading) {
        return <Loading />;
    }

    if (!authUser) {
        return <div>Unauthorized</div>;
    }

    // TODO: Fetch property details to get property name
    const propertyName = `Property ${propertyId}`;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* <Header
                title="Termination Settings"
                subtitle={propertyName}
            /> */}
            <main className="container mx-auto px-4 py-8">
                <PropertyTerminationSettings
                    propertyId={propertyId}
                    managerId={authUser.cognitoInfo.userId}
                    propertyName={propertyName}
                />
            </main>
        </div>
    );
}
