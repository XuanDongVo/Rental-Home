"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGetAuthUserQuery } from "@/state/api";
// Default server URLs
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
import { useRouter } from "next/navigation";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { MessageCircle } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useGetChatHistoryQuery, useGetConversationsQuery } from "@/state/api";

interface Conversation {
    id: string;
    managerName: string;
    propertyName: string;
    lastMessage: string;
    timestamp: Date;
    unreadCount: number;
    avatar?: string;
    managerId: string;
    propertyId: string;
}

interface Message {
    id: string;
    text: string;
    timestamp: Date;
    isFromUser: boolean;
    status?: 'sent' | 'delivered' | 'read';
    isRead?: boolean;
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


    // Default conversations if none provided
    const defaultConversations: Conversation[] = [
        {
            id: '1',
            managerName: 'John Smith',
            propertyName: 'Villa Seaside',
            lastMessage: 'Thank you for your interest! The property is available for viewing.',
            timestamp: new Date(Date.now() - 300000),
            unreadCount: 2,
            managerId: 'manager123',
            propertyId: '1'
        },
        {
            id: '2',
            managerName: 'Maria Garcia',
            propertyName: 'Downtown Apartment',
            lastMessage: 'I can schedule a tour for tomorrow if you\'re available.',
            timestamp: new Date(Date.now() - 3600000),
            unreadCount: 0,
            managerId: 'manager456',
            propertyId: '2'
        },
        {
            id: '3',
            managerName: 'David Johnson',
            propertyName: 'Luxury Condo',
            lastMessage: 'The lease terms are flexible. Let me know your preferences.',
            timestamp: new Date(Date.now() - 86400000),
            unreadCount: 1,
            managerId: 'manager789',
            propertyId: '3'
        }
    ];

    const defaultMessages: Message[] = [
        {
            id: '1',
            text: `Hello! I'm interested in this property. Could you provide more information?`,
            timestamp: new Date(Date.now() - 600000),
            isFromUser: true,
            status: 'read'
        },
        {
            id: '2',
            text: "Hi there! I'd be happy to help you with information about this property. It's a beautiful property with great amenities.",
            timestamp: new Date(Date.now() - 480000),
            isFromUser: false
        },
        {
            id: '3',
            text: "What's the monthly rent and when would it be available?",
            timestamp: new Date(Date.now() - 360000),
            isFromUser: true,
            status: 'read'
        },
        {
            id: '4',
            text: "The monthly rent varies by property type and it will be available from next month. Would you like to schedule a viewing?",
            timestamp: new Date(Date.now() - 300000),
            isFromUser: false
        }
    ];

