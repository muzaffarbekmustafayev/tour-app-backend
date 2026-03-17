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

router.get('/users', authenticate, authorize(['ADMIN']), getUsers);
router.patch('/users/:id/block', authenticate, authorize(['ADMIN']), blockUser);
router.put('/users/:id', authenticate, authorize(['ADMIN']), updateUser);
router.delete('/users/:id', authenticate, authorize(['ADMIN']), deleteUser);
router.get('/statistics', authenticate, authorize(['ADMIN']), getStatistics);
router.get('/bookings', authenticate, authorize(['ADMIN']), getAllBookings);
router.get('/hotels', authenticate, authorize(['ADMIN']), getAllHotels);

export default router;
