"use client";

import { useState, useEffect } from 'react';
import { useGetUnreadMessageCountQuery, useGetAuthUserQuery } from '@/state/api';

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

  // Get current user from auth
  const { data: authUser } = useGetAuthUserQuery();
  const currentUserId = authUser?.cognitoInfo?.userId;

  const { data: unreadCountData, isLoading, refetch } = useGetUnreadMessageCountQuery(
    currentUserId || '',
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