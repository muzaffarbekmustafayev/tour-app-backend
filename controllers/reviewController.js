import Review from '../models/Review.js';
import Hotel from '../models/Hotel.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

export const createReview = asyncHandler(async (req, res) => {
  const { hotelId, hotel, rating, comment } = req.body;
  const resolvedHotelId = hotelId || hotel;
  if (!resolvedHotelId || !rating) {
    throw new BadRequestError('hotelId va rating majburiy');
  }

  const review = new Review({ hotel: resolvedHotelId, user: req.user.id, rating, comment });
  await review.save();

  const [agg] = await Review.aggregate([
    { $match: { hotel: review.hotel } },
    { $group: { _id: '$hotel', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg) {
    await Hotel.findByIdAndUpdate(resolvedHotelId, {
      rating: Math.round(agg.avg * 10) / 10,
      reviewsCount: agg.count,
    });
  }

  res.status(201).json(review);
});

export const getHotelReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ hotel: req.params.hotelId })
    .populate('user', 'name')
    .sort('-createdAt');
  res.json(reviews);
});

export const replyToReview = asyncHandler(async (req, res) => {
  const replyText = req.body.reply || req.body.ownerReply;
  if (!replyText) throw new BadRequestError('reply matni majburiy');
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { ownerReply: replyText },
    { new: true }
  );
  if (!review) throw new NotFoundError('Review topilmadi');
  res.json(review);
});
