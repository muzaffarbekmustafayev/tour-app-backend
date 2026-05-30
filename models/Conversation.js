import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  // Suhbat qatnashchilari: [customerId, hotelOwnerId]
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  // Har bir foydalanuvchi uchun o'qilmagan xabarlar soni
  unreadCount: { type: Map, of: Number, default: {} },
}, { timestamps: true });

conversationSchema.index({ participants: 1, hotel: 1 });

export default mongoose.model('Conversation', conversationSchema);
