"use client";

import { useState, useEffect } from 'react';
import { useGetUnreadMessageCountQuery } from '@/state/api';

export interface UnreadMessageData {
  totalUnread: number;
  conversations: Array<{
    id: string;
    unreadCount: number;
    lastMessage: string;
    timestamp: Date;
  }>;
}

export const useUnreadMessages = () => {
  const [unreadData, setUnreadData] = useState<UnreadMessageData>({
    totalUnread: 0,
    conversations: []
  });

  // This would need to be passed from the parent component
  const currentUserId = 'current-user-id'; // TODO: Get from auth context

  const { data: unreadCountData, isLoading, refetch } = useGetUnreadMessageCountQuery(
    currentUserId,
    { skip: !currentUserId }
  );

  useEffect(() => {
    if (unreadCountData) {
      setUnreadData(prev => ({
        ...prev,
        totalUnread: unreadCountData.unreadCount
      }));
    }
  }, [unreadCountData]);

  const markAsRead = (conversationId: string) => {
    // Update local state immediately for better UX
    setUnreadData(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
      totalUnread: Math.max(0, prev.totalUnread - 1)
    }));
  };

  const markAllAsRead = () => {
    setUnreadData({
      totalUnread: 0,
      conversations: []
    });
  };

  const refreshUnreadCount = () => {
    refetch();
  };

  return {
    totalUnread: unreadData.totalUnread,
    conversations: unreadData.conversations,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount
  };
};