import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  ownerReply: String
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
