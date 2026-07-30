import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../lib/errors.js';

/** Token yaratish yordamchi funksiyasi */
const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const addFavorite = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { favorites: req.params.hotelId } });
  res.json({ message: 'Added to favorites' });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $pull: { favorites: req.params.hotelId } });
  res.json({ message: 'Removed from favorites' });
});

export const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('favorites');
  const validFavorites = (user.favorites || []).filter(fav => fav != null);
  res.json(validFavorites);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');
  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, profileImage },
    { new: true, runValidators: true }
  ).select('-password');
  res.json(user);
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError('name, email va password majburiy');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError("Bu email allaqachon ro'yxatdan o'tgan");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    role: role || 'CUSTOMER',
    phone,
  });

  await user.save();

  const token = signToken({ id: user._id, role: user.role });

  res.status(201).json({
    token,
    user: {
      _id:   user._id,
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
});

/**
 * Google OAuth — access_token yordamida Google userinfo API dan ma'lumot olish.
 * Frontend: useGoogleLogin (implicit flow) → access_token → POST /api/auth/google
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { access_token, id_token, idToken, token: genericToken } = req.body || {};
  const accessToken = access_token || (typeof req.body === 'string' ? req.body : null);
  const idTok = id_token || idToken;

  if (!accessToken && !idTok && !genericToken) {
    throw new BadRequestError('Google token topilmadi');
  }

  let googleId, email, name, picture, email_verified;

  // 1-usul: access_token bilan Userinfo API ga so'rov
  if (accessToken) {
    try {
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (googleRes.ok) {
        const info = await googleRes.json();
        googleId = info.sub;
        email = info.email;
        name = info.name;
        picture = info.picture;
        email_verified = info.email_verified;
      }
    } catch {}
  }

  // 2-usul: id_token bo'lsa tokeninfo API orqali tekshirish (fallback)
  if (!email && (idTok || genericToken)) {
    try {
      const targetToken = idTok || genericToken;
      const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${targetToken}`);
      if (tokenRes.ok) {
        const info = await tokenRes.json();
        googleId = info.sub;
        email = info.email;
        name = info.name;
        picture = info.picture;
        email_verified = info.email_verified === 'true' || info.email_verified === true;
      }
    } catch {}
  }

  if (!email) {
    throw new UnauthorizedError("Google token yaroqsiz yoki muddati o'tgan");
  }

  // Mavjud foydalanuvchini topish (googleId yoki email bo'yicha)
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      if (!user.profileImage && picture) user.profileImage = picture;
      await user.save();
    }
    if (user.blocked) {
      throw new ForbiddenError("Hisobingiz bloklangan. Admin bilan bog'laning.");
    }
  } else {
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      profileImage: picture || '',
      role: 'CUSTOMER',
      verification: { emailVerified: !!email_verified },
    });
  }

  const token = signToken({ id: user._id, role: user.role });

  res.json({
    token,
    user: {
      _id:          user._id,
      id:           user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      profileImage: user.profileImage,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new BadRequestError('email va password majburiy');

  const user = await User.findOne({ email });
  // Timing attack oldini olish: user topilmasa ham compare qilinadi
  const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  const isMatch = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

  if (!user || !isMatch) {
    throw new UnauthorizedError("Email yoki parol noto'g'ri");
  }

  if (user.blocked) {
    throw new ForbiddenError("Hisobingiz bloklangan. Admin bilan bog'laning.");
  }

  const token = signToken({ id: user._id, role: user.role });

  res.json({
    token,
    user: {
      _id:   user._id,
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new BadRequestError('Email manzil majburiy');

  const user = await User.findOne({ email });
  if (!user) {
    // Xavfsizlik qoidasi: email tizimda bo'lmasa ham bir xil xabar qaytariladi
    return res.json({ message: "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash havolasi yuborildi." });
  }

  // Bu yerda aslida nodemailer yordamida haqiqiy email yuboriladi
  // const resetToken = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '15m' });
  // await sendEmail(email, 'Parolni tiklash', `Havola: .../reset?token=${resetToken}`);

  res.json({ message: "Parolni tiklash havolasi email manzilga yuborildi." });
});