    // States
    const [conversations, setConversations] = useState<Conversation[]>(
        initialConversations.length > 0 ? initialConversations : defaultConversations
    );
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>(
        initialMessages.length > 0 ? initialMessages : []
    );
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    // Socket ref
    const socketRef = useRef<Socket | null>(null);
    // Socket.io: Kết nối và lắng nghe tin nhắn realtime
    useEffect(() => {
        if (!currentUserId) return;
        socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
        // Join personal room for direct messages
        socketRef.current.emit("join", currentUserId);

        socketRef.current.on("chat:receive", (data: any) => {
            // data: { id?, senderId, receiverId, content, createdAt? }
            // Avoid duplicating the sender's own message (we already appended locally)
            if (data.senderId === currentUserId) {
                // Optionally, update the status of the last local message here
                return;
            }
            setMessages(prev => [
                ...prev,
                {
                    id: (data.id?.toString?.()) || Date.now().toString(),
                    text: data.content,
                    timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
                    isFromUser: false,
                }
            ]);

            // Ensure conversation shows the sender with preview and unread badge
            setConversations(prev => {
                const convId = data.senderId as string;
                const existing = prev.find(c => c.id === convId);
                const now = data.createdAt ? new Date(data.createdAt) : new Date();
                if (existing) {
                    return prev.map(c =>
                        c.id === convId
                            ? {
                                ...c,
                                lastMessage: data.content,
                                timestamp: now,
                                unreadCount: (selectedConversation === convId ? 0 : (c.unreadCount || 0) + 1),
                              }
                            : c
                    );
                }
                const newConv = {
                    id: convId,
                    managerName: 'User',
                    propertyName: '',
                    lastMessage: data.content,
                    timestamp: now,
                    unreadCount: 1,
                    managerId: convId,
                    propertyId: ''
                } as any;
                return [newConv, ...prev];
            });

            // Resolve sender's display name asynchronously
            if (API_BASE && data.senderId) {
                fetch(`${API_BASE}/chat/user/${encodeURIComponent(data.senderId)}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(user => {
                        if (user && user.name) {
                            setConversations(prev => prev.map(c => c.id === data.senderId ? { ...c, managerName: user.name } : c));
                        }
                    })
                    .catch(() => { /* ignore */ });
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [currentUserId]);

    // Auto-select conversation based on URL params
    useEffect(() => {
        // Case 1: Has specific property and manager ID - create/select conversation
        if (propertyId && managerId) {
            console.log('🎯 Auto-selecting conversation for property:', propertyId, 'manager:', managerId);

            const existingConversation = conversations.find(
                conv => conv.propertyId === propertyId && conv.managerId === managerId
            );

            if (existingConversation) {
                console.log('✅ Found existing conversation:', existingConversation.id);
                setSelectedConversation(existingConversation.id);
            } else {
                console.log('🆕 Creating new conversation');
                // Create new conversation
                const newConv: Conversation = {
                    id: Date.now().toString(),
                    managerName: 'Property Manager',
                    propertyName: `Property #${propertyId}`,
                    lastMessage: 'Start a conversation...',
                    timestamp: new Date(),
                    unreadCount: 0,
                    managerId: managerId,
                    propertyId: propertyId
                };
                setConversations(prev => [newConv, ...prev]);
                setSelectedConversation(newConv.id);
            }
        }
        // Case 2: No specific params but auto-select is enabled and we have conversations
        else if (autoSelectConversation && conversations.length > 0 && !selectedConversation && !propertyId && !managerId) {
            console.log('📋 Auto-selecting first conversation');
            setSelectedConversation(conversations[0].id);
        }
        // Case 3: No params - don't auto-select, let user choose
        else if (!propertyId && !managerId && !autoSelectConversation) {
            console.log('👆 Waiting for user to select conversation');
            // Don't auto-select anything
        }
    }, [propertyId, managerId, conversations, selectedConversation, autoSelectConversation]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: newMessage,
            timestamp: new Date(),
            isFromUser: true,
            status: 'sent'
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage("");

        // Gửi tin nhắn realtime qua socket
        if (socketRef.current && currentUserId) {
            // TODO: truyền đúng receiverId từ selectedConv
            const selectedConv = conversations.find(conv => conv.id === selectedConversation);
            socketRef.current.emit("chat:send", {
                senderId: currentUserId,
                receiverId: selectedConv?.managerId || "manager1",
                content: newMessage,
            });
        }

        // Update conversation last message
        setConversations(prev => prev.map(conv =>
            conv.id === selectedConversation
                ? { ...conv, lastMessage: newMessage, timestamp: new Date() }
                : conv
        ));
    };

    const selectedConv = conversations.find(conv => conv.id === selectedConversation);

    // Load persisted conversation list for the sidebar
    const { data: persistedConversations = [] } = useGetConversationsQuery(
        currentUserId ? { userId: currentUserId } : ({} as any),
        { skip: !currentUserId }
    );

    useEffect(() => {
        if (!persistedConversations || persistedConversations.length === 0) return;
        // Merge persisted conversations into local list (avoid duplicates)
        setConversations(prev => {
            const map = new Map(prev.map(c => [c.id, c] as const));
            persistedConversations.forEach(pc => {
                const existing = map.get(pc.peerId);
                const ts = new Date(pc.lastMessage.createdAt);
                const updated = {
                    id: pc.peerId,
                    managerName: pc.name || pc.peerId,
                    propertyName: '',
                    lastMessage: pc.lastMessage.content,
                    timestamp: ts,
                    unreadCount: existing?.unreadCount || 0,
                    managerId: pc.peerId,
                    propertyId: ''
                } as any;
                map.set(pc.peerId, updated);
            });
            // Sort by timestamp desc to resemble inbox ordering
            return Array.from(map.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
    }, [persistedConversations]);

    // Load persisted messages when a conversation is selected
    const peerId = selectedConv?.managerId;
    const { data: history = [], isFetching: historyLoading } = useGetChatHistoryQuery(
        currentUserId && peerId ? { user1: currentUserId, user2: peerId } : ({} as any),
        { skip: !currentUserId || !peerId }
    );

    useEffect(() => {
        if (!history || history.length === 0) return;
        // Map server history to local message format
        const mapped: Message[] = history.map((m) => ({
            id: m.id.toString(),
            text: m.content,
            timestamp: new Date(m.createdAt),
            isFromUser: m.senderId === currentUserId,
            status: 'read'
        }));
        setMessages(mapped);
    }, [history, currentUserId]);

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            {/* Left Sidebar */}
            <ChatSidebar
                conversations={conversations}
                selectedConversation={selectedConversation}
                searchQuery={searchQuery}
                onSelectConversation={(id: string) => {
                    // If selecting by user id from search, create conversation if needed
                    const existing = conversations.find(c => c.id === id);
                    if (!existing) {
                        const newConv = {
                            id,
                            managerName: 'User',
                            propertyName: '',
                            lastMessage: 'Start a conversation...',
                            timestamp: new Date(),
                            unreadCount: 0,
                            managerId: id,
                            propertyId: ''
                        };
                        setConversations(prev => [newConv as any, ...prev]);
                    }
                    setSelectedConversation(id);
                }}
                onSearchChange={setSearchQuery}
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
