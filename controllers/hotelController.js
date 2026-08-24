import Hotel from '../models/Hotel.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors.js';

// Navoiy viloyatining barcha tuman va shaharlari
export const HOTEL_DISTRICTS = [
  'Navoiy shahri',
  'Nurota',
  'Xatirchi',
  'Qiziltepa'
];

// Forma'dan kelgan location'dan GeoJSON Point hosil qilish (yaqin tarixiy joy/maskan topish uchun)
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

function normalizeAccessibility(acc) {
  if (!acc || typeof acc !== 'object') return undefined;
  return {
    mobility: {
      wheelchairAccessible: Boolean(acc.wheelchairAccessible || acc.mobility?.wheelchairAccessible),
      stepFreeRoute: Boolean(acc.stepFreeRoute || acc.mobility?.stepFreeRoute),
      rampSlopeDegree: Number(acc.rampSlopeDegree || acc.mobility?.rampSlopeDegree) || 0,
      elevatorWidthCm: Number(acc.elevatorWidthCm || acc.mobility?.elevatorWidthCm) || 0,
      accessibleRooms: Boolean(acc.accessibleRooms || acc.mobility?.accessibleRooms),
      accessibleParking: Boolean(acc.accessibleParking || acc.mobility?.accessibleParking),
      accessibleToilet: Boolean(acc.accessibleToilet || acc.mobility?.accessibleToilet),
      elevator: Boolean(acc.elevator || acc.mobility?.elevator),
      wideDoors: Boolean(acc.wideDoors || acc.mobility?.wideDoors),
      showerSeat: Boolean(acc.showerSeat || acc.mobility?.showerSeat),
    },
    visual: {
      brailleSigns: Boolean(acc.brailleSigns || acc.visual?.brailleSigns),
      tactilePaving: Boolean(acc.tactilePaving || acc.tactileFlooring || acc.visual?.tactilePaving),
      tactileFlooring: Boolean(acc.tactileFlooring || acc.tactilePaving || acc.visual?.tactileFlooring),
      highContrastSignage: Boolean(acc.highContrastSignage || acc.visual?.highContrastSignage),
    },
    auditory: {
      audioGuides: Boolean(acc.audioGuides || acc.auditory?.audioGuides),
      hearingLoop: Boolean(acc.hearingLoop || acc.hearingAssistance || acc.auditory?.hearingLoop),
      hearingAssistance: Boolean(acc.hearingAssistance || acc.hearingLoop || acc.auditory?.hearingAssistance),
      vibrationAlerts: Boolean(acc.vibrationAlerts || acc.auditory?.vibrationAlerts),
      signLanguageStaff: Boolean(acc.signLanguageStaff || acc.signLanguage || acc.auditory?.signLanguageStaff),
      signLanguage: Boolean(acc.signLanguage || acc.signLanguageStaff || acc.auditory?.signLanguage),
      voiceAssistant: Boolean(acc.voiceAssistant || acc.auditory?.voiceAssistant),
    },
    cognitive: {
      quietZones: Boolean(acc.quietZones || acc.cognitive?.quietZones),
      easyToReadSignage: Boolean(acc.easyToReadSignage || acc.cognitive?.easyToReadSignage),
      consistentLayout: Boolean(acc.consistentLayout || acc.cognitive?.consistentLayout),
      sensoryFriendlyHours: Boolean(acc.sensoryFriendlyHours || acc.cognitive?.sensoryFriendlyHours),
      emergencyButtons: Boolean(acc.emergencyButtons || acc.cognitive?.emergencyButtons),
    },
    support: {
      serviceAnimalFriendly: Boolean(acc.serviceAnimalFriendly || acc.support?.serviceAnimalFriendly),
      supportPersonPolicy: Boolean(acc.supportPersonPolicy || acc.support?.supportPersonPolicy),
      supportContact: acc.supportContact || acc.support?.supportContact || '',
    }
  };
}

function normalizeRooms(body, basePrice) {
  const rawRooms = Array.isArray(body.rooms) && body.rooms.length > 0 ? body.rooms : [{
    name: 'Standart Xona',
    roomType: 'Double Room',
    category: 'Standard',
    capacity: 2,
    pricePerNight: basePrice,
    totalRooms: Number(body.roomsAvailable || body.totalRooms) || 1,
    roomsAvailable: Number(body.roomsAvailable || body.totalRooms) || 1,
  }];

  return rawRooms.map((r) => {
    const capacity = Math.max(1, Number(r.capacity) || 2);
    const category = r.category || 'Standard';
    const totalRooms = Math.max(1, Number(r.totalRooms) || 1);
    const roomsAvailable = Number(r.roomsAvailable !== undefined && r.roomsAvailable !== '' ? r.roomsAvailable : totalRooms) || totalRooms;
    const pricePerNight = Number(r.pricePerNight !== undefined && r.pricePerNight !== '' ? r.pricePerNight : basePrice) || basePrice;
    const name = r.name?.trim() || `${capacity} kishilik ${category}`;
    return {
      ...r,
      name,
      roomType: r.roomType || 'Double Room',
      category,
      capacity,
      pricePerNight,
      totalRooms,
      roomsAvailable,
    };
  });
}

