import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Hotel from './models/Hotel.js';
import User from './models/User.js';
import Attraction from './models/Attraction.js';

dotenv.config();

/**
 * Seed — "Inklyuziv turizm" grant loyihasi
 * Navoiy viloyatining 3 tumani: Xatirchi, Nurota, Qiziltepa
 *
 * Har bir tuman uchun tarixiy/diqqatga sazovor joy va unga yaqin
 * dam olish — uxlash maskanlari (mehmonxona, resort, gostevoy uy)
 * kiritilgan. Barcha maskanlar inklyuziv (ko'rish, eshitish, harakat,
 * keksalar va oilaviy) imkoniyatlari bilan belgilangan.
 */

const mockHotels = [
  // ═══════════════════════════════════════════════════════════
  // 1-TUMAN: NUROTA — Chashma majmuasi, Nur qal'asi, Sarmishsoy
  // ═══════════════════════════════════════════════════════════
  {
    name: "Nurota Chashma Resort",
    description: "Nurota shahridagi muqaddas Chashma majmuasiga atigi 5 daqiqalik masofada joylashgan zamonaviy dam olish maskani. Tarixiy ziyoratgohga yaqinligi, toza tog' havosi va inklyuziv qulayliklari bilan ajralib turadi. Aravacha foydalanuvchilar, ko'rish va eshitish qiyinchiligi bo'lganlar uchun to'liq moslashtirilgan.",
    descriptionShort: "Chashma majmuasiga yaqin inklyuziv resort.",
    images: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.8,
    reviewsCount: 74,
    location: { lat: 40.5635, lng: 65.6889 },
    address: "Chashma ko'chasi, 7-uy",
    city: "Nurota",
    country: "O'zbekiston",
    category: "resort",
    stars: 4,
    basePricePerNight: 720000,
    checkIn: "14:00 dan",
    checkOut: "12:00 gacha",
    videoTour: "https://youtu.be/ZZyBG6UsvoQ?si=I_UBX7zl8oGMvXLJ",
    amenities: ["Free WiFi", "Restaurant", "Parking", "Traditional Food", "Air Conditioning"],
    security: ["24/7 Qo'riqlash", "Video kuzatuv", "Yong'in xavfsizligi"],
    accessibility: {
      mobility: { wheelchairAccessible: true, stepFreeRoute: true, rampSlopeDegree: 5, elevatorWidthCm: 110, accessibleRooms: true, accessibleParking: true, accessibleToilet: true },
      visual: { brailleSigns: true, tactilePaving: true, highContrastSignage: true },
      auditory: { audioGuides: true, hearingLoop: true, vibrationAlerts: true },
      cognitive: { quietZones: true, easyToReadSignage: true, consistentLayout: true },
      support: { serviceAnimalFriendly: true, supportPersonPolicy: true, supportContact: "+998 79 223 11 22" }
    },
    familyAndElderly: { strollerAccessible: true, medicalServiceOnSite: true, orthopedicBeddingAvailable: true, grabBarsInBathroom: true },
    atmosphere: {
      mood: "Tinch va ziyoratbop",
      soundscape: "Chashma bulog'i suvining shildirashi va tog' shamoli",
      bestTimeOfDay: "Erta tong — Chashmaga ziyorat uchun eng salqin payt",
      localTip: "Chashmadagi muqaddas baliqlarni ko'rishni unutmang, ular asrlar davomida muhofaza qilinadi."
    },
    nearbyPlaces: ["Chashma majmuasi (0.4 km)", "Nur qal'asi xarobalari (1.2 km)", "Nurota tog'lari"],
    rooms: [
      { name: "Inklyuziv Standart", roomType: "Double Room", category: "Comfort", capacity: 2, pricePerNight: 720000, roomsAvailable: 6, totalRooms: 12, areaSqMeters: 32, bedType: "double bed", bathroomType: "private",
        roomAccessibility: { hasEmergencyCord: true, grabBars: true, wideDoorways: true, rollInShower: true, lowerBedHeight: true } },
      { name: "Oilaviy xona", roomType: "Family Room", category: "Deluxe", capacity: 4, pricePerNight: 1150000, roomsAvailable: 3, totalRooms: 6, areaSqMeters: 55, bedType: "king size", bathroomType: "private" }
    ],
    paymentMethods: ["Click", "Payme", "Naqd"],
    approved: true
  },
  {
    name: "Sarmishsoy Eco Lodge",
    description: "Mashhur Sarmishsoy qoyatosh suratlari (petrogliflar) yodgorligiga yaqin tabiat qo'ynidagi eko-maskan. 7 ming yillik tarixga ega qoyatosh rasmlarini ko'rishni xohlovchilar uchun ideal to'xtash joyi. Past pog'onali yo'laklar va keksalar uchun qulay sharoit yaratilgan.",
    descriptionShort: "Sarmishsoy petrogliflariga yaqin eko-lodge.",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.6,
    reviewsCount: 41,
    location: { lat: 40.4550, lng: 65.4520 },
    address: "Sarmish darasi, Nurota tumani",
    city: "Nurota",
    country: "O'zbekiston",
    category: "resort",
    stars: 3,
    basePricePerNight: 480000,
    videoTour: "https://www.youtube.com/watch?v=F0m9n8-VvQc",
    amenities: ["Hiking", "Traditional Food", "Parking", "Bonfire"],
    accessibility: {
      mobility: { wheelchairAccessible: true, stepFreeRoute: true, rampSlopeDegree: 6, accessibleRooms: true, accessibleParking: true, accessibleToilet: true },
      visual: { highContrastSignage: true },
      auditory: { audioGuides: true, vibrationAlerts: true },
      cognitive: { quietZones: true, sensoryFriendlyHours: true },
      support: { serviceAnimalFriendly: true, supportPersonPolicy: true }
    },
    familyAndElderly: { strollerAccessible: true, orthopedicBeddingAvailable: true, grabBarsInBathroom: true },
    atmosphere: {
      mood: "Tabiat bilan uyg'un",
      soundscape: "Tong pallasida qushlar sayrashi va daraning sukunati",
      localTip: "Quyosh botishidan oldin petrogliflarga boring — yorug'lik tushishi rasmni yaqqol ko'rsatadi."
    },
    nearbyPlaces: ["Sarmishsoy petrogliflari (0.8 km)", "Nurota tog' yodgorligi", "Qoratog' qoyatosh suratlari"],
    rooms: [
      { name: "Tog' bungalosi", roomType: "Double Room", category: "Standard", capacity: 2, pricePerNight: 480000, roomsAvailable: 8, totalRooms: 10, areaSqMeters: 24, bedType: "double bed", bathroomType: "private",
        roomAccessibility: { grabBars: true, wideDoorways: true, lowerBedHeight: true } }
    ],
    paymentMethods: ["Payme", "Naqd"],
    approved: true
  },

  // ═══════════════════════════════════════════════════════════
  // 2-TUMAN: XATIRCHI — Polkan baxshi xotira majmuasi
  // ═══════════════════════════════════════════════════════════
  {
    name: "Xatirchi Mehmon Saroyi",
    description: "Xatirchi tumani markazida, mashhur xalq baxshisi Polkan va shoir Amirqul Polkan xotirasiga bag'ishlangan majmuaga yaqin joylashgan milliy uslubdagi mehmon uyi. Mahalliy madaniyat va baxshichilik san'ati bilan tanishmoqchi bo'lgan sayohatchilar uchun qulay. To'liq inklyuziv jihozlangan.",
    descriptionShort: "Polkan baxshi majmuasiga yaqin milliy mehmon uyi.",
    images: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.5,
    reviewsCount: 33,
    location: { lat: 40.2510, lng: 65.9560 },
    address: "Yangirabot shaharchasi, Mustaqillik ko'chasi 12",
    city: "Xatirchi",
    country: "O'zbekiston",
    category: "hotel",
    stars: 3,
    basePricePerNight: 390000,
    checkIn: "14:00",
    checkOut: "12:00",
    videoTour: "https://www.youtube.com/embed/ZZyBG6UsvoQ?si=CgyfEmVFMkvi6C-b",
    amenities: ["Free WiFi", "Restaurant", "Parking", "Traditional Food"],
    security: ["CCTV", "24/7 Qo'riqlash"],
    accessibility: {
      mobility: { wheelchairAccessible: true, stepFreeRoute: true, rampSlopeDegree: 7, accessibleRooms: true, accessibleParking: true, accessibleToilet: true },
      visual: { brailleSigns: true, highContrastSignage: true },
      auditory: { audioGuides: true, signLanguageStaff: true, vibrationAlerts: true },
      cognitive: { quietZones: true, easyToReadSignage: true, consistentLayout: true },
      support: { serviceAnimalFriendly: true, supportPersonPolicy: true, supportContact: "+998 79 445 22 33" }
    },
    familyAndElderly: { strollerAccessible: true, medicalServiceOnSite: true, nursingRoom: true, orthopedicBeddingAvailable: true, grabBarsInBathroom: true },
    atmosphere: {
      mood: "Milliy va mehmondo'st",
      soundscape: "Kechqurun hovlidan taralayotgan dutor sadosi",
      bestTimeOfDay: "Kechki payt — baxshichilik dasturlari shu vaqtda bo'ladi",
      localTip: "Mahalliy oshxonada tandir nonni issig'ida tatib ko'ring."
    },
    nearbyPlaces: ["Polkan baxshi xotira majmuasi (0.6 km)", "Xatirchi tarixiy markazi", "Zarafshon daryosi sohili"],
    rooms: [
      { name: "Inklyuziv Standart", roomType: "Double Room", category: "Comfort", capacity: 2, pricePerNight: 390000, roomsAvailable: 7, totalRooms: 14, areaSqMeters: 28, bedType: "double bed", bathroomType: "private",
        roomAccessibility: { hasEmergencyCord: true, grabBars: true, wideDoorways: true, visualAlarms: true, rollInShower: true, lowerBedHeight: true } },
      { name: "Single qulay", roomType: "Single Room", category: "Standard", capacity: 1, pricePerNight: 250000, roomsAvailable: 10, totalRooms: 20, areaSqMeters: 18, bedType: "single bed", bathroomType: "private" }
    ],
    paymentMethods: ["Click", "Payme", "Naqd", "Uzum Bank"],
    approved: true
  },

  // ═══════════════════════════════════════════════════════════
  // 3-TUMAN: QIZILTEPA — Toshmasjid majmuasi, Xoja Boyazid Bistomiy maqbarasi
  // ═══════════════════════════════════════════════════════════
  {
    name: "Qiziltepa Karvonsaroy Hotel",
    description: "Qiziltepa tumanidagi tarixiy Toshmasjid majmuasi (XVI–XIX asrlar) va Xoja Boyazid Bistomiy maqbarasiga yaqin, karvonsaroy uslubida qurilgan mehmonxona. Buyuk Ipak yo'li merosini his qilmoqchi bo'lgan barcha sayohatchilar uchun qulay va inklyuziv sharoit.",
    descriptionShort: "Toshmasjid majmuasiga yaqin karvonsaroy mehmonxona.",
    images: [
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.4,
    reviewsCount: 28,
    location: { lat: 40.0067, lng: 64.8467 },
    address: "Vangozi qishlog'i yo'nalishi, Qiziltepa",
    city: "Qiziltepa",
    country: "O'zbekiston",
    category: "hotel",
    stars: 3,
    basePricePerNight: 420000,
    checkIn: "14:00",
    checkOut: "12:00",
    videoTour: "https://www.youtube.com/watch?v=vV_X1xR-oO8",
    amenities: ["Free WiFi", "Restaurant", "Parking", "Air Conditioning"],
    security: ["CCTV", "Yong'in o'chirish tizimi", "24/7 Qo'riqlash"],
    accessibility: {
      mobility: { wheelchairAccessible: true, stepFreeRoute: true, rampSlopeDegree: 6, elevatorWidthCm: 100, accessibleRooms: true, accessibleParking: true, accessibleToilet: true },
      visual: { brailleSigns: true, tactilePaving: true, highContrastSignage: true },
      auditory: { audioGuides: true, hearingLoop: true, signLanguageStaff: true },
      cognitive: { quietZones: true, easyToReadSignage: true, consistentLayout: true, sensoryFriendlyHours: true },
      support: { serviceAnimalFriendly: true, supportPersonPolicy: true, supportContact: "+998 79 552 33 44" }
    },
    familyAndElderly: { strollerAccessible: true, medicalServiceOnSite: true, orthopedicBeddingAvailable: true, grabBarsInBathroom: true },
    atmosphere: {
      mood: "Tarixiy va sokin",
      soundscape: "Eski karvonsaroy hovlisidagi sukunat va shamol",
      bestTimeOfDay: "Tushdan keyin — Toshmasjid yorug'likda go'zal ko'rinadi",
      localTip: "Vangozi qishlog'idagi qadimiy Toshmasjid me'morchiligiga alohida e'tibor bering."
    },
    nearbyPlaces: ["Toshmasjid majmuasi, Vangozi (1.0 km)", "Xoja Boyazid Bistomiy maqbarasi", "Qadimiy So'g'd manzilgohi xarobalari"],
    rooms: [
      { name: "Inklyuziv Standart", roomType: "Double Room", category: "Comfort", capacity: 2, pricePerNight: 420000, roomsAvailable: 9, totalRooms: 18, areaSqMeters: 30, bedType: "double bed", bathroomType: "private",
        roomAccessibility: { hasEmergencyCord: true, grabBars: true, wideDoorways: true, visualAlarms: true, rollInShower: true } },
      { name: "Oilaviy xona", roomType: "Family Room", category: "Deluxe", capacity: 4, pricePerNight: 780000, roomsAvailable: 4, totalRooms: 8, areaSqMeters: 48, bedType: "king size", bathroomType: "private" }
    ],
    paymentMethods: ["Click", "Payme", "Naqd"],
    approved: true
  },
  {
    name: "Bistomiy Guest House",
    description: "Xoja Boyazid Bistomiy maqbarasi yaqinidagi shinam oilaviy gostevoy uy. Arzon narx, samimiy xizmat va keksalar hamda nogironligi bo'lgan mehmonlar uchun maxsus qulayliklar. Ziyorat turizmi uchun ideal.",
    descriptionShort: "Bistomiy maqbarasiga yaqin arzon gostevoy uy.",
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=1000"
    ],
    rating: 4.3,
    reviewsCount: 19,
    location: { lat: 40.0180, lng: 64.8550 },
    address: "Qiziltepa shahri, Tinchlik ko'chasi 5",
    city: "Qiziltepa",
    country: "O'zbekiston",
    category: "hostel",
    stars: 2,
    basePricePerNight: 180000,
    videoTour: "https://www.youtube.com/watch?v=vV_X1xR-oO8",
    amenities: ["Free WiFi", "Shared Kitchen", "Parking"],
    accessibility: {
      mobility: { wheelchairAccessible: true, stepFreeRoute: true, rampSlopeDegree: 8, accessibleRooms: true, accessibleToilet: true },
      visual: { highContrastSignage: true },
      auditory: { vibrationAlerts: true },
      cognitive: { quietZones: true, easyToReadSignage: true },
      support: { serviceAnimalFriendly: true, supportPersonPolicy: true }
    },
    familyAndElderly: { strollerAccessible: true, orthopedicBeddingAvailable: true, grabBarsInBathroom: true },
    atmosphere: {
      mood: "Sokin va samimiy",
      localTip: "Maqbara ziyoratidan so'ng uy egasidan mahalliy choy marosimini so'rang."
    },
    nearbyPlaces: ["Xoja Boyazid Bistomiy maqbarasi (0.5 km)", "Toshmasjid majmuasi", "Qiziltepa markaziy bozori"],
    rooms: [
      { name: "Qulay xona", roomType: "Double Room", category: "Standard", capacity: 2, pricePerNight: 180000, roomsAvailable: 5, totalRooms: 8, areaSqMeters: 20, bedType: "double bed", bathroomType: "shared",
        roomAccessibility: { grabBars: true, wideDoorways: true, lowerBedHeight: true } }
    ],
    paymentMethods: ["Payme", "Naqd"],
    approved: true
  }
];

