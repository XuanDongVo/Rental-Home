import { Request, Response } from "express";
import * as paymentService from "../services/paymentService";

export const recordPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentDate } = req.body;

    const updatedPayment = await paymentService.recordPayment(
      Number(id),
      Number(amountPaid),
      paymentDate ? new Date(paymentDate) : new Date()
    );

    res.json(updatedPayment);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: `Error recording payment: ${error.message}`,
    });
  }
};

export const getPaymentsByLease = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leaseId } = req.params;
    const payments = await paymentService.getPaymentsByLease(Number(leaseId));
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({
      message: `Error retrieving payments: ${error.message}`,
    });
  }
};

export const getPaymentsByProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const payments = await paymentService.getPaymentsByProperty(
      Number(propertyId)
    );
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({
      message: `Error retrieving property payments: ${error.message}`,
    });
  }
};

export const getCurrentMonthPaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leaseId } = req.params;
    const paymentStatus = await paymentService.getCurrentMonthPaymentStatus(
      Number(leaseId)
    );
    res.json(paymentStatus);
  } catch (error: any) {
    res.status(500).json({
      message: `Error retrieving payment status: ${error.message}`,
    });
  }
};

export const checkOverduePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const overduePayments = await paymentService.checkOverduePayments();
    res.json({
      message: `Found ${overduePayments.length} overdue payments`,
      overduePayments,
    });
  } catch (error: any) {
    res.status(500).json({
      message: `Error checking overdue payments: ${error.message}`,
    });
  }
};

export const getOverduePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userType, userId } = req.query;

    const whereClause: any = {
      paymentStatus: "Overdue",
    };

    if (userType === "manager" && userId) {
      whereClause.lease = {
        property: {
          managerCognitoId: String(userId),
        },
      };
    } else if (userType === "tenant" && userId) {
      whereClause.lease = {
        tenantCognitoId: String(userId),
      };
    }

    const overduePayments = await paymentService.getPaymentsByProperty(0); // Will be fixed with proper query
    res.json(overduePayments);
  } catch (error: any) {
    res.status(500).json({
      message: `Error retrieving overdue payments: ${error.message}`,
    });
  }
};
