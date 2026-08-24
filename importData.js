import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Attraction from './models/Attraction.js';
import Hotel from './models/Hotel.js';
import User from './models/User.js';

dotenv.config();

// ── Toifalar bo'yicha mos Unsplash rasmlar ──
const IMAGES = {
  tarixiy: [
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1599818816949-34070a7b4097?auto=format&fit=crop&q=80&w=1000'
  ],
  ziyoratgoh: [
    'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000'
  ],
  tabiat: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000'
  ],
  istirohat_bogi: [
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=1000'
  ],
  madaniy: [
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=1000'
  ],
  kasalxona: [
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000'
  ],
  iib: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&q=80&w=1000'
  ],
  hokimiyat: [
    'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=1000'
  ],
  transport: [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=1000'
  ],
  bozor: [
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1000'
  ],
  supermarket: [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1000'
  ],
  mall: [
    'https://images.unsplash.com/photo-1567449303078-57ad995bd301?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&q=80&w=1000'
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'
  ],
  resort: [
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=1000'
  ],
  guesthouse: [
    'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&q=80&w=1000'
  ],
  boutique: [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1000'
  ]
};

// 🏛️ 1. DIQQATGA SAZOVOR JOYLAR (35 ta)
const ATTRACTIONS_1 = [
  {
    name: "Nurota Chashma majmuasi",
    district: "Nurota",
    category: "ziyoratgoh",
    lat: 40.5640, lng: 65.6895,
    address: "Chashma ko'chasi, Nurota shahri",
    descriptionShort: "Muqaddas shifobaxsh buloq, qadimiy Chilustun masjidi va muqaddas marinka baliqlari hovuzi.",
    bestSeason: "Bahor va Kuz",
    thingsToSeeAround: [
      { title: "Muqaddas baliqlar hovuzi", walkingMinutes: 2, type: 'diniy' },
      { title: "Nur qal'asi xarobalari", walkingMinutes: 15, type: 'tarix' },
      { title: "Hunarmandlar rastasi", walkingMinutes: 5, type: 'bozor' }
    ],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, accessibleParking: true, audioGuides: true, quietZones: true },
    atmosphere: { mood: "Sokin va ziyoratbop", localTip: "Erta tongda tashrif buyuring, baliqlarni ovqatlantirish mumkin emas." }
  },
  {
    name: "Nur qal'asi (Makedonskiy qal'asi)",
    district: "Nurota",
    category: "tarixiy",
    lat: 40.5678, lng: 65.6912,
    address: "Tog' etagi, Nurota shahri",
    descriptionShort: "Miloddan avvalgi IV asrda Aleksandr Makedonskiy tomonidan qurilgan qadimiy harbiy istehkom xarobalari.",
    bestSeason: "Mart–Iyun, Sentabr–Noyabr",
    thingsToSeeAround: [
      { title: "Chashma majmuasi", walkingMinutes: 12, type: 'diniy' },
      { title: "Qadimiy korizlar tizimi", walkingMinutes: 10, type: 'tarix' },
      { title: "Nurota panoramik kuzatuv nuqtasi", walkingMinutes: 5, type: 'tabiat' }
    ],
    accessibility: { accessibleParking: true, audioGuides: true },
    atmosphere: { mood: "Qadimiy va sirli", localTip: "Tepalikka chiqishda qulay poyabzal kiying, quyosh botishi ajoyib ko'rinadi." }
  },
  {
    name: "Sarmishsoy qoyatosh suratlari (Petrogliflar)",
    district: "Nurota",
    category: "tarixiy",
    lat: 40.4555, lng: 65.4525,
    address: "Sarmish darasi, Nurota tog' tizmasi",
    descriptionShort: "4000 dan ortiq 7000 yillik qadimiy petrogliflar — ochiq osmon ostidagi jahon ahamiyatiga ega muzey.",
    bestSeason: "Aprel–Iyun, Sentabr–Oktabr",
    thingsToSeeAround: [
      { title: "Ov sahnalari petrogliflari", walkingMinutes: 10, type: 'tarix' },
      { title: "Sarmish darasi sharsharasi", walkingMinutes: 25, type: 'tabiat' }
    ],
    accessibility: { accessibleParking: true, audioGuides: true, serviceAnimalFriendly: true, quietZones: true },
    atmosphere: { mood: "Tabiiy va tarixiy energetika", localTip: "Quyosh botishidan oldin boring, qiya yorug'likda suratlar juda tiniq ko'rinadi." }
  },
  {
    name: "Sentob qadimiy tog' qishlog'i",
    district: "Nurota",
    category: "tabiat",
    lat: 40.5820, lng: 66.0120,
    address: "Sentob qishlog'i, Nurota tog'lari",
    descriptionShort: "Qadimiy tosh uylar, yong'oqzorlar, tosh yo'laklar va qadimiy arab yozuvli qoyalar bilan mashhur UNESCO ekoturizm qishlog'i.",
    bestSeason: "Aprel–Oktabr",
    thingsToSeeAround: [
      { title: "Sentobsoy darasi", walkingMinutes: 5, type: 'tabiat' },
      { title: "Qadimiy tosh qal'a qoldiqlari", walkingMinutes: 20, type: 'tarix' }
    ],
    accessibility: { accessibleParking: true, audioGuides: true, quietZones: true },
    atmosphere: { mood: "Etnik, osoyishta va xushmanzara", localTip: "Mahalliy aholining an'anaviy non va pishloqlaridan tatib ko'ring." }
  },
  {
    name: "Sayyod tog' darasi va sharsharasi",
    district: "Nurota",
    category: "tabiat",
    lat: 40.5430, lng: 65.9210,
    address: "Sayyod qishlog'i, Nurota",
    descriptionShort: "Nurota tog'larining go'zal darasi, musaffo tog' sharsharalari va shifobaxsh archazorlar maskani.",
    bestSeason: "May–Sentabr",
    thingsToSeeAround: [
      { title: "Sayyod sharsharasi", walkingMinutes: 15, type: 'tabiat' },
      { title: "Qadimiy archazor", walkingMinutes: 10, type: 'tabiat' }
    ],
    accessibility: { accessibleParking: true, audioGuides: true, quietZones: true },
    atmosphere: { mood: "Tetiklantiruvchi va salqin tog' havosi", localTip: "Yozning issiq kunlarida salqinlanish uchun eng yaxshi manzil." }
  },
  {
    name: "Hazrati Eshon xalifa ziyoratgohi",
    district: "Nurota",
    category: "ziyoratgoh",
    lat: 40.5710, lng: 65.6950,
    address: "Eshon xalifa mahallasi, Nurota",
    descriptionShort: "Mashhur tariqat ulamolari ziyoratgohi, qadimiy maqbara, ko'kalamzor sokin bog' va tabarruk qadamjo.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [
      { title: "Ziyoratgoh hovlisi", walkingMinutes: 1, type: 'diniy' },
      { title: "Qadimiy chashma suvi", walkingMinutes: 5, type: 'tabiat' }
    ],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, accessibleParking: true },
    atmosphere: { mood: "Sokin, fayzli va ma'naviy osoyishtalik", localTip: "Bog'dagi ko'p yillik chinorlar soyasida hordiq chiqaring." }
  },
  {
    name: "Qadimiy Korizlar yerosti gidrotexnik tizimi",
    district: "Nurota",
    category: "tarixiy",
    lat: 40.5610, lng: 65.6840,
    address: "Nurota shahar chekkasi",
    descriptionShort: "Aleksandr Makedonskiy davridan qolgan 2500 yillik qadimiy yerosti suv quvurlari va quduqlar tizimi.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Koriz kuzatuv qudug'i", walkingMinutes: 1, type: 'tarix' }],
    accessibility: { accessibleParking: true, audioGuides: true },
    atmosphere: { mood: "Muhandislik hayrati va qadimiy tarix", localTip: "Yerosti suvlari oqimini kuzatish uchun maxsus tushish joyidan foydalaning." }
  },
  {
    name: "Dehibaland qadimiy jome masjidi",
    district: "Nurota",
    category: "ziyoratgoh",
    lat: 40.5690, lng: 65.7020,
    address: "Dehibaland mahallasi, Nurota",
    descriptionShort: "XVI asrga oid nafis yog'och o'ymakorligi va qadimiy ustunlari bilan ajralib turuvchi me'moriy yodgorlik.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Qadimiy Dehibaland ko'chalari", walkingMinutes: 3, type: 'tarix' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true },
    atmosphere: { mood: "Sokin va tarixiy yog'och o'ymakorlik san'ati" }
  },
  {
    name: "Chilustun va Panjvaxte masjidlari majmuasi",
    district: "Nurota",
    category: "ziyoratgoh",
    lat: 40.5638, lng: 65.6890,
    address: "Chashma majmuasi ichida, Nurota",
    descriptionShort: "IX-XVI asrlarga oid 40 ustunli qadimiy masjid va Panjvaxte masjidi — Nurotaning eng qadimiy ibodatgohlari.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Chashma bulog'i", walkingMinutes: 1, type: 'diniy' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, brailleSigns: true },
    atmosphere: { mood: "Muqaddas, sokin va salobatli" }
  },
  {
    name: "Osrafsoy darasi va tog' petrogliflari",
    district: "Nurota",
    category: "tabiat",
    lat: 40.5120, lng: 65.8420,
    address: "Osraf qishlog'i, Nurota tog'lari",
    descriptionShort: "Nurota tog' tizmasidagi xushmanzara dara, shifobaxsh archazorlar va qadimgi ov sahnalari aks etgan tosh suratlari.",
    bestSeason: "Aprel–Oktabr",
    thingsToSeeAround: [{ title: "Osraf bulog'i", walkingMinutes: 5, type: 'tabiat' }],
    accessibility: { accessibleParking: true },
    atmosphere: { mood: "Toza tog' havosi va yovvoyi tabiat" }
  },
  {
    name: "Aydarko'l Nurota sohili",
    district: "Nurota",
    category: "tabiat",
    lat: 40.8520, lng: 66.1240,
    address: "Qizilqum va Nurota tutashmasi",
    descriptionShort: "Moviy suvli ulkan cho'l dengizi — Aydarko'l sohili, qum plyajlari, baliq ovlash va tuyalarda sayr qilish maskani.",
    bestSeason: "Aprel–Oktabr",
    thingsToSeeAround: [{ title: "O'tovlar oromgohi", walkingMinutes: 2, type: 'tabiat' }],
    accessibility: { accessibleParking: true, quietZones: true },
    atmosphere: { mood: "Dengiz kabi bepoyon, erkin va hayratlanarli", localTip: "Quyosh botishini ko'l sohilida tomosha qilish unutilmas xotira beradi." }
  },
  {
    name: "Polkan baxshi xotira majmuasi",
    district: "Xatirchi",
    category: "madaniy",
    lat: 40.2515, lng: 65.9565,
    address: "Yangirabot shaharchasi, Xatirchi tumani",
    descriptionShort: "O'zbek xalq dostonchilik san'ati va mashhur baxshi Polkan shoir merosiga bag'ishlangan madaniyat maskani.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Baxshichilik maktabi", walkingMinutes: 2, type: 'madaniy' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, audioGuides: true },
    atmosphere: { mood: "Baxshiyona, milliy va tantanavor" }
  },
  {
    name: "Sangijumon (Tebranma toshlar) yodgorligi",
    district: "Xatirchi",
    category: "tabiat",
    lat: 40.3345, lng: 66.0820,
    address: "Sangijumon qishlog'i, Xatirchi",
    descriptionShort: "Tabiat mo'jizasi — bir barmoq turtkisi bilan tebranuvchi ulkan granit xarsangtoshlar va shifobaxsh buloqlar darasi.",
    bestSeason: "Aprel–Iyun, Sentabr–Oktabr",
    thingsToSeeAround: [{ title: "Sangijumon soy sharsharasi", walkingMinutes: 15, type: 'tabiat' }],
    accessibility: { accessibleParking: true, audioGuides: true, quietZones: true },
    atmosphere: { mood: "Hayratlanarli, toza tog' havosi", localTip: "Tebranuvchi toshni o'z qo'lingiz bilan tebratib ko'ring." }
  },
  {
    name: "Langar ota ziyoratgohi va turizm qishlog'i",
    district: "Xatirchi",
    category: "ziyoratgoh",
    lat: 40.2890, lng: 65.8912,
    address: "Langar qishlog'i, Xatirchi",
    descriptionShort: "XVI asrga oid qadimiy masjid, maqbara va so'fiylik tariqati allomalari mangu qo'nim topgan tog' turizm qishlog'i.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Qadimiy Langar masjidi", walkingMinutes: 1, type: 'diniy' }],
    accessibility: { accessibleParking: true, accessibleToilet: true },
    atmosphere: { mood: "Sokin, viqorli va ma'naviy" }
  },
  {
    name: "Angidon turizm qishlog'i va sharsharasi",
    district: "Xatirchi",
    category: "tabiat",
    lat: 40.3520, lng: 66.0450,
    address: "Angidon qishlog'i, Xatirchi tog'lari",
    descriptionShort: "Xatirchining eng go'zal tog' turizm maskanlaridan biri — musaffo havo, sharshara, yong'oqzorlar va milliy mehmondo'stlik.",
    bestSeason: "May–Oktabr",
    thingsToSeeAround: [{ title: "Angidon sharsharasi", walkingMinutes: 10, type: 'tabiat' }],
    accessibility: { accessibleParking: true, quietZones: true },
    atmosphere: { mood: "Ekoturizm, yashil tabiat va sokinlik" }
  },
  {
    name: "Oltinsoy shifobaxsh mineral buloqlari",
    district: "Xatirchi",
    category: "tabiat",
    lat: 40.3120, lng: 66.0120,
    address: "Oltinsoy hududi, Xatirchi",
    descriptionShort: "Tabiiy mineral shifobaxsh yerosti suvlari, davolovchi buloqlar va sanatoriy-profilaktika maskani.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Shifobaxsh suv qabul qilish punkti", walkingMinutes: 1, type: 'tabiat' }],
    accessibility: { wheelchairAccessible: true, accessibleParking: true },
    atmosphere: { mood: "Sog'lomlashtiruvchi, orombaxsh" }
  },
  {
    name: "Xoja Ahmad Samarqandiy maqbarasi",
    district: "Xatirchi",
    category: "ziyoratgoh",
    lat: 40.2640, lng: 65.9420,
    address: "Samarqandiy mahallasi, Xatirchi",
    descriptionShort: "XIV-XV asrlarga oid tabarruk ziyoratgoh, qadimiy maqbara va ko'p yillik mevali bog'lar hududi.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Ziyoratgoh xiyoboni", walkingMinutes: 2, type: 'diniy' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, accessibleParking: true },
    atmosphere: { mood: "Ma'naviy xotirjamlik va fayz" }
  },
  {
    name: "Chashtepa arxeologik yodgorligi",
    district: "Xatirchi",
    category: "tarixiy",
    lat: 40.2450, lng: 65.9620,
    address: "Yangirabot yaqini, Xatirchi",
    descriptionShort: "Buxoro amirligi davridagi Xatirchi bekligi ark saroyi va qadimiy shaharsozlik mudofaa istehkomi qoldiqlari.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Tarixiy beklik xiyoboni", walkingMinutes: 4, type: 'tarix' }],
    accessibility: { accessibleParking: true },
    atmosphere: { mood: "Qadimiy shaharsozlik va beklik tarixi" }
  },
  {
    name: "Oqtepa qadimiy qal'a manzilgohi",
    district: "Xatirchi",
    category: "tarixiy",
    lat: 40.2310, lng: 65.9780,
    address: "Oqtepa qishlog'i, Xatirchi",
    descriptionShort: "Ilk o'rta asrlarga oid arxeologik tepalik, qadimiy mudofaa qal'asi qoldiqlari va kulolchilik topilmalari maydoni.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Qadimiy kanal o'zani", walkingMinutes: 5, type: 'tarix' }],
    accessibility: { accessibleParking: true, audioGuides: true },
    atmosphere: { mood: "Qadimiy shaharsozlik va arxeologiya ruhiyati" }
  },
  {
    name: "Zarafshon to'qayzorlari va daryo sohili",
    district: "Xatirchi",
    category: "tabiat",
    lat: 40.2180, lng: 65.9320,
    address: "Zarafshon daryosi bo'yi, Xatirchi",
    descriptionShort: "Zarafshon daryosi bo'yidagi tabiiy to'qayzorlar, qushlar sayrashi, baliq ovi va dam olish maskani.",
    bestSeason: "May–Sentabr",
    thingsToSeeAround: [{ title: "Daryo bo'yi piknik maydoni", walkingMinutes: 1, type: 'tabiat' }],
    accessibility: { accessibleParking: true, quietZones: true },
    atmosphere: { mood: "Xushhavo, salqin va tabiiy" }
  },
  {
    name: "Toshmasjid majmuasi (Vangozi)",
    district: "Qiziltepa",
    category: "ziyoratgoh",
    lat: 40.0072, lng: 64.8472,
    address: "Vangozi qishlog'i, Qiziltepa tumani",
    descriptionShort: "XVI asrga oid toshdan barpo etilgan noyob masjid, qadimiy baland minora va madrasa majmuasi.",
    bestSeason: "Mart–May, Sentabr–Noyabr",
    thingsToSeeAround: [{ title: "Vangozi qadimiy minorasi", walkingMinutes: 1, type: 'tarix' }],
    accessibility: { accessibleParking: true, audioGuides: true, quietZones: true },
    atmosphere: { mood: "Qadimiy qishloq me'morchiligi nafasi" }
  },
  {
    name: "Xoja Boyazid Bistomiy ziyoratgohi va masjidi",
    district: "Qiziltepa",
    category: "ziyoratgoh",
    lat: 40.0185, lng: 64.8555,
    address: "Bo'ston mahallasi, Qiziltepa",
    descriptionShort: "Mashhur buyuk so'fiy alloma Boyazid Bistomiy (801–875) xotirasiga atalgan tinch va ko'kalamzor muqaddas ziyoratgoh.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Qiziltepa markaziy istirohat bog'i", walkingMinutes: 8, type: 'istirohat_bogi' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true },
    atmosphere: { mood: "Sokin va ma'naviy xotirjamlik" }
  },
  {
    name: "Qo'rg'on masjidi (Vangozi)",
    district: "Qiziltepa",
    category: "tarixiy",
    lat: 40.0085, lng: 64.8490,
    address: "Vangozi qishlog'i markazi, Qiziltepa",
    descriptionShort: "XVI asrga oid tarixiy mudofaa qo'rg'oni ichida joylashgan qadimiy masjid va arxitektura yodgorligi.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Toshmasjid", walkingMinutes: 2, type: 'ziyoratgoh' }],
    accessibility: { wheelchairAccessible: true, accessibleParking: true },
    atmosphere: { mood: "Tarixiy, salobatli va sokin" }
  },
  {
    name: "Yuqori mahalla tarixiy masjidi",
    district: "Qiziltepa",
    category: "ziyoratgoh",
    lat: 40.0150, lng: 64.8520,
    address: "Yuqori mahalla, Qiziltepa",
    descriptionShort: "XIX asrda barpo etilgan an'anaviy sharqona uslubdagi g'ishtin masjid va ayvonli milliy me'morlik namunasi.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Bistomiy ziyoratgohi", walkingMinutes: 5, type: 'ziyoratgoh' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true },
    atmosphere: { mood: "Samimiy, nuroniy va tinch" }
  },
  {
    name: "Qiziltepa tumani tarixi va o'lkashunoslik muzeyi",
    district: "Qiziltepa",
    category: "madaniy",
    lat: 40.0220, lng: 64.8580,
    address: "Mustaqillik ko'chasi 16, Qiziltepa",
    descriptionShort: "Qadimiy Ipak yo'li karvonlari, Vangozi tosh ustalari, qadimiy tangalar va kulolchilik ashyolari muzeyi.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Markaziy xiyobon", walkingMinutes: 2, type: 'istirohat_bogi' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, audioGuides: true },
    atmosphere: { mood: "Ilmiy, qiziqarli va ma'rifiy" }
  },
  {
    name: "Shohimardon ziyoratgohi",
    district: "Qiziltepa",
    category: "ziyoratgoh",
    lat: 40.0341, lng: 64.8123,
    address: "Zarmedan qishlog'i, Qiziltepa",
    descriptionShort: "Qadimiy tabiat va ziyorat maskani, shifobaxsh buloq suvlari va ko'p yillik chinorlar maskani.",
    bestSeason: "Bahor, Yoz",
    thingsToSeeAround: [{ title: "Zarmedan mevali bog'lari", walkingMinutes: 5, type: 'tabiat' }],
    accessibility: { wheelchairAccessible: true, accessibleParking: true, quietZones: true },
    atmosphere: { mood: "Tabiat va ziyorat uyg'unligi" }
  },
  {
    name: "To'dako'l dam olish maskani va sohili",
    district: "Qiziltepa",
    category: "tabiat",
    lat: 39.8540, lng: 64.8520,
    address: "To'dako'l sohili, Qiziltepa",
    descriptionShort: "Qiziltepa yaqinidagi go'zal ko'l, qumli sohillar, suv sporti, yaxta va dam olish oromgohi.",
    bestSeason: "May–Sentabr",
    thingsToSeeAround: [{ title: "To'dako'l plyaj zonasi", walkingMinutes: 1, type: 'tabiat' }],
    accessibility: { wheelchairAccessible: true, accessibleParking: true },
    atmosphere: { mood: "Dam olish, quyoshli plyaj va suv to'lqinlari" }
  },
  {
    name: "Rabot qadimiy ziyoratgohi",
    district: "Qiziltepa",
    category: "ziyoratgoh",
    lat: 40.0410, lng: 64.8820,
    address: "Rabot qishlog'i, Qiziltepa",
    descriptionShort: "Qadimiy karvon yo'lida joylashgan ziyoratgoh, asriy daraxtlar va qadimiy me'moriy qoldiqlar.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Qadimiy qishloq ko'chalari", walkingMinutes: 4, type: 'tarix' }],
    accessibility: { wheelchairAccessible: true, accessibleParking: true },
    atmosphere: { mood: "Sokin va nuroniy" }
  },
  {
    name: "Bo'ston qadimiy arxeologik tepaligi",
    district: "Qiziltepa",
    category: "tarixiy",
    lat: 40.0620, lng: 64.8210,
    address: "Bo'ston mahallasi, Qiziltepa",
    descriptionShort: "Antik va ilk o'rta asrlarga oid shaharsozlik va qadimiy dehqonchilik madaniyatidan darak beruvchi yodgorlik.",
    bestSeason: "Bahor, Kuz",
    thingsToSeeAround: [{ title: "Qadimiy kulolchilik qoldiqlari", walkingMinutes: 1, type: 'tarix' }],
    accessibility: { accessibleParking: true, audioGuides: true },
    atmosphere: { mood: "Sirli va tarixiy qatlamlar nafasi" }
  },
  {
    name: "Alisher Navoiy nomidagi Milliy bog' va Ko'l",
    district: "Navoiy shahri",
    category: "istirohat_bogi",
    lat: 40.0982, lng: 65.3725,
    address: "Islom Karimov ko'chasi, Navoiy shahri",
    descriptionShort: "Markaziy yirik sun'iy ko'l, favvoralar, dam olish xiyobonlari va madaniy tadbirlar maydoni.",
    bestSeason: "Aprel–Noyabr",
    thingsToSeeAround: [{ title: "Navoiy teatri", walkingMinutes: 6, type: 'madaniy' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, brailleSigns: true },
    atmosphere: { mood: "Zamonaviy, xushhavo va gavjum" }
  },
  {
    name: "Navoiy viloyat tarixi va o'lkashunoslik muzeyi",
    district: "Navoiy shahri",
    category: "madaniy",
    lat: 40.1044, lng: 65.3791,
    address: "Xalqlar do'stligi shoh ko'chasi, Navoiy",
    descriptionShort: "Qizilqum florasi, faunasi, konchilik tarixi, arxeologik topilmalar va petrogliflar nusxalari muzeyi.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "G'alaba bog'i", walkingMinutes: 5, type: 'istirohat_bogi' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, audioGuides: true, brailleSigns: true },
    atmosphere: { mood: "Ilmiy, ma'rifiy va qiziqarli" }
  },
  {
    name: "\"G'alaba\" madaniyat va istirohat bog'i",
    district: "Navoiy shahri",
    category: "istirohat_bogi",
    lat: 40.1070, lng: 65.3820,
    address: "G'alaba shoh ko'chasi, Navoiy shahri",
    descriptionShort: "Katta soya-salqin daraxtzorlar, zamonaviy attraksionlar, sport maydonchalari va xotira maydoni.",
    bestSeason: "Bahor, Yoz, Kuz",
    thingsToSeeAround: [{ title: "Tarix muzeyi", walkingMinutes: 5, type: 'madaniy' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true },
    atmosphere: { mood: "Shodmon, oilaviy va yashil tabiat qo'yni" }
  },
  {
    name: "Hazrat Alisher Navoiy memoriali va Amfiteatr",
    district: "Navoiy shahri",
    category: "madaniy",
    lat: 40.1015, lng: 65.3760,
    address: "Shahar markaziy maydoni, Navoiy",
    descriptionShort: "Buyuk mutafakkir Alisher Navoiyning mahobatli haykali, favvoralar kaskadi va ochiq osmon ostidagi amfiteatr.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Milliy bog'", walkingMinutes: 4, type: 'istirohat_bogi' }],
    accessibility: { wheelchairAccessible: true, accessibleParking: true },
    atmosphere: { mood: "Ulug'vor, shahar markaziy nafasi" }
  },
  {
    name: "\"Farhod\" madaniyat saroyi va Favvoralar xiyoboni",
    district: "Navoiy shahri",
    category: "madaniy",
    lat: 40.0950, lng: 65.3680,
    address: "Farhod ko'chasi, Navoiy",
    descriptionShort: "Shaharning tarixiy me'moriy durdonasi bo'lgan muhtasham madaniyat saroyi, teatr zallari va yorug'likli favvoralar.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Farhod bog'i", walkingMinutes: 2, type: 'istirohat_bogi' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, audioGuides: true },
    atmosphere: { mood: "Madaniy, klassik va estetik go'zallik" }
  },
  {
    name: "\"So'g'diyona\" madaniyat va sport majmuasi",
    district: "Navoiy shahri",
    category: "istirohat_bogi",
    lat: 40.0890, lng: 65.3610,
    address: "Janubiy xiyobon, Navoiy shahri",
    descriptionShort: "Suzish havzalari, yopiq sport arenalari, para-sportchilar uchun maxsus moslashtirilgan trenajyor zallari majmuasi.",
    bestSeason: "Yil bo'yi",
    thingsToSeeAround: [{ title: "Shahar stadioni", walkingMinutes: 3, type: 'istirohat_bogi' }],
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, brailleSigns: true, audioGuides: true },
    atmosphere: { mood: "Faol, sog'lom va do'stona" }
  }
];

