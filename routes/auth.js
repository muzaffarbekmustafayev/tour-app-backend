import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { register, login, getMe, updateProfile, addFavorite, removeFavorite, getFavorites } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfile);
router.post('/favorites/:hotelId', authenticate, addFavorite);
router.delete('/favorites/:hotelId', authenticate, removeFavorite);
router.get('/favorites', authenticate, getFavorites);

export default router;
