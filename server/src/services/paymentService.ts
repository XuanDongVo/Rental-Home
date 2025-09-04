import { PrismaClient, PaymentStatus } from "@prisma/client";
import { NotificationService } from "./NotificationService";

const prisma = new PrismaClient();
const notificationService = new NotificationService();

// Tạo payment cho tháng hiện tại khi lease được approve
export const createCurrentMonthPayment = async (leaseId: number) => {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!lease) {
      throw new Error("Lease not found");
    }

    const today = new Date();
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // Check if payment already exists for current month
    const existingPayment = await prisma.payment.findFirst({
      where: {
        leaseId: leaseId,
        dueDate: {
          gte: currentMonthStart,
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        },
      },
    });

    if (!existingPayment) {
      const payment = await prisma.payment.create({
        data: {
          amountDue: lease.rent,
          amountPaid: 0,
          dueDate: currentMonthStart,
          paymentStatus: PaymentStatus.Pending,
          leaseId: leaseId,
        } as any,
      });

      // Send notification for current month payment
      await notificationService.notifyPaymentDue(
        leaseId,
        lease.rent,
        currentMonthStart,
        lease.tenantCognitoId
      );

      return payment;
    }

    return existingPayment;
  } catch (error) {
    console.error("Error creating current month payment:", error);
    throw error;
  }
};

// Tạo payment cho tháng tiếp theo (được gọi bởi cron job)
export const createNextMonthPayment = async (leaseId: number) => {
  try {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!lease) {
      throw new Error("Lease not found");
    }

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Check if lease is still active for next month
    if (nextMonth > new Date(lease.endDate)) {
      return null; // Lease expired, no need to create payment
    }

    // Check if payment already exists for next month
    const existingPayment = await prisma.payment.findFirst({
      where: {
        leaseId: leaseId,
        dueDate: {
          gte: nextMonth,
          lt: new Date(today.getFullYear(), today.getMonth() + 2, 1),
        },
      },
    });

    if (!existingPayment) {
      const payment = await prisma.payment.create({
        data: {
          amountDue: lease.rent,
          amountPaid: 0,
          dueDate: nextMonth,
          paymentStatus: PaymentStatus.Pending,
          leaseId: leaseId,
        } as any,
      });

      return payment;
    }

    return existingPayment;
  } catch (error) {
    console.error("Error creating next month payment:", error);
    throw error;
  }
};

export const recordPayment = async (
  paymentId: number,
  amountPaid: number,
  paymentDate: Date = new Date()
) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            property: {
              include: {
                manager: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Determine payment status
    let newStatus: PaymentStatus;
    const totalPaid = payment.amountPaid + amountPaid;

    if (totalPaid >= payment.amountDue) {
      newStatus = PaymentStatus.Paid;
    } else if (totalPaid > 0) {
      newStatus = PaymentStatus.PartiallyPaid;
    } else {
      newStatus = PaymentStatus.Pending;
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        amountPaid: totalPaid,
        paymentDate:
          totalPaid >= payment.amountDue ? paymentDate : payment.paymentDate,
        paymentStatus: newStatus,
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
    });

    // Send notification to manager
    if (newStatus === PaymentStatus.Paid) {
      await notificationService.notifyPaymentReceived(
        payment.leaseId,
        amountPaid,
        payment.lease.property.managerCognitoId,
        payment.lease.tenant.name
      );
    }

    return updatedPayment;
  } catch (error) {
    console.error("Error recording payment:", error);
    throw error;
  }
};

export const checkOverduePayments = async () => {
  try {
    const today = new Date();
    const overduePayments = await prisma.payment.findMany({
      where: {
        dueDate: { lt: today },
        paymentStatus: {
          in: [PaymentStatus.Pending, PaymentStatus.PartiallyPaid],
        },
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
          },
        },
      },
    });

    // Update status to Overdue and send notifications
    for (const payment of overduePayments) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: PaymentStatus.Overdue },
      });

      // Send overdue notification to tenant
      await notificationService.notifyPaymentOverdue(
        payment.leaseId,
        payment.amountDue - payment.amountPaid,
        payment.dueDate,
        payment.lease.tenantCognitoId,
        false
      );

      // Send notification to manager
      await notificationService.notifyPaymentOverdue(
        payment.leaseId,
        payment.amountDue - payment.amountPaid,
        payment.dueDate,
        payment.lease.property.managerCognitoId,
        true
      );
    }

    return overduePayments;
  } catch (error) {
    console.error("Error checking overdue payments:", error);
    throw error;
  }
};

export const getPaymentsByLease = async (leaseId: number) => {
  try {
    return await prisma.payment.findMany({
      where: { leaseId },
      orderBy: { dueDate: "asc" },
    });
  } catch (error) {
    console.error("Error getting payments by lease:", error);
    throw error;
  }
};

export const getPaymentsByProperty = async (propertyId: number) => {
  try {
    return await prisma.payment.findMany({
      where: {
        lease: {
          propertyId,
        },
      },
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });
  } catch (error) {
    console.error("Error getting payments by property:", error);
    throw error;
  }
};

export const getCurrentMonthPaymentStatus = async (leaseId: number) => {
  try {
    const currentDate = new Date();
    const payment = await prisma.payment.findFirst({
      where: {
        leaseId,
        dueDate: {
          gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          lt: new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            1
          ),
        },
      },
    });

    return {
      paymentStatus: payment?.paymentStatus || "Pending",
      amountDue: payment?.amountDue || 0,
      amountPaid: payment?.amountPaid || 0,
      dueDate: payment?.dueDate || null,
      paymentDate: payment?.paymentDate || null,
    };
  } catch (error) {
    console.error("Error getting current month payment status:", error);
    throw error;
  }
};
