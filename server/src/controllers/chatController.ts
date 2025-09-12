import { Request, Response } from 'express';
import * as chatService from '../services/chatService';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { senderId, receiverId, content } = req.body;
    if (!senderId || !receiverId || !content) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    const message = await chatService.sendMessage(senderId, receiverId, content);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error });
  }
};

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      res.status(400).json({ message: 'Missing user ids' });
      return;
    }
    const messages = await chatService.getChatHistory(user1 as string, user2 as string);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get chat history', error });
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const exclude = (req.query.exclude as string) || undefined;
    const results = await chatService.searchUsers(q, exclude);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search users', error });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || '';
    if (!userId) {
      res.status(400).json({ message: 'Missing userId' });
      return;
    }
    const result = await chatService.getConversations(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get conversations', error });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const cognitoId = (req.params.cognitoId as string) || '';
    if (!cognitoId) {
      res.status(400).json({ message: 'Missing cognitoId' });
      return;
    }
    const user = await chatService.getUserById(cognitoId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user', error });
  }
}; 