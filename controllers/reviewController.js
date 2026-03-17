import Review from '../models/Review.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';

export const createReview = async (req, res) => {
  try {
    const { hotelId, hotel, rating, comment } = req.body;
    const resolvedHotelId = hotelId || hotel;
    
    // In a real scenario, we check if they had a completed booking
    // For now, let's allow it if they have any booking or just simplify
    const booking = await Booking.findOne({
      hotel: resolvedHotelId,
      user: req.user.id
      // status: 'completed' // For demo, might be better to relax this or ensure we have completed bookings
    });

    // if (!booking) {
    //   return res.status(403).json({ message: 'You must have a booking to review' });
    // }

    const review = new Review({
      hotel: resolvedHotelId,
      user: req.user.id,
      rating,
      comment
    });

    await review.save();

    // Update hotel rating
    const reviews = await Review.find({ hotel: resolvedHotelId });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    await Hotel.findByIdAndUpdate(resolvedHotelId, {
      rating: avgRating,
      reviewsCount: reviews.length
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getHotelReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hotel: req.params.hotelId })
      .populate('user', 'name')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replyToReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { ownerReply: req.body.reply || req.body.ownerReply },
      { new: true }
    );
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
