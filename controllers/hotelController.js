import Hotel from '../models/Hotel.js';

export const getAllHotels = async (req, res) => {
  try {
    const {
      search,
      city,
      minPrice,
      maxPrice,
      priceMin,
      priceMax,
      stars,
      starRating,
      minRating,
      amenities,
      accessibility,
      category,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    let filter = { approved: true };
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { country: new RegExp(search, 'i') }
      ];
    }
    if (city) filter.city = new RegExp(city, 'i');
    if (stars || starRating) filter.stars = parseInt(stars || starRating, 10);
    if (category) filter.category = category;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (priceMin || priceMax || minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (priceMin || minPrice) filter.pricePerNight.$gte = parseInt(priceMin || minPrice, 10);
      if (priceMax || maxPrice) filter.pricePerNight.$lte = parseInt(priceMax || maxPrice, 10);
    }
    if (amenities) {
      const amenitiesArray = Array.isArray(amenities)
        ? amenities
        : String(amenities).split(',');
      filter.amenities = { $all: amenitiesArray };
    }
    if (accessibility) {
      const features = Array.isArray(accessibility)
        ? accessibility
        : String(accessibility).split(',');
      for (const feature of features) {
        if (feature === 'wheelchair') filter['accessibility.wheelchairAccessible'] = true;
        if (feature === 'elevator') filter['accessibility.elevator'] = true;
        if (feature === 'rooms') filter['accessibility.accessibleRooms'] = true;
        if (feature === 'braille') filter['accessibility.brailleSigns'] = true;
        if (feature === 'hearing') filter['accessibility.hearingAssistance'] = true;
        if (feature === 'parking') filter['accessibility.specialParking'] = true;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Use .sort({ [sortBy]: order === 'desc' ? -1 : 1 }) later if needed
    const hotels = await Hotel.find(filter)
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limitNum);
      
    const total = await Hotel.countDocuments(filter);

    res.json(hotels); // Kept array response for backward compatibility with frontend, normally we would return object
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('owner', 'name email');
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createHotel = async (req, res) => {
  try {
    const normalizedBody = {
      ...req.body,
      stars: Number(req.body.stars || req.body.starRating || 0) || undefined,
      roomsAvailable: Number(req.body.roomsAvailable || req.body.totalRooms || 0) || 0,
      totalRooms: Number(req.body.totalRooms || req.body.roomsAvailable || 0) || 0,
      pricePerNight: Number(req.body.pricePerNight || 0),
      city: req.body.city || req.body.location?.city,
      country: req.body.country || req.body.location?.country,
      address: req.body.address || req.body.location?.address
    };

    const hotel = new Hotel({
      ...normalizedBody,
      owner: req.user.id
    });
    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    
    if (req.user.role !== 'ADMIN' && hotel.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(hotel, {
      ...req.body,
      stars: Number(req.body.stars || req.body.starRating || hotel.stars || 0) || hotel.stars,
      city: req.body.city || req.body.location?.city || hotel.city,
      country: req.body.country || req.body.location?.country || hotel.country,
      address: req.body.address || req.body.location?.address || hotel.address
    });
    await hotel.save();
    res.json(hotel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    
    if (req.user.role !== 'ADMIN' && hotel.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await hotel.deleteOne();
    res.json({ message: 'Hotel deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOwnerHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.user.id });
    res.json(hotels);
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
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.query;

    const hotel = await Hotel.findById(id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

    // In a real application, you'd check bookings in this date range
    // For now we check if there are any rooms available globally
    if (hotel.roomsAvailable > 0) {
      res.json({ available: true, pricePerNight: hotel.pricePerNight, roomsAvailable: hotel.roomsAvailable });
    } else {
      res.json({ available: false, message: 'No rooms available for the selected dates' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