// 🏥 2. INFRATUZILMA, KASALXONA, IIB, TRANSPORT VA SAVDO (36 ta)
const ATTRACTIONS_2 = [
  {
    name: "Respublika shoshilinch tez tibbiy yordam ilmiy markazi (Navoiy filiali)",
    district: "Navoiy shahri",
    category: "kasalxona",
    lat: 40.1085, lng: 65.3815,
    address: "Ibn Sino ko'chasi 6, Navoiy shahri",
    descriptionShort: "24/7 shoshilinch tibbiy yordam, jarrohlik, travmatologiya, reanimatsiya va qabul bo'limi.",
    phone: "103 / +998 79 224-03-03",
    workingHours: "24/7 uzluksiz",
    emergencyContact: "103",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, accessibleParking: true }
  },
  {
    name: "Navoiy viloyat Ichki ishlar boshqarmasi (Xavfsiz turizm bo'limi)",
    district: "Navoiy shahri",
    category: "iib",
    lat: 40.1030, lng: 65.3710,
    address: "Navoiy ko'chasi 7, Navoiy shahri",
    descriptionShort: "Sayyohlar xavfsizligini ta'minlash, xorijiy fuqarolarga ko'mak, yo'qolgan buyumlar va huquqiy yordam.",
    phone: "102 / +998 79 229-22-22",
    workingHours: "24/7 navbatchilik",
    emergencyContact: "102",
    accessibility: { wheelchairAccessible: true }
  },
  {
    name: "Navoiy shahar Hokimiyati",
    district: "Navoiy shahri",
    category: "hokimiyat",
    lat: 40.1005, lng: 65.3755,
    address: "Amir Temur ko'chasi 2, Bunyodkor MFY",
    descriptionShort: "Shahar ma'muriy boshqarmasi, xalqaro hamkorlik va sayyohlik axborotlarini muvofiqlashtirish.",
    phone: "+998 79 223-20-00",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Navoiy xalqaro aeroporti (NVI)",
    district: "Navoiy shahri",
    category: "transport",
    lat: 40.1178, lng: 65.1750,
    address: "M37 trassasi, Navoiy",
    descriptionShort: "Xalqaro va mahalliy reyslar, VIP/CIP zallari, valyuta ayirboshlash, taksi va avtobus xizmati.",
    phone: "+998 79 220-40-00",
    workingHours: "Parvozlar jadvali bo'yicha 24/7",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, brailleSigns: true, audioGuides: true }
  },
  {
    name: "Navoiy Markaziy temir yo'l vokzali",
    district: "Navoiy shahri",
    category: "transport",
    lat: 40.1190, lng: 65.3645,
    address: "Hayot MFY, Vokzal ko'chasi 1",
    descriptionShort: "\"Afrosiyob\", \"Sharq\" tezyurar va xalqaro poyezdlar vokzali, bilet kassalari, kutish zali.",
    phone: "1005 / +998 79 225-12-22",
    workingHours: "24/7 ochiq",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Navoiy Markaziy dehqon bozori",
    district: "Navoiy shahri",
    category: "bozor",
    lat: 40.1065, lng: 65.3840,
    address: "G'alaba shoh ko'chasi, 17-mikrorayon",
    descriptionShort: "Yangi meva-sabzavotlar, quruq mevalar, milliy taomlar, hunarmandchilik suvenirlari va ziravorlar.",
    workingHours: "Har kuni 07:00–19:00 (Dushanba sanitariya)",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "\"Korzinka\" Supermarketi (8-mikrorayon)",
    district: "Navoiy shahri",
    category: "supermarket",
    lat: 40.0995, lng: 65.3740,
    address: "Islom Karimov shoh ko'chasi 27A, 8-mikrorayon",
    descriptionShort: "Shaharning eng yirik supermarketlaridan biri. Oziq-ovqat, tayyor taomlar, import tovarlar va bankomatlar.",
    phone: "+998 78 140-14-14",
    workingHours: "Har kuni 08:00–24:00",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "\"Korzinka\" Supermarketi (Navoiy markaz)",
    district: "Navoiy shahri",
    category: "supermarket",
    lat: 40.1035, lng: 65.3695,
    address: "Navoiy ko'chasi 45-B, Navoiy shahri",
    descriptionShort: "Yirik shahar supermarketi, yangi pishiriqlar, kofe-zona, xalqaro mahsulotlar va 24/7 bankomatlar.",
    phone: "+998 78 140-14-14",
    workingHours: "Har kuni 08:00–23:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "\"Istiqlol\" Savdo Majmuasi (Mega Mall)",
    district: "Navoiy shahri",
    category: "mall",
    lat: 40.1055, lng: 65.3785,
    address: "Xalqlar do'stligi shoh ko'chasi 20, Navoiy",
    descriptionShort: "Ko'p qavatli savdo majmuasi: kiyim-kechak butiklari, kosmetika, bolalar o'yingohi, fud-kort va kafelar.",
    workingHours: "Har kuni 09:00–22:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, accessibleParking: true }
  },
  {
    name: "\"Silk Road Mall\" Savdo-ko'ngilochar markazi",
    district: "Navoiy shahri",
    category: "mall",
    lat: 40.0985, lng: 65.3715,
    address: "Amir Temur ko'chasi 14, Navoiy",
    descriptionShort: "Zamonaviy savdo markazi: brend kiyimlar, maishiy texnika, kinozal, restoranlar va suvenir rastalari.",
    workingHours: "Har kuni 10:00–23:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, brailleSigns: true }
  },
  {
    name: "Navoiy shahar Davlat xizmatlari markazi",
    district: "Navoiy shahri",
    category: "hokimiyat",
    lat: 40.1020, lng: 65.3690,
    address: "Sadriddin Ayniy ko'chasi 27",
    descriptionShort: "SIM-karta rasmiylashtirish, xorijiy fuqarolarni ro'yxatga olish, notarial va turistik davlat xizmatlari.",
    phone: "1148",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, brailleSigns: true }
  },
  {
    name: "Nurota tuman tibbiyot birlashmasi (Shoshilinch yordam)",
    district: "Nurota",
    category: "kasalxona",
    lat: 40.5665, lng: 65.6860,
    address: "U. Yusupov ko'chasi 18, Nurota",
    descriptionShort: "Tuman markaziy shifoxonasi, 24/7 tez tibbiy yordam stansiyasi, dorixona va birinchi tibbiy yordam.",
    phone: "103 / +998 79 522-12-03",
    workingHours: "24/7 uzluksiz",
    emergencyContact: "103",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Nurota tuman Ichki ishlar bo'limi (Sayyohlar xavfsizlik posti)",
    district: "Nurota",
    category: "iib",
    lat: 40.5630, lng: 65.6880,
    address: "Islom Karimov ko'chasi 48, Nurota",
    descriptionShort: "Sayyohlarga yo'l ko'rsatish, jamoat xavfsizligini ta'minlash, 24/7 navbatchilik va huquqiy ko'mak.",
    phone: "102 / +998 79 522-10-02",
    workingHours: "24/7 navbatchilik",
    emergencyContact: "102",
    accessibility: { wheelchairAccessible: true }
  },
  {
    name: "Nurota tuman Hokimiyati",
    district: "Nurota",
    category: "hokimiyat",
    lat: 40.5655, lng: 65.6905,
    address: "X. Xudoyqulov ko'chasi 47, Nurota",
    descriptionShort: "Tuman ma'muriy organi, turizm va madaniy meros masalalari bo'limi.",
    phone: "+998 79 522-11-22",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "Nurota \"Istiqlol\" madaniyat va istirohat bog'i",
    district: "Nurota",
    category: "istirohat_bogi",
    lat: 40.5620, lng: 65.6870,
    address: "Mustaqillik ko'chasi, Nurota",
    descriptionShort: "Salqin xiyobonlar, bolalar maydonchasi, favvoralar, choyxona va oilaviy sayr qilish maskani.",
    workingHours: "Har kuni 06:00–23:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Nurota Markaziy dehqon bozori va Hunarmandlar rastasi",
    district: "Nurota",
    category: "bozor",
    lat: 40.5645, lng: 65.6920,
    address: "Chashma ko'chasi, Nurota",
    descriptionShort: "Nurotaning mashhur an'anaviy so'zana kashtachiligi, tabiiy tog' asalari, quruq mevalar va tandir nonlari.",
    workingHours: "Har kuni 07:00–18:00 (Ayniqsa yakshanba gavjum)",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "\"Nur Oazis\" Savdo Majmuasi va Supermarketi",
    district: "Nurota",
    category: "supermarket",
    lat: 40.5642, lng: 65.6905,
    address: "Chashma ko'chasi 15, Nurota",
    descriptionShort: "Nurota markazidagi universal savdo markazi: oziq-ovqat supermarketi, ichimliklar va 24/7 bankomat.",
    workingHours: "Har kuni 08:00–22:00",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "\"Chashma Mall\" Etnik va Sayyohlik Savdo Uyi",
    district: "Nurota",
    category: "mall",
    lat: 40.5635, lng: 65.6892,
    address: "Mustaqillik ko'chasi, Nurota",
    descriptionShort: "An'anaviy milliy kashtachilik mahsulotlari, esdalik sovg'alari, mineral shifobaxsh suvlar va milliy liboslar markazi.",
    workingHours: "Har kuni 08:30–21:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Nurota tuman Davlat xizmatlari markazi",
    district: "Nurota",
    category: "hokimiyat",
    lat: 40.5660, lng: 65.6890,
    address: "Islom Karimov ko'chasi, Nurota",
    descriptionShort: "Ro'yxatga olish, sayyohlar uchun ma'lumotlar, SIM-karta va tezkor davlat xizmatlari.",
    phone: "1148",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Xatirchi tuman tibbiyot birlashmasi (Shoshilinch yordam)",
    district: "Xatirchi",
    category: "kasalxona",
    lat: 40.2560, lng: 65.9520,
    address: "Yangirabot shaharchasi, M. Bobomurodov ko'chasi",
    descriptionShort: "24/7 tez tibbiy yordam, tuman markaziy kasalxonasi, travmatologiya va shoshilinch qabulxona.",
    phone: "103 / +998 79 542-12-03",
    workingHours: "24/7 uzluksiz",
    emergencyContact: "103",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Xatirchi tuman Ichki ishlar bo'limi (IIB)",
    district: "Xatirchi",
    category: "iib",
    lat: 40.2520, lng: 65.9540,
    address: "Yangirabot shaharchasi, Polkan ko'chasi",
    descriptionShort: "Jamoat xavfsizligini ta'minlash, 24/7 navbatchilik qismi, fuqarolar va sayyohlarni qabul qilish.",
    phone: "102 / +998 79 542-10-02",
    workingHours: "24/7 navbatchilik",
    emergencyContact: "102",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "Xatirchi tuman Hokimiyati",
    district: "Xatirchi",
    category: "hokimiyat",
    lat: 40.2530, lng: 65.9570,
    address: "Yangirabot shaharchasi, Mustaqillik ko'chasi 34",
    descriptionShort: "Tuman ma'muriy boshqaruv binosi, madaniyat va turizmni rivojlantirish bo'limi.",
    phone: "+998 79 542-11-22",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Xatirchi tuman Madaniyat va istirohat bog'i",
    district: "Xatirchi",
    category: "istirohat_bogi",
    lat: 40.2505, lng: 65.9550,
    address: "Mustaqillik shoh ko'chasi, Yangirabot",
    descriptionShort: "Katta chinorzorlar, ochiq amfiteatr, bolalar o'yingohlari, favvoralar va choyxonalar.",
    workingHours: "Har kuni 06:00–23:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Yangirabot Markaziy dehqon bozori",
    district: "Xatirchi",
    category: "bozor",
    lat: 40.2550, lng: 65.9590,
    address: "Bozor ko'chasi, Yangirabot",
    descriptionShort: "Yangi uzilgan mevalar, sabzavotlar, quritilgan mevalar, milliy tandir somsa va issiq nonlar rastasi.",
    workingHours: "Har kuni 07:00–18:00 (Shanba va yakshanba eng gavjum)",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "\"Imkon\" Savdo Markazi va Gipermarketi",
    district: "Xatirchi",
    category: "mall",
    lat: 40.2525, lng: 65.9555,
    address: "Yangirabot shaharchasi, Mustaqillik ko'chasi",
    descriptionShort: "Xatirchidagi eng yirik savdo majmualaridan biri: oziq-ovqat supermarketi, kiyim-kechak va bankomat.",
    workingHours: "Har kuni 08:00–22:00",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "Xatirchi Universal Savdo Majmuasi",
    district: "Xatirchi",
    category: "mall",
    lat: 40.2545, lng: 65.9585,
    address: "Damariq MFY, Ahmad Yassaviy ko'chasi",
    descriptionShort: "Katta universal savdo uyi, yangi mevalar, oziq-ovqat tovarlari, xo'jalik mollari va dorixona.",
    workingHours: "Har kuni 08:00–21:30",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "Xatirchi tuman Davlat xizmatlari markazi",
    district: "Xatirchi",
    category: "hokimiyat",
    lat: 40.2535, lng: 65.9575,
    address: "Mustaqillik ko'chasi, Yangirabot",
    descriptionShort: "Tezkor davlat xizmatlari, sayyohlik ma'lumotlari va rasmiy hujjatlarni ro'yxatga olish markazi.",
    phone: "1148",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Qiziltepa tuman tibbiyot birlashmasi (Shoshilinch yordam)",
    district: "Qiziltepa",
    category: "kasalxona",
    lat: 40.0165, lng: 64.8510,
    address: "Shifokorlar ko'chasi 1, Bo'ston MFY, Qiziltepa",
    descriptionShort: "24/7 tez tibbiy yordam, tuman markaziy shifoxonasi, jarrohlik, terapiya va dorixona tarmog'i.",
    phone: "103 / +998 79 552-12-03",
    workingHours: "24/7 uzluksiz",
    emergencyContact: "103",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Qiziltepa tuman Ichki ishlar bo'limi (IIB)",
    district: "Qiziltepa",
    category: "iib",
    lat: 40.0195, lng: 64.8540,
    address: "O'zbekiston shoh ko'chasi 4, Qiziltepa",
    descriptionShort: "Jamoat tartibini saqlash, 24/7 navbatchilik, xavfsizlik va sayyohlarga tezkor ko'mak.",
    phone: "102 / +998 79 552-10-02",
    workingHours: "24/7 navbatchilik",
    emergencyContact: "102",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "Qiziltepa tuman Hokimiyati",
    district: "Qiziltepa",
    category: "hokimiyat",
    lat: 40.0190, lng: 64.8560,
    address: "O'zbekiston shoh ko'chasi, Qiziltepa",
    descriptionShort: "Tuman ma'muriy markazi, madaniyat, ziyorat turizmi va ijtimoiy sohalar boshqarmasi.",
    phone: "+998 79 552-11-22",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Qiziltepa temir yo'l vokzali",
    district: "Qiziltepa",
    category: "transport",
    lat: 40.0360, lng: 64.8500,
    address: "Gulzor MFY, Vokzal ko'chasi, Qiziltepa",
    descriptionShort: "Toshkent–Buxoro yo'nalishidagi poyezdlar to'xtash punkti, chiptalar sotish kassasi va kutish zali.",
    phone: "1005",
    workingHours: "Poyezdlar jadvali bo'yicha 24/7",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Qiziltepa \"Yoshlik\" madaniyat va istirohat bog'i",
    district: "Qiziltepa",
    category: "istirohat_bogi",
    lat: 40.0175, lng: 64.8530,
    address: "Mustaqillik ko'chasi, Qiziltepa",
    descriptionShort: "Soya-salqin xiyobonlar, zamonaviy favvoralar, bolalar attraksionlari, choyxona va sayrgoh.",
    workingHours: "Har kuni 06:00–23:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  },
  {
    name: "Qiziltepa Markaziy dehqon bozori",
    district: "Qiziltepa",
    category: "bozor",
    lat: 40.0205, lng: 64.8570,
    address: "Bozor ko'chasi, Qiziltepa",
    descriptionShort: "Mashhur Vang'ozi va Qiziltepa uzumlari, anorlar, yangi mevalar va hunarmandchilik rastasi.",
    workingHours: "Har kuni 07:00–18:00 (Chorshanba va yakshanba eng gavjum)",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "\"Bazaar Market\" Supermarketi",
    district: "Qiziltepa",
    category: "supermarket",
    lat: 40.0192, lng: 64.8545,
    address: "Bo'ston MFY, O'zbekiston shoh ko'chasi",
    descriptionShort: "Qiziltepa markazidagi zamonaviy supermarket: oziq-ovqat, sarxil ichimliklar va bankomat.",
    workingHours: "Har kuni 08:00–23:00",
    accessibility: { wheelchairAccessible: true, accessibleParking: true }
  },
  {
    name: "Qiziltepa Mega Savdo Majmuasi",
    district: "Qiziltepa",
    category: "mall",
    lat: 40.0215, lng: 64.8575,
    address: "Mustaqillik ko'chasi 22, Qiziltepa",
    descriptionShort: "Ko'p tarmoqli savdo markazi: kiyim-kechak, maishiy anjomlar, elektronika do'koni va fud-zona.",
    workingHours: "Har kuni 08:30–22:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true, accessibleParking: true }
  },
  {
    name: "Qiziltepa tuman Davlat xizmatlari markazi",
    district: "Qiziltepa",
    category: "hokimiyat",
    lat: 40.0188, lng: 64.8550,
    address: "O'zbekiston ko'chasi, Qiziltepa",
    descriptionShort: "SIM-kartalar rasmiylashtirish, xorijiy mehmonlar ro'yxati va tezkor davlat xizmatlari.",
    phone: "1148",
    workingHours: "Dush–Jum 09:00–18:00",
    accessibility: { wheelchairAccessible: true, accessibleToilet: true }
  }
];

