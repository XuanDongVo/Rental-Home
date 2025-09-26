"use client";

import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSafeDateFormat } from "@/hooks/useHydration";
import MessageActions from "./MessageActions";
import { Message, Conversation } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessagesProps {
  messages: Message[];
  conversation: Conversation;
  isTyping?: boolean;
  currentUserId?: string;
  onMessageRead?: (messageId: string | number) => void;
  onRecallMessage?: (messageId: string | number) => void;
  onEditMessage?: (messageId: string | number, newContent: string) => void;
  onDeleteMessageForMe?: (messageId: string | number) => void;
  onViewEditHistory?: (messageId: string | number) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  conversation,
  isTyping = false,
  currentUserId,
  onMessageRead,
  onRecallMessage,
  onEditMessage,
  onDeleteMessageForMe,
  onViewEditHistory
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { formatTime } = useSafeDateFormat();
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showEditHistory, setShowEditHistory] = useState<Message | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = (message: Message) => {
    if (message.isRecalled) return '↩️';

    switch (message.status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'edited':
        return '✎';
      default:
        return '';
    }
  };

  const getStatusColor = (message: Message) => {
    if (message.isRecalled) return 'text-gray-400';

    switch (message.status) {
      case 'sent':
        return 'text-gray-400';
      case 'delivered':
        return 'text-gray-400';
      case 'read':
        return 'text-blue-500';
      case 'edited':
        return 'text-amber-500';
      default:
        return 'text-gray-400';
    }
  };

  const handleEditSubmit = () => {
    if (editingMessage && onEditMessage && editContent.trim()) {
      onEditMessage(editingMessage.id, editContent);
      setEditingMessage(null);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 text-sm">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isFromUser = message.isFromUser || (currentUserId && message.senderId === currentUserId);
              const showAvatar = true;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isFromUser ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Avatar for received messages */}
                  {!isFromUser && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="text-xs bg-gray-200">
                        {getInitials(conversation.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Spacer for sent messages */}
                  {isFromUser && showAvatar && (
                    <div className="w-8" />
                  )}

                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl group relative",
                      message.isRecalled
                        ? "bg-gray-200 text-gray-500 italic"
                        : isFromUser
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                    )}
                  >
                    {/* Message actions dropdown */}
                    <div className={cn(
                      "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    )}>
                      <MessageActions
                        message={message}
                        isFromUser={isFromUser}
                        onRecall={() => onRecallMessage && onRecallMessage(message.id)}
                        onEdit={() => {
                          setEditingMessage(message);
                          setEditContent(message.content);
                        }}
                        onDelete={() => onDeleteMessageForMe && onDeleteMessageForMe(message.id)}
                        onViewHistory={() => onViewEditHistory && onViewEditHistory(message.id)}
                      />
                    </div>

                    <div className="text-sm leading-relaxed">
                      {message.isRecalled
                        ? "Tin nhắn đã bị thu hồi"
                        : message.content}
                    </div>

                    <div className={cn(
                      "flex items-center gap-1 mt-1 text-xs",
                      isFromUser ? "text-blue-100" : "text-gray-500"
                    )}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.isEdited && !message.isRecalled && (
                        <span className="text-xs">(đã chỉnh sửa)</span>
                      )}
                      {isFromUser && (
                        <span className={cn("text-xs ml-1", getStatusColor(message))}>
                          {getStatusIcon(message)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Avatar for sent messages */}
                  {isFromUser && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="text-xs bg-blue-500 text-white">
                        Me
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Spacer for received messages */}
                  {!isFromUser && showAvatar && (
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

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tin nhắn</DialogTitle>
            <DialogDescription>
              Chỉnh sửa nội dung tin nhắn của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Nhập nội dung mới"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingMessage(null)}>Hủy</Button>
            <Button onClick={handleEditSubmit}>Lưu thay đổi</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit History Dialog */}
      {showEditHistory && (
        <Dialog open={!!showEditHistory} onOpenChange={(open) => !open && setShowEditHistory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lịch sử chỉnh sửa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {showEditHistory.editHistory && showEditHistory.editHistory.length > 0 ? (
                showEditHistory.editHistory.map((edit, index) => (
                  <div key={edit.id} className="p-3 border rounded-md">
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(edit.editedAt).toLocaleString()}
                    </div>
                    <div className="text-sm">{edit.previousContent}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Không có lịch sử chỉnh sửa
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ChatMessages;