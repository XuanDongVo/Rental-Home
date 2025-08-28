"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Send,
    Phone,
    Video,
    MoreVertical,
    Search,
    MessageCircle,
    ArrowLeft,
    Plus
} from "lucide-react";

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
}

const ChatPage = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: authUser } = useGetAuthUserQuery();

    // Get URL params
    const propertyId = searchParams?.get('property');
    const managerId = searchParams?.get('manager');


    // States
    const [conversations, setConversations] = useState<Conversation[]>([
        {
            id: '1',
            managerName: 'John Smith',
            propertyName: 'Villa Seaside',
            lastMessage: 'Thank you for your interest! The property is available for viewing.',
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
            unreadCount: 2,
            managerId: 'manager123',
            propertyId: '1'
        },
        {
            id: '2',
            managerName: 'Maria Garcia',
            propertyName: 'Downtown Apartment',
            lastMessage: 'I can schedule a tour for tomorrow if you\'re available.',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            unreadCount: 0,
            managerId: 'manager456',
            propertyId: '2'
        },
        {
            id: '3',
            managerName: 'David Johnson',
            propertyName: 'Luxury Condo',
            lastMessage: 'The lease terms are flexible. Let me know your preferences.',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            unreadCount: 1,
            managerId: '697af53c-f061-7030-0d4a-f729a2dc2da1',
            propertyId: '3'
        }
    ]);

    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Hello! I'm interested in this property. Could you provide more information?`,
            timestamp: new Date(Date.now() - 600000), // 10 minutes ago
            isFromUser: true,
            status: 'read'
        },
        {
            id: '2',
            text: "Hi there! I'd be happy to help you with information about this property. It's a beautiful property with great amenities.",
            timestamp: new Date(Date.now() - 480000), // 8 minutes ago
            isFromUser: false
        },
        {
            id: '3',
            text: "What's the monthly rent and when would it be available?",
            timestamp: new Date(Date.now() - 360000), // 6 minutes ago
            isFromUser: true,
            status: 'read'
        },
        {
            id: '4',
            text: "The monthly rent varies by property type and it will be available from next month. Would you like to schedule a viewing?",
            timestamp: new Date(Date.now() - 300000), // 5 minutes ago
            isFromUser: false
        }
    ]);

    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-select conversation based on URL params
    useEffect(() => {

        if (propertyId && managerId) {
            const existingConversation = conversations.find(
                conv => conv.propertyId === propertyId && conv.managerId === managerId
            );

            if (existingConversation) {
                setSelectedConversation(existingConversation.id);
            } else {
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
        } else if (conversations.length > 0 && !selectedConversation) {
            setSelectedConversation(conversations[0].id);
        }
    }, [propertyId, managerId, conversations, selectedConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

        // Update conversation last message
        setConversations(prev => prev.map(conv =>
            conv.id === selectedConversation
                ? { ...conv, lastMessage: newMessage, timestamp: new Date() }
                : conv
        ));

        // Simulate typing indicator
        setIsTyping(true);

        // Simulate manager response after 2 seconds
        setTimeout(() => {
            setIsTyping(false);
            const managerResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "Thank you for your message! I'll get back to you with more details shortly.",
                timestamp: new Date(),
                isFromUser: false
            };
            setMessages(prev => [...prev, managerResponse]);

            // Update conversation
            setConversations(prev => prev.map(conv =>
                conv.id === selectedConversation
                    ? { ...conv, lastMessage: managerResponse.text, timestamp: new Date() }
                    : conv
            ));

        }, 2000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatLastMessageTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return `${Math.floor(diff / 86400000)}d`;
    };

    const filteredConversations = conversations.filter(conv =>
        conv.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedConv = conversations.find(conv => conv.id === selectedConversation);

    if (!authUser) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-2xl font-bold mb-4">Please sign in to access chat</h2>
                    <Button onClick={() => router.push('/signin')}>
                        Sign In
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            {/* Left Sidebar - Conversations List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold">Messages</h1>
                        <Button variant="ghost" size="sm" className="rounded-full">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2">
                        {filteredConversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                onClick={() => setSelectedConversation(conversation.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${selectedConversation === conversation.id
                                    ? 'bg-primary-100 border border-primary-200'
                                    : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="bg-primary-600 text-white">
                                                {conversation.managerName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Online indicator */}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-sm truncate">
                                                {conversation.managerName}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {formatLastMessageTime(conversation.timestamp)}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-600 mb-1 truncate">
                                            {conversation.propertyName}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 truncate flex-1">
                                                {conversation.lastMessage}
                                            </p>
                                            {conversation.unreadCount > 0 && (
                                                <span className="ml-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredConversations.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No conversations found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {selectedConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-white flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="lg:hidden"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>

                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary-600 text-white">
                                        {selectedConv.managerName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <h2 className="font-semibold">{selectedConv.managerName}</h2>
                                    <p className="text-sm text-gray-600">{selectedConv.propertyName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="rounded-full">
                                    <Phone className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="rounded-full">
                                    <Video className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="rounded-full">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            <div className="space-y-4 max-w-4xl mx-auto">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex items-end gap-2 max-w-[70%] ${message.isFromUser ? 'flex-row-reverse' : 'flex-row'
                                            }`}>
                                            {!message.isFromUser && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-gray-400 text-white text-xs">
                                                        {selectedConv.managerName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className={`p-3 rounded-2xl ${message.isFromUser
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-white text-gray-900 shadow-sm border'
                                                }`}>
                                                <p className="text-sm leading-relaxed">{message.text}</p>

                                                <div className={`flex items-center gap-1 mt-1 ${message.isFromUser ? 'justify-end' : 'justify-start'
                                                    }`}>
                                                    <span className={`text-xs ${message.isFromUser ? 'text-primary-200' : 'text-gray-500'
                                                        }`}>
                                                        {formatTime(message.timestamp)}
                                                    </span>
                                                    {message.isFromUser && message.status && (
                                                        <span className={`text-xs ml-1 ${message.status === 'read' ? 'text-blue-300' :
                                                            message.status === 'delivered' ? 'text-primary-200' : 'text-primary-300'
                                                            }`}>
                                                            {message.status === 'read' ? '✓✓' :
                                                                message.status === 'delivered' ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex items-end gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-gray-400 text-white text-xs">
                                                    {selectedConv.managerName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="bg-white p-3 rounded-2xl shadow-sm border">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-white border-t flex-shrink-0">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center gap-3">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-full"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                        className="bg-primary-600 hover:bg-primary-700 rounded-full h-10 w-10 p-0"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Press Enter to send, Shift+Enter for new line
                                </p>
                            </div>
                        </div>
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

export default ChatPage;