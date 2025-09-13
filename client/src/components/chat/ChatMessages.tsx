"use client";

import React, { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface ChatMessagesProps {
  messages: Message[];
  conversation: Conversation;
  isTyping?: boolean;
  onMessageRead?: (messageId: string | number) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  conversation,
  isTyping = false,
  onMessageRead
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'sent':
        return 'text-gray-400';
      case 'delivered':
        return 'text-gray-400';
      case 'read':
        return 'text-blue-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-sm">
              No messages yet. Start the conversation!
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isFirstMessage = index === 0;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar = !prevMessage || 
              prevMessage.isFromUser !== message.isFromUser ||
              (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) > 300000; // 5 minutes

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.isFromUser ? "justify-end" : "justify-start"
                )}
              >
                {/* Avatar for received messages */}
                {!message.isFromUser && showAvatar && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs bg-gray-200">
                      {getInitials(conversation.name)}
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Spacer for sent messages */}
                {message.isFromUser && showAvatar && (
                  <div className="w-8" />
                )}

                <div
                  className={cn(
                    "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                    message.isFromUser
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  )}
                >
                  <div className="text-sm leading-relaxed">
                    {message.content}
                  </div>
                  
                  <div className={cn(
                    "flex items-center justify-end gap-1 mt-1 text-xs",
                    message.isFromUser ? "text-blue-100" : "text-gray-500"
                  )}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.isFromUser && (
                      <span className={cn("text-xs", getStatusColor(message.status))}>
                        {getStatusIcon(message.status)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Avatar for sent messages */}
                {message.isFromUser && showAvatar && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs bg-blue-500 text-white">
                      Me
                    </AvatarFallback>
                  </Avatar>
                )}

                {/* Spacer for received messages */}
                {!message.isFromUser && showAvatar && (
                  <div className="w-8" />
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarFallback className="text-xs bg-gray-200">
                {getInitials(conversation.name)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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