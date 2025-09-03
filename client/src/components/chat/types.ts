// Types cho Chat components - chỉ giữ lại những gì thực sự được sử dụng

// Interface này đã được định nghĩa trong useChatParams.ts, không cần duplicate
// export interface ChatParams được moved vào useChatParams.ts

export interface ChatLoadingSpinnerProps {
  message?: string;
  className?: string;
}

export interface ChatAuthRequiredProps {
  title?: string;
  buttonText?: string;
  redirectPath?: string;
  className?: string;
}

export interface ChatPageWrapperProps {
  loadingMessage?: string;
  authRequiredTitle?: string;
  authRequiredButtonText?: string;
  authRequiredRedirectPath?: string;
  className?: string;
  onChatError?: (error: any) => void;
  chatContainerProps?: Record<string, any>;
}
