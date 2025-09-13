"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
  disabled = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
      }
    }
  };

  const handleSend = () => {
    if (value.trim()) {
      onSend();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 flex-shrink-0"
            disabled={disabled}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Message input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[40px] max-h-32 resize-none pr-12"
              rows={1}
            />
            
            {/* Emoji button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 bottom-2 h-6 w-6 p-0"
              disabled={disabled}
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="h-10 w-10 p-0 flex-shrink-0"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Helper text */}
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInput;