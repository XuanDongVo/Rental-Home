// Chat Components
export { default as ChatContainer } from "./ChatContainer";
export { default as ChatSidebar } from "./ChatSidebar";
export { default as ChatHeader } from "./ChatHeader";
export { default as ChatMessages } from "./ChatMessages";
export { default as ChatInput } from "./ChatInput";

// Types
export interface Conversation {
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

export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isFromUser: boolean;
  status?: "sent" | "delivered" | "read";
}
