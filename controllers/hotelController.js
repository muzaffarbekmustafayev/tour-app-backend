import Hotel from '../models/Hotel.js';

export const getAllHotels = async (req, res) => {
  try {
    const {
      search,
      city,
      minPrice,
      maxPrice,
      stars,
      minRating,
      amenities,
      accessibility,
      category,
      roomCategory,
      capacity,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    let filter = {};
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') }
      ];
    }
    if (city) filter.city = new RegExp(city, 'i');
    if (stars) filter.stars = parseInt(stars, 10);
    if (category) filter.category = category;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    
    // Search by base price OR room price
    if (minPrice || maxPrice) {
      filter.$or = filter.$or || [];
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseInt(minPrice, 10);
      if (maxPrice) priceFilter.$lte = parseInt(maxPrice, 10);
      
      filter.$or.push({ basePricePerNight: priceFilter });
      filter.$or.push({ 'rooms.pricePerNight': priceFilter });
    }

    if (capacity || roomCategory) {
      const roomMatch = {};
      if (capacity) roomMatch['capacity'] = { $gte: parseInt(capacity, 10) };
      if (roomCategory) roomMatch['category'] = roomCategory;
      filter.rooms = { $elemMatch: roomMatch };
    }

    if (amenities) {
      const amenitiesArray = String(amenities).split(',');
      filter.amenities = { $all: amenitiesArray };
    }
    
    if (accessibility) {
      const features = String(accessibility).split(',');
      for (const feature of features) {
        if (feature === 'wheelchair') filter['accessibility.wheelchairAccessible'] = true;
        if (feature === 'elevator') filter['accessibility.elevator'] = true;
        if (feature === 'rooms') filter['accessibility.accessibleRooms'] = true;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const hotels = await Hotel.find(filter)
      .populate('owner', 'name email')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum);
      
    const total = await Hotel.countDocuments(filter);

    res.json({
      data: hotels,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
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
    const hotel = new Hotel({
      ...req.body,
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

    Object.assign(hotel, req.body);
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
    res.json({ message: 'Hotel deleted successfully' });
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
    const { roomId, checkIn, checkOut, guests } = req.query;

    const hotel = await Hotel.findById(id);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });

    let roomToCheck = null;
    if (roomId) {
      roomToCheck = hotel.rooms.id(roomId);
      if (!roomToCheck) return res.status(404).json({ message: 'Room not found in this hotel' });
    }

    const checkAvailable = roomToCheck ? roomToCheck.roomsAvailable > 0 : hotel.rooms.some(r => r.roomsAvailable > 0);

    if (checkAvailable) {
      res.json({ available: true, hotelId: hotel._id, roomId: roomToCheck?._id });
    } else {
      res.json({ available: false, message: 'No rooms available for the selected dates' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
