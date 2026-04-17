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
  images: [String],
  roomAccessibility: {
    hasEmergencyCord: { type: Boolean, default: false },
    grabBars: { type: Boolean, default: false },
    wideDoorways: { type: Boolean, default: false },
    visualAlarms: { type: Boolean, default: false },
    rollInShower: { type: Boolean, default: false },
    lowerBedHeight: { type: Boolean, default: false }
  }
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
    mobility: {
      wheelchairAccessible: { type: Boolean, default: false },
      stepFreeRoute: { type: Boolean, default: false },
      rampSlopeDegree: { type: Number, min: 0, max: 15 },
      elevatorWidthCm: { type: Number, min: 0, max: 500 },
      accessibleRooms: { type: Boolean, default: false },
      accessibleParking: { type: Boolean, default: false },
      accessibleToilet: { type: Boolean, default: false }
    },
    visual: {
      brailleSigns: { type: Boolean, default: false },
      tactilePaving: { type: Boolean, default: false },
      highContrastSignage: { type: Boolean, default: false }
    },
    auditory: {
      audioGuides: { type: Boolean, default: false },
      hearingLoop: { type: Boolean, default: false },
      vibrationAlerts: { type: Boolean, default: false },
      signLanguageStaff: { type: Boolean, default: false }
    },
    cognitive: {
      quietZones: { type: Boolean, default: false },
      easyToReadSignage: { type: Boolean, default: false },
      consistentLayout: { type: Boolean, default: false },
      sensoryFriendlyHours: { type: Boolean, default: false }
    },
    support: {
      serviceAnimalFriendly: { type: Boolean, default: false },
      supportPersonPolicy: { type: Boolean, default: false },
      supportContact: String
    }
  },
  familyAndElderly: {
    strollerAccessible: { type: Boolean, default: false },
    medicalServiceOnSite: { type: Boolean, default: false },
    nursingRoom: { type: Boolean, default: false },
    orthopedicBeddingAvailable: { type: Boolean, default: false },
    grabBarsInBathroom: { type: Boolean, default: false }
  },
  digitalInclusion: {
    lowResImagePlaceholder: String,
    isPwaCompatible: { type: Boolean, default: true },
    offlineDataSupport: { type: Boolean, default: true },
    lowDataMode: { type: Boolean, default: false },
    captionedVideoTour: { type: Boolean, default: false },
    screenReaderDescription: String
  },
  nearbyPlaces: [String],
  tags: [String],
  features: [String],
  paymentMethods: [{
    type: String,
    enum: ['Click', 'Payme', 'Uzum Bank', 'Stripe', 'Visa', 'MasterCard', 'Cash', 'Installment']
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

hotelSchema.index({ name: 'text', tags: 'text' });
hotelSchema.index({ 'accessibility.mobility.wheelchairAccessible': 1 });
hotelSchema.index({ 'accessibility.mobility.stepFreeRoute': 1 });
hotelSchema.index({ 'accessibility.visual.brailleSigns': 1 });
hotelSchema.index({ 'accessibility.auditory.audioGuides': 1 });
hotelSchema.index({ 'accessibility.auditory.hearingLoop': 1 });
hotelSchema.index({ 'accessibility.cognitive.quietZones': 1 });
hotelSchema.index({ 'accessibility.support.serviceAnimalFriendly': 1 });
hotelSchema.index({ 'familyAndElderly.strollerAccessible': 1 });
hotelSchema.index({ 'digitalInclusion.offlineDataSupport': 1 });
hotelSchema.index({ city: 1, stars: 1, basePricePerNight: 1 });

export default mongoose.model('Hotel', hotelSchema);
