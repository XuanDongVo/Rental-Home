import express from "express";
import {
  sendMessage,
  getChatHistory,
  searchUsers,
  getConversations,
  getUserById,
  markMessagesAsRead,
  getUnreadMessageCount,
  editMessage,
  recallMessage,
  deleteMessageForMe,
  getMessageEditHistory,
} from "../controllers/chatController";

const router = express.Router();

// Gửi tin nhắn
router.post("/send", sendMessage);

// Lấy lịch sử chat giữa hai người dùng
router.get("/history", getChatHistory);

// Tìm kiếm người dùng (tenant và manager)
router.get("/users", searchUsers);

// Lấy danh sách cuộc hội thoại của người dùng
router.get("/conversations/:userId", getConversations);

// Lấy thông tin người dùng theo cognito ID
router.get("/user/:cognitoId", getUserById);

// Đánh dấu tin nhắn đã đọc
router.post("/mark-read", markMessagesAsRead);

// Lấy số tin nhắn chưa đọc của người dùng
router.get("/unread-count/:userId", getUnreadMessageCount);

// Chỉnh sửa tin nhắn (chỉ người gửi mới có quyền chỉnh sửa)
router.put("/messages/:messageId/edit", editMessage);

// Thu hồi tin nhắn (chỉ người gửi mới có quyền thu hồi)
router.put("/messages/:messageId/recall", recallMessage);

// Xóa tin nhắn cho người dùng hiện tại (không ảnh hưởng đến người khác)
router.put("/messages/:messageId/delete-for-me", deleteMessageForMe);

// Lấy lịch sử chỉnh sửa của tin nhắn
router.get("/messages/:messageId/edit-history", getMessageEditHistory);

export default router;
