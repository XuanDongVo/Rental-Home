"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    const { totalUnread, isLoading } = useUnreadMessages();
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.push("/chat");
        }
    };

    const formatUnreadCount = (count: number): string => {
        if (count === 0) return "";
        if (count > 99) return "99+";
        return count.toString();
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`relative text-primary-200 hover:text-white hover:bg-white/10 h-10 w-10 ${className || ''}`}
            onClick={handleClick}
        >
            <MessageCircle className="h-7 w-7" />            {showBadge && !isLoading && totalUnread > 0 && (
                <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                    {formatUnreadCount(totalUnread)}
                </Badge>
            )}

            {showBadge && !isLoading && totalUnread === 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full opacity-50"></span>
            )}
        </Button>
    );
};

export default MessageIcon;
