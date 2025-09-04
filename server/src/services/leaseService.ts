import { getLeaseDetailByPropertyId } from "../repositories/leaseRepository";

export const getLeaseByPropertyId = async (
  propertyId: number,
  cognitoId: string
) => {
  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  const lease = await getLeaseDetailByPropertyId(propertyId, cognitoId);
  return lease;
};
