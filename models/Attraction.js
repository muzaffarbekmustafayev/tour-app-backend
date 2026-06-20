import mongoose from 'mongoose';

/**
 * Attraction — Tarixiy / diqqatga sazovor joy.
 *
 * Hotel'dan farqi: EGASI YO'Q. Faqat ADMIN qo'shadi/boshqaradi.
 * Maqsadi — joyni 360° video + "atrofda nima bor" bilan ko'rsatish va
 * unga yaqin tunash maskanlarini (Hotel) tavsiya qilish. Bron yo'q.
 */

const DISTRICTS = ['Nurota', 'Xatirchi', 'Qiziltepa'];

// Tarixiy joyga qoldirilgan sharhlar (embedded)
const attractionReviewSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:   String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
}, { timestamps: true });

const attractionSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  district:    { type: String, enum: DISTRICTS, required: true },
  description: String,
  descriptionShort: String,

  images: [String],

  // ── 360° video (asosiy talab) — YouTube link yoki yuklangan fayl ──
  video360: {
    url:       String,
    type:      { type: String, enum: ['youtube', 'file'], default: 'youtube' },
    captioned: { type: Boolean, default: false },
  },

  panoramas: [{
    url:     { type: String, required: true },
    caption: String,
  }],

  // ── "Atrofda aylanishga arzigulik nima bor" ──
  thingsToSeeAround: [{
    title:       { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ['tabiat', 'tarix', 'bozor', 'ovqat', 'diniy', 'boshqa'],
      default: 'boshqa',
    },
    walkingMinutes: Number,
  }],

  // ── Geo (GeoJSON Point) + oddiy lat/lng (frontend xaritasi) ──
  geo: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined },
  },
  location: { lat: Number, lng: Number },
  address: String,

  // ── Inklyuzivlik (qisqartirilgan ko'rinish) ──
  accessibility: {
    wheelchairAccessible: { type: Boolean, default: false },
    accessibleParking:    { type: Boolean, default: false },
    accessibleToilet:     { type: Boolean, default: false },
    brailleSigns:         { type: Boolean, default: false },
    audioGuides:          { type: Boolean, default: false },
    signLanguageStaff:    { type: Boolean, default: false },
    quietZones:           { type: Boolean, default: false },
    serviceAnimalFriendly:{ type: Boolean, default: false },
  },

  atmosphere: {
    mood:          String,
    soundscape:    String,
    bestTimeOfDay: String,
    localTip:      String,
  },

  bestSeason: String,
  entryFee:   String,

  rating:       { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  reviews:      [attractionReviewSchema],

  approved:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Yaqin maskanlar Haversine (location lat/lng) bilan hisoblanadi —
// 2dsphere indeks shart emas (koordinatasiz hujjatlarda xato bermasligi uchun).
attractionSchema.index({ district: 1 });
attractionSchema.index({ name: 'text', description: 'text' });

export const ATTRACTION_DISTRICTS = DISTRICTS;
export default mongoose.model('Attraction', attractionSchema);
