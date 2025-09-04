import { PrismaClient } from "@prisma/client";
import { getLeaseByPropertyId as getLeaseByPropertyIdService } from "../services/leaseService";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Get current active lease for a property (for Current Tenant tab)
export const getCurrentLeaseByProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const currentDate = new Date();
    
    const currentLease = await prisma.lease.findFirst({
      where: {
        propertyId: Number(propertyId),
        startDate: { lte: currentDate },
        endDate: { gte: currentDate }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        },
        property: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(currentLease);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving current lease: ${error.message}` });
  }
};

// Get all lease history for a property (for Lease History tab)
export const getLeaseHistoryByProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    
    const leaseHistory = await prisma.lease.findMany({
      where: {
        propertyId: Number(propertyId)
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        },
        property: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startDate: 'desc' // Most recent first
      }
    });

    res.json(leaseHistory);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving lease history: ${error.message}` });
  }
};

// Get payment history for a property (for Payment History tab)
export const getPaymentHistoryByProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    
    // Get all payments for leases of this property
    const payments = await prisma.payment.findMany({
      where: {
        lease: {
          propertyId: Number(propertyId)
        }
      },
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'desc' // Most recent first
      }
    });

    res.json(payments);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving payment history: ${error.message}` });
  }
};

// Get current month payment status for a lease
export const getCurrentMonthPaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leaseId } = req.params;
    const currentDate = new Date();
    
    const currentMonthPayment = await prisma.payment.findFirst({
      where: {
        leaseId: Number(leaseId),
        dueDate: {
          gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        }
      }
    });

    res.json({
      paymentStatus: currentMonthPayment?.paymentStatus || "Not Paid",
      amountDue: currentMonthPayment?.amountDue || 0,
      amountPaid: currentMonthPayment?.amountPaid || 0,
      dueDate: currentMonthPayment?.dueDate || null,
      paymentDate: currentMonthPayment?.paymentDate || null
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving payment status: ${error.message}` });
  }
};

// Get previous tenants for quick reference (for Current Tenant tab)
export const getPreviousTenantsForProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const { limit = 3 } = req.query;
    const currentDate = new Date();
    
    const previousLeases = await prisma.lease.findMany({
      where: {
        propertyId: Number(propertyId),
        endDate: { lt: currentDate } // Only past leases
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        endDate: 'desc' // Most recently ended first
      },
      take: Number(limit)
    });

    res.json(previousLeases);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving previous tenants: ${error.message}` });
  }
};

// Get property lease summary (combines current + previous for overview)
export const getPropertyLeaseSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId } = req.params;
    const currentDate = new Date();
    
    // Get current lease
    const currentLease = await prisma.lease.findFirst({
      where: {
        propertyId: Number(propertyId),
        startDate: { lte: currentDate },
        endDate: { gte: currentDate }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    // Get lease count and total revenue
    const leaseStats = await prisma.lease.aggregate({
      where: {
        propertyId: Number(propertyId)
      },
      _count: {
        id: true
      },
      _sum: {
        rent: true
      }
    });

    // Get current month payment for current lease
    let currentPaymentStatus = null;
    if (currentLease) {
      const currentMonthPayment = await prisma.payment.findFirst({
        where: {
          leaseId: currentLease.id,
          dueDate: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
          }
        }
      });
      currentPaymentStatus = currentMonthPayment?.paymentStatus || "Pending";
    }

    res.json({
      currentLease,
      currentPaymentStatus,
      totalLeases: leaseStats._count.id,
      totalRevenue: leaseStats._sum.rent || 0,
      isVacant: !currentLease
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving property lease summary: ${error.message}` });
  }
};

// Legacy function - keep for backward compatibility
export const getLeasePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const payments = await prisma.payment.findMany({
      where: { leaseId: Number(id) },
    });
    res.json(payments);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving lease payments: ${error.message}` });
  }
};
