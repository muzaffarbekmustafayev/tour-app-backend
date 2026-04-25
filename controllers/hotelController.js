import Hotel from '../models/Hotel.js';

export const getAllHotels = async (req, res) => {
  try {
    const { city, stars, minPrice, maxPrice, category, search } = req.query;
    
    let query = { approved: true };

    if (city) query.city = new RegExp(city, 'i');
    if (stars) query.stars = Number(stars);
    if (category) query.category = category;
    
    if (minPrice || maxPrice) {
      query.basePricePerNight = {};
      if (minPrice) query.basePricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.basePricePerNight.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const hotels = await Hotel.find(query)
      .sort('-createdAt')
      .select('-owner');
    
    res.json(hotels);
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

export const checkAvailability = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const availableRooms = hotel.rooms.filter(room => room.roomsAvailable > 0);
    res.json({
      hotelId: hotel._id,
      available: availableRooms.length > 0,
      rooms: availableRooms.map(r => ({
        id: r._id,
        name: r.name,
        available: r.roomsAvailable,
        price: r.pricePerNight
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
