import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getConversations,
  getUnreadCount,
  getOrCreateConversationByHotel,
  getMessages,
  sendMessageRest,
} from '../controllers/chatController.js';

const router = express.Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/conversations/unread', getUnreadCount);
router.post('/conversations/hotel/:hotelId', getOrCreateConversationByHotel);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/messages', sendMessageRest);

export default router;
