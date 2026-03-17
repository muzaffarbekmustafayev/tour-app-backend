import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createReview,
  getHotelReviews,
  replyToReview
} from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', authenticate, authorize(['CUSTOMER']), createReview);
router.get('/hotel/:hotelId', getHotelReviews);
router.patch('/:id/reply', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), replyToReview);

export default router;
