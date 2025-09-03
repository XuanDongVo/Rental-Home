"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatAuthRequiredProps } from "./types";

const ChatAuthRequired: React.FC<ChatAuthRequiredProps> = ({
    title = "Please sign in to access chat",
    buttonText = "Sign In",
    redirectPath = "/signin",
    className = "h-screen flex items-center justify-center bg-gray-50"
}) => {
    const router = useRouter();

    return (
        <div className={className}>
            <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <Button onClick={() => router.push(redirectPath)}>
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};

export default ChatAuthRequired;
