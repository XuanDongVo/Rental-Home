import { Request, Response } from "express";
import * as chatService from "../services/chatService";

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: senderId, receiverId, content",
      });
      return;
    }

    if (senderId === receiverId) {
      res.status(400).json({
        success: false,
        message: "Cannot send message to yourself",
      });
      return;
    }

    const message = await chatService.sendMessage(
      senderId,
      receiverId,
      content
    );

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getChatHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
      res.status(400).json({
        success: false,
        message: "Missing required query parameters: user1, user2",
      });
      return;
    }

    const messages = await chatService.getChatHistory(
      user1 as string,
      user2 as string
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error getting chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chat history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q, exclude } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        message: "Missing or invalid query parameter: q",
      });
      return;
    }

    const users = await chatService.searchUsers(q, exclude as string);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getConversations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameter: userId",
      });
      return;
    }

    const conversations = await chatService.getConversations(userId);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversations",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;

    if (!cognitoId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameter: cognitoId",
      });
      return;
    }

    const user = await chatService.getUserById(cognitoId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error getting user by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const markMessagesAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: chatId, userId",
      });
      return;
    }

    const result = await chatService.markMessagesAsRead(chatId, userId);

    res.json({
      success: true,
      data: { updatedCount: result.count },
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUnreadMessageCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameter: userId",
      });
      return;
    }

    const count = await chatService.getUnreadMessageCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    console.error("Error getting unread message count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread message count",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Chỉnh sửa tin nhắn
 */
export const editMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { userId, content } = req.body;

    if (!messageId || !userId || !content) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: messageId, userId, content",
      });
      return;
    }

    const parsedMessageId = parseInt(messageId, 10);
    if (isNaN(parsedMessageId)) {
      res.status(400).json({
        success: false,
        message: "Invalid messageId format",
      });
      return;
    }

    const updatedMessage = await chatService.editMessage(
      parsedMessageId,
      userId,
      content
    );

    res.json({
      success: true,
      data: updatedMessage[1], // Return the updated message from transaction
    });
  } catch (error) {
    console.error("Error editing message:", error);

    if (
      error instanceof Error &&
      error.message === "Không có quyền chỉnh sửa tin nhắn này"
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to edit message",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Thu hồi tin nhắn
 */
export const recallMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!messageId || !userId) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: messageId, userId",
      });
      return;
    }

    const parsedMessageId = parseInt(messageId, 10);
    if (isNaN(parsedMessageId)) {
      res.status(400).json({
        success: false,
        message: "Invalid messageId format",
      });
      return;
    }

    const recalledMessage = await chatService.recallMessage(
      parsedMessageId,
      userId
    );

    res.json({
      success: true,
      data: recalledMessage,
    });
  } catch (error) {
    console.error("Error recalling message:", error);

    if (
      error instanceof Error &&
      error.message === "Không có quyền thu hồi tin nhắn này"
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to recall message",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Xóa tin nhắn cho người dùng hiện tại
 */
export const deleteMessageForMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!messageId || !userId) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: messageId, userId",
      });
      return;
    }

    const parsedMessageId = parseInt(messageId, 10);
    if (isNaN(parsedMessageId)) {
      res.status(400).json({
        success: false,
        message: "Invalid messageId format",
      });
      return;
    }

    const deletedMessage = await chatService.deleteMessageForMe(
      parsedMessageId,
      userId
    );

    res.json({
      success: true,
      data: deletedMessage,
    });
  } catch (error) {
    console.error("Error deleting message for user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Lấy lịch sử chỉnh sửa của tin nhắn
 */
export const getMessageEditHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { userId } = req.query;

    console.log("Request params:", userId);

    if (!messageId || !userId) {
      res.status(400).json({
        success: false,
        message: "Missing required parameters: messageId, userId",
      });
      return;
    }

    const parsedMessageId = parseInt(messageId, 10);
    if (isNaN(parsedMessageId)) {
      res.status(400).json({
        success: false,
        message: "Invalid messageId format",
      });
      return;
    }

    const editHistory = await chatService.getMessageEditHistory(
      parsedMessageId,
      userId as string
    );

    console.log("Edit history fetched:", editHistory);
    res.json({
      success: true,
      data: editHistory,
    });
  } catch (error) {
    console.error("Error getting message edit history:", error);

    if (
      error instanceof Error &&
      error.message === "Không có quyền xem lịch sử chỉnh sửa"
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to get message edit history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
