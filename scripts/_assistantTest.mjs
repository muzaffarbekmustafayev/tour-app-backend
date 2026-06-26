// Vaqtinchalik test — DB'siz, mock ma'lumot bilan assistant intentlarini tekshiradi.
import Hotel from '../models/Hotel.js';
import Attraction from '../models/Attraction.js';
import { askAssistant } from '../controllers/assistantController.js';

const hotels = [
  {
    _id: 'h1', name: 'Nurota Chashma Resort',
    description: "Chashma majmuasiga yaqin, tog' manzarali zamonaviy resort. Tinch va salqin muhit.",
    descriptionShort: 'Chashmaga yaqin inklyuziv resort.', district: 'Nurota', city: 'Nurota',
    address: "Chashma ko'chasi, 7", rating: 4.8, stars: 4, category: 'resort',
    basePricePerNight: 720000, checkIn: '14:00 dan', checkOut: '12:00 gacha', images: ['img'],
    location: { lat: 40.5635, lng: 65.6889 },
    amenities: ['Free WiFi', 'Restaurant', 'Parking', 'Air Conditioning', 'Pool', 'Spa'],
    security: ["24/7 Qo'riqlash", 'CCTV (Kameratizm)', "Yong'in o'chirish tizimi"],
    nearbyPlaces: ['Chashma majmuasi', 'Nur qal\'asi xarobalari', "Aydarko'l"],
    tags: ['romantik', 'oilaviy'],
    paymentMethods: ['Click', 'Payme', 'Naqd'],
    atmosphere: { mood: 'Tinch va ziyoratbop', localTip: "Muqaddas baliqlarni ko'ring." },
    accessibility: { mobility: { wheelchairAccessible: true }, support: { supportContact: '+998 79 223 11 22' } },
    familyAndElderly: { orthopedicBeddingAvailable: true },
    rooms: [
      { name: 'Standart', roomType: 'Double Room', category: 'Comfort', capacity: 2, pricePerNight: 720000 },
      { name: 'Oilaviy lyuks', roomType: 'Family Room', category: 'Suite', capacity: 5, pricePerNight: 1150000 },
    ],
    ratings: { cleanliness: 4.9, service: 4.7 }, approved: true,
  },
  {
    _id: 'h2', name: 'Sarmishsoy Eco Lodge',
    description: 'Sarmishsoy petrogliflari yodgorligiga yaqin tabiat qo\'ynidagi eko-maskan. Gulxan va hiking.',
    descriptionShort: 'Petrogliflarga yaqin lodge.', district: 'Nurota', city: 'Nurota',
    rating: 4.6, stars: 3, category: 'resort', basePricePerNight: 480000, images: ['img'],
    location: { lat: 40.455, lng: 65.452 },
    amenities: ['Hiking', 'Traditional Food', 'Parking', 'Bonfire'],
    security: ["Yong'in xavfsizligi"], nearbyPlaces: ['Sarmishsoy petrogliflari', "Nurota tog'lari"],
    tags: ['tabiat', 'sarguzasht'],
    paymentMethods: ['Payme', 'Naqd'],
    atmosphere: { mood: 'Jonli va sarguzasht', localTip: 'Tunda yulduzlarni kuzating.' },
    rooms: [{ name: 'Eko xona', roomType: 'Single Room', category: 'Standard', capacity: 1, pricePerNight: 250000 }],
    approved: true,
  },
  {
    _id: 'h3', name: 'Xatirchi Grand Hotel',
    description: 'Xatirchi markazidagi qulay biznes-mehmonxona. Konferensiya zali, fitnes va bar mavjud.',
    descriptionShort: 'Markaziy biznes-mehmonxona.', district: 'Xatirchi', city: 'Xatirchi',
    rating: 4.3, stars: 5, category: 'hotel', basePricePerNight: 600000, images: ['img'],
    location: { lat: 40.12, lng: 65.9 },
    amenities: ['Free WiFi', 'Gym', 'Bar', 'Meeting Rooms', 'Laundry', 'Room Service', '24h Reception'],
    security: ['Elektron kalit', 'Seyf'], nearbyPlaces: ['Xatirchi tarixiy markazi'],
    tags: ['biznes'], paymentMethods: ['Click', 'Uzum Bank', 'Naqd'],
    atmosphere: { mood: 'Jonli va shahar markazida' },
    rooms: [
      { name: 'Biznes', roomType: 'Double Room', category: 'Deluxe', capacity: 2, pricePerNight: 600000 },
      { name: 'Triple', roomType: 'Triple Room', category: 'Comfort', capacity: 3, pricePerNight: 800000 },
    ],
    ratings: { service: 4.8, cleanliness: 4.4 }, approved: true,
  },
];