// 🏨 3. MEHMONXONALAR VA DAM OLISH MASKANLARI (22 ta)
const HOTELS = [
  {
    name: "Nurota Chashma Resort",
    district: "Nurota",
    category: "resort",
    stars: 4,
    lat: 40.5635, lng: 65.6889,
    address: "Chashma ko'chasi, 7-uy, Nurota",
    descriptionShort: "Chashma majmuasiga 200m masofadagi barcha qulayliklarga ega zamonaviy inklyuziv dam olish maskani.",
    basePricePerNight: 720000,
    amenities: ["Free WiFi", "Restaurant", "Parking", "Air Conditioning"],
    accessibility: {
      mobility: { wheelchairAccessible: true, stepFreeRoute: true, rampSlopeDegree: 5, elevatorWidthCm: 110, accessibleRooms: true, accessibleParking: true, accessibleToilet: true },
      visual: { brailleSigns: true, tactilePaving: true },
      auditory: { audioGuides: true, signLanguageStaff: true },
      support: { serviceAnimalFriendly: true }
    }
  },
  {
    name: "Sarmishsoy Eco Lodge",
    district: "Nurota",
    category: "resort",
    stars: 3,
    lat: 40.4550, lng: 65.4520,
    address: "Sarmish darasi, Nurota",
    descriptionShort: "Sarmishsoy petrogliflariga yaqin, tog' etagidagi tabiat bilan uyg'un ekologik yog'och kottejlar.",
    basePricePerNight: 580000,
    amenities: ["Free WiFi", "Parking", "Restaurant"],
    accessibility: { mobility: { wheelchairAccessible: true, accessibleParking: true, accessibleToilet: true }, cognitive: { quietZones: true } }
  },
  {
    name: "Sentob Yurt & Eco Guesthouse",
    district: "Nurota",
    category: "guesthouse",
    stars: 3,
    lat: 40.5830, lng: 66.0140,
    address: "Sentob qishlog'i, Nurota",
    descriptionShort: "Qadimiy tog' qishlog'ida joylashgan milliy mehmondo'stlik maskani, toza havo va eko-turizm qulayliklari.",
    basePricePerNight: 350000,
    amenities: ["Free WiFi", "Traditional Food"],
    accessibility: { mobility: { stepFreeRoute: true, accessibleRooms: true }, cognitive: { quietZones: true } }
  },
  {
    name: "Nurota Oasis Hotel",
    district: "Nurota",
    category: "hotel",
    stars: 3,
    lat: 40.5650, lng: 65.6930,
    address: "Mustaqillik ko'chasi 18, Nurota",
    descriptionShort: "Nurota markazida joylashgan, zamonaviy shinam xonalarga va milliy choyxonaga ega qulay mehmonxona.",
    basePricePerNight: 450000,
    amenities: ["Free WiFi", "Restaurant", "Parking", "Air Conditioning"],
    accessibility: { mobility: { wheelchairAccessible: true, accessibleRooms: true } }
  },
  {
    name: "Sayyod Mountain Eco-Lodge",
    district: "Nurota",
    category: "resort",
    stars: 3,
    lat: 40.5440, lng: 65.9230,
    address: "Sayyod darasi, Nurota",
    descriptionShort: "Tog' bag'ridagi ekologik oromgoh, archazorlar, toza buloq suvi va shifobaxsh tog' iqlimi maskani.",
    basePricePerNight: 490000,
    amenities: ["Pool", "Parking", "Restaurant"],
    accessibility: { mobility: { accessibleToilet: true }, cognitive: { quietZones: true } }
  },
  {
    name: "Aydarko'l Yurt Safari Camp",
    district: "Nurota",
    category: "resort",
    stars: 3,
    lat: 40.8540, lng: 66.1260,
    address: "Aydarko'l sohili, Nurota",
    descriptionShort: "Ko'l bo'yidagi an'anaviy o'tovlar oromgohi, tuya minish, baliq ovi va sohil bo'yida dam olish bazasi.",
    basePricePerNight: 550000,
    amenities: ["Parking", "Traditional Food"],
    accessibility: { mobility: { stepFreeRoute: true, accessibleToilet: true } }
  },
  {
    name: "Xatirchi Mehmon Saroyi",
    district: "Xatirchi",
    category: "hotel",
    stars: 3,
    lat: 40.2510, lng: 65.9560,
    address: "Mustaqillik ko'chasi 12, Yangirabot",
    descriptionShort: "Polkan baxshi majmuasiga yaqin, milliy an'analar va zamonaviy qulayliklarni birlashtirgan maskan.",
    basePricePerNight: 420000,
    amenities: ["Free WiFi", "Restaurant", "Parking"],
    accessibility: { mobility: { wheelchairAccessible: true }, visual: { brailleSigns: true } }
  },
  {
    name: "Sangijumon Eko Dacha",
    district: "Xatirchi",
    category: "guesthouse",
    stars: 2,
    lat: 40.3320, lng: 66.0800,
    address: "Sangijumon darasi, Xatirchi",
    descriptionShort: "Tebranma toshlar va tog' sharsharasi yonidagi xushmanzara tog' mehmon uyi. Toza havo va tabiiy buloq suvlari.",
    basePricePerNight: 300000,
    amenities: ["Parking", "Traditional Food"],
    accessibility: { cognitive: { quietZones: true } }
  },
  {
    name: "Langar Eco Guest House",
    district: "Xatirchi",
    category: "guesthouse",
    stars: 2,
    lat: 40.2880, lng: 65.8930,
    address: "Langar qishlog'i, Xatirchi",
    descriptionShort: "Langar ota ziyoratgohiga yaqin, milliy bog'li hovli va qadimiy chinorlar soyasidagi sokin oilaviy mehmon uyi.",
    basePricePerNight: 320000,
    amenities: ["Parking", "Traditional Food"],
    accessibility: { mobility: { stepFreeRoute: true }, support: { serviceAnimalFriendly: true } }
  },
  {
    name: "Angidon Mountain Haven",
    district: "Xatirchi",
    category: "guesthouse",
    stars: 3,
    lat: 40.3530, lng: 66.0470,
    address: "Angidon qishlog'i, Xatirchi",
    descriptionShort: "Angidon tog' sharsharasi yaqinidagi xushmanzara ekoturizm mehmon uyi, toza tog' havosi va mevali bog'lar.",
    basePricePerNight: 380000,
    amenities: ["Parking", "Traditional Food"],
    accessibility: { cognitive: { quietZones: true } }
  },
  {
    name: "Oltinsoy Sanatoriy Mehmonxonasi",
    district: "Xatirchi",
    category: "resort",
    stars: 3,
    lat: 40.3140, lng: 66.0140,
    address: "Oltinsoy shifobaxsh zonasi, Xatirchi",
    descriptionShort: "Mineral buloq suvlari bilan sog'lomlashtiruvchi sanatoriy kompleksi va qulay turar joy.",
    basePricePerNight: 650000,
    amenities: ["Spa", "Restaurant", "Parking", "Free WiFi"],
    accessibility: { mobility: { wheelchairAccessible: true, elevator: true }, visual: { brailleSigns: true } }
  },
  {
    name: "Yangirabot Comfort Hotel",
    district: "Xatirchi",
    category: "hotel",
    stars: 3,
    lat: 40.2540, lng: 65.9580,
    address: "Yangirabot shoh ko'chasi 45, Xatirchi",
    descriptionShort: "Tuman markazidagi zamonaviy biznes va oilaviy mehmonxona, transport uchun qulay joylashuv.",
    basePricePerNight: 400000,
    amenities: ["Free WiFi", "Restaurant", "Parking", "Air Conditioning"],
    accessibility: { mobility: { wheelchairAccessible: true } }
  },
  {
    name: "Qiziltepa Karvonsaroy Hotel",
    district: "Qiziltepa",
    category: "hotel",
    stars: 3,
    lat: 40.0067, lng: 64.8467,
    address: "Vangozi yo'li, Qiziltepa tumani",
    descriptionShort: "Toshmasjid majmuasiga yaqin, qadimiy karvonsaroy muhitini eslatuvchi shinam va sokin maskan.",
    basePricePerNight: 460000,
    amenities: ["Free WiFi", "Restaurant", "Parking"],
    accessibility: { mobility: { wheelchairAccessible: true }, auditory: { audioGuides: true } }
  },
  {
    name: "Bistomiy Guest House",
    district: "Qiziltepa",
    category: "guesthouse",
    stars: 2,
    lat: 40.0180, lng: 64.8550,
    address: "Tinchlik ko'chasi 5, Qiziltepa",
    descriptionShort: "Xoja Boyazid Bistomiy ziyoratgohi yonidagi samimiy oilaviy mehmondo'stlik uyi. Ziyoratchilar uchun ideal.",
    basePricePerNight: 280000,
    amenities: ["Free WiFi", "Parking"],
    accessibility: { mobility: { stepFreeRoute: true, accessibleRooms: true } }
  },
  {
    name: "To'dako'l Beach & Resort",
    district: "Qiziltepa",
    category: "resort",
    stars: 4,
    lat: 39.8560, lng: 64.8540,
    address: "To'dako'l qirg'og'i, Qiziltepa",
    descriptionShort: "Ko'l bo'yidagi premium dam olish majmuasi, qumli plyaj, yozgi kottejlar, suzish havzasi va restoran.",
    basePricePerNight: 850000,
    amenities: ["Pool", "Spa", "Restaurant", "Free WiFi", "Parking"],
    accessibility: { mobility: { wheelchairAccessible: true, accessibleParking: true }, visual: { tactilePaving: true } }
  },
  {
    name: "Silk Road Oasis Qiziltepa",
    district: "Qiziltepa",
    category: "hotel",
    stars: 3,
    lat: 40.0210, lng: 64.8590,
    address: "Ipak yo'li ko'chasi 14, Qiziltepa",
    descriptionShort: "Qiziltepa markazida joylashgan, zamonaviy jihozlangan qulay va shinam turar joy.",
    basePricePerNight: 420000,
    amenities: ["Free WiFi", "Restaurant", "Parking", "Air Conditioning"],
    accessibility: { mobility: { wheelchairAccessible: true } }
  },
  {
    name: "Grand Navoiy Hotel",
    district: "Navoiy shahri",
    category: "hotel",
    stars: 4,
    lat: 40.1012, lng: 65.3745,
    address: "Islom Karimov shoh ko'chasi 24, Navoiy",
    descriptionShort: "Shahar markazidagi biznes va sayyohlik mehmonxonasi. Xalqaro inklyuzivlik standartlariga to'liq javob beradi.",
    basePricePerNight: 890000,
    amenities: ["Free WiFi", "Pool", "Spa", "Gym", "Restaurant", "Parking"],
    accessibility: {
      mobility: { wheelchairAccessible: true, elevator: true, accessibleRooms: true },
      visual: { brailleSigns: true },
      auditory: { hearingLoop: true }
    }
  },
  {
    name: "Silk Road Palace Navoiy",
    district: "Navoiy shahri",
    category: "hotel",
    stars: 4,
    lat: 40.1040, lng: 65.3780,
    address: "Xalqlar do'stligi shoh ko'chasi 15, Navoiy",
    descriptionShort: "Shaharning eng gavjum xiyobonida joylashgan hashamatli, to'liq to'siqsiz muhitga ega mehmonxona.",
    basePricePerNight: 820000,
    amenities: ["Free WiFi", "Pool", "Spa", "Restaurant", "Parking"],
    accessibility: { mobility: { wheelchairAccessible: true, elevator: true }, auditory: { signLanguageStaff: true } }
  },
  {
    name: "Zarafshan Grand Hotel Navoiy",
    district: "Navoiy shahri",
    category: "hotel",
    stars: 3,
    lat: 40.0960, lng: 65.3710,
    address: "Alisher Navoiy shoh ko'chasi 32, Navoiy",
    descriptionShort: "Markaziy ko'l va bog' yaqinidagi sokin, shinam va barcha qulayliklarga ega mehmonxona.",
    basePricePerNight: 550000,
    amenities: ["Free WiFi", "Restaurant", "Parking"],
    accessibility: { mobility: { wheelchairAccessible: true, elevator: true } }
  },
  {
    name: "Registan Plaza Navoiy",
    district: "Navoiy shahri",
    category: "hotel",
    stars: 3,
    lat: 40.1080, lng: 65.3810,
    address: "Ibn Sino ko'chasi 10, Navoiy",
    descriptionShort: "Shahar shifoxonalari va tibbiy markazlariga yaqin, salomatlik va qulay dam olish uchun mo'ljallangan maskan.",
    basePricePerNight: 520000,
    amenities: ["Free WiFi", "Restaurant", "Parking"],
    accessibility: { mobility: { wheelchairAccessible: true, accessibleRooms: true } }
  },
  {
    name: "City Center Apart-Hotel Navoiy",
    district: "Navoiy shahri",
    category: "boutique",
    stars: 3,
    lat: 40.0990, lng: 65.3730,
    address: "Amir Temur ko'chasi 8, Navoiy",
    descriptionShort: "Uzoq muddat qoluvchi sayyohlar va oilalar uchun oshxonali, to'liq jihozlangan shinam apartamentlar.",
    basePricePerNight: 600000,
    amenities: ["Free WiFi", "Parking", "Air Conditioning"],
    accessibility: { mobility: { wheelchairAccessible: true, elevator: true } }
  },
  {
    name: "Farhod Luxury Suites",
    district: "Navoiy shahri",
    category: "boutique",
    stars: 4,
    lat: 40.0955, lng: 65.3685,
    address: "Farhod ko'chasi 12, Navoiy",
    descriptionShort: "Farhod madaniyat saroyi va teatr maydoni yonidagi hashamatli butik apartamentlar va lyuks xonalar.",
    basePricePerNight: 780000,
    amenities: ["Free WiFi", "Restaurant", "Parking", "Air Conditioning"],
    accessibility: { mobility: { wheelchairAccessible: true, elevator: true }, visual: { brailleSigns: true } }
  }
];

