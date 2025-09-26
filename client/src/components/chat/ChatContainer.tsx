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
import { useHydration } from "@/hooks/useHydration";
import {
  useGetChatHistoryQuery,
  useGetConversationsQuery,
  useSendChatMessageMutation,
  useEditChatMessageMutation,
  useRecallChatMessageMutation,
  useDeleteChatMessageForMeMutation,
  useGetChatMessageEditHistoryQuery,
  useMarkChatMessagesAsReadMutation
} from "@/state/api";
import { Conversation, Message, MessageEdit } from "./types";
// import { useToast } from "@/components/ui/use-toast";

// Default server URLs
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

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
  const isHydrated = useHydration();
  // const { toast } = useToast();

  // Chat mutations
  const [sendChatMessage] = useSendChatMessageMutation();
  const [editChatMessage] = useEditChatMessageMutation();
  const [recallChatMessage] = useRecallChatMessageMutation();
  const [deleteMessageForMe] = useDeleteChatMessageForMeMutation();
  const [markMessagesAsRead] = useMarkChatMessagesAsReadMutation();

  // States
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeEditHistoryMessageId, setActiveEditHistoryMessageId] = useState<number | null>(null);

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

  // Selected conversation and peer
  const selectedConv = conversations.find(conv => conv.id === selectedConversation);
  const peerId = selectedConv?.peerId;

  // Load messages for selected conversation
  const { data: history = [], isFetching: historyLoading } = useGetChatHistoryQuery(
    currentUserId && peerId ? { user1: currentUserId, user2: peerId } : ({} as any),
    { skip: !currentUserId || !peerId }
  );

  // Get edit history for a message if requested
  const { data: editHistory, isLoading: editHistoryLoading } = useGetChatMessageEditHistoryQuery(
    activeEditHistoryMessageId && currentUserId
      ? { messageId: activeEditHistoryMessageId, userId: currentUserId }
      : ({} as any),
    { skip: !activeEditHistoryMessageId || !currentUserId }
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

      // Kiểm tra và ngăn tin nhắn trùng lặp
      const isDuplicate = messages.some(msg => {
        // Kiểm tra theo ID cụ thể
        if (data.id && msg.id.toString() === data.id.toString()) {
          return true;
        }

        // Kiểm tra theo nội dung và thời gian
        if (msg.content === data.content &&
          msg.senderId === data.senderId &&
          // Tin nhắn được gửi trong vòng 5 giây
          (new Date().getTime() - new Date(msg.timestamp).getTime() < 5000)) {
          return true;
        }

        // Kiểm tra nếu là tin nhắn tạm thời
        if (msg.id.toString().startsWith('temp_') &&
          msg.content === data.content &&
          msg.senderId === data.senderId) {
          return true;
        }

        return false;
      });

      // Nếu là tin nhắn trùng lặp, cập nhật trạng thái tin nhắn hiện tại
      if (isDuplicate) {
        if (data.id) {
          setMessages(prev => prev.map(msg => {
            // Nếu đây là tin nhắn tạm thời cần cập nhật
            if (msg.content === data.content &&
              msg.senderId === data.senderId &&
              msg.id.toString().startsWith('temp_')) {
              return {
                ...msg,
                id: data.id.toString(),
                status: 'delivered',
                isRead: data.isRead || false,
                timestamp: data.createdAt ? new Date(data.createdAt) : msg.timestamp
              };
            }
            // Nếu tìm thấy chính xác tin nhắn cần cập nhật
            else if (msg.id.toString() === data.id.toString()) {
              return {
                ...msg,
                status: 'delivered',
                isRead: data.isRead || false
              };
            }
            return msg;
          }));
        }
        return; // Không thêm tin nhắn trùng
      }

      // Nếu là tin nhắn mới, thêm vào danh sách
      const newMessage: Message = {
        id: data.id?.toString() || `msg_${Date.now()}`,
        chatId: data.chatId,
        content: data.content,
        timestamp: new Date(data.createdAt || Date.now()),
        isFromUser: data.senderId === currentUserId,
        senderId: data.senderId,
        isRead: data.isRead || false,
        isEdited: data.isEdited || false,
        isRecalled: data.isRecalled || false,
        status: data.isRecalled ? 'recalled' : data.isEdited ? 'edited' : data.isRead ? 'read' : 'delivered'
      };

      setMessages(prev => [...prev, newMessage]);

      // Cập nhật danh sách cuộc trò chuyện
      setConversations(prev => {
        const convId = data.chatId;
        const peerId = data.senderId !== currentUserId ? data.senderId : data.receiverId;
        const existing = prev.find(c => c.chatId === convId || c.peerId === peerId);
        const now = data.createdAt ? new Date(data.createdAt) : new Date();

        if (existing) {
          return prev.map(c =>
            (c.chatId === convId || c.peerId === peerId)
              ? {
                ...c,
                chatId: convId || c.chatId, // Cập nhật chatId nếu chưa có
                lastMessage: {
                  id: data.id,
                  content: data.content,
                  senderId: data.senderId,
                  createdAt: now.toISOString(),
                  isRead: data.senderId === currentUserId,
                  isEdited: data.isEdited || false,
                  isRecalled: data.isRecalled || false
                },
                unreadCount: (data.senderId !== currentUserId && selectedConversation !== c.id)
                  ? (c.unreadCount || 0) + 1
                  : c.unreadCount
              }
              : c
          );
        }

        // Tạo cuộc trò chuyện mới nếu chưa tồn tại
        return prev;
      });
    });

    // Listen for message edit events
    socketRef.current.on("chat:edit", (data: any) => {
      if (data.messageId) {
        setMessages(prev => prev.map(msg =>
          msg.id.toString() === data.messageId.toString()
            ? {
              ...msg,
              content: data.content,
              isEdited: true,
              status: 'edited'
            }
            : msg
        ));
      }
    });

    // Listen for message recall events
    socketRef.current.on("chat:recall", (data: any) => {
      if (data.messageId) {
        setMessages(prev => prev.map(msg =>
          msg.id.toString() === data.messageId.toString()
            ? {
              ...msg,
              isRecalled: true,
              status: 'recalled'
            }
            : msg
        ));
      }
    });

    socketRef.current.on("chat:error", (error: any) => {
      if (error && typeof error === 'object' && Object.keys(error).length > 0) {
        console.error("Chat error:", error);
      } else if (error && typeof error === 'string') {
        console.error("Chat error:", error);
      } else {
        console.warn("Chat error received but no details provided");
      }
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to chat server");
    });

    socketRef.current.on("disconnect", (reason: any) => {
      console.log("Disconnected from chat server:", reason || "Unknown reason");
    });

    socketRef.current.on("connect_error", (error: any) => {
      console.error("Socket connection error:", error?.message || error || "Unknown connection error");
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUserId, selectedConversation]);

  // Update conversations from API
  useEffect(() => {
    if (conversationsLoading || !safePersistedConversations || safePersistedConversations.length === 0) return;

    setConversations(prev => {
      const currentConversations = Array.from(new Map(prev.map(c => [c.peerId, c] as const)).values())
        .sort((a, b) =>
          new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        );

      const newConversations = safePersistedConversations.map((pc: any) => {
        const existing = prev.find(c => c.peerId === pc.peerId);

        const unreadCount = (pc.lastMessage.senderId !== currentUserId && !pc.lastMessage.isRead)
          ? (existing?.unreadCount || 0) + 1
          : (existing?.unreadCount || 0);

        return {
          id: pc.peerId,
          chatId: pc.chatId, // Thêm chatId
          peerId: pc.peerId,
          name: pc.name || pc.peerId,
          email: pc.email || '',
          type: pc.type || 'tenant',
          lastMessage: {
            id: pc.lastMessage.id,
            content: pc.lastMessage.content,
            senderId: pc.lastMessage.senderId,
            createdAt: pc.lastMessage.createdAt,
            isRead: pc.lastMessage.isRead,
            isEdited: pc.lastMessage.isEdited || false,
            isRecalled: pc.lastMessage.isRecalled || false
          },
          unreadCount: unreadCount
        };
      }).sort((a, b) =>
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );

      const hasChanged = JSON.stringify(currentConversations) !== JSON.stringify(newConversations);
      return hasChanged ? newConversations : prev;
    });
  }, [safePersistedConversations, conversationsLoading]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!history || history.length === 0) return;

    const mapped: Message[] = history.map((m: any) => ({
      id: m.id.toString(),
      chatId: m.chatId,
      content: m.content,
      timestamp: new Date(m.createdAt),
      isFromUser: m.senderId === currentUserId,
      status: m.isRecalled ? 'recalled' : m.isEdited ? 'edited' : m.isRead ? 'read' : 'delivered',
      isRead: m.isRead,
      isEdited: m.isEdited,
      isRecalled: m.isRecalled,
      senderId: m.senderId,
      editHistory: m.editHistory
    }));

    setMessages(mapped);

    // Mark messages as read
    if (selectedConv && currentUserId) {
      markMessagesAsRead({
        chatId: selectedConv.chatId,
        userId: currentUserId
      });
    }
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
          chatId: '',
          peerId: managerId,
          name: 'Property Manager',
          email: '',
          type: 'manager',
          lastMessage: {
            id: 0,
            content: 'Start a conversation...',
            senderId: '',
            createdAt: new Date().toISOString(),
            isRead: true,
            isEdited: false,
            isRecalled: false
          },
          unreadCount: 0
        };
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv.id);
      }
    } else if (autoSelectConversation && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [propertyId, managerId, autoSelectConversation]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const currentConv = conversations.find(conv => conv.id === selectedConversation);
    if (!currentConv) return;

    const messageContent = newMessage;
    setNewMessage(""); // Xóa nội dung tin nhắn trong input

    const tempId = `temp_${Date.now()}`;

    // Tạo tin nhắn tạm thời với trạng thái "sending"
    const userMessage: Message = {
      id: tempId,
      chatId: currentConv.chatId || '',
      content: messageContent,
      timestamp: new Date(),
      isFromUser: true,
      status: 'sent',
      senderId: currentUserId,
      isEdited: false,
      isRecalled: false
    };

    // Cập nhật UI với tin nhắn đang gửi
    setMessages(prev => [...prev, userMessage]);

    try {
      // Gửi tin nhắn qua API
      const result = await sendChatMessage({
        senderId: currentUserId,
        receiverId: currentConv.peerId,
        content: messageContent,
      }).unwrap();

      // Cập nhật trạng thái tin nhắn sau khi gửi thành công
      if (result && result.id) {
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? {
              ...msg,
              id: result.id.toString(),
              chatId: result.chatId || msg.chatId,
              status: 'sent',
              timestamp: result.createdAt ? new Date(result.createdAt) : msg.timestamp
            }
            : msg
        ));

        // Cập nhật thông tin chatId cho cuộc trò chuyện nếu cần
        if (result.chatId && (!currentConv.chatId || currentConv.chatId !== result.chatId)) {
          setConversations(prev => prev.map(conv =>
            conv.id === selectedConversation
              ? { ...conv, chatId: result.chatId }
              : conv
          ));
        }

      }

      // Gửi qua socket nếu muốn
      if (socketRef.current) {
        socketRef.current.emit("chat:send", {
          senderId: currentUserId,
          receiverId: currentConv.peerId,
          content: messageContent,
          chatId: result?.chatId
        });
      }
    } catch (error) {
      console.error('Failed to save message:', error);

      // Đánh dấu tin nhắn bị lỗi
      // setMessages(prev => prev.map(msg =>
      //   msg.id === tempId
      //     ? { ...msg, status: 'error' }
      //     : msg
      // ));
    }
  };

  // Handle editing a message
  const handleEditMessage = async (messageId: string | number, newContent: string) => {
    if (!currentUserId || !newContent.trim()) return;

    try {
      // Optimistic update
      setMessages(prev => prev.map(msg =>
        msg.id.toString() === messageId.toString()
          ? { ...msg, content: newContent, isEdited: true, status: 'edited' }
          : msg
      ));

      // Call API to edit message
      const result = await editChatMessage({
        messageId: Number(messageId),
        userId: currentUserId,
        content: newContent
      }).unwrap();

      // Notify via socket
      if (socketRef.current) {
        socketRef.current.emit("chat:edit", {
          messageId: messageId,
          content: newContent,
          userId: currentUserId
        });
      }

      // toast({
      //   title: "Tin nhắn đã được chỉnh sửa",
      //   description: "Tin nhắn của bạn đã được cập nhật thành công."
      // });
    } catch (error) {
      console.error('Failed to edit message:', error);

      // Revert the optimistic update
      // toast({
      //   title: "Không thể chỉnh sửa tin nhắn",
      //   description: "Đã xảy ra lỗi khi chỉnh sửa tin nhắn. Vui lòng thử lại.",
      //   variant: "destructive"
      // });
    }
  };

  // Handle recalling (deleting for everyone) a message
  const handleRecallMessage = async (messageId: string | number) => {
    if (!currentUserId) return;

    try {
      // Optimistic update
      setMessages(prev => prev.map(msg =>
        msg.id.toString() === messageId.toString()
          ? { ...msg, isRecalled: true, status: 'recalled' }
          : msg
      ));

      // Call API to recall message
      const result = await recallChatMessage({
        messageId: Number(messageId),
        userId: currentUserId
      }).unwrap();

      // Notify via socket
      if (socketRef.current) {
        socketRef.current.emit("chat:recall", {
          messageId: messageId,
          userId: currentUserId
        });
      }

      // toast({
      //   title: "Tin nhắn đã được thu hồi",
      //   description: "Tin nhắn của bạn đã được thu hồi thành công."
      // });
    } catch (error) {
      console.error('Failed to recall message:', error);

      // Revert the optimistic update
      setMessages(prev => prev.map(msg =>
        msg.id.toString() === messageId.toString()
          ? { ...msg, isRecalled: false, status: msg.isEdited ? 'edited' : 'delivered' }
          : msg
      ));

      // toast({
      //   title: "Không thể thu hồi tin nhắn",
      //   description: "Đã xảy ra lỗi khi thu hồi tin nhắn. Vui lòng thử lại.",
      //   variant: "destructive"
      // });
    }
  };

  // Handle deleting a message for current user only
  const handleDeleteMessageForMe = async (messageId: string | number) => {
    if (!currentUserId) return;

    try {
      // Optimistic update - remove from UI
      setMessages(prev => prev.filter(msg => msg.id.toString() !== messageId.toString()));

      // Call API to delete message for current user
      const result = await deleteMessageForMe({
        messageId: Number(messageId),
        userId: currentUserId
      }).unwrap();

      // toast({
      //   title: "Tin nhắn đã được xóa",
      //   description: "Tin nhắn đã được xóa khỏi cuộc trò chuyện của bạn."
      // });
    } catch (error) {
      console.error('Failed to delete message:', error);

      // toast({
      //   title: "Không thể xóa tin nhắn",
      //   description: "Đã xảy ra lỗi khi xóa tin nhắn. Vui lòng thử lại.",
      //   variant: "destructive"
      // });
    }
  };

  // Handle viewing edit history
  const handleViewEditHistory = (messageId: string | number) => {
    setActiveEditHistoryMessageId(Number(messageId));

    // Find message and update its editHistory if we got data from API
    if (editHistory && activeEditHistoryMessageId === Number(messageId)) {
      setMessages(prev => prev.map(msg =>
        msg.id.toString() === messageId.toString()
          ? { ...msg, editHistory: editHistory as unknown as MessageEdit[] }
          : msg
      ));
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);

    // Find conversation
    const conversation = conversations.find(c => c.id === id);
    if (!conversation || !currentUserId) return;

    // Update local state to mark as read
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    ));

    // Mark messages as read in database if there is a valid chatId
    if (conversation.chatId) {
      markMessagesAsRead({
        chatId: conversation.chatId,
        userId: currentUserId
      });
    }
  };

  const handleUserSelect = (user: any) => {
    // Create a new conversation for the selected user
    const newConversation: Conversation = {
      id: user.cognitoId,
      chatId: '', // Will be filled after first message
      peerId: user.cognitoId,
      name: user.name,
      email: user.email,
      type: user.type,
      lastMessage: {
        id: 0,
        content: "Start a new conversation",
        senderId: currentUserId || '',
        createdAt: new Date().toISOString(),
        isRead: true,
        isEdited: false,
        isRecalled: false
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

  // Show loading state until hydrated
  if (!isHydrated) {
    return (
      <div className="h-screen flex bg-gray-50 overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải trò chuyện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden" suppressHydrationWarning={true}>
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
              currentUserId={currentUserId}
              onMessageRead={(messageId) => {
                // Mark message as read locally
                setMessages(prev => prev.map(msg =>
                  msg.id === messageId ? { ...msg, isRead: true } : msg
                ));

                // Mark conversation as read in global state
                markAsRead(selectedConv.id);
              }}
              onRecallMessage={handleRecallMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessageForMe={handleDeleteMessageForMe}
              onViewEditHistory={handleViewEditHistory}
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
                Chọn một cuộc trò chuyện
              </h2>
              <p className="text-gray-500">
                Chọn một cuộc trò chuyện từ thanh bên để bắt đầu
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;