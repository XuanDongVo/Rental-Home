"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
// import { ChatContainer } from "@/components/chat";

// Test direct import
import ChatContainer from "@/components/chat/ChatContainer";

const ChatPage = () => {
    console.log('🎯 ChatPage rendering...');

    return (
        <div className="h-screen flex items-center justify-center bg-blue-100">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-blue-600">Chat Page Test</h1>
                <p className="text-blue-500 mt-4">Direct render without components</p>
            </div>
        </div>
    );
};

/*
const ChatPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: authUser, isLoading: authLoading, error: authError } = useGetAuthUserQuery();

    // Get URL params
    const propertyId = searchParams?.get('property');
    const managerId = searchParams?.get('manager');

    console.log('🔗 Chat page URL params:', { propertyId, managerId });
    console.log('👤 Auth user:', authUser, 'Loading:', authLoading, 'Error:', authError);

    // Determine auto-select behavior based on URL params
    const hasUrlParams = !!(propertyId && managerId);
    const shouldAutoSelect = hasUrlParams; // Only auto-select if coming from property page

    console.log('⚙️ Chat logic:', { hasUrlParams, shouldAutoSelect });

    // Show loading while auth is being checked
    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading chat...</p>
                </div>
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h2 className="text-2xl font-bold mb-4">Please sign in to access chat</h2>
                    <Button onClick={() => router.push('/signin')}>
                        Sign In
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <ChatContainer
            propertyId={propertyId || undefined}
            managerId={managerId || undefined}
            autoSelectConversation={shouldAutoSelect}
        />
    );
};

export default ChatPage;
*/