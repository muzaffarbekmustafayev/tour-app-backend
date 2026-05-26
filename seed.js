import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Hotel from './models/Hotel.js';
import User from './models/User.js';

dotenv.config();

const mockHotels = [
  {
    name: "Navoi Grand Hotel",
    description: "Navoiy shahrining qoq markazida joylashgan eng hashamatli mehmonxona. Bizda siz uchun barcha qulayliklar mavjud: shinam xonalar, restoran, konferens-zal va SPA markazi. Bizning mehmonxona nafaqat dam olish, balki biznes uchrashuvlar uchun ham juda qulay.",
    descriptionShort: "Shahar markazidagi 5 yulduzli lyuks mehmonxona.",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.9,
    reviewsCount: 156,
    location: { lat: 40.1032, lng: 65.3735 },
    address: "Islom Karimov ko'chasi, 1-uy",
    city: "Navoiy",
    country: "O'zbekiston",
    category: "hotel",
    stars: 5,
    basePricePerNight: 950000,
    checkIn: "14:00 dan",
    checkOut: "12:00 gacha",
    videoTour: "https://youtu.be/ZZyBG6UsvoQ?si=I_UBX7zl8oGMvXLJ", // Real 360 Hotel Video
    amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Gym", "Parking", "Air Conditioning"],
    security: ["24/7 Qo'riqlash", "Video kuzatuv", "Yong'in xavfsizligi"],
    accessibility: {
      mobility: {
        wheelchairAccessible: true,
        stepFreeRoute: true,
        rampSlopeDegree: 5,
        elevatorWidthCm: 120,
        accessibleRooms: true,
        accessibleParking: true,
        accessibleToilet: true
      },
      visual: { brailleSigns: true, tactilePaving: true, highContrastSignage: true },
      auditory: { audioGuides: true, hearingLoop: true },
      cognitive: { quietZones: true, easyToReadSignage: true }
    },
    rooms: [
      {
        name: "Prezident Lyuks",
        roomType: "Family Room",
        category: "Luxury / VIP",
        capacity: 4,
        pricePerNight: 2500000,
        roomsAvailable: 2,
        totalRooms: 5,
        areaSqMeters: 120,
        bedType: "king size",
        amenities: ["Mini-bar", "Jacuzzi", "Smart TV", "Kitchenette"]
      },
      {
        name: "Standard Single",
        roomType: "Single Room",
        category: "Standard",
        capacity: 1,
        pricePerNight: 750000,
        roomsAvailable: 15,
        totalRooms: 40,
        areaSqMeters: 25,
        bedType: "single bed"
      }
    ],
    approved: true
  },
  {
    name: "Zarafshan Business Hotel",
    description: "Ishbilarmonlar uchun maxsus loyihalashtirilgan zamonaviy mehmonxona. Aeroportga yaqin va shahar markaziga bir necha daqiqalik yo'l. Bizda yuqori tezlikdagi internet va qulay ishchi hududlar mavjud.",
    descriptionShort: "Biznes sayohatlar uchun ideal tanlov.",
    images: [
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.5,
    reviewsCount: 82,
    location: { lat: 40.0885, lng: 65.3621 },
    address: "G'alaba shoh ko'chasi, 45",
    city: "Navoiy",
    country: "O'zbekiston",
    category: "hotel",
    stars: 4,
    basePricePerNight: 650000,
    checkIn: "14:00",
    checkOut: "12:00",
    videoTour: "https://www.youtube.com/embed/ZZyBG6UsvoQ?si=CgyfEmVFMkvi6C-b", // Real 360 Room Video
    amenities: ["Free WiFi", "Restaurant", "Gym", "Parking", "Meeting Rooms"],
    rooms: [
      {
        name: "Business Comfort",
        roomType: "Double Room",
        category: "Comfort",
        capacity: 2,
        pricePerNight: 850000,
        roomsAvailable: 12,
        totalRooms: 30,
        areaSqMeters: 35,
        bedType: "double bed"
      }
    ],
    approved: true
  },
  {
    name: "Sarmishsoy Resort & SPA",
    description: "Tabiat qo'ynida, Sarmishsoy darasiga yaqin hududda joylashgan dam olish maskani. Qadimiy petrogliflarni ko'rish va toza havodan bahra olish uchun ajoyib joy.",
    descriptionShort: "Tabiat qo'ynida maroqli dam oling.",
    images: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.7,
    reviewsCount: 64,
    location: { lat: 40.2167, lng: 65.6167 },
    address: "Navbahor tumani, Sarmishsoy",
    city: "Navbahor",
    country: "O'zbekiston",
    category: "resort",
    stars: 4,
    basePricePerNight: 1100000,
    videoTour: "https://www.youtube.com/watch?v=F0m9n8-VvQc", // Real 360 Resort Video
    amenities: ["Pool", "Hiking", "Traditional Food", "Yoga Zone"],
    approved: true
  },
  {
    name: "Silk Road Hostel Navoi",
    description: "Sayohatni sevuvchi yoshlar va arzon narxda sifatli xizmat qidirayotganlar uchun eng yaxshi variant. Markaziy park yonida joylashgan.",
    descriptionShort: "Shinam va arzon hostel.",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.2,
    reviewsCount: 45,
    location: { lat: 40.0950, lng: 65.3850 },
    address: "Navoiy ko'chasi, 12",
    city: "Navoiy",
    country: "O'zbekiston",
    category: "hostel",
    stars: 3,
    basePricePerNight: 150000,
    videoTour: "https://www.youtube.com/watch?v=vV_X1xR-oO8", // 360 Hostel Video
    amenities: ["Free WiFi", "Shared Kitchen", "Laundry"],
    approved: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/navaitour');
    console.log('✅ MongoDB ulandi');

    // ── Foydalanuvchilar ──────────────────────────────────────────
    await User.deleteMany({});
    const hashedPassword = await bcrypt.hash('123456', 10);

    const admin = await User.create({
      name: 'Admin',
      email: 'a@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+998901234560',
    });

    const owner = await User.create({
      name: 'Hotel Owner',
      email: 'h@gmail.com',
      password: hashedPassword,
      role: 'HOTEL_OWNER',
      phone: '+998901234561',
    });

    await User.create({
      name: 'Customer',
      email: 'c@gmail.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '+998901234562',
    });

    console.log('👤 Foydalanuvchilar yaratildi:');
    console.log('   a@gmail.com  | 123456 | ADMIN');
    console.log('   h@gmail.com  | 123456 | HOTEL_OWNER');
    console.log('   c@gmail.com  | 123456 | CUSTOMER');

    // ── Mehmonxonalar ─────────────────────────────────────────────
    await Hotel.deleteMany({});
    const hotelsData = mockHotels.map(h => ({ ...h, owner: owner._id }));
    await Hotel.insertMany(hotelsData);

    console.log(`🏨 ${mockHotels.length} ta mehmonxona qo'shildi`);
    console.log('✅ Seed muvaffaqiyatli yakunlandi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed xatosi:', error.message);
    process.exit(1);
  }
};

seedDatabase();

