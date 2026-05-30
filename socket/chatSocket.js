/**
 * socket/chatSocket.js
 *
 * Yaxshilashlar:
 *  - send_message endi socket ACK qaytaradi — sender optimistic xabarni real bilan almashtiradi
 *  - sender "new_message" ni boshqalarga socket.to() orqali yuboradi (o'ziga emas)
 *  - Online presence: user_online / user_offline eventlari
 *  - get_online_status: muayyan userlarning online/offline holatini so'rash
 */

import { sendMessage, markConversationRead } from '../services/chatService.js';

// Online foydalanuvchilar: userId => Set<socketId>
const onlineUsers = new Map();

export function registerChatSocket(io) {
  io.on('connection', (socket) => {
    const userId = socket.userId;

    // ── Online holati ──────────────────────────────────────────────────────
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    // Boshqa barcha ulanganlarga xabar berish
    socket.broadcast.emit('user_online', { userId });

    // ── Xona boshqaruvi ───────────────────────────────────────────────────
    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) return;
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return;
      socket.leave(`conv:${conversationId}`);
    });

    // ── Xabar yuborish (ACK bilan) ────────────────────────────────────────
    //
    // Client: socket.emit('send_message', { conversationId, content, type, tempId }, (ack) => {...})
    // ACK:    { ok: true, message } | { ok: false, code, message }
    //
    socket.on('send_message', async ({ conversationId, content, type = 'text', tempId }, ack) => {
      const reply = (payload) => { if (typeof ack === 'function') ack(payload); };

      try {
        if (!conversationId || !content?.trim()) {
          return reply({ ok: false, code: 'BAD_REQUEST', message: 'conversationId va content majburiy' });
        }

        const { message, receiverId, conv } = await sendMessage(
          userId, conversationId, content, type,
        );

        // Mongoose doc -> plain object (socket.io JSON serialization uchun)
        const msgData = message.toJSON ? message.toJSON() : message;

        // Sender'ga ACK: optimistic xabarni haqiqiy bilan almashtiradi
        reply({ ok: true, message: msgData });

        // Suhbatdagi BOSHQA foydalanuvchilarga (sender o'zi olmaydi)
        socket.to(`conv:${conversationId}`).emit('new_message', msgData);

        // Qabul qiluvchiga badge yangilanishi (u boshqa suhbatda bo'lsa ham)
        io.to(`user:${receiverId.toString()}`).emit('conversation_update', {
          conversationId,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: conv.unreadCount.get(receiverId.toString()) || 0,
        });
      } catch (err) {
        reply({
          ok: false,
          code: err.code || 'INTERNAL',
          message: err.statusCode ? err.message : 'Xabar yuborishda xato yuz berdi',
        });
        if (!err.statusCode) console.error('[socket:send_message]', err.message);
      }
    });

    // ── Yozish indikatori ─────────────────────────────────────────────────
    socket.on('typing', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit('typing', { conversationId, userId });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit('stop_typing', { conversationId, userId });
    });

    // ── O'qildi belgisi ───────────────────────────────────────────────────
    socket.on('mark_read', async (conversationId) => {
      try {
        if (!conversationId) return;
        await markConversationRead(userId, conversationId);
        io.to(`conv:${conversationId}`).emit('messages_read', { conversationId, userId });
      } catch (err) {
        socket.emit('error', {
          code: err.code || 'INTERNAL',
          message: err.statusCode ? err.message : "O'qildi belgilashda xato",
        });
        if (!err.statusCode) console.error('[socket:mark_read]', err.message);
      }
    });

    // ── Online holat so'rovi ───────────────────────────────────────────────
    // Client: socket.emit('get_online_status', [userId1, userId2], (result) => {...})
    // Result: { [userId]: true|false }
    socket.on('get_online_status', (userIds, ack) => {
      if (typeof ack !== 'function' || !Array.isArray(userIds)) return;
      const result = {};
      for (const id of userIds) {
        result[id] = (onlineUsers.get(id)?.size ?? 0) > 0;
      }
      ack(result);
    });

    // ── Uzilish ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user_offline', { userId });
        }
      }
      if (reason === 'transport error' || reason === 'ping timeout') {
        console.info(`[socket] User ${userId} uzildi: ${reason}`);
      }
    });
  });
}
