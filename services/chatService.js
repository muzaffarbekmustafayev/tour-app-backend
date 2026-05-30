import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors.js';

export async function sendMessage(senderId, conversationId, content, type = 'text') {
  const trimmed = content?.trim();
  if (!trimmed) throw new BadRequestError("Xabar matni bo'sh bo'lishi mumkin emas");
  if (trimmed.length > 2000) throw new BadRequestError('Xabar 2000 belgidan uzun bo\'lishi mumkin emas');

  const conv = await Conversation.findOne({ _id: conversationId, participants: senderId });
  if (!conv) throw new ForbiddenError("Bu suhbatga xabar yuborish uchun ruxsatingiz yo'q");

  const receiverId = conv.participants.find(p => p.toString() !== senderId.toString());
  if (!receiverId) throw new BadRequestError('Suhbatda qabul qiluvchi topilmadi');

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    hotel: conv.hotel,
    content: trimmed,
    type,
  });

  conv.lastMessage = trimmed;
  conv.lastMessageAt = new Date();
  const prev = conv.unreadCount.get(receiverId.toString()) || 0;
  conv.unreadCount.set(receiverId.toString(), prev + 1);
  await conv.save();

  const populated = await Message.findById(message._id).populate('sender', 'name avatar');
  return { message: populated, receiverId, conv };
}

export async function markConversationRead(userId, conversationId) {
  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) throw new ForbiddenError("Bu suhbatga kirish uchun ruxsatingiz yo'q");

  await Message.updateMany(
    { conversation: conversationId, receiver: userId, read: false },
    { $set: { read: true } },
  );

  conv.unreadCount.set(userId.toString(), 0);
  await conv.save();
  return conv;
}

export async function getUserConversations(userId, { limit = 20, skip = 0 } = {}) {
  const conversations = await Conversation.find({ participants: userId })
    .populate('participants', 'name avatar email role')
    .populate('hotel', 'name images')
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit);

  return conversations.map(conv => ({
    ...conv.toObject(),
    unreadCount: conv.unreadCount?.get?.(userId.toString()) || 0,
  }));
}

export async function getConversationMessages(userId, conversationId, { limit = 30, before } = {}) {
  // Kirish huquqi tekshiruvi
  const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conv) throw new ForbiddenError("Bu suhbatga kirish uchun ruxsatingiz yo'q");

  const filter = { conversation: conversationId };
  if (before) {
    filter._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  // Eng yangi limit ta xabarni olish (desc), keyin asc ga teskari aylantirish
  const raw = await Message.find(filter)
    .populate('sender', 'name avatar')
    .sort({ _id: -1 })
    .limit(limit)
    .lean();

  // Bug fix: reverse() in-place o'zgartiradi — slice() bilan nusxa olamiz
  const messages = raw.slice().reverse(); // oldest → newest

  // Cursor: navbatdagi "load more" uchun eng ESKI xabarning _id
  // (raw[last] = eng eski, chunki raw desc tartibda)
  const nextCursor = raw.length === limit ? raw[raw.length - 1]._id : null;

  // O'qildi belgilash — xato bo'lsa message'larni bloklamamaslik uchun try/catch
  try {
    await Message.updateMany(
      { conversation: conversationId, receiver: userId, read: false },
      { $set: { read: true } },
    );
    conv.unreadCount.set(userId.toString(), 0);
    await conv.save();
  } catch (err) {
    // Log, lekin xato chiqarmaymiz — asosiy maqsad xabarlarni qaytarish
    console.warn('[chatService] markRead failed:', err.message);
  }

  return { messages, nextCursor, hasMore: !!nextCursor };
}

export async function getTotalUnread(userId) {
  // Aggregation'da Mongoose auto-cast ishlamaydi — ObjectId ga o'girish shart
  let userObjectId;
  try {
    userObjectId = new mongoose.Types.ObjectId(userId);
  } catch {
    return 0;
  }

  const result = await Conversation.aggregate([
    { $match: { participants: userObjectId } },
    {
      $project: {
        unread: {
          $ifNull: [
            { $toInt: { $getField: { field: userId.toString(), input: '$unreadCount' } } },
            0,
          ],
        },
      },
    },
    { $group: { _id: null, total: { $sum: '$unread' } } },
  ]);

  return result[0]?.total ?? 0;
}

export async function getOrCreateHotelConversation(userId, hotelId) {
  const Hotel = (await import('../models/Hotel.js')).default;

  const hotel = await Hotel.findById(hotelId).populate('owner', 'name avatar email');
  if (!hotel) throw new NotFoundError('Mehmonxona topilmadi');
  if (!hotel.owner) throw new BadRequestError('Mehmonxona egasi topilmadi');

  const ownerId = hotel.owner._id;
  if (ownerId.toString() === userId.toString()) {
    throw new BadRequestError("O'zingiz bilan suhbat boshlay olmaysiz");
  }

  let conv = await Conversation.findOne({
    hotel: hotelId,
    participants: { $all: [userId, ownerId] },
  })
    .populate('participants', 'name avatar email role')
    .populate('hotel', 'name images');

  if (!conv) {
    const created = await Conversation.create({
      participants: [userId, ownerId],
      hotel: hotelId,
    });
    conv = await Conversation.findById(created._id)
      .populate('participants', 'name avatar email role')
      .populate('hotel', 'name images');
  }

  return conv;
}
