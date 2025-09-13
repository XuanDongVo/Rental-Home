"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { useGetAuthUserQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { MessageCircle } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { 
  useGetChatHistoryQuery, 
  useGetConversationsQuery
} from "@/state/api";

// Default server URLs
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface Conversation {
  id: string;
  peerId: string;
  name: string;
  email: string;
  type: 'tenant' | 'manager';
  lastMessage: {
    id: number;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount?: number;
}

interface Message {
  id: string | number;
  content: string;
  timestamp: Date;
  isFromUser: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isRead?: boolean;
  senderId?: string;
  receiverId?: string;
}

interface ChatContainerProps {
  initialConversations?: Conversation[];
  initialMessages?: Message[];
  propertyId?: string;
  managerId?: string;
  autoSelectConversation?: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  initialConversations = [],
  initialMessages = [],
  propertyId,
  managerId,
  autoSelectConversation = true
}) => {
  const router = useRouter();
  const { markAsRead } = useUnreadMessages();
  const { data: authUser } = useGetAuthUserQuery();
  const currentUserId = authUser?.cognitoInfo?.userId;
  
  // States
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Socket ref
  const socketRef = useRef<Socket | null>(null);

  // Load conversations from API
  const { data: persistedConversations = [], error: conversationsError, 
    isLoading: conversationsLoading } = useGetConversationsQuery(
    currentUserId ? { userId: currentUserId } : ({} as any),
    { skip: !currentUserId }
  );

  // Ensure persistedConversations is always an array
  const safePersistedConversations = useMemo(() => {
    return Array.isArray(persistedConversations) ? persistedConversations : [];
  }, [persistedConversations]);
  
  // Debug logging
  console.log('ChatContainer - persistedConversations:', persistedConversations);
  console.log('ChatContainer - safePersistedConversations:', safePersistedConversations);
  console.log('ChatContainer - conversationsError:', conversationsError);

  // Load messages for selected conversation
  const selectedConv = conversations.find(conv => conv.id === selectedConversation);
  const peerId = selectedConv?.peerId;
  const { data: history = [], isFetching: historyLoading } = useGetChatHistoryQuery(
    currentUserId && peerId ? { user1: currentUserId, user2: peerId } : ({} as any),
    { skip: !currentUserId || !peerId }
  );

  // Socket.io: Connect and listen for real-time messages
  useEffect(() => {
    if (!currentUserId) return;

    socketRef.current = io(SOCKET_URL, { 
      transports: ["websocket"],
      autoConnect: true
    });

    // Join personal room for direct messages
    socketRef.current.emit("join", currentUserId);

    socketRef.current.on("chat:receive", (data: any) => {
      console.log("Received message:", data);
      
      // Avoid duplicating the sender's own message
      if (data.senderId === currentUserId) {
        return;
      }

      const newMessage: Message = {
        id: data.id?.toString() || Date.now().toString(),
        content: data.content,
        timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
        isFromUser: false,
        senderId: data.senderId,
        receiverId: data.receiverId,
        isRead: data.isRead || false
      };

      setMessages(prev => [...prev, newMessage]);

      // Update conversation with new message
      setConversations(prev => {
        const convId = data.senderId as string;
        const existing = prev.find(c => c.peerId === convId);
        const now = data.createdAt ? new Date(data.createdAt) : new Date();
        
        if (existing) {
          return prev.map(c =>
            c.peerId === convId
              ? {
                  ...c,
                  lastMessage: {
                    id: data.id,
                    content: data.content,
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                    createdAt: now.toISOString(),
                    isRead: false
                  },
                  unreadCount: (selectedConversation === c.id ? 0 : (c.unreadCount || 0) + 1)
                }
              : c
          );
        }
        
        // Create new conversation if it doesn't exist
        const newConv: Conversation = {
          id: convId,
          peerId: convId,
          name: 'User',
          email: '',
          type: 'tenant',
          lastMessage: {
            id: data.id,
            content: data.content,
            senderId: data.senderId,
            receiverId: data.receiverId,
            createdAt: now.toISOString(),
            isRead: false
          },
          unreadCount: 1
        };
        return [newConv, ...prev];
      });
    });

    socketRef.current.on("chat:error", (error: any) => {
      console.error("Chat error:", error);
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to chat server");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUserId, selectedConversation]);

  // Update conversations from API
  useEffect(() => {
    if (conversationsLoading || !safePersistedConversations || safePersistedConversations.length === 0) return;
    
    console.log('ChatContainer - Processing conversations:', safePersistedConversations);
    
    setConversations(prev => {
      const map = new Map(prev.map(c => [c.peerId, c] as const));
      
      safePersistedConversations.forEach((pc: any) => {
        const existing = map.get(pc.peerId);
        const ts = new Date(pc.lastMessage.createdAt);
        const updated: Conversation = {
          id: pc.peerId,
          peerId: pc.peerId,
          name: pc.name || pc.peerId,
          email: pc.email || '',
          type: pc.type || 'tenant',
          lastMessage: {
            id: pc.lastMessage.id,
            content: pc.lastMessage.content,
            senderId: pc.lastMessage.senderId,
            receiverId: pc.lastMessage.receiverId,
            createdAt: pc.lastMessage.createdAt,
            isRead: pc.lastMessage.isRead
          },
          unreadCount: existing?.unreadCount || 0
        };
        map.set(pc.peerId, updated);
      });
      
      // Sort by timestamp desc
      return Array.from(map.values()).sort((a, b) => 
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
    });
  }, [safePersistedConversations, conversationsLoading]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!history || history.length === 0) return;
    
    const mapped: Message[] = history.map((m: any) => ({
      id: m.id.toString(),
      content: m.content,
      timestamp: new Date(m.createdAt),
      isFromUser: m.senderId === currentUserId,
      status: 'read' as const,
      isRead: m.isRead,
      senderId: m.senderId,
      receiverId: m.receiverId
    }));
    
    setMessages(mapped);
  }, [history, currentUserId]);

  // Auto-select conversation based on URL params
  useEffect(() => {
    if (propertyId && managerId) {
      const existingConversation = conversations.find(
        conv => conv.peerId === managerId
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation.id);
      } else {
        // Create new conversation
        const newConv: Conversation = {
          id: managerId,
          peerId: managerId,
          name: 'Property Manager',
          email: '',
          type: 'manager',
          lastMessage: {
            id: 0,
            content: 'Start a conversation...',
            senderId: '',
            receiverId: '',
            createdAt: new Date().toISOString(),
            isRead: true
          },
          unreadCount: 0
        };
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv.id);
      }
    } else if (autoSelectConversation && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [propertyId, managerId, conversations, selectedConversation, autoSelectConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const currentConv = conversations.find(conv => conv.id === selectedConversation);
    if (!currentConv) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date(),
      isFromUser: true,
      status: 'sent',
      senderId: currentUserId,
      receiverId: currentConv.peerId
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = newMessage;
    setNewMessage("");

    // Send message via socket
    if (socketRef.current) {
      socketRef.current.emit("chat:send", {
        senderId: currentUserId,
        receiverId: currentConv.peerId,
        content: messageContent,
      });
    }

    // Update conversation last message
    setConversations(prev => prev.map(conv =>
      conv.id === selectedConversation
        ? { 
            ...conv, 
            lastMessage: {
              ...conv.lastMessage,
              content: messageContent,
              senderId: currentUserId,
              receiverId: currentConv.peerId,
              createdAt: new Date().toISOString(),
              isRead: true
            }
          }
        : conv
    ));
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    
    // Update local state to mark as read
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const handleUserSelect = (user: any) => {
    // Create a new conversation for the selected user
    const newConversation: Conversation = {
      id: user.cognitoId,
      peerId: user.cognitoId,
      name: user.name,
      email: user.email,
      type: user.type,
      lastMessage: {
        id: 0,
        content: "Start a new conversation",
        senderId: currentUserId || '',
        receiverId: user.cognitoId,
        createdAt: new Date().toISOString(),
        isRead: true
      },
      unreadCount: 0
    };

    // Add to conversations if not already exists
    setConversations(prev => {
      const exists = prev.some(c => c.peerId === user.cognitoId);
      if (!exists) {
        return [newConversation, ...prev];
      }
      return prev;
    });

    // Select the conversation
    setSelectedConversation(user.cognitoId);
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <ChatSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        searchQuery={searchQuery}
        onSelectConversation={handleSelectConversation}
        onUserSelect={handleUserSelect}
        onSearchChange={setSearchQuery}
        currentUserId={currentUserId}
      />

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedConv ? (
          <>
            <ChatHeader
              conversation={selectedConv}
              onBack={() => setSelectedConversation(null)}
              showBackButton={true}
            />

            <ChatMessages
              messages={messages}
              conversation={selectedConv}
              isTyping={isTyping}
              onMessageRead={(messageId) => {
                // Mark message as read locally
                setMessages(prev => prev.map(msg =>
                  msg.id === messageId ? { ...msg, isRead: true } : msg
                ));

                // Mark conversation as read in global state
                markAsRead(selectedConv.id);
              }}
            />

            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSendMessage}
            />
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;