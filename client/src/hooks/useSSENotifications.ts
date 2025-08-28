"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGetAuthUserQuery } from "@/state/api";
import { fetchAuthSession } from "aws-amplify/auth";

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export const useSSENotifications = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE stream - simple approach without auth
  useEffect(() => {
    if (!authUser?.cognitoInfo?.userId) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        // Get ID token for auth (same as api.ts)
        const session = await fetchAuthSession();
        const { idToken } = session.tokens ?? {};

        if (!idToken) {
          console.error("No ID token available");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched notifications:", data);
          setNotifications(data);
          setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        } else {
          //   console.error(
          //     "Failed to fetch notifications:",
          //     response.status,
          //     response.statusText
          //   );
        }
      } catch (error) {
        console.error("Failed to fetch initial notifications:", error);
      }
    };

    fetchNotifications();

    let retryCount = 0;
    const maxRetries = 3;

    const connectSSE = () => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Simple connection with just userId, no auth token needed
      const userRole = authUser.userRole?.toLowerCase() || "tenant";
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/subscribe?id=${authUser.cognitoInfo.userId}&type=${userRole}`
      );

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection opened");
        setIsConnected(true);
        retryCount = 0; // Reset retry count on successful connection
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        setIsConnected(false);
        eventSource.close();

        // Retry connection with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            if (authUser?.cognitoInfo?.userId) {
              connectSSE();
            }
          }, 2000 * retryCount); // Exponential backoff: 2s, 4s, 6s
        } else {
          console.log("Max retries reached, stopping reconnection attempts");
        }
      };

      eventSource.addEventListener("connected", (event) => {
        console.log("SSE connected:", event.data);
      });

      eventSource.addEventListener("notification", (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          console.log("📩 New notification received:", notification);

          // Add to notifications list (avoid duplicates)
          setNotifications((prev) => {
            const isDuplicate = prev.some(
              (existing) => existing.id === notification.id
            );
            if (!isDuplicate) {
              return [notification, ...prev.slice(0, 49)]; // Keep max 50 notifications
            }
            return prev;
          });

          // Update unread count if notification is unread
          if (!notification.isRead) {
            setUnreadCount((prev) => prev + 1);
          }

          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
              tag: notification.id.toString(),
            });
          }
        } catch (e) {
          console.error(
            "Error parsing notification JSON:",
            e,
            "Raw data:",
            event.data
          );
        }
      });

      eventSource.addEventListener("ping", (event) => {
        // Keep alive ping - no action needed
        console.log("SSE ping received");
      });

      return eventSource;
    };

    const source = connectSSE();

    // Cleanup function
    return () => {
      if (source) {
        source.close();
        console.log("SSE connection closed!");
      }
      setIsConnected(false);
    };
  }, [authUser?.cognitoInfo?.userId, authUser?.userRole]);

  // Sync unread count with notifications to ensure accuracy
  useEffect(() => {
    const actualUnreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount !== actualUnreadCount) {
      console.log(
        `🔄 Syncing unread count: ${unreadCount} -> ${actualUnreadCount}`
      );
      setUnreadCount(actualUnreadCount);
    }
  }, [notifications, unreadCount]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!authUser?.cognitoInfo?.userId) return;

      try {
        // Get ID token for auth (same as api.ts)
        const session = await fetchAuthSession();
        const { idToken } = session.tokens ?? {};

        if (!idToken) {
          console.error("No ID token available for mark as read");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/${notificationId}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (response.ok) {
          // Update local state
          setNotifications((prev) => {
            return prev.map((notification) => {
              if (notification.id === notificationId) {
                // If this notification was unread, decrease unread count
                if (!notification.isRead) {
                  setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
                }
                return { ...notification, isRead: true };
              }
              return notification;
            });
          });
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [authUser]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!authUser?.cognitoInfo?.userId) return;

    try {
      // Get ID token for auth (same as api.ts)
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};

      if (!idToken) {
        console.error("No ID token available for mark all as read");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.ok) {
        // Update local state - only mark unread notifications as read
        setNotifications((prev) => {
          const unreadCount = prev.filter((n) => !n.isRead).length;

          // Update notifications
          const updatedNotifications = prev.map((notification) => ({
            ...notification,
            isRead: true,
          }));

          // Set unread count to 0 since we marked all as read
          setUnreadCount(0);

          return updatedNotifications;
        });
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [authUser]);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  // Refresh notifications manually
  const refreshNotifications = useCallback(async () => {
    if (!authUser?.cognitoInfo?.userId) return;

    try {
      // Get ID token for auth (same as api.ts)
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};

      if (!idToken) {
        console.error("No ID token available for refresh");
        return;
      }

      console.log("Refreshing notifications...");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log("Refresh response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Refreshed notifications data:", data);
        setNotifications(data);
        // Recalculate unread count accurately
        const actualUnreadCount = data.filter(
          (n: Notification) => !n.isRead
        ).length;
        setUnreadCount(actualUnreadCount);
        console.log("Updated unread count:", actualUnreadCount);
      } else {
        console.error("Failed to refresh notifications:", response.statusText);
      }
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  }, [authUser]);
  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    requestPermission,
    refreshNotifications,
  };
};
