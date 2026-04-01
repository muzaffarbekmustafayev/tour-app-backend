import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, blocked, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, blocked, phone },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    existingUser.blocked = !existingUser.blocked;
    await existingUser.save();

    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHotels = await Hotel.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Revenue from all bookings that are not cancelled
    const bookings = await Booking.find({ status: { $ne: 'cancelled' } });
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const topHotels = await Hotel.find()
      .sort('-rating')
      .limit(5)
      .select('name rating reviewsCount');

    const monthlyBookingsRaw = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalUsers,
      totalHotels,
      totalBookings,
      totalRevenue,
      totalVisitors: Math.floor(totalUsers * 12.5 + 42), // Mock realistic visitors
      topHotels,
      monthlyBookings: monthlyBookingsRaw.map((entry) => ({
        label: `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`,
        count: entry.count
      }))
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .populate('owner', 'name email phone')
      .sort('-createdAt');
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('hotel', 'name city')
      .populate('user', 'name email')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
