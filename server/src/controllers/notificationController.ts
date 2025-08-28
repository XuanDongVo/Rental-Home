import { Request, Response } from "express";
import { NotificationService } from "../services/NotificationService";
import { sseManager } from "../services/SSEConnectionManager";

const notificationService = new NotificationService();

export const connectSSE = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id as string; // From auth middleware
    const userType = req.user?.role?.toLowerCase() as "tenant" | "manager";

    if (!userId || !userType) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Establish SSE connection
    sseManager.addConnection(userId, userType, res);

    // Connection will be kept alive by SSEConnectionManager
    // No need to send response here
  } catch (error) {
    console.error("SSE connection error:", error);
    res.status(500).json({ error: "Failed to establish SSE connection" });
  }
};

export const connectSSESimple = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.query.id as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // For simple connection, we assume user type based on some logic
    // or you can add userType as another query parameter
    const userType = (req.query.type as "tenant" | "manager") || "tenant";

    console.log(`SSE Simple connection for user: ${userId}, type: ${userType}`);

    // Establish SSE connection
    sseManager.addConnection(userId, userType, res);

    // Connection will be kept alive by SSEConnectionManager
    // No need to send response here
  } catch (error) {
    console.error("SSE simple connection error:", error);
    res.status(500).json({ error: "Failed to establish SSE connection" });
  }
};

export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const userType = req.user?.role?.toLowerCase() as "tenant" | "manager";

    if (!userId || !userType) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notifications = await notificationService.getNotifications(
      userId,
      userType
    );

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notification = await notificationService.markAsRead(
      parseInt(id),
      userId
    );

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const userType = req.user?.role?.toLowerCase() as "tenant" | "manager";

    if (!userId || !userType) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await notificationService.markAllAsRead(userId, userType);

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const userType = req.user?.role?.toLowerCase() as "tenant" | "manager";

    if (!userId || !userType) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const count = await notificationService.getUnreadCount(userId, userType);

    res.json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
};

export const getActiveConnections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow managers to see this (for debugging)
    const userType = req.user?.role?.toLowerCase();
    if (userType !== "manager") {
      res.status(403).json({ error: "Forbidden" });
    }

    const connections = sseManager.getActiveConnections();
    res.json(connections);
  } catch (error) {
    console.error("Error getting active connections:", error);
    res.status(500).json({ error: "Failed to get active connections" });
  }
};
