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
  const rawLat = body?.location?.lat ?? body?.geo?.coordinates?.[1];
  const rawLng = body?.location?.lng ?? body?.geo?.coordinates?.[0];
  if (
    rawLat !== undefined && rawLat !== null && String(rawLat).trim() !== '' &&
    rawLng !== undefined && rawLng !== null && String(rawLng).trim() !== ''
  ) {
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        location: { lat, lng },
        geo: { type: 'Point', coordinates: [lng, lat] },
      };
    }
  }
  return {};
}

function sanitizeAttractionPayload(body) {
  const payload = { ...body };

  if (body.images) {
    payload.images = (Array.isArray(body.images) ? body.images : [body.images])
      .filter((img) => typeof img === 'string' && img.trim() !== '');
  }

  if (body.shortDescription && !body.descriptionShort) {
    payload.descriptionShort = body.shortDescription;
  }
  if (body.descriptionShort && !body.shortDescription) {
    payload.shortDescription = body.descriptionShort;
  }

  // Atrofda aylanishga arzigulik nima bor (bo'sh qatorlar va noto'g'ri tiplardan tozalash)
  if (Array.isArray(body.thingsToSeeAround)) {
    const VALID_TYPES = ['tabiat', 'tarix', 'bozor', 'ovqat', 'ovqatlanish', 'diniy', 'boshqa'];
    payload.thingsToSeeAround = body.thingsToSeeAround
      .filter((t) => t && typeof t.title === 'string' && t.title.trim() !== '')
      .map((t) => ({
        title: t.title.trim(),
        description: t.description ? String(t.description).trim() : '',
        type: VALID_TYPES.includes(t.type) ? t.type : 'boshqa',
        walkingMinutes: (t.walkingMinutes !== undefined && t.walkingMinutes !== '' && !isNaN(Number(t.walkingMinutes)))
          ? Number(t.walkingMinutes)
          : undefined,
      }));
  }

  // 360 Video
  if (body.video360 && typeof body.video360 === 'object') {
    payload.video360 = {
      url: body.video360.url || '',
      type: body.video360.type === 'file' ? 'file' : 'youtube',
      captioned: Boolean(body.video360.captioned),
    };
  }

  // Panoramas
  if (Array.isArray(body.panoramas)) {
    payload.panoramas = body.panoramas.filter((p) => p && typeof p.url === 'string' && p.url.trim() !== '');
  }

  const geoData = normalizeGeo(body);
  if (geoData.location) payload.location = geoData.location;
  if (geoData.geo) payload.geo = geoData.geo;

  return payload;
}

