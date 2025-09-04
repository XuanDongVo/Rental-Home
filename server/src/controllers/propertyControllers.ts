import { Request, Response } from "express";
import * as propertyService from "../services/propertyService";
import { getLeaseByPropertyId as getLeaseByPropertyIdService } from "../services/leaseService";
import * as paymentService from "../services/paymentService";

export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const properties = await propertyService.getProperties(req.query);
    res.json(properties);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving properties: ${error.message}` });
  }
};

export const getProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getProperty(Number(id));
    if (property) {
      res.json(property);
    } else {
      res.status(404).json({ message: "Property not found" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving property: ${error.message}` });
  }
};

export const createProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const newProperty = await propertyService.createProperty(req.body, files);
    res.status(201).json(newProperty);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating property: ${error.message}` });
  }
};

export const deleteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await propertyService.deleteProperty(Number(id));
    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const updateProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    const updatedProperty = await propertyService.updateProperty(
      Number(id),
      req.body,
      files
    );
    res.status(200).json(updatedProperty);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const getLeaseByPropertyId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId, cognito } = req.body;
    const lease = await getLeaseByPropertyIdService(
      propertyId as unknown as number,
      cognito as string
    );
    if (!lease) {
      res
        .status(404)
        .json({ message: "Lease not found for the given property ID" });
      return;
    }
    res.json(lease);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving leases: ${error.message}` });
  }
};

export const getCurrentMonthPaymentStatusByProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;

    // First get the current lease for this property
    const leases = await getLeaseByPropertyIdService(
      Number(propertyId),
      req.user?.id as string
    );

    if (!leases || leases.length === 0) {
      res
        .status(404)
        .json({ message: "No active lease found for this property" });
      return;
    }

    const currentLease = leases[0]; // Get the first lease

    // Get current month payment status for this lease
    const paymentStatus = await paymentService.getCurrentMonthPaymentStatus(
      currentLease.id
    );
    res.json(paymentStatus);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving payment status: ${error.message}` });
  }
};
