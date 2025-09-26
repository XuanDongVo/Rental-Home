import React from 'react';
import { MoreHorizontal, Trash, Edit, History, RotateCcw } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MessageActionsProps } from './types';

const MessageActions = ({
    message,
    isFromUser,
    onRecall,
    onEdit,
    onDelete,
    onViewHistory,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Tùy chọn tin nhắn</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {isFromUser && !message.isRecalled && (
                    <>
                        <DropdownMenuItem onClick={onEdit} disabled={message.isRecalled}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Chỉnh sửa tin nhắn</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onRecall} className="text-red-600">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            <span>Thu hồi tin nhắn</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem onClick={onDelete}>
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Xóa (chỉ với bạn)</span>
                </DropdownMenuItem>
                {message.isEdited && (
                    <DropdownMenuItem onClick={onViewHistory}>
                        <History className="mr-2 h-4 w-4" />
                        <span>Xem lịch sử chỉnh sửa</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default MessageActions;