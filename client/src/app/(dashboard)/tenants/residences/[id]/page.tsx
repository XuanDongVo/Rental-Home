"use client";

import Header from "@/components/Header";
import Loading from "@/components/Loading";
import PropertyDetailTabs from "@/components/PropertyDetailTabs";
import { useGetAuthUserQuery, useGetPropertyQuery } from "@/state/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

const ResidenceDetail = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const { data: authUser } = useGetAuthUserQuery();

  const { data: property, isLoading: propertyLoading } =
    useGetPropertyQuery(propertyId);

  if (propertyLoading) return <Loading />;

  return (
    <div className="dashboard-container">
      {/* Back to residences page */}
      <Link
        href="/tenants/residences"
        className="flex items-center mb-4 hover:text-primary-500"
        scroll={false}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <span>Back to Residences</span>
      </Link>

      <Header
        title={property?.name || "My Residence"}
        subtitle="View your lease details and manage termination requests"
      />

      <PropertyDetailTabs propertyId={propertyId} userType="tenant" />
    </div>
  );
};

export default ResidenceDetail;
