import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ['Visa', 'MasterCard', 'UzCard', 'Humo', 'Click', 'Payme'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  paidAt: Date
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
