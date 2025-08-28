"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSSENotifications, Notification } from "@/hooks/useSSENotifications";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
}) => {
    const handleClick = () => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }

        // Handle navigation based on notification type
        if (notification.data?.propertyId) {
            // Navigate to property page
            window.location.href = `/managers/properties/${notification.data.propertyId}`;
        } else if (notification.data?.applicationId) {
            // Navigate to applications page
            window.location.href = `/tenants/applications`;
        }
    };

    return (
        <div
            className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors relative ${!notification.isRead
                ? "bg-blue-50 border-l-4 border-l-blue-500"
                : "bg-white hover:bg-gray-50"
                }`}
            onClick={handleClick}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        {/* Read/Unread indicator */}
                        <div className={`w-2 h-2 rounded-full ${!notification.isRead ? "bg-blue-500" : "bg-gray-300"
                            }`}></div>

                        <h4 className={`text-sm ${!notification.isRead
                            ? "font-semibold text-gray-900"
                            : "font-normal text-gray-700"
                            }`}>
                            {notification.title}
                        </h4>

                        {/* NEW badge for unread */}
                        {!notification.isRead && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                                NEW
                            </span>
                        )}
                    </div>
                    <p className={`text-xs mt-1 ${!notification.isRead ? "text-gray-700" : "text-gray-500"
                        }`}>
                        {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {/* Read status text */}
                        <span className={`text-xs ${!notification.isRead ? "text-blue-600" : "text-gray-400"
                            }`}>
                            {!notification.isRead ? "Unread" : "Read"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationBell: React.FC = () => {
    const {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        requestPermission,
        refreshNotifications,
    } = useSSENotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [showReadNotifications, setShowReadNotifications] = useState(true);

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleRequestPermission = async () => {
        await requestPermission();
    };

    const handleRefresh = async () => {
        await refreshNotifications();
    };

    // Filter notifications based on toggle
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const readNotifications = notifications.filter(n => n.isRead);

    // Debug: log notifications
    console.log("NotificationBell - notifications:", notifications);
    console.log("NotificationBell - unreadCount:", unreadCount);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className=" p-0">
                <div className="p-4 border-b w-[510px]">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs text-gray-500">
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 ">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">
                                {unreadCount} unread • {notifications.length} total
                            </span>
                            {/* Toggle for read notifications */}
                            <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showReadNotifications}
                                    onChange={(e) => setShowReadNotifications(e.target.checked)}
                                    className="w-3 h-3 text-blue-600 rounded"
                                />
                                <span className="text-xs text-gray-500">Show read</span>
                            </label>
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                className="text-xs px-2 py-1"
                            >
                                Refresh
                            </Button>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs px-2 py-1"
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <ScrollArea className="max-h-[500px]">
                    {notifications.length > 0 ? (
                        <div>
                            {/* Unread notifications - always show */}
                            {unreadNotifications.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border-b flex items-center justify-between">
                                        <span>🔔 Unread ({unreadNotifications.length})</span>
                                        <span className="text-blue-600">NEW</span>
                                    </div>
                                    {unreadNotifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkAsRead={markAsRead}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Read notifications - show based on toggle */}
                            {showReadNotifications && readNotifications.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border-b flex items-center justify-between">
                                        <span>📖 Earlier ({readNotifications.length})</span>
                                        <button
                                            onClick={() => setShowReadNotifications(false)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {readNotifications
                                        .slice(0, 15) // Limit to 15 read notifications for performance
                                        .map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={markAsRead}
                                            />
                                        ))}
                                    {readNotifications.length > 15 && (
                                        <div className="p-3 text-center border-b">
                                            <span className="text-xs text-gray-500">
                                                And {readNotifications.length - 15} more...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* No notifications message */}
                            {unreadNotifications.length === 0 && (!showReadNotifications || readNotifications.length === 0) && (
                                <div className="p-6 text-center text-gray-500">
                                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No notifications yet</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        You&apos;ll see new notifications here when they arrive
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">No notifications yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                You&apos;ll see new notifications here when they arrive
                            </p>
                        </div>
                    )}
                </ScrollArea>                {notifications.length > 0 && (
                    <div className="p-3 border-t bg-gray-50">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                                📊 {unreadNotifications.length} unread, {readNotifications.length} read
                            </span>
                            <span>
                                🗂️ Auto-cleanup: 30 days
                            </span>
                        </div>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;
