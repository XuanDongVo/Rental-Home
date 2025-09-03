"use client";

import React from "react";
import { ChatLoadingSpinnerProps } from "./types";

const ChatLoadingSpinner: React.FC<ChatLoadingSpinnerProps> = ({
    message = "Loading chat...",
    className = "h-screen flex items-center justify-center bg-gray-50"
}) => {
    return (
        <div className={className}>
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default ChatLoadingSpinner;
