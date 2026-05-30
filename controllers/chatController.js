import { asyncHandler } from '../lib/asyncHandler.js';
import {
  getUserConversations,
  getTotalUnread,
  getOrCreateHotelConversation,
  getConversationMessages,
  sendMessage,
} from '../services/chatService.js';

// GET /api/chat/conversations
export const getConversations = asyncHandler(async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = Math.max(0,  parseInt(req.query.skip)  || 0);
  const conversations = await getUserConversations(req.user.id, { limit, skip });
  res.json({ data: conversations, limit, skip });
});

// GET /api/chat/conversations/unread  — aggregation bilan, N+1 yo'q
export const getUnreadCount = asyncHandler(async (req, res) => {
  const total = await getTotalUnread(req.user.id);
  res.json({ unread: total });
});

// POST /api/chat/conversations/hotel/:hotelId
export const getOrCreateConversationByHotel = asyncHandler(async (req, res) => {
  const conv = await getOrCreateHotelConversation(req.user.id, req.params.hotelId);
  res.json(conv);
});

// GET /api/chat/conversations/:conversationId/messages?limit=30&before=<cursor>
export const getMessages = asyncHandler(async (req, res) => {
  const limit  = Math.min(100, parseInt(req.query.limit) || 30);
  const before = req.query.before || null;
  const result = await getConversationMessages(req.user.id, req.params.conversationId, { limit, before });
  res.json(result);
});

// POST /api/chat/messages
export const sendMessageRest = asyncHandler(async (req, res) => {
  const { conversationId, content, type } = req.body;
  const { message } = await sendMessage(req.user.id, conversationId, content, type);
  res.status(201).json(message);
});
