import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  connectSSE,
  connectSSESimple,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  getActiveConnections,
} from "../controllers/notificationController";

const router = express.Router();

// SSE connection endpoint (with auth)
router.get("/stream", authMiddleware(["manager", "tenant"]), connectSSE);

// SSE connection endpoint (simple - no auth, just userId)
router.get("/subscribe", connectSSESimple);

// Get all notifications for user
router.get("/", authMiddleware(["manager", "tenant"]), getNotifications);

// Get unread count
router.get(
  "/unread-count",
  authMiddleware(["manager", "tenant"]),
  getUnreadCount
);

// Mark specific notification as read
router.put(
  "/:id/read",
  authMiddleware(["manager", "tenant"]),
  markNotificationAsRead
);

// Mark all notifications as read
router.put(
  "/mark-all-read",
  authMiddleware(["manager", "tenant"]),
  markAllNotificationsAsRead
);

// Debug: Get active SSE connections (managers only)
router.get("/connections", authMiddleware(["manager"]), getActiveConnections);

export default router;
