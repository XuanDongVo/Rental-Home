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
  const pollingRef = useRef<number | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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

        if (!navigator.onLine) {
          console.warn("Offline: skipping notifications fetch");
          return;
        }

        const base = API_BASE ? API_BASE.replace(/\/$/, "") : "";
        const notificationsPath = "/notifications";
        const notificationsUrl = base ? `${base}${notificationsPath}` : notificationsPath;
        const originFallback = window.location.origin + notificationsPath;

        console.debug("Attempting to fetch notifications. idToken present:", !!idToken);
        console.debug("Primary URL:", notificationsUrl, "Origin fallback:", originFallback);

        const fetchOptions: RequestInit = {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          mode: "cors",
        };

        const urlsToTry = [notificationsUrl];
        // If notificationsUrl is relative, also try origin-prefixed absolute URL
        if (!base) urlsToTry.push(originFallback);

        let lastError: any = null;
        let data: any = null;

        for (const url of urlsToTry) {
          try {
            console.debug("Fetching notifications from:", url);
            const response = await fetch(url, fetchOptions);
            if (response.ok) {
              data = await response.json();
              break;
            } else {
              lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
              console.warn("Fetch returned non-OK status for", url, response.status, response.statusText);
            }
            } catch (err) {
            lastError = err;
            console.warn("Fetch attempt failed for", url, err);
          }
        }

        if (data) {
          setNotifications(data);
          setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        } else {
          console.warn("Failed to fetch notifications after attempts:", lastError);

          // Diagnostic probe: try a no-cors fetch to detect CORS vs server down
          (async () => {
            try {
              const probeUrl = urlsToTry[0] || originFallback;
              const ac = new AbortController();
              const id = setTimeout(() => ac.abort(), 3000);
              // Attempt a no-cors request — if it resolves, likely CORS issue; if it rejects, server unreachable
              await fetch(probeUrl, { mode: "no-cors", signal: ac.signal });
              clearTimeout(id);
              console.warn("Probe succeeded in no-cors mode — this suggests a CORS issue for:", probeUrl);
              console.warn(
                "If you're running the API on localhost, ensure the server sets the Access-Control-Allow-Origin header to your client origin (or '*') and allows Authorization header if needed."
              );
            } catch (probeErr) {
              console.warn("Probe failed — API appears unreachable at:", urlsToTry, probeErr);
              console.warn(
                "Check that the API server is running and accessible at the above URL(s). If using Docker, ensure port mapping is correct."
              );
            }
          })();
        }
      } catch (error) {
        console.warn("Failed to fetch initial notifications (unexpected):", error);
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
      const subscribeUrl = API_BASE
        ? `${API_BASE.replace(/\/$/, "")}/notifications/subscribe?id=${encodeURIComponent(
            authUser.cognitoInfo.userId
          )}&type=${encodeURIComponent(userRole)}`
        : `/notifications/subscribe?id=${encodeURIComponent(
            authUser.cognitoInfo.userId
          )}&type=${encodeURIComponent(userRole)}`;

      try {
        const eventSource = new EventSource(subscribeUrl);
        eventSourceRef.current = eventSource;

        // If we had a polling fallback running, clear it
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        eventSource.onopen = () => {
          setIsConnected(true);
          retryCount = 0; // Reset retry count on successful connection
        };

        eventSource.onerror = (error) => {
          // console.error("SSE error:", error);
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
            // If SSE keeps failing, fallback to polling every 30s
            if (!pollingRef.current) {
              pollingRef.current = window.setInterval(() => {
                refreshNotifications();
              }, 30000);
            }
          }
        };

        eventSource.addEventListener("notification", (event) => {
          try {
            const notification: Notification = JSON.parse(event.data);

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
      } catch (err) {
        console.warn("Failed to connect to SSE, falling back to polling:", err);
        // Fallback to polling every 30s
        if (!pollingRef.current) {
          pollingRef.current = window.setInterval(() => {
            refreshNotifications();
          }, 30000);
        }
      }
      // end try/catch for connecting SSE
    };

    const source = connectSSE();

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setIsConnected(false);
    };
  }, [authUser?.cognitoInfo?.userId, authUser?.userRole]);

  // Sync unread count with notifications to ensure accuracy
  useEffect(() => {
    const actualUnreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount !== actualUnreadCount) {
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
        setNotifications(data);
        // Recalculate unread count accurately
        const actualUnreadCount = data.filter(
          (n: Notification) => !n.isRead
        ).length;
        setUnreadCount(actualUnreadCount);
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
