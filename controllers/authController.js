import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// .env dan markaziy JWT sozlamalari
const JWT_SECRET     = process.env.JWT_SECRET     || 'navaitour_jwt_secret_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';


/** Token yaratish yordamchi funksiyasi */
const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const addFavorite = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { favorites: req.params.hotelId } });
    res.json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $pull: { favorites: req.params.hotelId } });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    const validFavorites = (user.favorites || []).filter(fav => fav != null);
    res.json(validFavorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, profileImage },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Google OAuth — access_token yordamida Google userinfo API dan ma'lumot olish.
 * Frontend: useGoogleLogin (implicit flow) → access_token → POST /api/auth/google
 */
export const googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ message: 'Google token topilmadi' });
    }

    // Google userinfo API dan foydalanuvchi ma'lumotlarini olish
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!googleRes.ok) {
      return res.status(401).json({ message: 'Google token yaroqsiz yoki muddati o\'tgan' });
    }

    const { sub: googleId, email, name, picture, email_verified } = await googleRes.json();

    if (!email) {
      return res.status(400).json({ message: 'Google hisobda email topilmadi' });
    }

    // Mavjud foydalanuvchini topish (googleId yoki email bo'yicha)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Mavjud foydalanuvchiga googleId bog'lash (email orqali ro'yxatdan o'tgan bo'lsa)
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.profileImage && picture) user.profileImage = picture;
        await user.save();
      }
      if (user.blocked) {
        return res.status(403).json({ message: 'Hisobingiz bloklangan. Admin bilan bog\'laning.' });
      }
    } else {
      // Yangi foydalanuvchi yaratish
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
  } catch (error) {
    console.error('[googleLogin] Xato:', error.message);
    res.status(500).json({ message: 'Google autentifikatsiya xatosi. Qayta urinib ko\'ring.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }

    if (user.blocked) {
      return res.status(403).json({ message: 'Hisobingiz bloklangan. Admin bilan bog\'laning.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
