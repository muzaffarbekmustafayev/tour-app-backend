import Hotel from '../models/Hotel.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors.js';

// Navoiy viloyatining barcha tuman va shaharlari
export const HOTEL_DISTRICTS = [
  'Navoiy shahri', 'Zarafshon shahri', 'G\'ozg\'on shahri',
  'Karmana', 'Qiziltepa', 'Navbahor', 'Nurota', 
  'Tomdi', 'Uchquduq', 'Xatirchi', 'Konimex'
];

// Forma'dan kelgan location'dan GeoJSON Point hosil qilish (yaqin tarixiy joy/maskan topish uchun)
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

// Accessibility filtrlari xaritasi
const ACC_MAP = {
  wheelchair:            'accessibility.mobility.wheelchairAccessible',
  stepFreeRoute:         'accessibility.mobility.stepFreeRoute',
  accessibleRooms:       'accessibility.mobility.accessibleRooms',
  accessibleParking:     'accessibility.mobility.accessibleParking',
  accessibleToilet:      'accessibility.mobility.accessibleToilet',
  brailleSigns:          'accessibility.visual.brailleSigns',
  tactilePaving:         'accessibility.visual.tactilePaving',
  highContrastSignage:   'accessibility.visual.highContrastSignage',
  audioGuides:           'accessibility.auditory.audioGuides',
  hearingLoop:           'accessibility.auditory.hearingLoop',
  vibrationAlerts:       'accessibility.auditory.vibrationAlerts',
  signLanguageStaff:     'accessibility.auditory.signLanguageStaff',
  quietZones:            'accessibility.cognitive.quietZones',
  easyToReadSignage:     'accessibility.cognitive.easyToReadSignage',
  serviceAnimalFriendly: 'accessibility.support.serviceAnimalFriendly',
  strollerAccessible:    'familyAndElderly.strollerAccessible',
  medicalOnSite:         'familyAndElderly.medicalServiceOnSite',
  nursingRoom:           'familyAndElderly.nursingRoom',
  offlineDataSupport:    'digitalInclusion.offlineDataSupport',
  lowDataMode:           'digitalInclusion.lowDataMode',
};

export const getAllHotels = asyncHandler(async (req, res) => {
  const { city, district, stars, minPrice, maxPrice, category, search, minRating } = req.query;

  const query = { approved: true };

  if (city)     query.city     = new RegExp(city, 'i');
  if (district) query.district = district;
  if (stars)    query.stars    = Number(stars);
  if (category) query.category = category;
  if (minRating) query.rating  = { $gte: Number(minRating) };

  if (minPrice || maxPrice) {
    query.basePricePerNight = {};
    if (minPrice) query.basePricePerNight.$gte = Number(minPrice);
    if (maxPrice) query.basePricePerNight.$lte = Number(maxPrice);
  }

  if (search) query.$text = { $search: search };

  // Accessibility filtrlari
  for (const [key, path] of Object.entries(ACC_MAP)) {
    if (req.query[key] === 'true') query[path] = true;
  }

  // Saralash — masalan ?sortBy=rating&order=desc (AIRecommendations buni ishlatadi)
  const SORT_FIELDS = { rating: 'rating', price: 'basePricePerNight', createdAt: 'createdAt' };
  const sortField = SORT_FIELDS[req.query.sortBy] || 'createdAt';
  const sortDir = req.query.order === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortDir };

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip  = (page - 1) * limit;

  const [hotels, total] = await Promise.all([
    Hotel.find(query).sort(sort).skip(skip).limit(limit).select('-owner'),
    Hotel.countDocuments(query),
  ]);

  res.json({ data: hotels, total, page, pages: Math.ceil(total / limit) });
});

export const getHotelById = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id).populate('owner', 'name email phone');
  if (!hotel) throw new NotFoundError('Hotel topilmadi');
  res.json(hotel);
});

export const createHotel = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';

  // Tuman majburiy — viloyat tumanlaridan biri bo'lishi shart
  if (!HOTEL_DISTRICTS.includes(req.body.district)) {
    throw new BadRequestError('Tuman noto\'g\'ri tanlandi yoki mavjud emas.');
  }

  const hotelData = {
    ...req.body,
    ...normalizeGeo(req.body),
    owner: (isAdmin && req.body.owner) ? req.body.owner : req.user.id,
    // Admin qo'shsa — avtomatik tasdiqlanadi; owner qo'shsa — admin tasdig'ini kutadi
    approved: isAdmin,
    moderationStatus: isAdmin ? 'approved' : 'pending',
  };

  const hotel = new Hotel(hotelData);
  await hotel.save();
  res.status(201).json(hotel);
});

export const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new NotFoundError('Hotel topilmadi');

  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Bu hotelni tahrirlash uchun ruxsatingiz yo\'q');
  }

  // Tuman o'zgartirilsa — viloyat tumanlaridan biri bo'lishi shart
  if (req.body.district !== undefined && !HOTEL_DISTRICTS.includes(req.body.district)) {
    throw new BadRequestError('Tuman noto\'g\'ri tanlandi yoki mavjud emas.');
  }

  // approved maydonini update orqali bypass qilishni oldini olish + geo'ni qayta hisoblash
  const updatedHotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    { ...req.body, ...normalizeGeo(req.body), approved: hotel.approved },
    { new: true, runValidators: true }
  );

  res.json(updatedHotel);
});

export const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new NotFoundError('Hotel topilmadi');

  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Bu hotelni o\'chirish uchun ruxsatingiz yo\'q');
  }

  await Hotel.findByIdAndDelete(req.params.id);
  res.json({ message: 'Hotel muvaffaqiyatli o\'chirildi' });
});

export const approveHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    { approved: true, moderationStatus: 'approved' },
    { new: true }
  );
  if (!hotel) throw new NotFoundError('Hotel topilmadi');
  res.json(hotel);
});

export const getOwnerHotels = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find({ owner: req.user.id }).sort('-createdAt');
  res.json(hotels);
});
