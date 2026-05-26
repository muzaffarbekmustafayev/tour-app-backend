import Message from '../models/Message.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { hotelId, receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!hotelId || !content) {
      return res.status(400).json({ message: "Mehmonxona ID si va xabar matni bo'lishi shart" });
    }

    let finalReceiverId = receiverId;

    // If receiverId is not provided, find the hotel and send to the owner
    if (!finalReceiverId) {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Mehmonxona topilmadi" });
      }
      if (!hotel.owner) {
        return res.status(400).json({ message: "Bu mehmonxonaning egasi aniqlanmadi" });
      }
      finalReceiverId = hotel.owner;
    }

    // A user cannot chat with themselves
    if (senderId === finalReceiverId.toString()) {
      return res.status(400).json({ message: "O'zingizga xabar yubora olmaysiz" });
    }

    const message = new Message({
      sender: senderId,
      receiver: finalReceiverId,
      hotel: hotelId,
      content: content.trim()
    });

    await message.save();

    // Populate sender and receiver for immediate UI update if needed
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get chat history with a specific other user (or automatically resolve hotel owner)
export const getChatHistory = async (req, res) => {
  try {
    const { hotelId, otherUserId } = req.params;
    const currentUserId = req.user.id;
    let partnerId = otherUserId;

    // If otherUserId is not provided, and user is a customer, find the hotel owner
    if (!partnerId || partnerId === 'undefined') {
      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return res.status(404).json({ message: "Mehmonxona topilmadi" });
      }
      partnerId = hotel.owner;
    }

    if (!partnerId) {
      return res.status(400).json({ message: "Suhbatdosh topilmadi" });
    }

    const messages = await Message.find({
      hotel: hotelId,
      $or: [
        { sender: currentUserId, receiver: partnerId },
        { sender: partnerId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    // Mark all incoming messages in this chat as read
    await Message.updateMany(
      { hotel: hotelId, sender: partnerId, receiver: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active conversations for hotel owners (Inbox)
export const getOwnerInbox = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Find all messages involving the owner
    const messages = await Message.find({
      $or: [{ sender: ownerId }, { receiver: ownerId }]
    })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .populate('hotel', 'name images')
    .sort({ createdAt: -1 });

    const conversationsMap = new Map();

    for (const msg of messages) {
      if (!msg.hotel) continue;

      const otherUser = msg.sender._id.toString() === ownerId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      const key = `${msg.hotel._id}_${otherUser._id}`;

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          id: key,
          hotel: {
            _id: msg.hotel._id,
            name: msg.hotel.name,
            image: msg.hotel.images && msg.hotel.images.length > 0 ? msg.hotel.images[0] : null
          },
          customer: {
            _id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email
          },
          lastMessage: {
            content: msg.content,
            sender: msg.sender._id,
            createdAt: msg.createdAt,
            isRead: msg.isRead
          },
          unreadCount: 0
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());

    // Calculate unread count for each conversation
    for (const conv of conversations) {
      const count = await Message.countDocuments({
        hotel: conv.hotel._id,
        sender: conv.customer._id,
        receiver: ownerId,
        isRead: false
      });
      conv.unreadCount = count;
    }

    // Sort by latest message
    conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { hotelId, otherUserId } = req.params;
    const currentUserId = req.user.id;

    await Message.updateMany(
      { hotel: hotelId, sender: otherUserId, receiver: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
