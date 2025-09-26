import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { NotificationService } from "../services/NotificationService";

const prisma = new PrismaClient();
const notificationService = new NotificationService();

// Business constants
const PENALTY_RULES = {
  NO_PENALTY_DAYS: 60,
  HALF_PENALTY_DAYS: 30,
  FULL_PENALTY_DAYS: 0,
  MINIMUM_NOTICE_DAYS: 30,
  MANAGER_RESPONSE_DAYS: 5,
};

const calculatePenaltyFee = (lease: any, requestedEndDate: Date): number => {
  const leaseEndDate = new Date(lease.endDate);
  const daysNotice = Math.floor(
    (leaseEndDate.getTime() - requestedEndDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysNotice >= PENALTY_RULES.NO_PENALTY_DAYS) {
    return 0;
  } else if (daysNotice >= PENALTY_RULES.HALF_PENALTY_DAYS) {
    return lease.rent * 0.5;
  } else {
    return lease.rent;
  }
};

// Create termination request
export const createTerminationRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { leaseId, reason, requestedEndDate } = req.body;
    const tenantCognitoId = req.user?.id;

    if (!tenantCognitoId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate required fields
    if (!leaseId || !reason || !requestedEndDate) {
      res.status(400).json({
        error: "Missing required fields: leaseId, reason, requestedEndDate",
      });
      return;
    }

    // Get lease details
    const lease = await prisma.lease.findFirst({
      where: {
        id: Number(leaseId),
        tenantCognitoId,
        status: "Active",
      },
      include: {
        property: {
          include: {
            manager: {
              select: {
                id: true,
                cognitoId: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!lease) {
      res.status(404).json({
        error: "Active lease not found for this tenant",
      });
      return;
    }

    const requestedEnd = new Date(requestedEndDate);

    // Validate that requested end date is not in the past
    if (requestedEnd < new Date()) {
      res.status(400).json({
        error: "Requested end date cannot be in the past",
      });
      return;
    }

    // Calculate penalty fee
    const penaltyFee = calculatePenaltyFee(lease, requestedEnd);
    const isEarlyTermination = requestedEnd < new Date(lease.endDate);

    // Create termination request
    const terminationRequest = await prisma.terminationRequest.create({
      data: {
        reason,
        requestedEndDate: requestedEnd,
        leaseId: Number(leaseId),
        managerId: lease.property.manager.id,
        estimatedPenaltyFee: penaltyFee,
        isEarlyTermination,
        tenantCognitoId,
        managerCognitoId: lease.property.manager.cognitoId,
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    // Send notification to manager
    await notificationService.createNotification({
      type: "TerminationRequest",
      title: "New Lease Termination Request",
      message: `${
        lease.tenant?.name || "Tenant"
      } has requested to terminate their lease at ${lease.property.name}.`,
      data: {
        terminationRequestId: terminationRequest.id,
        propertyId: lease.property.id,
      },
      managerCognitoId: lease.property.manager.cognitoId,
    });

    res.status(201).json({
      message: "Termination request created successfully",
      terminationRequest,
    });
  } catch (error: any) {
    console.error("Error creating termination request:", error);
    res.status(500).json({
      error: "Failed to create termination request",
      details: error.message,
    });
  }
};

// Get all termination requests for a manager
export const getManagerTerminationRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const managerCognitoId = req.user?.id;
    const { propertyId, status } = req.query;

    if (!managerCognitoId) {
      res.status(401).json({ error: "Unauthorized" });
    }

    const where: any = {
      lease: {
        property: {
          managerCognitoId,
        },
      },
    };

    if (propertyId) {
      where.lease.property.id = Number(propertyId);
    }

    if (status) {
      where.status = status;
    }

    const requests = await prisma.terminationRequest.findMany({
      where,
      include: {
        lease: {
          include: {
            property: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedDate: "desc",
      },
    });

    // Calculate additional info for each request
    const requestsWithDetails = requests.map((request) => {
      const lease = request.lease;
      const isEarlyTermination =
        request.requestedEndDate &&
        new Date(request.requestedEndDate) < new Date(lease.endDate);

      const penaltyFee = request.requestedEndDate
        ? calculatePenaltyFee(lease, new Date(request.requestedEndDate))
        : 0;

      return {
        ...request,
        isEarlyTermination,
        estimatedPenalty: penaltyFee,
        daysUntilRequestedEnd: request.requestedEndDate
          ? Math.ceil(
              (new Date(request.requestedEndDate).getTime() -
                new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null,
      };
    });

    res.json(requestsWithDetails);
  } catch (error: any) {
    console.error("Error fetching manager termination requests:", error);
    res.status(500).json({
      error: "Failed to fetch termination requests",
      details: error.message,
    });
  }
};

// Get all termination requests for a tenant
export const getTenantTerminationRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantCognitoId = req.user?.id;

    if (!tenantCognitoId) {
      res.status(401).json({ error: "Unauthorized" });
    }

    const requests = await prisma.terminationRequest.findMany({
      where: {
        tenantCognitoId,
      },
      include: {
        lease: {
          include: {
            property: true,
          },
        },
      },
      orderBy: {
        requestedDate: "desc",
      },
    });

    res.json(requests);
  } catch (error: any) {
    console.error("Error fetching tenant termination requests:", error);
    res.status(500).json({
      error: "Failed to fetch termination requests",
      details: error.message,
    });
  }
};

// Get single termination request
export const getTerminationRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userCognitoId = req.user?.id;

    if (!userCognitoId) {
      res.status(401).json({ error: "Unauthorized" });
    }

    const request = await prisma.terminationRequest.findFirst({
      where: {
        id: id,
        OR: [
          { tenantCognitoId: userCognitoId },
          {
            lease: {
              property: {
                managerCognitoId: userCognitoId,
              },
            },
          },
        ],
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Termination request not found" });
    }

    res.json(request);
  } catch (error: any) {
    console.error("Error fetching termination request:", error);
    res.status(500).json({
      error: "Failed to fetch termination request",
      details: error.message,
    });
  }
};

// Update termination request (manager response)
// Update termination request (manager response)
export const updateTerminationRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, managerResponse, finalPenaltyFee, approvedEndDate } =
      req.body;
    const managerCognitoId = req.user?.id;

    if (!managerCognitoId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    console.log("Updating termination request:", status);

    // Verify termination request exists
    const terminationRequest = await prisma.terminationRequest.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            property: {
              include: {
                manager: true,
              },
            },
          },
        },
      },
    });

    if (!terminationRequest) {
      res.status(404).json({ error: "Termination request not found" });
      return;
    }

    // Verify manager has access to this lease
    if (
      terminationRequest.lease.property.manager.cognitoId !== managerCognitoId
    ) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Verify request is not already processed
    if (terminationRequest.status !== "Pending") {
      res
        .status(400)
        .json({ error: "This termination request has already been processed" });
      return;
    }

    // Update the termination request
    const updatedRequest = await prisma.terminationRequest.update({
      where: { id },
      data: {
        status,
        managerResponse,
        finalPenaltyFee,
        approvedEndDate: approvedEndDate
          ? new Date(approvedEndDate)
          : terminationRequest.requestedEndDate,
        responseDate: new Date(),
      },
    });

    // If approved, update the lease status
    if (status === "Approved") {
      await prisma.lease.update({
        where: { id: terminationRequest.leaseId },
        data: {
          status: "PendingTermination",
          terminationDate: approvedEndDate
            ? new Date(approvedEndDate)
            : terminationRequest.requestedEndDate,
          terminationReason: terminationRequest.reason,
        },
      });

      // Create a payment record for the penalty fee if applicable
      if (finalPenaltyFee && finalPenaltyFee > 0) {
        await prisma.payment.create({
          data: {
            leaseId: terminationRequest.leaseId,
            amountDue: finalPenaltyFee,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
            description: "Early termination penalty fee",
            paymentStatus: "Pending",
          },
        });
      }
    }

    // Send notification to tenant
    const tenantNotificationType =
      status === "Approved" ? "TerminationApproved" : "TerminationRejected";

    await notificationService.createNotification({
      type: "TerminationResponse",
      title: `Termination Request ${status}`,
      message: `Your termination request has been ${status.toLowerCase()}${
        managerResponse ? `. Manager's response: ${managerResponse}` : ""
      }`,
      data: { terminationRequestId: id },
      tenantCognitoId: terminationRequest.lease.tenantCognitoId,
    });

    res.json(updatedRequest);
  } catch (error: any) {
    console.error("Error updating termination request:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// Delete termination request (tenant only, before manager response)
export const deleteTerminationRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantCognitoId = req.user?.id;

    if (!tenantCognitoId) {
      res.status(401).json({ error: "Unauthorized" });
    }

    const request = await prisma.terminationRequest.findFirst({
      where: {
        id: id,
        tenantCognitoId,
        status: "Pending",
      },
    });

    if (!request) {
      res.status(404).json({
        error: "Termination request not found or cannot be deleted",
      });
    }

    await prisma.terminationRequest.delete({
      where: { id: id },
    });

    res.json({ message: "Termination request deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting termination request:", error);
    res.status(500).json({
      error: "Failed to delete termination request",
      details: error.message,
    });
  }
};

// Get termination request details with calculations
export const getTerminationRequestDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userCognitoId = req.user?.id;

    if (!userCognitoId) {
      res.status(401).json({ error: "Unauthorized" });
    }

    const request = await prisma.terminationRequest.findFirst({
      where: {
        id: id,
        OR: [
          { tenantCognitoId: userCognitoId },
          {
            lease: {
              property: {
                managerCognitoId: userCognitoId,
              },
            },
          },
        ],
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      res.status(404).json({ error: "Termination request not found" });
      return;
    }

    // Calculate additional details
    const isEarlyTermination =
      request.requestedEndDate &&
      new Date(request.requestedEndDate) < new Date(request.lease.endDate);

    const estimatedPenalty = request.requestedEndDate
      ? calculatePenaltyFee(request.lease, new Date(request.requestedEndDate))
      : 0;

    res.json({
      ...request,
      isEarlyTermination,
      estimatedPenalty,
    });
  } catch (error: any) {
    console.error("Error fetching termination request:", error);
    res.status(500).json({
      error: "Failed to fetch termination request",
      details: error.message,
    });
  }
};
