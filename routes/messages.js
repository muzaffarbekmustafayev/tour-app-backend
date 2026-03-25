import express from 'express';
import { getConversationByBooking, sendMessage, markAsRead } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // Ensure all messaging routes are protected

// Get all messages for a specific booking
router.get('/:bookingId', getConversationByBooking);

// Send a new message
router.post('/', sendMessage);

// Mark messages as read
router.patch('/:bookingId/read', markAsRead);

export default router;
