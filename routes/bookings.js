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

router.post('/', authenticate, authorize(['CUSTOMER']), createBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/hotel/:hotelId', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), getHotelBookings);
router.patch('/:id/cancel', authenticate, cancelBooking);
router.patch('/:id/confirm', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), confirmBooking);

export default router;
