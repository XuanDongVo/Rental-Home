import express from 'express';
import { 
  sendMessage, 
  getChatHistory, 
  searchUsers, 
  getConversations, 
  getUserById,
  markMessagesAsRead,
  getUnreadMessageCount
} from '../controllers/chatController';

const router = express.Router();

// Send a message
router.post('/send', sendMessage);

// Get chat history between two users
router.get('/history', getChatHistory);

// Search for users (tenants and managers)
router.get('/users', searchUsers);

// Get conversations for a user
router.get('/conversations/:userId', getConversations);

// Get user by cognito ID
router.get('/user/:cognitoId', getUserById);

// Mark messages as read
router.post('/mark-read', markMessagesAsRead);

// Get unread message count for a user
router.get('/unread-count/:userId', getUnreadMessageCount);

export default router;
