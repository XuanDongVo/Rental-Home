"use client";

import PropertyForm from "@/components/PropertyForm";
import { useRouter } from "next/navigation";

const NewProperty = () => {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to properties list after successful creation
    router.push("/managers/properties");
  };

  return (
    <PropertyForm
      mode="create"
      onSuccess={handleSuccess}
    />
  );
};

export default NewProperty;
