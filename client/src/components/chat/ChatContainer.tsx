"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { MessageCircle } from "lucide-react";

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

    console.log('🎯 ChatContainer props:', {
        propertyId,
        managerId,
        autoSelectConversation,
        initialConversations: initialConversations.length,
        initialMessages: initialMessages.length
    });

    // Simple test return to check if component loads
    console.log('🚀 ChatContainer rendering...');

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
        initialMessages.length > 0 ? initialMessages : defaultMessages
    );
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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

    const selectedConv = conversations.find(conv => conv.id === selectedConversation);

    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            {/* Left Sidebar */}
            <ChatSidebar
                conversations={conversations}
                selectedConversation={selectedConversation}
                searchQuery={searchQuery}
                onSelectConversation={setSelectedConversation}
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
