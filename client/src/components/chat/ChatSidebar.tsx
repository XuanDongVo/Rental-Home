"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Plus } from "lucide-react";

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

interface ChatSidebarProps {
    conversations: Conversation[];
    selectedConversation: string | null;
    searchQuery: string;
    onSelectConversation: (id: string) => void;
    onSearchChange: (query: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    selectedConversation,
    searchQuery,
    onSelectConversation,
    onSearchChange
}) => {
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

    return (
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
                        onChange={(e) => onSearchChange(e.target.value)}
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
                            onClick={() => onSelectConversation(conversation.id)}
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
    );
};

export default ChatSidebar;
