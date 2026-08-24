import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Attraction from '../models/Attraction.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { NotFoundError } from '../lib/errors.js';

export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, blocked, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role, blocked, phone },
    { new: true, runValidators: true }
  ).select('-password');
  if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');
  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');
  res.json({ message: 'Foydalanuvchi o\'chirildi' });
});

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

export const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');

  user.blocked = !user.blocked;
  await user.save();

  // save() dan keyin password-siz javob qaytarish
  const result = await User.findById(req.params.id).select('-password');
  res.json(result);
});

export const getStatistics = asyncHandler(async (_req, res) => {
  // Parallel so'rovlar — N+1 emas
  const [totalUsers, totalHotels, totalAttractions, topHotels] = await Promise.all([
    User.countDocuments(),
    Hotel.countDocuments(),
    Attraction.countDocuments(),
    Hotel.find().sort('-rating').limit(5).select('name rating reviewsCount'),
  ]);

  res.json({
    totalUsers,
    totalHotels,
    totalAttractions,
    totalVisitors: Math.floor(totalUsers * 12.5 + 42),
    topHotels,
  });
});

export const getAllHotels = asyncHandler(async (_req, res) => {
  const hotels = await Hotel.find()
    .populate('owner', 'name email phone')
    .sort('-createdAt');
  res.json(hotels);
});
