"use client";

import React, { useState, useEffect } from "react";
import { Search, MessageCircle, Users, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchChatUsersQuery } from "@/state/api";
import { cn } from "@/lib/utils";
import { Conversation } from "./types";

// interface Conversation {
//   id: string;
//   peerId: string;
//   name: string;
//   email: string;
//   type: 'tenant' | 'manager';
//   lastMessage: {
//     id: number;
//     content: string;
//     senderId: string;
//     receiverId: string;
//     createdAt: string;
//     isRead: boolean;
//   };
//   unreadCount?: number;
// }

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  searchQuery: string;
  onSelectConversation: (id: string) => void;
  onUserSelect: (user: any) => void;
  onSearchChange: (query: string) => void;
  currentUserId?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversation,
  searchQuery,
  onSelectConversation,
  onUserSelect,
  onSearchChange,
  currentUserId
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Search users when query changes
  const { data: searchData, isLoading: isSearchLoading } = useSearchChatUsersQuery(
    { q: searchQuery, exclude: currentUserId },
    { skip: !searchQuery || searchQuery.length < 2 }
  );

  useEffect(() => {
    if (searchData) {
      setSearchResults(searchData);
    }
  }, [searchData]);

  const handleSearchFocus = () => {
    setIsSearching(true);
  };

  const handleSearchBlur = () => {
    // Delay hiding search results to allow clicking on them
    setTimeout(() => {
      setIsSearching(false);
      onSearchChange("");
    }, 200);
  };

  const handleUserSelectClick = (user: any) => {
    onUserSelect(user);
    setIsSearching(false);
    onSearchChange("");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setIsSearching(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="pl-10"
          />
        </div>
      </div>

      {/* Search Results */}
      {isSearching && searchQuery && (
        <div className="border-b border-gray-200 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              {isSearchLoading ? "Searching..." : "Search Results"}
            </div>
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.cognitoId}
                  className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handleUserSelectClick(user)}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <Badge
                        variant={user.type === 'manager' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {user.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              ))
            ) : (
              !isSearchLoading && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No users found
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "flex items-center p-3 rounded-lg cursor-pointer mb-1 transition-colors",
                  selectedConversation === conversation.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="text-sm">
                    {getInitials(conversation.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={conversation.type === 'manager' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {conversation.type}
                    </Badge>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start a conversation by searching for users above
            </p>
            <Button
              size="sm"
              onClick={() => setIsSearching(true)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Find Users
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;