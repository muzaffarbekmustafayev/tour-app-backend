import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, default: 'Standart Xona' },
  roomType: {
    type: String,
    enum: ['Single Room', 'Double Room', 'Triple Room', 'Quad Room', 'Family Room'],
    default: 'Double Room'
  },
  category: {
    type: String,
    enum: ['Standard', 'Comfort', 'Deluxe', 'Suite', 'Luxury / VIP'],
    default: 'Standard'
  },
  capacity: { type: Number, default: 2 },
  roomsAvailable: { type: Number, default: 1 },
  totalRooms: { type: Number, default: 1 },
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
  shortDescription: String,
  hotelChain: String,
  // ── Media ──────────────────────────────────────────────────────────────
  images: [String],

  // 360° panorama rasmlari — har biri uchun alt matn va sarlavha
  panoramas: [{
    url:     { type: String, required: true },
    caption: String,                          // "Mehmonxona kirish qismi"
    room:    String,                          // "Standart xona", "Hovli" …
  }],

  // Video tur — YouTube yoki to'g'ridan-to'g'ri fayl
  videoTour: {
    url:        String,                       // YouTube link yoki mp4
    captioned:  { type: Boolean, default: false }, // Subtitr mavjudmi?
    durationSec: Number,                      // Taxminiy uzunlik (soniya)
  },
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
  // GeoJSON Point — tarixiy joyga eng yaqin maskanlarni topish uchun
  geo: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  address: String,
  city: String,
  // Navoiy viloyatining barcha tuman va shaharlari
  district: { 
    type: String, 
    enum: [
      'Navoiy shahri',
      'Nurota',
      'Xatirchi',
      'Qiziltepa'
    ], 
    required: true 
  },
  country: String,
  distance: {
    airport: String,
    trainStation: String,
    cityCenter: String
  },
  category: { type: String, enum: ['hotel', 'resort', 'hostel', 'boutique', 'motel', 'guesthouse'] },
  stars: { type: Number, min: 1, max: 5 },
  roomsAvailable: Number,
  totalRooms: Number,
  maxGuests: Number,
  rooms: [roomSchema],
  checkIn: String,
  checkOut: String,
  checkInTime: String,
  checkOutTime: String,
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
      accessibleToilet: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
      wideDoors: { type: Boolean, default: false },
      showerSeat: { type: Boolean, default: false },
    },
    visual: {
      brailleSigns: { type: Boolean, default: false },
      tactilePaving: { type: Boolean, default: false },
      tactileFlooring: { type: Boolean, default: false },
      highContrastSignage: { type: Boolean, default: false }
    },
    auditory: {
      audioGuides: { type: Boolean, default: false },
      hearingLoop: { type: Boolean, default: false },
      hearingAssistance: { type: Boolean, default: false },
      vibrationAlerts: { type: Boolean, default: false },
      signLanguageStaff: { type: Boolean, default: false },
      signLanguage: { type: Boolean, default: false },
      voiceAssistant: { type: Boolean, default: false },
    },
    cognitive: {
      quietZones: { type: Boolean, default: false },
      easyToReadSignage: { type: Boolean, default: false },
      consistentLayout: { type: Boolean, default: false },
      sensoryFriendlyHours: { type: Boolean, default: false },
      emergencyButtons: { type: Boolean, default: false },
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
    isPwaCompatible:        { type: Boolean, default: true },
    offlineDataSupport:     { type: Boolean, default: true },
    lowDataMode:            { type: Boolean, default: false },
    screenReaderDescription: String,  // Ko'rish qiyinligi uchun batafsil tavsif
  },
  // ── Atmosfera (joy hissini beruvchi qisqa ma'lumotlar) ─────────────────
  atmosphere: {
    mood:          String,  // "Tinch va sakin" | "Jonli va gavjum"
    soundscape:    String,  // "Tong pallasida qushlar sayrashi..."
    bestTimeOfDay: String,  // "Kechqurun soat 18-20 — oltin soat"
    localTip:      String,  // "Yaqin atrofda tandir non hidi..."
  },

  nearbyPlaces: [String],
  tags: [String],
  features: [String],
  // To'lov usullari — muassasa bilan kelishish uchun ma'lumot
  paymentMethods: [{
    type: String,
    enum: ['Click', 'Payme', 'Uzum Bank', 'Naqd', 'Muddatli to\'lov']
  }],
  statistics: {
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
hotelSchema.index({ city: 1, stars: 1 });
hotelSchema.index({ district: 1 });
// Eslatma: yaqin maskanlar Haversine (location lat/lng) bilan hisoblanadi,
// shu sababli 2dsphere indeks shart emas — koordinatasiz hujjatlarda
// indeks xatosini oldini olish uchun olib tashlandi.

export default mongoose.model('Hotel', hotelSchema);