function sanitizeHotelPayload(body) {
  const basePrice = Number(body.basePricePerNight || body.pricePerNight) || 500000;
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

  if (body.checkInTime && !body.checkIn) payload.checkIn = body.checkInTime;
  if (body.checkOutTime && !body.checkOut) payload.checkOut = body.checkOutTime;

  payload.basePricePerNight = basePrice;
  payload.pricePerNight = basePrice;
  if (body.roomsAvailable !== undefined && body.roomsAvailable !== '') {
    payload.roomsAvailable = Number(body.roomsAvailable);
  }
  if (body.totalRooms !== undefined && body.totalRooms !== '') {
    payload.totalRooms = Number(body.totalRooms);
  }
  if (body.stars !== undefined && body.stars !== '') {
    payload.stars = Math.min(5, Math.max(1, Number(body.stars)));
  }

  const normalizedAcc = normalizeAccessibility(body.accessibility);
  if (normalizedAcc) payload.accessibility = normalizedAcc;

  payload.rooms = normalizeRooms(body, basePrice);

  const geoData = normalizeGeo(body);
  if (geoData.location) payload.location = geoData.location;
  if (geoData.geo) payload.geo = geoData.geo;

  return payload;
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

  if (district && city) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { district: new RegExp(district, 'i') },
        { city: new RegExp(district, 'i') },
      ]
    });
    query.$and.push({
      $or: [
        { city: new RegExp(city, 'i') },
        { district: new RegExp(city, 'i') },
      ]
    });
  } else if (district) {
    query.$or = [
      { district: new RegExp(`^${district}$`, 'i') },
      { city: new RegExp(`^${district}$`, 'i') },
    ];
  } else if (city) {
    query.$or = [
      { city: new RegExp(city, 'i') },
      { district: new RegExp(city, 'i') },
    ];
  }

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
  if (!req.body.district || !HOTEL_DISTRICTS.includes(req.body.district)) {
    throw new BadRequestError('Tuman noto\'g\'ri tanlandi yoki mavjud emas. Navoiy viloyati tumanlaridan birini tanlang.');
  }

  const sanitized = sanitizeHotelPayload(req.body);

  const hotelData = {
    ...sanitized,
    owner: (isAdmin && req.body.owner && req.body.owner.trim() !== '') ? req.body.owner : req.user.id,
    // Admin qo'shsa — avtomatik tasdiqlanadi; owner qo'shsa — admin tasdig'ini kutadi
    approved: isAdmin,
    moderationStatus: isAdmin ? 'approved' : 'pending',
  };

  const hotel = new Hotel(hotelData);
  await hotel.save();
  await hotel.populate('owner', 'name email phone');
  res.status(201).json(hotel);
});

export const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new NotFoundError('Hotel topilmadi');

  const isOwner = hotel.owner && hotel.owner.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'ADMIN') {
    throw new ForbiddenError('Bu hotelni tahrirlash uchun ruxsatingiz yo\'q');
  }

  // Tuman o'zgartirilsa — viloyat tumanlaridan biri bo'lishi shart
  if (req.body.district !== undefined && !HOTEL_DISTRICTS.includes(req.body.district)) {
    throw new BadRequestError('Tuman noto\'g\'ri tanlandi yoki mavjud emas.');
  }

  const sanitized = sanitizeHotelPayload(req.body);

  if (req.user.role === 'ADMIN') {
    if (req.body.owner && String(req.body.owner).trim() !== '') {
      sanitized.owner = req.body.owner;
    } else if (req.body.owner === '') {
      sanitized.owner = req.user.id;
    }
  } else {
    delete sanitized.owner;
  }

  // approved maydonini update orqali bypass qilishni oldini olish
  const updatedHotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    { ...sanitized, approved: hotel.approved, moderationStatus: hotel.moderationStatus },
    { new: true, runValidators: true }
  ).populate('owner', 'name email phone');

  res.json(updatedHotel);
});

export const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new NotFoundError('Hotel topilmadi');

  const isOwner = hotel.owner && hotel.owner.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'ADMIN') {
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
