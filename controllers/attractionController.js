import Attraction, { ATTRACTION_DISTRICTS } from '../models/Attraction.js';
import Hotel from '../models/Hotel.js';
import User from '../models/User.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';

const NEARBY_RADIUS_KM = 10; // "10 km dagi barcha tunash joylari"

// Ikki koordinata orasidagi masofa (km) — Haversine
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Forma'dan kelgan location yoki geo'dan GeoJSON koordinatani normallashtirish
function normalizeGeo(body) {
  const lat = Number(body?.location?.lat ?? body?.geo?.coordinates?.[1]);
  const lng = Number(body?.location?.lng ?? body?.geo?.coordinates?.[0]);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      location: { lat, lng },
      geo: { type: 'Point', coordinates: [lng, lat] },
    };
  }
  return {};
}

// ── GET /api/attractions  (Public) ──
export const getAllAttractions = asyncHandler(async (req, res) => {
  const { district, search } = req.query;
  const query = { approved: true };

  if (district && ATTRACTION_DISTRICTS.includes(district)) query.district = district;
  if (search) query.$text = { $search: search };

  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip  = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Attraction.find(query).sort('-createdAt').skip(skip).limit(limit).select('-reviews'),
    Attraction.countDocuments(query),
  ]);

  res.json({ data: items, total, page, pages: Math.ceil(total / limit) });
});

// ── GET /api/attractions/:id  (Public) ──
export const getAttractionById = asyncHandler(async (req, res) => {
  const attraction = await Attraction.findById(req.params.id);
  if (!attraction) throw new NotFoundError('Tarixiy joy topilmadi');
  res.json(attraction);
});

// ── GET /api/attractions/:id/nearby-stays  (Public) ──
// Joyga 10 km radiusdagi barcha tasdiqlangan Hotellar, masofa bo'yicha tartib.
export const getNearbyStays = asyncHandler(async (req, res) => {
  const attraction = await Attraction.findById(req.params.id).select('location geo district');
  if (!attraction) throw new NotFoundError('Tarixiy joy topilmadi');

  const lat = attraction.location?.lat ?? attraction.geo?.coordinates?.[1];
  const lng = attraction.location?.lng ?? attraction.geo?.coordinates?.[0];

  const hotels = await Hotel.find({ approved: true }).select('-owner').lean();

  let result;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    result = hotels
      .map((h) => {
        const hLat = h.location?.lat ?? h.geo?.coordinates?.[1];
        const hLng = h.location?.lng ?? h.geo?.coordinates?.[0];
        if (!Number.isFinite(hLat) || !Number.isFinite(hLng)) return null;
        const distanceKm = haversineKm(lat, lng, hLat, hLng);
        return { ...h, distanceKm: Math.round(distanceKm * 10) / 10 };
      })
      .filter((h) => h && h.distanceKm <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    // Koordinata yo'q bo'lsa — bir xil tumandagi maskanlarga qaytamiz
    result = hotels.filter((h) => h.district === attraction.district || h.city === attraction.district);
  }

  // Eng yaqin tunash joyi (masofa bo'yicha birinchi) — frontend uni avtomatik tanlaydi
  const nearest = result[0] || null;

  res.json({ data: result, nearest, radiusKm: NEARBY_RADIUS_KM, total: result.length });
});

// ── POST /api/attractions  (Admin) ──
export const createAttraction = asyncHandler(async (req, res) => {
  const data = {
    ...req.body,
    ...normalizeGeo(req.body),
    approved: true,
    createdBy: req.user.id,
  };
  delete data.reviews;
  delete data.rating;
  delete data.reviewsCount;

  const attraction = new Attraction(data);
  await attraction.save();
  res.status(201).json(attraction);
});

// ── PUT /api/attractions/:id  (Admin) ──
export const updateAttraction = asyncHandler(async (req, res) => {
  const exists = await Attraction.findById(req.params.id);
  if (!exists) throw new NotFoundError('Tarixiy joy topilmadi');

  const update = { ...req.body, ...normalizeGeo(req.body) };
  // Sharh/reyting maydonlari update orqali o'zgartirilmaydi
  delete update.reviews;
  delete update.rating;
  delete update.reviewsCount;
  delete update.createdBy;

  const attraction = await Attraction.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, runValidators: true }
  );
  res.json(attraction);
});

// ── DELETE /api/attractions/:id  (Admin) ──
export const deleteAttraction = asyncHandler(async (req, res) => {
  const attraction = await Attraction.findByIdAndDelete(req.params.id);
  if (!attraction) throw new NotFoundError('Tarixiy joy topilmadi');
  res.json({ message: 'Tarixiy joy o\'chirildi' });
});

// ── POST /api/attractions/:id/reviews  (Customer) ──
export const addAttractionReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating) throw new BadRequestError('rating majburiy');

  const attraction = await Attraction.findById(req.params.id);
  if (!attraction) throw new NotFoundError('Tarixiy joy topilmadi');

  const author = await User.findById(req.user.id).select('name').lean();

  attraction.reviews.push({
    user: req.user.id,
    name: author?.name || 'Mehmon',
    rating: Number(rating),
    comment,
  });

  const count = attraction.reviews.length;
  const avg = attraction.reviews.reduce((s, r) => s + r.rating, 0) / count;
  attraction.rating = Math.round(avg * 10) / 10;
  attraction.reviewsCount = count;

  await attraction.save();
  res.status(201).json(attraction.reviews[attraction.reviews.length - 1]);
});
