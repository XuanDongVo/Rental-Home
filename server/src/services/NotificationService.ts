import { PrismaClient } from "@prisma/client";
import { sseManager } from "./SSEConnectionManager";

// Define notification types
export type NotificationType =
  | "ApplicationSubmitted"
  | "ApplicationApproved"
  | "ApplicationDenied"
  | "PaymentDue"
  | "PaymentReceived"
  | "PaymentOverdue"
  | "MaintenanceRequest"
  | "LeaseExpiring"
  | "NewMessage"
  | "PropertyUpdated"
  | "TerminationRequest"
  | "TerminationResponse";

const prisma = new PrismaClient();

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  tenantCognitoId?: string;
  managerCognitoId?: string;
}

export class NotificationService {
  constructor() {
    // Schedule daily cleanup at midnight
    this.scheduleCleanup();
  }

  // Schedule automatic cleanup every 24 hours
  private scheduleCleanup() {
    setInterval(async () => {
      await this.cleanupAllOldNotifications();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Cleanup old notifications for all users
  async cleanupAllOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const deletedCount = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isRead: true, // Only delete read notifications older than 30 days
        },
      });

      if (deletedCount.count > 0) {
      }
    } catch (error) {
      console.error("Error in daily cleanup:", error);
    }
  }

  async createNotification(notificationData: CreateNotificationData) {
    try {
      // Prepare data for Prisma - ensure only one recipient is set
      const prismaData: any = {
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
      };

      // Set only one recipient
      if (notificationData.tenantCognitoId) {
        prismaData.tenantCognitoId = notificationData.tenantCognitoId;
      } else if (notificationData.managerCognitoId) {
        prismaData.managerCognitoId = notificationData.managerCognitoId;
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: prismaData,
        include: {
          tenant: true,
          manager: true,
        },
      });

      // Send real-time notification via SSE
      await this.sendRealTimeNotification(notification);

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  async sendRealTimeNotification(notification: any) {
    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };

    // Send to specific user
    if (notification.tenantCognitoId) {
      const sent = sseManager.sendNotificationToUser(
        notification.tenantCognitoId,
        payload
      );
    }

    if (notification.managerCognitoId) {
      const sent = sseManager.sendNotificationToUser(
        notification.managerCognitoId,
        payload
      );
    }
  }

  async getNotifications(
    userCognitoId: string,
    userType: "tenant" | "manager"
  ) {
    const whereClause =
      userType === "tenant"
        ? { tenantCognitoId: userCognitoId }
        : { managerCognitoId: userCognitoId };

    // Auto cleanup old notifications (older than 30 days)
    await this.cleanupOldNotifications(userCognitoId, userType);

    return await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100, // Increased to 100 notifications
    });
  }

  async markAsRead(notificationId: number, userCognitoId: string) {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        OR: [
          { tenantCognitoId: userCognitoId },
          { managerCognitoId: userCognitoId },
        ],
      },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userCognitoId: string, userType: "tenant" | "manager") {
    const whereClause =
      userType === "tenant"
        ? { tenantCognitoId: userCognitoId, isRead: false }
        : { managerCognitoId: userCognitoId, isRead: false };

    return await prisma.notification.updateMany({
      where: whereClause,
      data: { isRead: true },
    });
  }

  async getUnreadCount(userCognitoId: string, userType: "tenant" | "manager") {
    const whereClause =
      userType === "tenant"
        ? { tenantCognitoId: userCognitoId, isRead: false }
        : { managerCognitoId: userCognitoId, isRead: false };

    return await prisma.notification.count({
      where: whereClause,
    });
  }

  // Cleanup notifications older than 30 days
  async cleanupOldNotifications(
    userCognitoId: string,
    userType: "tenant" | "manager"
  ) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause =
      userType === "tenant"
        ? {
            tenantCognitoId: userCognitoId,
            createdAt: { lt: thirtyDaysAgo },
            isRead: true, // Only delete read notifications older than 30 days
          }
        : {
            managerCognitoId: userCognitoId,
            createdAt: { lt: thirtyDaysAgo },
            isRead: true, // Only delete read notifications older than 30 days
          };

    try {
      const deletedCount = await prisma.notification.deleteMany({
        where: whereClause,
      });

      if (deletedCount.count > 0) {
      }
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
    }
  }

  // Helper methods for specific notification types
  async notifyApplicationSubmitted(
    applicationId: number,
    tenantName: string,
    propertyName: string,
    managerCognitoId: string
  ) {
    await this.createNotification({
      type: "ApplicationSubmitted",
      title: "New Application Received",
      message: `New rental application from ${tenantName} for property: ${propertyName}`,
      data: { applicationId, propertyName, tenantName },
      managerCognitoId,
    });
  }

  async notifyApplicationStatusChanged(
    applicationId: number,
    status: string,
    propertyName: string,
    tenantCognitoId: string
  ) {
    const title =
      status === "Approved" ? "Application Approved!" : "Application Update";
    const message =
      status === "Approved"
        ? `Your application for ${propertyName} has been approved!`
        : `Your application for ${propertyName} has been ${status.toLowerCase()}`;

    await this.createNotification({
      type: status === "Approved" ? "ApplicationApproved" : "ApplicationDenied",
      title,
      message,
      data: { applicationId, propertyName, status },
      tenantCognitoId,
    });
  }

  async notifyPaymentDue(
    leaseId: number,
    amount: number,
    dueDate: Date,
    tenantCognitoId: string
  ) {
    await this.createNotification({
      type: "PaymentDue",
      title: "Payment Due",
      message: `Payment of $${amount} is due on ${dueDate.toLocaleDateString()}`,
      data: { leaseId, amount, dueDate },
      tenantCognitoId,
    });
  }

  async notifyPaymentReceived(
    leaseId: number,
    amount: number,
    managerCognitoId: string,
    tenantName: string
  ) {
    await this.createNotification({
      type: "PaymentReceived",
      title: "Payment Received",
      message: `Payment of $${amount} received from ${tenantName}`,
      data: { leaseId, amount, tenantName },
      managerCognitoId,
    });
  }

  async notifyPaymentOverdue(
    leaseId: number,
    amount: number,
    dueDate: Date,
    recipientCognitoId: string,
    isManager: boolean = false
  ) {
    const title = isManager ? "Overdue Payment Alert" : "Payment Overdue";
    const message = isManager
      ? `Overdue payment of $${amount} from tenant (Due: ${dueDate.toLocaleDateString()})`
      : `Your payment of $${amount} is overdue (Due: ${dueDate.toLocaleDateString()})`;

    await this.createNotification({
      type: "PaymentOverdue",
      title,
      message,
      data: { leaseId, amount, dueDate },
      ...(isManager
        ? { managerCognitoId: recipientCognitoId }
        : { tenantCognitoId: recipientCognitoId }),
    });
  }
}