const attractions = [
  {
    _id: 'a1', name: 'Chashma majmuasi', district: 'Nurota', rating: 4.9, entryFee: 'Bepul',
    description: 'Muqaddas buloq va baliqlar. Ziyoratchilar uchun maskan.',
    descriptionShort: 'Muqaddas buloq.', images: ['img'], location: { lat: 40.564, lng: 65.689 },
    bestSeason: 'Bahor va kuz', atmosphere: { bestTimeOfDay: 'Erta tong', localTip: "Baliqlarni ko'ring." },
    thingsToSeeAround: [
      { title: 'Milliy taomlar choyxonasi', type: 'ovqat', walkingMinutes: 5 },
      { title: "Nur qal'asi", type: 'tarix', walkingMinutes: 15 },
    ], approved: true,
  },
  {
    _id: 'a2', name: 'Sarmishsoy petrogliflari', district: 'Nurota', rating: 4.7, entryFee: '20 000 so\'m',
    description: '7 ming yillik qoyatosh suratlari (petrogliflar). Ochiq osmon ostidagi muzey.',
    descriptionShort: 'Qadimiy qoyatosh suratlari.', images: ['img'], location: { lat: 40.45, lng: 65.45 },
    bestSeason: 'Bahor', thingsToSeeAround: [{ title: "Tog' buloqlari", type: 'tabiat', walkingMinutes: 10 }],
    approved: true,
  },
];

Hotel.find = () => ({ lean: async () => hotels });
Attraction.find = () => ({ lean: async () => attractions });

function mockRes() { return { body: null, json(d) { this.body = d; return d; } }; }

// [savol, kutilgan kalit so'z javob sarlavhasida/kartochkada]
const tests = [
  // Yangi qulayliklar (to'liq qamrov)
  ['basseyni bor mehmonxona', 'Basseyn'],
  ['spa bormi', 'SPA'],
  ['fitnes zali bor', 'Fitnes'],
  ['bar bor joy', 'Bar'],
  ['konferensiya zali kerak', 'Konferensiya'],
  ['kir yuvish xizmati', 'Kir yuvish'],
  ['24 soat resepshn', '24 soat'],
  ['aeroport transfer bormi', 'Aeroport'],
  // Ko'p-shartli filtr
  ['wifi bor 4 yulduzli resort', '🎯'],
  ['arzon basseyni bor mehmonxona', '🎯'],
  ['5 kishilik oilaviy xona arzon', '🎯'],
  ['Xatirchida 5 yulduzli bar bor', '🎯'],
  ['500 ming gacha wifi bor', '🎯'],
  // Generic kontent-qidiruv (egalar yozgan matndan)
  ["Aydarko'lga yaqin joy", '🔎'],
  ['qoriqlanadigan xavfsiz mehmonxona', null],
  ["tog' manzarali tinch joy", null],
  ['petroglif', '🔎'],
  ['biznes mehmonxona', null],
  ['romantik maskan', null],
  // Eski intentlar hali ishlayaptimi (regress)
  ['salom', 'assalom'],
  ['arzon mehmonxona', 'arzon'],
  ['tarixiy joylar', 'tarixiy'],
  ['3 kunlik plan yoz', 'plan'],
  ['Nurota Chashma Resort haqida', 'Chashma'],
  ['aravacha uchun qulay', 'aravacha'],
  ['nechta mehmonxona bor', 'bazasi'],
  ['eng yaxshi mehmonxona', 'tanlov'],
  ['asdkjfh nonsense xyz', 'Tushunmadim'],
];

let pass = 0;
const fails = [];
for (const [q, expect] of tests) {
  const res = mockRes();
  let caught = null;
  await askAssistant({ body: { message: q } }, res, (e) => { caught = e; });
  await new Promise((r) => setImmediate(r));
  if (caught) { fails.push(`❌ [${q}] ERROR: ${caught.message}`); continue; }
  const r = res.body || {};
  const reply = r.reply || '';
  const firstLine = reply.split('\n')[0];
  const cardNames = [...(r.hotels || []), ...(r.attractions || [])].map((x) => x.name).join(', ');
  const blob = reply + ' ' + cardNames;
  const ok = expect == null || blob.toLowerCase().includes(expect.toLowerCase());
  const tag = [r.hotels?.length ? `🏨×${r.hotels.length}` : '', r.attractions?.length ? `🏛️×${r.attractions.length}` : ''].filter(Boolean).join(' ');
  if (ok) { pass++; console.log(`✅ [${q}]\n   → ${firstLine}  {${tag}}${cardNames ? ` [${cardNames}]` : ''}`); }
  else { fails.push(`❌ [${q}] kutilgan "${expect}" topilmadi\n   → ${firstLine}  {${tag}} [${cardNames}]`); }
}
console.log('\n' + '='.repeat(50));
for (const f of fails) console.log(f);
console.log(`\n${pass}/${tests.length} TEST O'TDI`);
process.exit(0);
