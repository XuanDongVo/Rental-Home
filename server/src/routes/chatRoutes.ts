import express from 'express';
import { sendMessage, getChatHistory, searchUsers, getConversations, getUserById } from '../controllers/chatController';

const router = express.Router();

router.post('/send', sendMessage);
router.get('/history', getChatHistory);
router.get('/users', searchUsers);
router.get('/conversations', getConversations);
router.get('/user/:cognitoId', getUserById);

export default router;
