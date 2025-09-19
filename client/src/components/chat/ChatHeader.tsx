"use client";

import React from "react";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
  showBackButton = false
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusText = (type: 'tenant' | 'manager') => {
    return type === 'manager' ? 'Property Manager' : 'Tenant';
  };

  const getStatusColor = (type: 'tenant' | 'manager') => {
    return type === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm">
              {getInitials(conversation.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {conversation.name}
              </h3>
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getStatusColor(conversation.type))}
              >
                {getStatusText(conversation.type)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {conversation.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Voice call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Video call"
          >
            <Video className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;