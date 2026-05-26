import Hotel from '../models/Hotel.js';

// Reja 1: Accessibility filtrlari xaritasi
const ACC_MAP = {
  wheelchair:          'accessibility.mobility.wheelchairAccessible',
  stepFreeRoute:       'accessibility.mobility.stepFreeRoute',
  accessibleRooms:     'accessibility.mobility.accessibleRooms',
  accessibleParking:   'accessibility.mobility.accessibleParking',
  accessibleToilet:    'accessibility.mobility.accessibleToilet',
  brailleSigns:        'accessibility.visual.brailleSigns',
  tactilePaving:       'accessibility.visual.tactilePaving',
  highContrastSignage: 'accessibility.visual.highContrastSignage',
  audioGuides:         'accessibility.auditory.audioGuides',
  hearingLoop:         'accessibility.auditory.hearingLoop',
  vibrationAlerts:     'accessibility.auditory.vibrationAlerts',
  signLanguageStaff:   'accessibility.auditory.signLanguageStaff',
  quietZones:          'accessibility.cognitive.quietZones',
  easyToReadSignage:   'accessibility.cognitive.easyToReadSignage',
  serviceAnimalFriendly: 'accessibility.support.serviceAnimalFriendly',
  strollerAccessible:  'familyAndElderly.strollerAccessible',
  medicalOnSite:       'familyAndElderly.medicalServiceOnSite',
  nursingRoom:         'familyAndElderly.nursingRoom',
  offlineDataSupport:  'digitalInclusion.offlineDataSupport',
  lowDataMode:         'digitalInclusion.lowDataMode',
};

export const getAllHotels = async (req, res) => {
  try {
    const { city, stars, minPrice, maxPrice, category, search } = req.query;

    let query = { approved: true };

    if (city)     query.city     = new RegExp(city, 'i');
    if (stars)    query.stars    = Number(stars);
    if (category) query.category = category;

    if (minPrice || maxPrice) {
      query.basePricePerNight = {};
      if (minPrice) query.basePricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.basePricePerNight.$lte = Number(maxPrice);
    }

    if (search) query.$text = { $search: search };

    // Reja 1: Accessibility filtrlari
    Object.entries(ACC_MAP).forEach(([key, path]) => {
      if (req.query[key] === 'true') query[path] = true;
    });

    // Reja 2: Pagination
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const skip  = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
      Hotel.find(query).sort('-createdAt').skip(skip).limit(limit).select('-owner'),
      Hotel.countDocuments(query),
    ]);

    res.json({
      data:  hotels,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('owner', 'name email phone');
    
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createHotel = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const hotelData = {
      ...req.body,
      owner: (isAdmin && req.body.owner) ? req.body.owner : req.user.id,
      approved: isAdmin // Auto-approve if created by Admin
    };

    const hotel = new Hotel(hotelData);
    await hotel.save();
    
    res.status(201).json(hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check ownership or admin role
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, approved: hotel.approved }, // Prevent bypassing approval via update
      { new: true, runValidators: true }
    );

    res.json(updatedHotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check ownership or admin role
    if (hotel.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { approved: true, moderationStatus: 'approved' },
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOwnerHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.user.id })
      .sort('-createdAt');
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