// 🚀 ASOSIY IMPORT AMALIYOTI 🚀
async function runImport() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tour-app';
  console.log('🔗 MongoDBga ulanmoqda:', uri);

  try {
    await mongoose.connect(uri);
    console.log('✅ Ulanish o\'rnatildi!');

    // 1. Admin va Owner foydalanuvchilarini tekshirish
    let admin = await User.findOne({ role: 'ADMIN' });
    if (!admin) {
      const pass = await bcrypt.hash('admin123', 10);
      admin = await User.create({ name: 'Admin', email: 'admin@tour.uz', password: pass, role: 'ADMIN' });
    }

    let owner = await User.findOne({ role: 'HOTEL_OWNER' });
    if (!owner) {
      const pass = await bcrypt.hash('owner123', 10);
      owner = await User.create({ name: 'Hotel Owner', email: 'owner@tour.uz', password: pass, role: 'HOTEL_OWNER' });
    }

    // 2. Bazadagi eski ma'lumotlarni tozalash
    console.log('🧹 Eski ma\'lumotlar tozalanmoqda...');
    await Attraction.deleteMany({});
    await Hotel.deleteMany({});

    // 3. 71 ta Obyektni kiritish (360 Video url bo'sh holda)
    const rawAttractions = [...ATTRACTIONS_1, ...ATTRACTIONS_2];
    const attractionDocs = rawAttractions.map(item => ({
      name: item.name,
      district: item.district,
      category: item.category,
      location: { lat: item.lat, lng: item.lng },
      geo: { type: 'Point', coordinates: [item.lng, item.lat] },
      address: item.address || '',
      descriptionShort: item.descriptionShort || '',
      description: item.descriptionShort || '',
      phone: item.phone || '',
      workingHours: item.workingHours || '',
      emergencyContact: item.emergencyContact || '',
      bestSeason: item.bestSeason || '',
      entryFee: item.entryFee || '',
      thingsToSeeAround: item.thingsToSeeAround || [],
      accessibility: item.accessibility || {},
      atmosphere: item.atmosphere || {},
      peakInfo: item.peakInfo || {},
      video360: { url: '', type: 'youtube', captioned: false }, // 360 Video o'chirildi (bo'sh)
      images: IMAGES[item.category] || IMAGES.tarixiy,
      approved: true,
      createdBy: admin._id
    }));

    const savedAttractions = await Attraction.insertMany(attractionDocs);
    console.log(`✅ ${savedAttractions.length} ta Obyekt bazaga muvaffaqiyatli qo'shildi!`);

    // 4. 22 ta Mehmonxonani kiritish
    const hotelDocs = HOTELS.map(h => ({
      name: h.name,
      district: h.district,
      city: h.district,
      category: h.category,
      stars: h.stars,
      location: { lat: h.lat, lng: h.lng },
      geo: { type: 'Point', coordinates: [h.lng, h.lat] },
      address: h.address,
      descriptionShort: h.descriptionShort,
      description: h.descriptionShort,
      basePricePerNight: h.basePricePerNight,
      pricePerNight: h.basePricePerNight,
      amenities: h.amenities || ['Free WiFi', 'Parking'],
      accessibility: h.accessibility || {},
      images: IMAGES[h.category] || IMAGES.hotel,
      rating: 4.6,
      reviewsCount: 25,
      approved: true,
      owner: owner._id,
      roomsAvailable: 6,
      totalRooms: 12
    }));

    const savedHotels = await Hotel.insertMany(hotelDocs);
    console.log(`🏨 ${savedHotels.length} ta Mehmonxona bazaga muvaffaqiyatli qo'shildi!`);

    console.log('\n=============================================');
    console.log('🎉 BARCHA MA\'LUMOTLAR MUVAFFAQIYATLI QO\'SHILDI!');
    console.log(`📍 Jami Obyektlar: ${savedAttractions.length} ta`);
    console.log(`🏨 Jami Mehmonxonalar: ${savedHotels.length} ta`);
    console.log('🏷️ Toifalar o\'zlarining maxsus rang va ikonkalariga ega.');
    console.log('=============================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Xatolik:', err);
    process.exit(1);
  }
}

runImport();
