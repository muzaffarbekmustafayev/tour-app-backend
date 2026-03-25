import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';

export const createBooking = async (req, res) => {
  try {
    const {
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      guestsCount,
      paymentMethod,
      specialRequests,
      upsells
    } = req.body;
    
    const targetHotel = await Hotel.findById(hotelId);
    if (!targetHotel) return res.status(404).json({ message: 'Hotel not found' });
    
    const targetRoom = targetHotel.rooms.id(roomId);
    if (!targetRoom) return res.status(404).json({ message: 'Room not found' });

    if (targetRoom.roomsAvailable < 1) {
      return res.status(400).json({ message: 'No rooms available for this category' });
    }

    if (guestsCount > targetRoom.capacity) {
        // According to TZ: Kam kishi katta xona olishi mumkin. Lekin katta guruh kichik xonaga sig'maydi.
        return res.status(400).json({ message: 'Room capacity is smaller than guest count' });
    }

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const nights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    
    // Dynamic Pricing Logic (Weekend Markups)
    let currentDay = new Date(startDate);
    let computedTotalPrice = 0;
    
    while(currentDay < endDate) {
      let dailyPrice = targetRoom.pricePerNight;
      
      // If weekend (Friday, Saturday)
      if (currentDay.getDay() === 5 || currentDay.getDay() === 6) {
         const markupPercent = targetHotel.dynamicPricing?.weekendMarkupPercent || 0;
         dailyPrice += (dailyPrice * markupPercent) / 100;
      }
      
      computedTotalPrice += dailyPrice;
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // Upsell Costs
    if (upsells?.breakfast) computedTotalPrice += (15 * guestsCount * nights); // Dummy flat price
    if (upsells?.airportTransfer) computedTotalPrice += 50; 
    if (upsells?.extraBed) computedTotalPrice += (20 * nights);

    const booking = new Booking({
      hotel: hotelId,
      user: req.user.id,
      roomId,
      checkInDate,
      checkOutDate,
      totalPrice: computedTotalPrice,
      nights,
      guestsCount,
      paymentMethod,
      upsells,
      specialRequests,
      cancellationPolicy: targetHotel.policies?.cancellation || 'free'
    });

    await booking.save();
    
    // Decrement inventory
    targetRoom.roomsAvailable -= 1;
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
      .populate('hotel', 'name city images rooms')
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

    if (booking.status === 'cancelled') return res.json(booking);

    if (booking.cancellationPolicy === 'non-refundable' && req.user.role === 'CUSTOMER') {
      return res.status(400).json({ message: 'This booking is non-refundable.' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const hotel = await Hotel.findById(booking.hotel._id);
    if (hotel) {
      const room = hotel.rooms.id(booking.roomId);
      if (room) room.roomsAvailable += 1;
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
