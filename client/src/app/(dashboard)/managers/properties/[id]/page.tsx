"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import PropertyDetailTabs from "@/components/PropertyDetailTabs";
import { useGetAuthUserQuery, useGetPropertyQuery } from "@/state/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

const PropertyTenants = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const { data: authUser } = useGetAuthUserQuery();

  const { data: property, isLoading: propertyLoading } =
    useGetPropertyQuery(propertyId);

  if (propertyLoading) return <Loading />;

  return (
    <div className="dashboard-container">
      {/* Back to properties page */}
      <Link
        href="/managers/properties"
        className="flex items-center mb-4 hover:text-primary-500"
        scroll={false}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <span>Back to Properties</span>
      </Link>

      <Header
        title={property?.name || "My Property"}
        subtitle="Manage tenants, leases, and termination requests for this property"
      />

      <PropertyDetailTabs propertyId={propertyId} userType="manager" />
    </div>
  );
};

export default PropertyTenants;
