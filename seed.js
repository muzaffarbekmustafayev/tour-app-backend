import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hotel from './models/Hotel.js';
import User from './models/User.js';

dotenv.config();

const mockHotels = [
  {
    name: "Registan Plaza Luxury Hotel",
    description: "Experience luxury in the heart of the ancient Silk Road. Our hotel offers world-class amenities, stunning views of the Registan ensemble, and authentic Uzbek hospitality.",
    images: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.8,
    reviewsCount: 124,
    city: "Samarkand",
    country: "Uzbekistan",
    address: "Registan street 1",
    category: "hotel",
    stars: 5,
    pricePerNight: 1200000,
    roomsAvailable: 15,
    totalRooms: 100,
    amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym", "Parking"],
    approved: true,
    accessibility: {
      wheelchairAccessible: true,
      elevator: true,
      accessibleRooms: true
    }
  },
  {
    name: "Orient Star Khiva",
    description: "Stay in an authentic madrassah located inside the Ichan-Kala fortress. A truly unique and historical experience.",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.5,
    reviewsCount: 89,
    city: "Khiva",
    country: "Uzbekistan",
    address: "Ichan Kala, Khiva",
    category: "hotel",
    stars: 4,
    pricePerNight: 800000,
    roomsAvailable: 5,
    totalRooms: 40,
    amenities: ["Free WiFi", "Restaurant", "Air Conditioning", "Airport Shuttle"],
    approved: true
  },
  {
    name: "Hyatt Regency Tashkent",
    description: "Premium five-star hotel in the center of Tashkent city. Perfect for business travelers and tourists seeking ultimate comfort.",
    images: [
      "https://images.unsplash.com/photo-1551882547-ff40c0d5b5aa?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.9,
    reviewsCount: 340,
    city: "Tashkent",
    country: "Uzbekistan",
    address: "Navoi Avenue 1A",
    category: "hotel",
    stars: 5,
    pricePerNight: 2500000,
    roomsAvailable: 25,
    totalRooms: 300,
    amenities: ["Free WiFi", "Indoor Pool", "Spa", "Fitness Center", "Multiple Restaurants", "Bar", "Meeting Rooms"],
    approved: true,
    accessibility: {
      wheelchairAccessible: true,
      elevator: true,
      accessibleRooms: true,
      specialParking: true
    }
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/navaitour');
    console.log('MongoDB Connected for seeding');

    const adminUser = await User.findOne({ role: 'ADMIN' });
    let ownerId = null;

    if (adminUser) {
      ownerId = adminUser._id;
    } else {
      // Create a dummy owner to link hotels correctly if needed
      const dummyOwner = new User({
        name: "Admin NavaiTour",
        email: "admin@navaitour.com",
        password: "hashedpassword", // Only for seeding
        role: "ADMIN"
      });
      await dummyOwner.save();
      ownerId = dummyOwner._id;
    }

    const hotelCount = await Hotel.countDocuments();
    if (hotelCount === 0) {
      console.log('No hotels found. Seeding initial data...');
      
      const hotelsData = mockHotels.map(h => ({ ...h, owner: ownerId }));
      await Hotel.insertMany(hotelsData);
      
      console.log('Successfully seeded hotels!');
    } else {
      console.log('Database already contains hotels. Skipping seed.');
    }

    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
