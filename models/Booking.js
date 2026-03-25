import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Points to room in Hotel.rooms
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
  upsells: {
    breakfast: { type: Boolean, default: false },
    airportTransfer: { type: Boolean, default: false },
    extraBed: { type: Boolean, default: false }
  },
  paymentMethod: {
    type: String,
    enum: ['Click', 'Payme', 'Uzum Bank', 'Stripe', 'Visa', 'MasterCard', 'Cash']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  cancellationPolicy: {
    type: String,
    enum: ['free', 'non-refundable', 'partial']
  },
  invoiceUrl: String,
  specialRequests: String
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
