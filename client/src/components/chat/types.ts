export interface Conversation {
  id: string;
  chatId: string; // Thêm trường chatId
  peerId: string;
  name: string;
  email: string;
  type: "tenant" | "manager";
  lastMessage: {
    id: number;
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
    isEdited: boolean; // Thêm trạng thái đã chỉnh sửa
    isRecalled: boolean; // Thêm trạng thái đã thu hồi
  };
  unreadCount?: number;
}

export interface Message {
  id: string | number;
  chatId: string; // Thêm trường chatId
  content: string;
  timestamp: Date;
  isFromUser: boolean;
  status?: "sent" | "delivered" | "read" | "edited" | "recalled"; // Thêm trạng thái mới
  isRead?: boolean;
  isEdited?: boolean; // Thêm trạng thái đã chỉnh sửa
  isRecalled?: boolean; // Thêm trạng thái đã thu hồi
  senderId?: string;
  editHistory?: MessageEdit[]; // Lịch sử chỉnh sửa
}

export interface MessageEdit {
  id: number;
  messageId: number;
  previousContent: string;
  editedAt: string;
}

export interface ChatUser {
  type: "tenant" | "manager";
  id: number;
  name: string;
  email: string;
  cognitoId: string;
}

export interface ChatPageWrapperProps {
  loadingMessage?: string;
  authRequiredTitle?: string;
  authRequiredButtonText?: string;
  authRequiredRedirectPath?: string;
  className?: string;
  onChatError?: (error: any) => void;
  chatContainerProps?: any;
}

export interface ChatContainerProps {
  initialConversations?: Conversation[];
  initialMessages?: Message[];
  propertyId?: string;
  managerId?: string;
  autoSelectConversation?: boolean;
}

export interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  searchQuery: string;
  onSelectConversation: (id: string) => void;
  onUserSelect: (user: any) => void;
  onSearchChange: (query: string) => void;
  currentUserId?: string;
}

export interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  showBackButton?: boolean;
}

export interface ChatMessagesProps {
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

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface ChatAuthRequiredProps {
  title?: string;
  buttonText?: string;
  redirectPath?: string;
  onSignIn?: () => void;
  className?: string;
}

export interface ChatLoadingSpinnerProps {
  message?: string;
  className?: string;
}

// export interface MessageActionsProps {
//   message: Message;
//   isFromUser: boolean;
//   onRecall: () => void;
//   onEdit: () => void;
//   onDelete: () => void;
//   onViewHistory: () => void;
// }
