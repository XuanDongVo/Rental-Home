"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onKeyPress?: (e: React.KeyboardEvent) => void;
    disabled?: boolean;
    placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    onKeyPress,
    disabled = false,
    placeholder = "Type a message..."
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
        onKeyPress?.(e);
    };

    return (
        <div className="p-4 bg-white border-t flex-shrink-0">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        className="flex-1 rounded-full"
                        disabled={disabled}
                    />
                    <Button
                        onClick={onSend}
                        disabled={!value.trim() || disabled}
                        className="bg-primary-600 hover:bg-primary-700 rounded-full h-10 w-10 p-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
};

export default ChatInput;
