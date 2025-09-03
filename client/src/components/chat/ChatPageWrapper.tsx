"use client";

import React from "react";
import { useGetAuthUserQuery } from "@/state/api";
import ChatContainer from "@/components/chat/ChatContainer";
import ChatLoadingSpinner from "@/components/chat/ChatLoadingSpinner";
import ChatAuthRequired from "@/components/chat/ChatAuthRequired";
import { useChatParams } from "@/hooks/useChatParams";
import { ChatPageWrapperProps } from "./types";

const ChatPageWrapper: React.FC<ChatPageWrapperProps> = ({
    loadingMessage,
    authRequiredTitle,
    authRequiredButtonText,
    authRequiredRedirectPath,
    className,
    onChatError,
    chatContainerProps = {}
}) => {
    const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery();
    const { propertyId, managerId, shouldAutoSelect } = useChatParams();

    console.log('👤 Auth user:', authUser, 'Loading:', authLoading, 'Error:', authError);

    // Handle authentication error
    if (authError && onChatError) {
        onChatError(authError);
    }

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <ChatLoadingSpinner
                message={loadingMessage}
                className={className}
            />
        );
    }

    // Show auth required if user is not authenticated
    if (!authUser) {
        return (
            <ChatAuthRequired
                title={authRequiredTitle}
                buttonText={authRequiredButtonText}
                redirectPath={authRequiredRedirectPath}
                className={className}
            />
        );
    }

    // Render chat container when authenticated
    return (
        <ChatContainer
            propertyId={propertyId || undefined}
            managerId={managerId || undefined}
            autoSelectConversation={shouldAutoSelect}
            {...chatContainerProps}
        />
    );
};

export default ChatPageWrapper;
