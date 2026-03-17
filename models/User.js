import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ADMIN', 'HOTEL_OWNER', 'CUSTOMER', 'GUEST'],
    default: 'CUSTOMER'
  },
  phone: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
  blocked: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
