import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatAuthRequiredProps } from "./types";

const ChatAuthRequired: React.FC<ChatAuthRequiredProps> = ({
    title = "Please sign in to access chat",
    buttonText = "Sign In",
    redirectPath = "/auth/signin",
    onSignIn,
    className
}) => {
    const handleSignIn = () => {
        if (onSignIn) {
            onSignIn();
        } else {
            window.location.href = redirectPath;
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${className || ''}`}>
            <div className="mb-6">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
                {title}
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-md">
                You need to be signed in to access the chat feature. 
                Sign in to start conversations with other users.
            </p>
            
            <Button 
                onClick={handleSignIn}
                className="px-8 py-2"
                size="lg"
            >
                {buttonText}
            </Button>
        </div>
    );
};

export default ChatAuthRequired;