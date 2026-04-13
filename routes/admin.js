import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getUsers,
  blockUser,
  deleteUser,
  updateUser,
  getStatistics,
  getAllBookings,
  getAllHotels
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/users', authenticate, authorize(['ADMIN']), getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/block:
 *   patch:
 *     summary: Block/Unblock a user (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.patch('/users/:id/block', authenticate, authorize(['ADMIN']), blockUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user details (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.put('/users/:id', authenticate, authorize(['ADMIN']), updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.delete('/users/:id', authenticate, authorize(['ADMIN']), deleteUser);

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/statistics', authenticate, authorize(['ADMIN']), getStatistics);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all system bookings (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/bookings', authenticate, authorize(['ADMIN']), getAllBookings);

/**
 * @swagger
 * /api/admin/hotels:
 *   get:
 *     summary: Get all system hotels (Admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/hotels', authenticate, authorize(['ADMIN']), getAllHotels);

export default router;
