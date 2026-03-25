import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomType: { 
    type: String, 
    enum: ['Single Room', 'Double Room', 'Triple Room', 'Quad Room', 'Family Room'],
    required: true
  },
  category: { 
    type: String, 
    enum: ['Standard', 'Comfort', 'Deluxe', 'Suite', 'Luxury / VIP'],
    required: true
  },
  capacity: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  roomsAvailable: { type: Number, required: true },
  totalRooms: { type: Number, required: true },
  areaSqMeters: Number,
  bedType: { type: String, enum: ['single bed', 'double bed', 'king size'] },
  amenities: [String],
  bathroomType: { type: String, enum: ['private', 'shared'] },
  hasBalcony: { type: Boolean, default: false },
  images: [String]
});

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
  basePricePerNight: Number,
  dynamicPricing: {
    weekendMarkupPercent: { type: Number, default: 0 },
    holidayMarkupPercent: { type: Number, default: 0 },
    lowSeasonDiscountPercent: { type: Number, default: 0 }
  },
  discount: {
    active: Boolean,
    percent: Number,
    validUntil: Date
  },
  seasonPrices: [{
    season: String,
    price: Number
  }],
  rooms: [roomSchema],
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
  policies: {
    petsAllowed: Boolean,
    smokingAllowed: Boolean,
    cancellation: { type: String, enum: ['free', 'non-refundable', 'partial'] }
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
  paymentMethods: [{
    type: String, 
    enum: ['Click', 'Payme', 'Uzum Bank', 'Stripe', 'Visa', 'MasterCard', 'Cash']
  }],
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
