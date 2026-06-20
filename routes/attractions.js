import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllAttractions,
  getAttractionById,
  getNearbyStays,
  createAttraction,
  updateAttraction,
  deleteAttraction,
  addAttractionReview,
} from '../controllers/attractionController.js';

const router = express.Router();

/**
 * @swagger
 * /api/attractions:
 *   get:
 *     summary: Get all attractions (Public)
 *     tags: [Attractions]
 *     responses:
 *       200: { description: List of attractions }
 */
router.get('/', getAllAttractions);

/**
 * @swagger
 * /api/attractions/{id}:
 *   get:
 *     summary: Get attraction by ID (Public)
 *     tags: [Attractions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Attraction details }
 */
router.get('/:id', getAttractionById);

/**
 * @swagger
 * /api/attractions/{id}/nearby-stays:
 *   get:
 *     summary: Nearby stays within 10km (Public)
 *     tags: [Attractions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Nearby hotels }
 */
router.get('/:id/nearby-stays', getNearbyStays);

/**
 * @swagger
 * /api/attractions/{id}/reviews:
 *   post:
 *     summary: Add a review to an attraction (Customer)
 *     tags: [Attractions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Review added }
 */
router.post('/:id/reviews', authenticate, authorize(['CUSTOMER']), addAttractionReview);

/**
 * @swagger
 * /api/attractions:
 *   post:
 *     summary: Create attraction (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201: { description: Attraction created }
 */
router.post('/', authenticate, authorize(['ADMIN']), createAttraction);

/**
 * @swagger
 * /api/attractions/{id}:
 *   put:
 *     summary: Update attraction (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Attraction updated }
 */
router.put('/:id', authenticate, authorize(['ADMIN']), updateAttraction);

/**
 * @swagger
 * /api/attractions/{id}:
 *   delete:
 *     summary: Delete attraction (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Attraction deleted }
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteAttraction);

export default router;