/**
 * Tarixiy / diqqatga sazovor joylar (Attraction) — egasiz, admin qo'shadi.
 * Har biri 360° video, "atrofda nima bor" va koordinatalar bilan.
 * Koordinatalar yuqoridagi mehmonxonalarga yaqin tanlangan (10 km ichida).
 */
const mockAttractions = [
  // ── NUROTA ──
  {
    name: "Nurota Chashma majmuasi",
    district: "Nurota",
    description: "Nurota shahridagi muqaddas buloq va ziyoratgoh majmuasi. Afsonaga ko'ra buloq Hazrati Ali tomonidan paydo bo'lgan deyiladi. Majmuada qadimiy masjid, hammom va muqaddas baliqlar yashaydigan tiniq suvli hovuz mavjud. Yil davomida minglab ziyoratchi va sayyoh tashrif buyuradi.",
    descriptionShort: "Muqaddas buloq, qadimiy masjid va muqaddas baliqlar.",
    images: [
      "https://images.unsplash.com/photo-1590060766050-3ef0d4a8f7a6?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=1000"
    ],
    video360: { url: "https://www.youtube.com/watch?v=ZZyBG6UsvoQ", type: "youtube", captioned: true },
    thingsToSeeAround: [
      { title: "Muqaddas baliqlar hovuzi", description: "Asrlar davomida muhofaza qilinadigan marinka baliqlari.", type: "diniy", walkingMinutes: 2 },
      { title: "Nur qal'asi xarobalari", description: "Aleksandr Makedonskiy davriga oid qadimiy qal'a qoldiqlari.", type: "tarix", walkingMinutes: 15 },
      { title: "Hunarmandlar bozorchasi", description: "Mahalliy sovg'a va milliy taomlar.", type: "bozor", walkingMinutes: 5 }
    ],
    location: { lat: 40.5640, lng: 65.6895 },
    address: "Chashma ko'chasi, Nurota",
    accessibility: { wheelchairAccessible: true, accessibleParking: true, accessibleToilet: true, audioGuides: true, quietZones: true, serviceAnimalFriendly: true },
    atmosphere: {
      mood: "Tinch va ziyoratbop",
      soundscape: "Buloq suvining shildirashi va ziyoratchilar duosi",
      bestTimeOfDay: "Erta tong — eng salqin va sokin payt",
      localTip: "Buloqdagi muqaddas baliqlarni ovqatlantirish taqiqlanadi — faqat kuzating."
    },
    bestSeason: "Bahor va kuz",
    entryFee: "Bepul",
    rating: 4.9, reviewsCount: 0
  },
  {
    name: "Sarmishsoy qoyatosh suratlari",
    district: "Nurota",
    description: "Nurota tog'laridagi Sarmish darasida joylashgan ochiq osmon ostidagi muzey. Bu yerda 4 mingdan ortiq, ayrimlari 7 ming yillik tarixga ega petrogliflar — qoyatosh suratlari saqlangan. Suratlarda ov sahnalari, hayvonlar va qadimgi marosimlar tasvirlangan.",
    descriptionShort: "7 ming yillik petrogliflar ochiq osmon ostidagi muzey.",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1000"
    ],
    video360: { url: "https://www.youtube.com/watch?v=F0m9n8-VvQc", type: "youtube", captioned: false },
    thingsToSeeAround: [
      { title: "Ov sahnasi petrogliflari", description: "Qadimgi ovchilar va yovvoyi hayvonlar tasviri.", type: "tarix", walkingMinutes: 10 },
      { title: "Dara bo'ylab piyoda yo'l", description: "Tabiat qo'ynida sokin sayr.", type: "tabiat", walkingMinutes: 20 }
    ],
    location: { lat: 40.4555, lng: 65.4525 },
    address: "Sarmish darasi, Nurota tumani",
    accessibility: { accessibleParking: true, audioGuides: true, quietZones: true, serviceAnimalFriendly: true },
    atmosphere: {
      mood: "Tabiat bilan uyg'un, sirli",
      soundscape: "Daraning sukunati va shamol ovozi",
      bestTimeOfDay: "Quyosh botishidan oldin — suratlar yaqqol ko'rinadi",
      localTip: "Yoningizga suv va quyoshdan himoya oling — soyabon kam."
    },
    bestSeason: "Aprel–Iyun, Sentabr–Oktabr",
    entryFee: "20 000 so'm",
    rating: 4.7, reviewsCount: 0
  },
  // ── XATIRCHI ──
  {
    name: "Polkan baxshi xotira majmuasi",
    district: "Xatirchi",
    description: "Mashhur o'zbek xalq baxshisi Polkan (Qurbonnazar) va shoir Amirqul Polkan xotirasiga bag'ishlangan majmua. Bu yerda baxshichilik san'ati, dostonchilik an'analari va milliy musiqa merosi bilan tanishish mumkin. Majmua Xatirchi tumanining madaniy markazi hisoblanadi.",
    descriptionShort: "Baxshichilik va dostonchilik san'atiga bag'ishlangan majmua.",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000"
    ],
    video360: { url: "https://www.youtube.com/watch?v=ZZyBG6UsvoQ", type: "youtube", captioned: true },
    thingsToSeeAround: [
      { title: "Baxshichilik dasturlari", description: "Kechki paytlarda dutor jo'rligida dostonlar.", type: "tarix", walkingMinutes: 1 },
      { title: "Zarafshon daryosi sohili", description: "Daryo bo'yida sayr va dam olish.", type: "tabiat", walkingMinutes: 12 },
      { title: "Milliy taomlar oshxonasi", description: "Tandir non va mahalliy palov.", type: "ovqat", walkingMinutes: 3 }
    ],
    location: { lat: 40.2515, lng: 65.9565 },
    address: "Yangirabot shaharchasi, Xatirchi tumani",
    accessibility: { wheelchairAccessible: true, accessibleParking: true, accessibleToilet: true, brailleSigns: true, signLanguageStaff: true, audioGuides: true },
    atmosphere: {
      mood: "Milliy va mehmondo'st",
      soundscape: "Dutor sadosi va baxshi qo'shig'i",
      bestTimeOfDay: "Kechki payt — baxshichilik dasturlari vaqti",
      localTip: "Dasturlar odatda hafta oxiri kechqurun bo'ladi — oldindan so'rang."
    },
    bestSeason: "Bahor va kuz",
    entryFee: "Bepul",
    rating: 4.6, reviewsCount: 0
  },
  // ── QIZILTEPA ──
  {
    name: "Toshmasjid majmuasi (Vangozi)",
    district: "Qiziltepa",
    description: "Qiziltepa tumanidagi Vangozi qishlog'ida joylashgan XVI–XIX asrlarga oid tarixiy masjid majmuasi. Toshdan qurilgani uchun \"Toshmasjid\" deb ataladi. Buyuk Ipak yo'li merosi va o'sha davr me'morchiligining noyob namunasi.",
    descriptionShort: "XVI–XIX asrlarga oid noyob toshdan qurilgan masjid.",
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000"
    ],
    video360: { url: "https://www.youtube.com/watch?v=vV_X1xR-oO8", type: "youtube", captioned: false },
    thingsToSeeAround: [
      { title: "Qadimiy minora", description: "Masjid yonidagi tosh minora.", type: "tarix", walkingMinutes: 2 },
      { title: "So'g'd manzilgohi xarobalari", description: "Qadimiy So'g'd davriga oid arxeologik yodgorlik.", type: "tarix", walkingMinutes: 25 }
    ],
    location: { lat: 40.0072, lng: 64.8472 },
    address: "Vangozi qishlog'i, Qiziltepa tumani",
    accessibility: { wheelchairAccessible: true, accessibleParking: true, accessibleToilet: true, brailleSigns: true, audioGuides: true, quietZones: true, serviceAnimalFriendly: true },
    atmosphere: {
      mood: "Tarixiy va sokin",
      soundscape: "Eski hovlidagi sukunat va shamol",
      bestTimeOfDay: "Tushdan keyin — tosh devorlar yorug'likda go'zal ko'rinadi",
      localTip: "Me'moriy naqshlarga diqqat bering — har bir tosh qo'lda ishlangan."
    },
    bestSeason: "Mart–May, Sentabr–Noyabr",
    entryFee: "Bepul",
    rating: 4.5, reviewsCount: 0
  },
  {
    name: "Xoja Boyazid Bistomiy maqbarasi",
    district: "Qiziltepa",
    description: "Mashhur so'fiy avliyo Boyazid Bistomiy nomi bilan bog'liq ziyoratgoh. Mintaqadagi muhim ziyorat turizmi nuqtalaridan biri. Sokin muhiti va ma'naviy ahamiyati bilan ziyoratchilarni o'ziga jalb etadi.",
    descriptionShort: "So'fiylik bilan bog'liq muhim ziyoratgoh.",
    images: [
      "https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&q=80&w=1000"
    ],
    video360: { url: "https://www.youtube.com/watch?v=vV_X1xR-oO8", type: "youtube", captioned: false },
    thingsToSeeAround: [
      { title: "Ziyoratgoh hovlisi", description: "Sokin bog' va dam olish maydoni.", type: "diniy", walkingMinutes: 2 },
      { title: "Qiziltepa markaziy bozori", description: "Mahalliy mevalar va hunarmandchilik.", type: "bozor", walkingMinutes: 15 }
    ],
    location: { lat: 40.0185, lng: 64.8555 },
    address: "Qiziltepa shahri",
    accessibility: { wheelchairAccessible: true, accessibleParking: true, accessibleToilet: true, quietZones: true, serviceAnimalFriendly: true },
    atmosphere: {
      mood: "Sokin va ma'naviy",
      soundscape: "Bog'dagi qush sayrashi va shamol",
      bestTimeOfDay: "Erta tong yoki kechqurun",
      localTip: "Ziyoratdan so'ng mahalliy choyxonada choy marosimini sinab ko'ring."
    },
    bestSeason: "Yil bo'yi",
    entryFee: "Bepul",
    rating: 4.4, reviewsCount: 0
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

    // ── Mehmonxonalar (3 tuman: Nurota, Xatirchi, Qiziltepa) ──────
    await Hotel.deleteMany({});
    const hotelsData = mockHotels.map(h => ({
      ...h,
      owner: owner._id,
      // city allaqachon tuman nomi — uni rasmiy district maydoniga ko'chiramiz
      district: h.city,
      // GeoJSON Point (yaqin tarixiy joy/maskan topish uchun)
      geo: (h.location?.lat && h.location?.lng)
        ? { type: 'Point', coordinates: [h.location.lng, h.location.lat] }
        : undefined,
      // videoTour string bo'lsa — obyekt ko'rinishiga keltiramiz
      videoTour: typeof h.videoTour === 'string'
        ? { url: h.videoTour, captioned: false }
        : h.videoTour,
    }));
    await Hotel.insertMany(hotelsData);

    // ── Tarixiy / diqqatga sazovor joylar ────────────────────────
    await Attraction.deleteMany({});
    const attractionsData = mockAttractions.map(a => ({
      ...a,
      createdBy: admin._id,
      approved: true,
      geo: (a.location?.lat && a.location?.lng)
        ? { type: 'Point', coordinates: [a.location.lng, a.location.lat] }
        : undefined,
    }));
    await Attraction.insertMany(attractionsData);

    const districts = [...new Set(mockHotels.map(h => h.city))];
    console.log(`🏨 ${mockHotels.length} ta maskan qo'shildi`);
    console.log(`🏛️  ${mockAttractions.length} ta tarixiy joy qo'shildi`);
    console.log(`🗺️  ${districts.length} ta hudud: ${districts.join(', ')}`);
    console.log('✅ Seed muvaffaqiyatli yakunlandi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed xatosi:', error.message);
    process.exit(1);
  }
};

seedDatabase();
