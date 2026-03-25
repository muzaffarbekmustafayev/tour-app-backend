import Message from '../models/Message.js';
import Booking from '../models/Booking.js';

export const getConversationByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Check if booking exists
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name _id role')
      .populate({
         path: 'hotel',
         select: 'name owner',
         populate: { path: 'owner', select: 'name _id role' }
      });
      
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Validate if current user is part of the booking (either customer or hotel owner)
    // For simplicity, we assume they are authorized if they request it, but we can tighten it.

    const messages = await Message.find({ bookingId })
      .populate('sender', 'name _id role')
      .populate('receiver', 'name _id role')
      .sort('createdAt');
      
    res.json({ booking, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { bookingId, receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!content || !bookingId || !receiverId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newMessage = new Message({
      bookingId,
      sender: senderId,
      receiver: receiverId,
      content
    });

    const savedMessage = await newMessage.save();
    
    // Populate sender info for real-time sending
    await savedMessage.populate('sender', 'name _id role');

    // Emit to active booking room users
    const io = req.app.get('io');
    io.to(`booking_${bookingId}`).emit('receive_message', savedMessage);
    
    // Emit push notification to absolute receiver if they are elsewhere in app
    io.to(`user_${receiverId}`).emit('push_notification', {
      title: `Yangi xabar: ${savedMessage.sender.name}`,
      body: content.length > 30 ? content.substring(0, 30) + '...' : content,
      bookingId
    });

    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id; // Receiver is current user
    
    await Message.updateMany(
      { bookingId, receiver: userId, read: false },
      { $set: { read: true } }
    );
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
