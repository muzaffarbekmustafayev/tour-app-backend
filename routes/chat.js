import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  sendMessage,
  getChatHistory,
  getOwnerInbox,
  markAsRead
} from '../controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// Send message
router.post('/send', sendMessage);

// Get chat history with owner or customer
router.get('/history/:hotelId', getChatHistory);
router.get('/history/:hotelId/:otherUserId', getChatHistory);

// Get inbox for hotel owners
router.get('/owner/inbox', authorize(['HOTEL_OWNER']), getOwnerInbox);

// Mark messages as read
router.post('/read/:hotelId/:otherUserId', markAsRead);

export default router;
