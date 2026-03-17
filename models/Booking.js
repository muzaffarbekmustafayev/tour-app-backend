import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomType: { type: String, required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  nights: Number,
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  guestsCount: Number,
  paymentMethod: {
    type: String,
    enum: ['Visa', 'MasterCard', 'UzCard', 'Humo', 'Click', 'Payme']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  specialRequests: String
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
