"use client";

import React, { useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
    id: string;
    text: string;
    timestamp: Date;
    isFromUser: boolean;
    status?: 'sent' | 'delivered' | 'read';
}

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

interface ChatMessagesProps {
    messages: Message[];
    conversation: Conversation;
    isTyping?: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    conversation,
    isTyping = false
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
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
                                        {conversation.managerName.charAt(0)}
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
                                    {conversation.managerName.charAt(0)}
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
    );
};

export default ChatMessages;
