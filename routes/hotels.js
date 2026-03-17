import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  approveHotel,
  getOwnerHotels,
  checkAvailability
} from '../controllers/hotelController.js';

const router = express.Router();

router.get('/', getAllHotels);
router.get('/owner', authenticate, authorize(['HOTEL_OWNER']), getOwnerHotels);
router.get('/:id', getHotelById);
router.get('/:id/availability', checkAvailability);
router.post('/', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), createHotel);
router.put('/:id', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), updateHotel);
router.delete('/:id', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), deleteHotel);
router.patch('/:id/approve', authenticate, authorize(['ADMIN']), approveHotel);

export default router;
