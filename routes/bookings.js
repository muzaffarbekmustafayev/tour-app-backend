import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createBooking,
  getMyBookings,
  getHotelBookings,
  cancelBooking,
  confirmBooking
} from '../controllers/bookingController.js';

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking (Customer only)
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 */
router.post('/', authenticate, authorize(['CUSTOMER']), createBooking);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get my bookings
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/my-bookings', authenticate, getMyBookings);

/**
 * @swagger
 * /api/bookings/hotel/{hotelId}:
 *   get:
 *     summary: Get bookings for a specific hotel (Owner/Admin only)
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.get('/hotel/:hotelId', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), getHotelBookings);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.patch('/:id/cancel', authenticate, cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm a booking (Owner/Admin only)
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Success }
 */
router.patch('/:id/confirm', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), confirmBooking);

export default router;
