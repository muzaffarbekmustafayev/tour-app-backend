import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { register, login, getMe, updateProfile, addFavorite, removeFavorite, getFavorites } from '../controllers/authController.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Successfully logged in
 */
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateProfile);
router.post('/favorites/:hotelId', authenticate, addFavorite);
router.delete('/favorites/:hotelId', authenticate, removeFavorite);
router.get('/favorites', authenticate, getFavorites);

export default router;
