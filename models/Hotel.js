import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  descriptionShort: String,
  hotelChain: String,
  images: [String],
  videoTour: String,
  panoramaImages: [String],
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  ratings: {
    cleanliness: Number,
    comfort: Number,
    location: Number,
    service: Number,
    valueForMoney: Number
  },
  location: {
    lat: Number,
    lng: Number
  },
  address: String,
  city: String,
  country: String,
  distance: {
    airport: String,
    trainStation: String,
    cityCenter: String
  },
  category: { type: String, enum: ['hotel', 'resort', 'hostel'] },
  stars: { type: Number, min: 1, max: 5 },
  pricePerNight: Number,
  discount: {
    active: Boolean,
    percent: Number,
    validUntil: Date
  },
  seasonPrices: [{
    season: String,
    price: Number
  }],
  roomsAvailable: Number,
  totalRooms: Number,
  maxGuests: Number,
  checkIn: String,
  checkOut: String,
  openingYear: Number,
  renovatedYear: Number,
  languages: [String],
  contact: {
    phone: String,
    email: String,
    website: String
  },
  amenities: [String],
  roomTypes: [{
    type: String,
    price: Number,
    capacity: Number,
    roomsAvailable: Number,
    totalRooms: Number,
    amenities: [String]
  }],
  policies: {
    petsAllowed: Boolean,
    smokingAllowed: Boolean,
    cancellation: String
  },
  security: [String],
  accessibility: {
    wheelchairAccessible: Boolean,
    elevator: Boolean,
    accessibleRooms: Boolean,
    brailleSigns: Boolean,
    hearingAssistance: Boolean,
    specialParking: Boolean
  },
  nearbyPlaces: [String],
  tags: [String],
  features: [String],
  paymentMethods: [String],
  statistics: {
    bookingsThisMonth: { type: Number, default: 0 },
    occupancyRate: String,
    popularityScore: Number
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved: { type: Boolean, default: false },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('Hotel', hotelSchema);
