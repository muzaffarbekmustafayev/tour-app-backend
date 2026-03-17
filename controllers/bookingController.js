import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';

export const createBooking = async (req, res) => {
  try {
    const {
      hotelId,
      hotel,
      roomType,
      checkInDate,
      checkOutDate,
      totalPrice,
      guestsCount,
      numberOfGuests,
      paymentMethod,
      specialRequests
    } = req.body;
    const resolvedHotelId = hotelId || hotel;
    
    const targetHotel = await Hotel.findById(resolvedHotelId);
    if (!targetHotel) return res.status(404).json({ message: 'Hotel not found' });
    
    if (targetHotel.roomsAvailable < 1) {
      return res.status(400).json({ message: 'No rooms available' });
    }

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const nights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const computedTotalPrice = totalPrice || nights * Number(targetHotel.pricePerNight || 0);

    const booking = new Booking({
      hotel: resolvedHotelId,
      user: req.user.id,
      roomType,
      checkInDate,
      checkOutDate,
      totalPrice: computedTotalPrice,
      nights,
      guestsCount: Number(guestsCount || numberOfGuests || 1),
      paymentMethod,
      specialRequests
    });

    await booking.save();
    
    targetHotel.roomsAvailable -= 1;
    targetHotel.statistics.bookingsThisMonth += 1;
    await targetHotel.save();

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('hotel', 'name city images')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
    if (req.user.role === 'HOTEL_OWNER' && hotel.owner?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const bookings = await Booking.find({ hotel: req.params.hotelId })
      .populate('user', 'name email phone')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hotel');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    const ownerCanManage =
      req.user.role === 'HOTEL_OWNER' &&
      booking.hotel?.owner?.toString() === req.user.id;

    if (booking.user.toString() !== req.user.id && req.user.role !== 'ADMIN' && !ownerCanManage) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return res.json(booking);
    }

    booking.status = 'cancelled';
    await booking.save();

    const hotel = await Hotel.findById(booking.hotel);
    if (hotel) {
      hotel.roomsAvailable += 1;
      await hotel.save();
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hotel');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (
      req.user.role === 'HOTEL_OWNER' &&
      booking.hotel?.owner?.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = 'confirmed';
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
