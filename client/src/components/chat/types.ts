export interface Conversation {
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

export interface Message {
  id: string | number;
  content: string;
  timestamp: Date;
  isFromUser: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isRead?: boolean;
  senderId?: string;
  receiverId?: string;
}

export interface ChatUser {
  type: 'tenant' | 'manager';
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
  onMessageRead?: (messageId: string | number) => void;
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