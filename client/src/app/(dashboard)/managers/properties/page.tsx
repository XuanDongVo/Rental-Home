"use client";

import Card from "@/components/Card";
import CustomDialog from "@/components/CustomDialog";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import { useDeletePropertyMutation, useGetAuthUserQuery, useGetManagerPropertiesQuery } from "@/state/api";
import { Edit, Trash } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";


const Properties = () => {
  const router = useRouter();
  const { data: authUser } = useGetAuthUserQuery();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const {
    data: managerProperties,
    isLoading,
    error,
  } = useGetManagerPropertiesQuery(authUser?.cognitoInfo?.userId || "", {
    skip: !authUser?.cognitoInfo?.userId,

  });

  const [deleteProperty] = useDeletePropertyMutation();

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading manager properties</div>;

  const handleEdit = (propertyId: number) => {
    router.push(`/managers/properties/${propertyId}/edit`);
  };

  const handleDelete = (propertyId: number) => {
    setSelectedPropertyId(propertyId);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedPropertyId) {
      await deleteProperty(selectedPropertyId);
      setOpenDialog(false);
      setSelectedPropertyId(null);
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="My Properties"
        subtitle="View and manage your property listings"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {managerProperties?.map((property) => (
          <div key={property.id} className="relative">
            {/* Edit & Delete Icons */}
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <button
                onClick={() => handleEdit(property.id)}
                className="p-1 bg-white rounded-full shadow hover:bg-gray-100 transition"
              >
                <Edit className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => handleDelete(property.id)}
                className="p-1 bg-white rounded-full shadow hover:bg-gray-100 transition"
              >
                <Trash className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* Property Card */}
            <Card
              property={property}
              isFavorite={false}
              onFavoriteToggle={() => { }}
              showFavoriteButton={false}
              propertyLink={`/managers/properties/${property.id}`}
            />
          </div>
        ))}
      </div>
      {(!managerProperties || managerProperties.length === 0) && (
        <p>You don&lsquo;t manage any properties</p>
      )}

      {openDialog && (
        <CustomDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          title="Confirm Delete"
          description="Are you sure you want to delete this property?"
          content={<p>This action cannot be undone.</p>}
          onCancel={() => setOpenDialog(false)}
          onConfirm={confirmDelete}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      )}    </div>
  );
};

export default Properties;
