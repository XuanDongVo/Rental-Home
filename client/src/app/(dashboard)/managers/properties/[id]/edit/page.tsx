"use client";

import PropertyForm from "@/components/PropertyForm";
import { useGetPropertyQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

const EditProperty = () => {
    const router = useRouter();
    const params = useParams();
    const propertyId = parseInt(params.id as string);

    const { data: property, isLoading, error } = useGetPropertyQuery(propertyId);

    const handleSuccess = () => {
        // Redirect back to property details or properties list
        router.push(`/properties/${propertyId}`);
    };

    if (isLoading) {
        return (
            <div className="dashboard-container">
                <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg">Loading property...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="dashboard-container">
                <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg text-red-500">
                            Failed to load property. Please try again.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PropertyForm
            mode="edit"
            property={property}
            onSuccess={handleSuccess}
        />
    );
};

export default EditProperty;