// ── GET /api/attractions  (Public) ──
export const getAllAttractions = asyncHandler(async (req, res) => {
  const { district, category, search, includeUtility } = req.query;
  const query = { approved: true };

  if (district) query.district = new RegExp(`^${district}$`, 'i');

  const UTILITY_CATEGORIES = ['kasalxona', 'iib', 'hokimiyat', 'transport', 'boshqa'];

  if (category && category !== 'all') {
    if (category === 'savdo') {
      query.category = { $in: ['bozor', 'supermarket', 'mall'] };
    } else if (category === 'infratuzilma' || category === 'xizmatlar') {
      query.category = { $in: UTILITY_CATEGORIES };
    } else {
      query.category = category;
    }
  } else if (!search && includeUtility !== 'true' && includeUtility !== true) {
    // Foydalanuvchi asosiy sahifa yoki umumiy ro'yxatga kirganda — faqat sayohat, hordiq chiqarish va diqqatga sazovor joylar chiqadi.
    // IIB, tez yordam/kasalxona, davlat xizmati/hokimiyat 2-darajali bo'lib, faqat qidirilganda yoki tegishli toifa tanlanganda chiqadi.
    query.category = { $nin: UTILITY_CATEGORIES };
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { descriptionShort: searchRegex },
      { address: searchRegex },
      { category: searchRegex },
      { 'thingsToSeeAround.title': searchRegex },
    ];
  }

  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, parseInt(req.query.limit) || 100);
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
// Joyga eng yaqin Hotellar va boshqa diqqatga sazovor joylar, masofa bo'yicha tartiblangan.
export const getNearbyStays = asyncHandler(async (req, res) => {
  const attraction = await Attraction.findById(req.params.id).select('location geo district category name');
  if (!attraction) throw new NotFoundError('Tarixiy joy topilmadi');

  const lat = attraction.location?.lat ?? attraction.geo?.coordinates?.[1];
  const lng = attraction.location?.lng ?? attraction.geo?.coordinates?.[0];

  const [hotels, allAttractions] = await Promise.all([
    Hotel.find({ approved: true }).select('-owner').lean(),
    Attraction.find({ approved: true, _id: { $ne: attraction._id } }).select('name district category images descriptionShort location geo rating').lean(),
  ]);

  let result = [];
  let nearbyAttractions = [];

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const withDistance = hotels
      .map((h) => {
        const hLat = h.location?.lat ?? h.geo?.coordinates?.[1];
        const hLng = h.location?.lng ?? h.geo?.coordinates?.[0];
        if (!Number.isFinite(hLat) || !Number.isFinite(hLng)) return null;
        const distanceKm = haversineKm(lat, lng, hLat, hLng);
        return { ...h, distanceKm: Math.round(distanceKm * 10) / 10 };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Dastlab 15 km radiusda qidiramiz
    const within15Km = withDistance.filter((h) => h.distanceKm <= 15);
    if (within15Km.length > 0) {
      result = within15Km;
    } else {
      // 15 km da bo'lmasa, eng yaqin 4 ta mehmonxonani tavsiya qilamiz
      result = withDistance.slice(0, 4);
    }

    // Yaqin boshqa tarixiy/madaniy joylar (25 km gacha yoki eng yaqin 4 ta)
    nearbyAttractions = allAttractions
      .map((a) => {
        const aLat = a.location?.lat ?? a.geo?.coordinates?.[1];
        const aLng = a.location?.lng ?? a.geo?.coordinates?.[0];
        if (!Number.isFinite(aLat) || !Number.isFinite(aLng)) return null;
        const distanceKm = haversineKm(lat, lng, aLat, aLng);
        return { ...a, distanceKm: Math.round(distanceKm * 10) / 10 };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 4);
  } else {
    // Koordinata bo'lmasa — bir xil tumandagi maskanlar
    const targetDistrict = (attraction.district || '').toLowerCase();
    result = hotels.filter((h) => 
      (h.district && h.district.toLowerCase() === targetDistrict) || 
      (h.city && h.city.toLowerCase() === targetDistrict)
    );
    nearbyAttractions = allAttractions
      .filter((a) => (a.district || '').toLowerCase() === targetDistrict)
      .slice(0, 4);
  }

  // Eng yaqin tunash joyi
  const nearest = result[0] || null;

  res.json({
    data: result,
    nearest,
    nearbyAttractions,
    radiusKm: NEARBY_RADIUS_KM,
    total: result.length,
  });
});

// ── POST /api/attractions  (Admin) ──
export const createAttraction = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.name.trim()) {
    throw new BadRequestError('Diqqatga sazovor joy nomi kiritilishi shart.');
  }

  if (!req.body.district || !ATTRACTION_DISTRICTS.includes(req.body.district)) {
    throw new BadRequestError('Tuman noto\'g\'ri tanlandi yoki mavjud emas. Navoiy viloyati tumanlaridan birini tanlang.');
  }

  const sanitized = sanitizeAttractionPayload(req.body);

  const data = {
    ...sanitized,
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

  if (req.body.district !== undefined && !ATTRACTION_DISTRICTS.includes(req.body.district)) {
    throw new BadRequestError('Tuman noto\'g\'ri tanlandi yoki mavjud emas.');
  }

  const sanitized = sanitizeAttractionPayload(req.body);
  const update = { ...sanitized };

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
