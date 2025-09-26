"use client";

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { cn } from '@/lib/utils';
import { useGetUnreadMessageCountQuery } from '@/state/api';
import { useGetAuthUserQuery } from '@/state/api';


interface MessageIconProps {
  className?: string;
  showBadge?: boolean;
  onClick?: () => void;
}

const MessageIcon: React.FC<MessageIconProps> = ({
  className,
  showBadge = true,
  onClick
}) => {
  // const { totalUnread, isLoading } = useUnreadMessages();

  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  console.log("Auth User in MessageIcon:", authUser);
  const { data: totalUnread, isLoading } = useGetUnreadMessageCountQuery(authUser?.cognitoInfo.userId as string);
  console.log("Total Unread in MessageIcon:", totalUnread);
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push('/chat');
    }
  };

  const formatUnreadCount = (count: number): string => {
    if (count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          "p-2 rounded-lg hover:bg-gray-100 transition-colors",
          className
        )}
        title="Messages"
      >
        <MessageCircle className="h-6 w-6 text-gray-600" />
      </button>

      {showBadge && typeof totalUnread?.unreadCount === 'number' && totalUnread.unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {formatUnreadCount(totalUnread.unreadCount)}
        </div>
      )}

      {isLoading && (
        <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default MessageIcon;