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

/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get all hotels (Public)
 *     tags: [Hotels]
 *     responses:
 *       200:
 *         description: List of hotels
 */
router.get('/', getAllHotels);

/**
 * @swagger
 * /api/hotels/owner:
 *   get:
 *     summary: Get hotels owned by current user (HotelOwner only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's hotels
 */
router.get('/owner', authenticate, authorize(['HOTEL_OWNER']), getOwnerHotels);

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Get hotel by ID (Public)
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hotel details
 */
router.get('/:id', getHotelById);

/**
 * @swagger
 * /api/hotels/{id}/availability:
 *   get:
 *     summary: Check hotel availability (Public)
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Availability info
 */
router.get('/:id/availability', checkAvailability);

/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Create a new hotel (HotelOwner or Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Hotel created successfully
 */
router.post('/', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), createHotel);

/**
 * @swagger
 * /api/hotels/{id}:
 *   put:
 *     summary: Update an existing hotel (HotelOwner or Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 */
router.put('/:id', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), updateHotel);

/**
 * @swagger
 * /api/hotels/{id}:
 *   delete:
 *     summary: Delete a hotel (HotelOwner or Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hotel deleted successfully
 */
router.delete('/:id', authenticate, authorize(['HOTEL_OWNER', 'ADMIN']), deleteHotel);

/**
 * @swagger
 * /api/hotels/{id}/approve:
 *   patch:
 *     summary: Approve a hotel (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hotel approved
 */
router.patch('/:id/approve', authenticate, authorize(['ADMIN']), approveHotel);

export default router;
