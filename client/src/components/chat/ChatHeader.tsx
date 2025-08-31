"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";

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
    return (
        <div className="p-4 border-b bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
                {showBackButton && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}

                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary-600 text-white">
                        {conversation.managerName.charAt(0)}
                    </AvatarFallback>
                </Avatar>

                <div>
                    <h2 className="font-semibold">{conversation.managerName}</h2>
                    <p className="text-sm text-gray-600">{conversation.propertyName}</p>
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
    );
};

export default ChatHeader;
