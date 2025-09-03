import { useState, useEffect } from "react";
import { useGetAuthUserQuery } from "@/state/api";

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
  const { data: authUser } = useGetAuthUserQuery();
  const [unreadData, setUnreadData] = useState<UnreadMessageData>({
    totalUnread: 0,
    conversations: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!authUser?.cognitoInfo?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/messages/unread/${authUser.cognitoInfo.userId}`);
        // const data = await response.json();
        
        // Mock data for now - replace with real API
        const mockData: UnreadMessageData = {
          totalUnread: 5, // Example: 5 unread messages
          conversations: [
            {
              id: "1",
              unreadCount: 3,
              lastMessage: "Hello, I'm interested in the property",
              timestamp: new Date()
            },
            {
              id: "2", 
              unreadCount: 2,
              lastMessage: "When can I schedule a viewing?",
              timestamp: new Date()
            }
          ]
        };

        setUnreadData(mockData);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
        setUnreadData({ totalUnread: 0, conversations: [] });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadMessages();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchUnreadMessages, 30000);

    return () => clearInterval(interval);
  }, [authUser?.cognitoInfo?.userId]);

  const markAsRead = (conversationId: string) => {
    setUnreadData(prev => ({
      ...prev,
      totalUnread: Math.max(0, prev.totalUnread - (prev.conversations.find(c => c.id === conversationId)?.unreadCount || 0)),
      conversations: prev.conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    }));
  };

  const markAllAsRead = () => {
    setUnreadData(prev => ({
      ...prev,
      totalUnread: 0,
      conversations: prev.conversations.map(conv => ({ ...conv, unreadCount: 0 }))
    }));
  };

  return {
    ...unreadData,
    isLoading,
    markAsRead,
    markAllAsRead
  };
};
