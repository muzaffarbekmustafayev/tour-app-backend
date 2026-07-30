import { asyncHandler } from '../lib/asyncHandler.js';
import Hotel from '../models/Hotel.js';
import Attraction from '../models/Attraction.js';

/**
 * AI Yordamchi — mavjud ma'lumotlar asosida javob beruvchi assistant.
 *
 * Tashqi LLM kerak emas: barcha javoblar bazadagi real maskan (Hotel) va
 * tarixiy joy (Attraction) ma'lumotlaridan generatsiya qilinadi. Shu sababli
 * demo va grant taqdimotida internetsiz ham barqaror ishlaydi.
 *
 * Imkoniyatlar (savol turlari):
 *   • Kundalik suhbat (salom, rahmat, qalaysiz, xayr)
 *   • "Nima qila olasan?"  → imkoniyatlar ro'yxati
 *   • Platforma FAQ        → bron, ro'yxat, to'lov, bekor qilish qanday ishlaydi
 *   • Narx / byudjet       → arzon/qimmat, "500 ming gacha", narx oralig'i
 *   • Qulayliklar          → Wi-Fi, restoran, parking, konditsioner, gulxan…
 *   • Yulduzlar            → "4 yulduzli mehmonxona"
 *   • To'lov usullari      → Click / Payme / Naqd / Uzum
 *   • Check-in / check-out → kirish va chiqish vaqtlari
 *   • Xona turlari         → oilaviy, lyuks, yakka, ikki kishilik
 *   • Reyting bo'yicha     → eng toza, xizmati zo'r, narx-sifat, joylashuv
 *   • Bog'lanish / manzil  → telefon, manzil, qayerda joylashgan
 *   • Atmosfera / maslahat → tinch yoki jonli joy, mahalliy maslahat
 *   • Pik / tinch vaqt     → joyga qachon borish yaxshi (gavjum/tinch + mavsum)
 *   • Tarixiy joylar       → tuman bo'yicha joylar + eng yaqin tunash maskani
 *   • Atrofda nima bor     → ovqat, bozor, tabiat (thingsToSeeAround)
 *   • Statistika           → nechta maskan/joy, narx oralig'i, tumanlar
 *   • N kunlik plan        → N-kunlik sayohat rejasi
 *   • Inklyuziv so'rov     → aravacha/ko'rish/eshitish/keksalar uchun moslar
 *   • Nom bo'yicha         → aniq maskan/joy haqida batafsil (entity lookup)
 *   • Imlo/sinonim bardosh + tushunmaganda aniq takliflar
 */

const DISTRICTS = ['Nurota', 'Xatirchi', 'Qiziltepa'];

// Navoiy viloyati uchun umumiy mavsum maslahati (joyda bestSeason bo'lmasa)
const REGION_SEASON =
  "Bahor (aprel–may) va kuz (sentabr–oktabr) — salqin va eng maqbul. Yozda kunduzi issiq bo'ladi, erta tong yoki kechqurun tavsiya etiladi.";

// Matnni normallashtirish (kichik harf + apostroflarni birlashtirish)
const normalize = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// Imlo/sinonimlarni kanonik shaklga keltirish (aqlliroq tushunish)
const applySynonyms = (t) =>
  t
    .replace(/\b(mehmonhona|mehmonxna|mehonxona|mehmonhna|gostinitsa|gostinitsalar|otel|otell|mehmonxonalar)\b/g, 'mehmonxona')
    .replace(/\b(tarixi|tarihiy|tarxiy|tarixy)\b/g, 'tarixiy')
    .replace(/\b(gavjum|gavjumi|gavjummi|tig'iz|tigiz|tirband|tirbandlik|qalaba|olomon|navbat|band)\b/g, 'pik')
    .replace(/\b(qulayli|qulayrok|qulayroq)\b/g, 'qulay')
    .replace(/\b(aravacha|kolyaska|invalid|nogiron)\b/g, 'aravacha')
    .replace(/\b(narxi|narxlari|narhi|narx)\b/g, 'narx')
    .replace(/\b(byujet|budjet|budget|byudget)\b/g, 'byudjet')
    .replace(/\b(vayfay|vay-fay|vifi|wi-fi)\b/g, 'wifi')
    .replace(/\b(avtoturargoh|avtoturgoh|turargoh|mashina joyi|mashinajoy)\b/g, 'parking')
    .replace(/\b(konditsioner|konditsion|sovutgich|kanditsioner)\b/g, 'konditsioner')
    .replace(/\b(to'lov|tulov|to'lash|tulash|to'layman)\b/g, 'tolov')
    .replace(/\b(yulduzli|yulduzlik|yulduzi)\b/g, 'yulduz')
    .replace(/\b(telefoni|telefon raqami|raqami|raqam|nomeri)\b/g, 'telefon')
    .replace(/\b(kuchuk|kuchug|mushuk|hayvon|uy hayvoni|pet|pets)\b/g, 'hayvon')
    .replace(/\b(bolalar|farzand|oila|oilam|chaqaloq|bolam|bolasi|bola)\b/g, 'bola')
    .replace(/\b(rus|ruscha|orisi|rus tili)\b/g, 'rus')
    .replace(/\b(ingliz|inglizcha|english|ingliz tili)\b/g, 'ingliz')
    .replace(/\b(markaz|gorod|sentr|center)\b/g, 'markaz')
    .replace(/\b(aeroport|ayraport|tayyora)\b/g, 'aeroport')
    .replace(/\b(vokzal|vaxzal|stansiya|poezd)\b/g, 'vokzal');

// ── Pul formatlash: 720000 → "720 000 so'm" ──────────────────────────
const fmtSom = (n) =>
  Number.isFinite(n) ? `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm` : null;

// Maskanning eng arzon xona narxi (rooms yo'q bo'lsa — basePricePerNight)
const cheapestPrice = (h) => {
  const prices = (h.rooms || []).map((r) => r.pricePerNight).filter(Number.isFinite);
  if (prices.length) return Math.min(...prices);
  return Number.isFinite(h.basePricePerNight) ? h.basePricePerNight : null;
};

// Matndan byudjet sonini ajratish: "500 ming"→500000, "1 mln"→1000000, "350000"→350000
function extractBudget(text) {
  const m1 = text.match(/(\d+(?:[.,]\d+)?)\s*(mln|million|mil)/);
  if (m1) return Math.round(parseFloat(m1[1].replace(',', '.')) * 1_000_000);
  const m2 = text.match(/(\d+(?:[.,]\d+)?)\s*ming/);
  if (m2) return Math.round(parseFloat(m2[1].replace(',', '.')) * 1000);
  const m3 = text.match(/(\d{4,})/); // 4+ raqamli xom son
  if (m3) return parseInt(m3[1], 10);
  return null;
}

// Ikki koordinata orasidagi masofa (km) — Haversine
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const coordOf = (o) => ({
  lat: o?.location?.lat ?? o?.geo?.coordinates?.[1],
  lng: o?.location?.lng ?? o?.geo?.coordinates?.[0],
});

// Tarixiy joyga GEO bo'yicha eng yaqin tunash maskani (koordinata yo'q bo'lsa — tuman bo'yicha)
function nearestStay(a, hotels) {
  const { lat, lng } = coordOf(a);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    let best = null;
    let bestD = Infinity;
    for (const h of hotels) {
      const c = coordOf(h);
      if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue;
      const d = haversineKm(lat, lng, c.lat, c.lng);
      if (d < bestD) { bestD = d; best = { ...h, distanceKm: Math.round(d * 10) / 10 }; }
    }
    if (best) return best;
  }
  return hotels.find((h) => (h.district || h.city) === a.district) || null;
}

// Joy uchun pik (gavjum) va tinch vaqtlar — peakInfo bo'lsa o'sha, bo'lmasa heuristika
function peakTimesFor(a) {
  const pi = a.peakInfo || {};
  const best = a.atmosphere?.bestTimeOfDay;
  const isReligious =
    /maqbara|masjid|ziyorat|chashma|qabr|mozor|xonaqo|ota\b/i.test(a.name || '') ||
    (a.thingsToSeeAround || []).some((t) => t.type === 'diniy');

  const peak =
    pi.peak ||
    `Hafta oxiri (shanba–yakshanba) va bayramlarda, asosan 11:00–16:00${isReligious ? "; juma kuni ziyoratchilar ko'p" : ''}`;
  const quiet =
    pi.quiet ||
    (best ? `${best}; ish kunlari ertalab kam odam` : "Erta tong (07:00–10:00) va ish kunlari — eng tinch payt");
  const note = pi.note || '';
  return { peak, quiet, note };
}

const bestSeasonFor = (a) => (a.bestSeason ? `${a.bestSeason}.` : REGION_SEASON);

// Maskan (Hotel) kartochkasi
const toHotelCard = (h) => ({
  _id: h._id,
  name: h.name,
  city: h.city,
  district: h.district || h.city,
  rating: h.rating,
  stars: h.stars,
  price: cheapestPrice(h),
  image: h.images?.[0] || null,
  category: h.category,
  descriptionShort: h.descriptionShort || '',
  nearbyPlaces: h.nearbyPlaces || [],
  distanceKm: Number.isFinite(h.distanceKm) ? h.distanceKm : undefined,
});

// Tarixiy joy (Attraction) kartochkasi — pik/tinch vaqt va mavsum bilan
const toAttractionCard = (a) => {
  const pt = peakTimesFor(a);
  return {
    _id: a._id,
    name: a.name,
    district: a.district,
    rating: a.rating,
    image: a.images?.[0] || null,
    descriptionShort: a.descriptionShort || '',
    entryFee: a.entryFee || '',
    bestSeason: a.bestSeason || '',
    peak: pt.peak,
    quiet: pt.quiet,
    type: 'attraction',
  };
};

const SUGGESTIONS = ['Tarixiy joylar', 'Arzon mehmonxona', 'Bepul Wi-Fi bormi?', '3 kunlik plan yoz'];

// Inklyuziv (nogironlar uchun) moslik tekshiruvi — Hotel
const isAccessible = (h, kind) => {
  const a = h.accessibility || {};
  if (kind === 'wheelchair') return a.mobility?.wheelchairAccessible;
  if (kind === 'visual') return a.visual?.brailleSigns || a.visual?.tactilePaving;
  if (kind === 'auditory') return a.auditory?.audioGuides || a.auditory?.hearingLoop;
  if (kind === 'elderly') return h.familyAndElderly?.orthopedicBeddingAvailable || h.familyAndElderly?.grabBarsInBathroom;
  return true;
};

// Qulaylik (amenity) xaritasi — UZ kalit so'z → ma'lumotdagi inglizcha tokenlar.
// Egalar formada tanlaydigan BARCHA qulayliklarni qamrab oladi:
// Free WiFi, Pool, Spa, Restaurant, Gym, Parking, Air Conditioning, Airport Shuttle,
// Bar, Meeting Rooms, Laundry, Room Service, 24h Reception (+ seed: Hiking, Bonfire,
// Traditional Food, Shared Kitchen).
const AMENITIES = [
  { re: /wifi|internet/, keys: ['wifi'], label: 'Bepul Wi-Fi' },
  { re: /basseyn|hovuz|suzish|pool/, keys: ['pool'], label: 'Basseyn' },
  { re: /\bspa\b|massaj|hammom|sauna/, keys: ['spa', 'sauna'], label: 'SPA / massaj' },
  { re: /restoran|ovqat|taom|nonushta|food/, keys: ['restaurant', 'food'], label: 'Restoran / milliy taom' },
  { re: /fitnes|\bgym\b|sport zal|trenajor|mashqlar zali/, keys: ['gym', 'fitness'], label: 'Fitnes zali' },
  { re: /parking|avtoturargoh|mashina/, keys: ['parking'], label: 'Avtoturargoh (parking)' },
  { re: /konditsioner|sovutgich|sovuq havo|air condition/, keys: ['air'], label: 'Konditsioner' },
  { re: /aeroport transfer|transfer|kutib ol|shuttle|aeroportdan/, keys: ['shuttle', 'airport'], label: 'Aeroport transfer' },
  { re: /\bbar\b/, keys: ['bar'], label: 'Bar' },
  { re: /konferensiya|yig'ilish zal|majlislar zal|meeting/, keys: ['meeting'], label: 'Konferensiya zali' },
  { re: /kir yuvish|kir-?yuvish|laundry|prachka/, keys: ['laundry'], label: 'Kir yuvish (laundry)' },
  { re: /xona xizmati|room service|nomer xizmati/, keys: ['room service'], label: 'Xona xizmati' },
  { re: /24 soat|24\/7|resepshn|kechayu-kunduz|tunu kun|reception/, keys: ['reception', '24'], label: '24 soat qabul' },
  { re: /gulxan|\bolov\b|bonfire|gulhan/, keys: ['bonfire'], label: 'Gulxan (bonfire)' },
  { re: /hiking|sayr|trekking|piyoda yurish|tog' yurish/, keys: ['hiking'], label: 'Hiking / tog\'' },
  { re: /oshxona|kitchen/, keys: ['kitchen'], label: 'Umumiy oshxona' },
  { re: /nonushta|zavtrak|breakfast/, keys: ['breakfast', 'food'], label: 'Nonushta' },
  { re: /transfer|kutib olish|shofyor/, keys: ['shuttle', 'transfer', 'airport'], label: 'Transfer xizmati' },
];

const hotelHasAmenity = (h, keys) =>
  (h.amenities || []).some((a) => keys.some((k) => a.toLowerCase().includes(k)));

// ── Ko'p-shartli filtr: matndan barcha cheklovlarni ajratish ──────────
function extractConstraints(text) {
  const c = { signals: 0, amenities: [] };

  c.district = DISTRICTS.find((d) => text.includes(d.toLowerCase())) || null; // kuchsiz signal

  const budget = extractBudget(text);
  if (budget && /gacha|kam|byudjet|ichida|oshma|atrofida|arzon/.test(text)) { c.maxPrice = budget; c.signals++; }
  else if (/arzon|tejamkor|eng arzon/.test(text)) { c.cheapest = true; c.signals++; }
  else if (/qimmat|hashamatli|eng qimmat/.test(text)) { c.expensive = true; c.signals++; }

  const sm = text.match(/([1-5])\s*yulduz/);
  if (sm) { c.exactStars = parseInt(sm[1], 10); c.signals++; }

  for (const a of AMENITIES) if (a.re.test(text)) { c.amenities.push(a); c.signals++; }

  if (/aravacha|wheelchair/.test(text)) { c.accessKind = 'wheelchair'; c.signals++; }
  else if (/ko'rish|braille|brayl/.test(text)) { c.accessKind = 'visual'; c.signals++; }
  else if (/eshitish|hearing/.test(text)) { c.accessKind = 'auditory'; c.signals++; }
  else if (/keksa|qari|nuroniy|elderly/.test(text)) { c.accessKind = 'elderly'; c.signals++; }

  if (/\bresort\b/.test(text)) { c.category = 'resort'; c.signals++; }
  else if (/\bhostel\b|xostel/.test(text)) { c.category = 'hostel'; c.signals++; }

  const cap = text.match(/(\d+)\s*(kishilik|kishi|odam|nafar)/);
  if (cap) { c.minCapacity = parseInt(cap[1], 10); c.signals++; }

  if (/oilaviy|family/.test(text)) { c.roomType = 'Family Room'; c.signals++; }
  else if (/lyuks|suite|vip|luxury/.test(text)) { c.luxuryRoom = true; c.signals++; }

  if (/\bhoyvon\b|kuchuk|mushuk|hayvon|uy hayvoni/.test(text)) { c.petsAllowed = true; c.signals++; }
  if (/\bbola\b|bolalar|chaqaloq|farzand/.test(text)) { c.kidFriendly = true; c.signals++; }
  if (/\bmarkaz\b/.test(text)) { c.distance = 'cityCenter'; c.signals++; }
  else if (/\baeroport\b/.test(text)) { c.distance = 'airport'; c.signals++; }
  else if (/\bvokzal\b/.test(text)) { c.distance = 'trainStation'; c.signals++; }

  if (/\brus\b|ruscha|orisi/.test(text)) { c.language = 'rus'; c.signals++; }
  else if (/\bingliz\b|inglizcha/.test(text)) { c.language = 'ingliz'; c.signals++; }

  let method = null;
  if (/click/.test(text)) method = 'click';
  else if (/payme/.test(text)) method = 'payme';
  else if (/uzum/.test(text)) method = 'uzum';
  else if (/naqd/.test(text)) method = 'naqd';
  if (method) { c.payment = method; c.signals++; }

  return c;
}

function applyConstraints(hotels, c) {
  let list = c.district ? hotels.filter((h) => (h.district || h.city) === c.district) : [...hotels];
  if (c.exactStars) list = list.filter((h) => h.stars === c.exactStars);
  if (c.category) list = list.filter((h) => h.category === c.category);
  for (const a of c.amenities) list = list.filter((h) => hotelHasAmenity(h, a.keys));
  if (c.accessKind) list = list.filter((h) => isAccessible(h, c.accessKind));
  if (c.minCapacity) list = list.filter((h) => (h.rooms || []).some((r) => (r.capacity || 0) >= c.minCapacity));
  if (c.roomType) list = list.filter((h) => (h.rooms || []).some((r) => r.roomType === c.roomType));
  if (c.luxuryRoom) list = list.filter((h) => (h.rooms || []).some((r) => /suite|luxury|vip/i.test(r.category || '')));
  
  if (c.petsAllowed) list = list.filter((h) => h.policies?.petsAllowed);
  if (c.kidFriendly) list = list.filter((h) => h.familyAndElderly?.strollerAccessible || (h.rooms || []).some((r) => r.roomType === 'Family Room'));
  if (c.distance) list = list.filter((h) => h.distance && h.distance[c.distance]);
  if (c.language) list = list.filter((h) => (h.languages || []).some((l) => l.toLowerCase().includes(c.language)));

  if (c.payment) list = list.filter((h) => (h.paymentMethods || []).some((p) => p.toLowerCase().includes(c.payment)));
  if (Number.isFinite(c.maxPrice)) list = list.filter((h) => { const p = cheapestPrice(h); return p != null && p <= c.maxPrice; });

  if (c.cheapest || Number.isFinite(c.maxPrice)) list.sort((a, b) => (cheapestPrice(a) ?? 1e12) - (cheapestPrice(b) ?? 1e12));
  else if (c.expensive) list.sort((a, b) => (cheapestPrice(b) ?? 0) - (cheapestPrice(a) ?? 0));
  else list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return list;
}

function describeConstraints(c) {
  const parts = [];
  if (c.district) parts.push(c.district);
  if (c.exactStars) parts.push(`${c.exactStars}⭐`);
  if (c.category) parts.push(c.category === 'resort' ? 'resort' : 'hostel');
  for (const a of c.amenities) parts.push(a.label);
  if (c.accessKind) parts.push({ wheelchair: 'aravacha', visual: "ko'rish", auditory: 'eshitish', elderly: 'keksalar' }[c.accessKind]);
  if (c.roomType) parts.push('oilaviy xona');
  if (c.luxuryRoom) parts.push('lyuks xona');
  if (c.minCapacity) parts.push(`${c.minCapacity}+ kishilik`);
  if (c.petsAllowed) parts.push('hayvonlarga ruxsat');
  if (c.kidFriendly) parts.push('bolalar uchun');
  if (c.distance === 'cityCenter') parts.push('markazga yaqin');
  else if (c.distance === 'airport') parts.push('aeroportga yaqin');
  else if (c.distance === 'trainStation') parts.push('vokzalga yaqin');
  if (c.language) parts.push(`${c.language === 'rus' ? 'Rus' : 'Ingliz'} tilida`);
  if (c.payment) parts.push(c.payment[0].toUpperCase() + c.payment.slice(1));
  if (Number.isFinite(c.maxPrice)) parts.push(`${fmtSom(c.maxPrice)} gacha`);
  else if (c.cheapest) parts.push('arzon');
  else if (c.expensive) parts.push('hashamatli');
  return parts.join(' · ');
}

// ── Generic kontent-qidiruv: egalar yozgan HAR QANDAY matndan tavsiya ──
const SEARCH_STOP = new Set([
  'mehmonxona', 'maskan', 'maskanlar', 'joy', 'joylar', 'joyni', 'bormi', 'bor', 'menga', 'kerak',
  'qaysi', 'qanday', 'qanaqa', 'eng', 'yaxshi', "zo'r", 'top', 'tavsiya', 'qil', 'qiling', 'bering',
  'beradigan', 'nima', 'qayer', 'qayerda', 'toping', "ko'rsat", 'korsat', 'uchun', 'bilan', 'haqida',
  'meni', 'sizda', 'bizga', 'istayman', 'xohlayman', 'kerakli', 'mavjud', 'reja',
  'va', 'yoki', 'ham', 'lekin', "bo'lsa", 'biror', 'biron', 'qanaqasiga',
  'nurota', 'xatirchi', 'qiziltepa', // tumanlar — pool-filtr orqali ishlanadi
]);

const stripField = (o) => [
  o.name, o.description, o.descriptionShort, o.address, o.city, o.district, o.category,
  ...(o.amenities || []), ...(o.tags || []), ...(o.features || []), ...(o.nearbyPlaces || []),
  ...(o.security || []), ...(o.languages || []),
  o.atmosphere?.mood, o.atmosphere?.soundscape, o.atmosphere?.localTip, o.atmosphere?.bestTimeOfDay,
  ...(o.rooms || []).map((r) => `${r.name || ''} ${r.category || ''} ${r.roomType || ''}`),
  ...(o.thingsToSeeAround || []).map((t) => `${t.title || ''} ${t.description || ''}`),
  o.entryFee, o.bestSeason,
].filter(Boolean).join(' ');

// Morfologiyaga bardoshli moslik: token aynan yoki ≥5 belgili umumiy prefiks bilan mos kelsa
function buildMatcher(o) {
  const blob = applySynonyms(normalize(stripField(o)));
  const words = new Set(blob.split(/[^a-z0-9']+/).filter((w) => w.length >= 3));
  return (token) => {
    if (words.has(token)) return true;
    if (token.length < 4) return false;
    const p = token.slice(0, 5);
    for (const w of words) {
      if (w.startsWith(p) || (w.length >= 5 && token.startsWith(w.slice(0, 5)))) return true;
    }
    return false;
  };
}

function smartSearch(text, hotels, attractions) {
  const tokens = [...new Set(text.split(' ').filter((t) => t.length >= 3 && !SEARCH_STOP.has(t)))];
  if (!tokens.length) return [];
  const pool = [
    ...hotels.map((h) => ({ o: h, kind: 'hotel' })),
    ...attractions.map((a) => ({ o: a, kind: 'attraction' })),
  ];
  return pool
    .map((e) => {
      const match = buildMatcher(e.o);
      const hits = tokens.filter((t) => match(t)).length;
      return { ...e, hits };
    })
    .filter((e) => e.hits > 0)
    .sort((a, b) => b.hits - a.hits || (b.o.rating || 0) - (a.o.rating || 0));
}

// N-kunlik sayohat rejasi — tarixiy joylar + tunash maskanlari
function buildPlan(days, hotels, attractions) {
  const planDays = [];
  for (let i = 0; i < days; i++) {
    const district = DISTRICTS[i % DISTRICTS.length];
    const stay = hotels.find((h) => (h.district || h.city) === district);
    const dayAttractions = attractions.filter((a) => a.district === district);
    const round = Math.floor(i / DISTRICTS.length);
    const picked = dayAttractions.slice(round * 2, round * 2 + 2);
    planDays.push({
      day: i + 1,
      district,
      places: (picked.length ? picked : dayAttractions.slice(0, 2)).map((a) => a.name),
      stay: stay ? { _id: stay._id, name: stay.name, rating: stay.rating } : null,
    });
  }
  return planDays;
}

function extractDays(text) {
  const m = text.match(/(\d{1,2})\s*(kun|kunlik|day|days)/i);
  if (m) return Math.min(14, Math.max(1, parseInt(m[1], 10)));
  if (/hafta|week/i.test(text)) return 7;
  return 3;
}

// ── Nom bo'yicha entity (maskan/joy) topish — fuzzy ────────────────────
const NAME_STOP = new Set([
  'resort', 'hotel', 'hostel', 'lodge', 'eco', 'inn', 'house', 'guest', 'the', 'va',
  'mehmonxona', 'tuman', 'tumani', 'navoiy', 'nurota', 'xatirchi', 'qiziltepa',
]);

function findEntity(text, hotels, attractions) {
  const pool = [
    ...hotels.map((h) => ({ o: h, kind: 'hotel' })),
    ...attractions.map((a) => ({ o: a, kind: 'attraction' })),
  ];
  let best = null;
  for (const e of pool) {
    const nameNorm = applySynonyms(normalize(e.o.name));
    const tokens = nameNorm.split(' ').filter((t) => t.length >= 4 && !NAME_STOP.has(t));
    if (!tokens.length) continue;
    const hit = tokens.filter((t) => text.includes(t)).length;
    if (!hit) continue;
    const score = hit / tokens.length;
    if (!best || score > best.score || (score === best.score && hit > best.hit)) {
      best = { ...e, hit, score };
    }
  }
  // Faqat ishonchli mosliklar: yarmidan ko'p so'z mos kelsa
  return best && best.score >= 0.5 ? best : null;
}

// Maskan haqida batafsil matn (entity detail)
function hotelDetailText(h) {
  const lines = [`🏨 ${h.name}`];
  if (h.descriptionShort || h.description) lines.push(h.descriptionShort || h.description);
  const meta = [];
  if (Number.isFinite(h.stars)) meta.push(`⭐ ${h.stars} yulduz`);
  if (Number.isFinite(h.rating) && h.rating > 0) meta.push(`📊 reyting ${h.rating.toFixed?.(1) ?? h.rating}`);
  const price = cheapestPrice(h);
  if (price) meta.push(`💰 ${fmtSom(price)} dan/kecha`);
  if (meta.length) lines.push('', meta.join('  ·  '));
  if (h.address || h.district || h.city) lines.push(`📍 ${[h.address, h.district || h.city].filter(Boolean).join(', ')}`);
  if (h.checkIn || h.checkOut) lines.push(`🕑 Kirish: ${h.checkIn || '—'} · Chiqish: ${h.checkOut || '—'}`);
  if (h.amenities?.length) lines.push(`✨ Qulayliklar: ${h.amenities.slice(0, 6).join(', ')}`);
  if (h.paymentMethods?.length) lines.push(`💳 To'lov: ${h.paymentMethods.join(', ')}`);
  const phone = h.contact?.phone || h.accessibility?.support?.supportContact;
  if (phone) lines.push(`📞 ${phone}`);
  if (h.atmosphere?.localTip) lines.push('', `💡 ${h.atmosphere.localTip}`);
  return lines.join('\n');
}

function attractionDetailText(a) {
  const pt = peakTimesFor(a);
  const lines = [`🏛️ ${a.name}`];
  if (a.descriptionShort || a.description) lines.push(a.descriptionShort || a.description);
  const meta = [];
  if (Number.isFinite(a.rating) && a.rating > 0) meta.push(`📊 reyting ${a.rating.toFixed?.(1) ?? a.rating}`);
  if (a.entryFee) meta.push(`🎟️ ${a.entryFee}`);
  if (meta.length) lines.push('', meta.join('  ·  '));
  if (a.district || a.address) lines.push(`📍 ${[a.address, a.district].filter(Boolean).join(', ')}`);
  lines.push(`⏰ 🟢 Tinch: ${pt.quiet}`, `   🔴 Pik: ${pt.peak}`);
  lines.push(`🌤️ Mavsum: ${bestSeasonFor(a)}`);
  if (a.thingsToSeeAround?.length) {
    lines.push('', `🔎 Atrofda: ${a.thingsToSeeAround.slice(0, 4).map((t) => t.title).join(', ')}`);
  }
  if (a.atmosphere?.localTip) lines.push('', `💡 ${a.atmosphere.localTip}`);
  return lines.join('\n');
}

// Yordamchi: maskan ro'yxati javobi
const hotelsReply = (reply, list, n = 4) => ({ reply, hotels: list.slice(0, n).map(toHotelCard) });

// POST /api/assistant   body: { message }
export const askAssistant = asyncHandler(async (req, res) => {
  const message = (req.body?.message || '').toString().trim();
  if (!message) {
    return res.json({
      reply:
        "Salom! Men NavaiTour yordamchisiman. Quyidagilarni so'rashingiz mumkin:\n• \"Tarixiy joylar\"\n• \"Arzon mehmonxona\" yoki \"500 ming gacha\"\n• \"Bepul Wi-Fi bormi?\"\n• \"3 kunlik plan yoz\"",
      suggestions: SUGGESTIONS,
    });
  }

  const text = applySynonyms(normalize(message));

  // ── 0) KUNDALIK SUHBAT (small talk) ──────────────────────────────
  if (/^(salom|assalom|assalomu alaykum|hayrli kun|hayrli tong|hi|hello|hey)/.test(text)) {
    return res.json({
      reply:
        "Va alaykum assalom! 🙂 Men NavaiTour yordamchisiman. Tarixiy joylar, mehmonxonalar, narxlar, qulayliklar, sayohat rejasi va boshqalar bo'yicha yordam beraman. Nimadan boshlaymiz?",
      suggestions: SUGGESTIONS,
    });
  }
  if (/(rahmat|tashakkur|raxmat|katta rahmat|minnatdor)/.test(text)) {
    return res.json({ reply: "Arzimaydi 🙂 Yana savolingiz bo'lsa, bemalol so'rang.", suggestions: SUGGESTIONS });
  }
  if (/(qalaysiz|yaxshimisiz|qalesiz|ahvoling|how are you)/.test(text)) {
    return res.json({ reply: 'Rahmat, men yaxshiman! Sizga sayohat rejasini tuzishda yordam berishga tayyorman. 🌄', suggestions: SUGGESTIONS });
  }
  if (/^(xayr|ko'rishguncha|korishguncha|salomat bo'ling|bye|hayr)/.test(text)) {
    return res.json({ reply: "Xayr! Sayohatingiz yoqimli o'tsin. 👋" });
  }

  // ── 0.1) IMKONIYATLAR — "nima qila olasan?" ─────────────────────
  if (/nima qila ol|nima qilasan|nimalarni bil|qanday yordam|imkoniyat|nima haqida so'r|menyu|yordam ber|help\b|kim san|kimsan/.test(text)) {
    return res.json({
      reply:
        "Men quyidagilar bo'yicha yordam beraman 👇\n" +
        "• 🏛️ Tarixiy joylar va ularga eng yaqin tunash maskani\n" +
        "• 💰 Narx / byudjet — \"arzon\", \"500 ming gacha\"\n" +
        "• ✨ Qulayliklar — Wi-Fi, restoran, parking, konditsioner…\n" +
        "• ⭐ Yulduz bo'yicha — \"4 yulduzli mehmonxona\"\n" +
        "• 💳 To'lov usullari — Click / Payme / Naqd\n" +
        "• 🛏️ Xona turlari — oilaviy, lyuks, yakka\n" +
        "• 🕑 Check-in / check-out vaqtlari\n" +
        "• ♿ Inklyuziv — aravacha, ko'rish, eshitish, keksalar\n" +
        "• ⏰ Qachon borish yaxshi (pik / tinch vaqt)\n" +
        "• 📅 N kunlik sayohat rejasi\n" +
        "• ℹ️ Bron, ro'yxatdan o'tish va to'lov qanday ishlaydi",
      suggestions: SUGGESTIONS,
    });
  }

  // ── 0.1.5) UMUMIY MA'LUMOT (Navoiy, tarix, transport, taom) ──────
  if (/navoiy( haqida| tarixi| qayerda| viloyati| iqlimi)/.test(text)) {
    return res.json({
      reply: "Navoiy viloyati O'zbekistonning markazida joylashgan bo'lib, o'zining boy tarixi, Qizilqum cho'li, Aydarko'l va Nurota tog'lari bilan mashhur. Iqlimi kontinental, yozda issiq, qishda sovuq. Asosan sanoat, konchilik va turizm rivojlangan.",
      suggestions: ['Tarixiy joylar', '3 kunlik plan yoz']
    });
  }
  if (/transport|poezd|avtobus|samolyot|aeroport|qanday bor|yetib bor|taksi/.test(text)) {
    return res.json({
      reply: "Transport 🚆✈️\nNavoiy shahriga Toshkentdan yoki boshqa viloyatlardan «Afrosiyob» tezyurar poyezdi, samolyot (Navoiy xalqaro aeroporti) yoki avtobus/taksi orqali qulay yetib olish mumkin. Viloyat ichida esa taksi va mikroavtobuslar qatnaydi.",
      suggestions: ['Navoiy haqida', 'Arzon mehmonxona']
    });
  }
  if (/taom|ovqat|milliy|osh|somsa|tandir|shashlik|nima yey|suvenir|sovg'a|sovga/.test(text)) {
    return res.json({
      reply: "Milliy taomlar va Suvenirlar 🍢\nNavoiy viloyati, ayniqsa Nurota tumani o'zining mashhur «Tandir go'sht» va chashma suvida tayyorlangan turli milliy taomlari bilan ajralib turadi. Suvenir sifatida Nurotaning milliy kashtachilik mahsulotlari (so'zanalar) va sopol idishlarini xarid qilishingiz mumkin.",
      suggestions: ['Atrofda nima bor', 'Tarixiy joylar']
    });
  }
  if (/ob-?havo|iqlim|qanday kiyim|nima kiy|sovuqmi|issiqmi|fasl|havo qanday/.test(text)) {
    return res.json({
      reply: "Ob-havo va Kiyim-kechak 🌤️👕\nNavoiy iqlimi keskin kontinental. Yozda juda issiq (+40°C gacha), yengil paxta kiyimlar, bosh kiyim va ko'zoynak olishni unutmang. Qishda esa sovuq va shamolli bo'lishi mumkin, qalin kurtka tavsiya etiladi. Bahor va kuz sayohat uchun eng zo'r vaqt (yengil kurtka yoki sviter yetarli).",
      suggestions: ['Qachon borish yaxshi?', 'Tarixiy joylar']
    });
  }

  // ── 0.2) PLATFORMA FAQ — qanday ishlaydi ────────────────────────
  if (/qanday bron|bron qil|buyurtma|qanday band|joy band|book\b/.test(text)) {
    return res.json({
      reply:
        "Bron qilish 📝\nMehmonxona sahifasini oching → xona va narxlarni ko'ring → \"Mehmonxona egasi bilan chat\" tugmasi orqali yozing yoki ko'rsatilgan telefon raqamiga qo'ng'iroq qiling. Hozircha to'g'ridan-to'g'ri onlayn to'lovli bron emas — joy va sanani egasi bilan kelishasiz.",
      suggestions: ['Arzon mehmonxona', 'Telefon raqami', '4 yulduzli'],
    });
  }
  if (/ro'yxatdan|royxatdan|registratsiya|account|akkaunt|qanday kir(ish|aman)|login|profil ochish/.test(text)) {
    return res.json({
      reply:
        "Ro'yxatdan o'tish 👤\nYuqori o'ng burchakdagi \"Kirish\" orqali email/parol bilan yoki Google akkaunt orqali bir bosishda kirishingiz mumkin. Ro'yxatdan o'tgach: sevimlilarga qo'shish, egalar bilan chat va sharh qoldirish ochiladi.",
      suggestions: SUGGESTIONS,
    });
  }
  if (/qanday tolov|tolov qanday|qanday pul to|to'lov turlari|tolov turlari|naqd to|karta bilan|qanday hisob/.test(text)) {
    return res.json({
      reply:
        "To'lov 💳\nKo'pchilik maskanlar Click, Payme, Uzum Bank va naqd to'lovni qabul qiladi (har bir mehmonxonada belgilanadi). To'lov odatda joyga yetib borganda yoki egasi bilan kelishilgan tarzda amalga oshiriladi. Aniq usulni mehmonxona sahifasida ko'rasiz.",
      suggestions: ['Click qabul qiladiganlar', 'Arzon mehmonxona'],
    });
  }
  if (/bekor qil|qaytar|cancel|pulim qayt|vozvrat/.test(text)) {
    return res.json({
      reply:
        "Bekor qilish ↩️\nBekor qilish shartlari har bir maskanga bog'liq (bepul, qisman yoki qaytarilmaydigan). Aniq shartni mehmonxona sahifasida yoki egasi bilan chatda aniqlashtiring.",
      suggestions: SUGGESTIONS,
    });
  }

  const [hotels, attractions] = await Promise.all([
    Hotel.find({ approved: true }).lean(),
    Attraction.find({ approved: true }).lean(),
  ]);

  if (!hotels.length && !attractions.length) {
    return res.json({ reply: "Hozircha bazada ma'lumot yo'q. Iltimos, ma'lumot qo'shilishini kuting." });
  }

  // Tuman filtri
  const mentionedDistrict = DISTRICTS.find((d) => text.includes(d.toLowerCase()));
  let hotelPool = mentionedDistrict ? hotels.filter((h) => (h.district || h.city) === mentionedDistrict) : hotels;
  let attractionPool = mentionedDistrict ? attractions.filter((a) => a.district === mentionedDistrict) : attractions;

  // ── 0.3) NOM bo'yicha aniq maskan/joy (entity lookup) ───────────
  // Agar so'rov aniq bir maskan/joy nomiga mos kelsa — javobni o'shanga qaratamiz.
  const FIELD_RE = /narx|byudjet|arzon|qimmat|wifi|restoran|parking|konditsioner|qulaylik|yulduz|tolov|click|payme|naqd|uzum|xona|nomer|oilaviy|lyuks|toza|xizmat|telefon|manzil|atmosfera|maslahat|pik|tinch|qachon|check|kirish vaqt|chiqish vaqt|masofa|km|plan|reja|kun|hafta|aravacha|tarixiy|ovqat/;
  const entity = findEntity(text, hotels, attractions);
  if (entity) {
    const wantsField = FIELD_RE.test(text);
    if (!wantsField) {
      // Sof "X haqida" so'rovi — batafsil kartochka
      if (entity.kind === 'hotel') {
        const stayCard = toHotelCard(entity.o);
        return res.json({ reply: hotelDetailText(entity.o), hotels: [stayCard] });
      }
      const stay = nearestStay(entity.o, hotels);
      return res.json({
        reply: attractionDetailText(entity.o),
        attractions: [toAttractionCard(entity.o)],
        hotels: stay ? [toHotelCard(stay)] : [],
      });
    }
    // Maydon so'rovi — qidiruvni shu entityga toraytirib, quyidagi intentlar javob beradi
    if (entity.kind === 'hotel') hotelPool = [entity.o];
    else attractionPool = [entity.o];
  }

  // ── 0.4) KO'P-SHARTLI FILTR (2+ cheklov birga) ──────────────────
  // "wifi bor 4 yulduzli arzon resort", "Nurotada 500 ming gacha basseyni bor"
  if (!/(plan|reja|marshrut|itinerary)|kun(lik)?\b|hafta|week/.test(text)) {
    const c = extractConstraints(text);
    if (c.signals >= 2) {
      let list = applyConstraints(hotels, c);
      let relaxedNote = '';
      // Hech narsa topilmasa — narx cheklovini bo'shatib qayta urinib ko'ramiz
      if (!list.length && Number.isFinite(c.maxPrice)) {
        list = applyConstraints(hotels, { ...c, maxPrice: undefined });
        if (list.length) relaxedNote = `\n⚠️ ${fmtSom(c.maxPrice)} gacha to'liq mos kelmadi — shartlarga eng yaqinlari:`;
      }
      const label = describeConstraints(c);
      if (!list.length) {
        return res.json({
          reply: `Afsuski, quyidagi shartlarga mos maskan topilmadi: ${label}. Shartlardan birini yumshatib ko'ring.`,
          suggestions: SUGGESTIONS,
        });
      }
      const lines = [`🎯 So'rovingiz bo'yicha (${label}) ${list.length} ta maskan topildi:${relaxedNote}`, ''];
      for (const h of list.slice(0, 4)) {
        const p = cheapestPrice(h);
        lines.push(`🏨 ${h.name}${Number.isFinite(h.stars) ? ` · ⭐${h.stars}` : ''}${p ? ` · ${fmtSom(p)} dan` : ''}`);
      }
      return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 4).map(toHotelCard) });
    }
  }

  // ── 1) PLAN / REJA ───────────────────────────────────────────────
  if (/(plan|reja|marshrut|itinerary|sayohat)/.test(text) || /kun(lik)?\b/.test(text) || /hafta|week/.test(text)) {
    const days = extractDays(text);
    const plan = buildPlan(days, hotels, attractions);
    const lines = [`📅 ${days} kunlik inklyuziv sayohat rejasi (Navoiy viloyati):`, ''];
    for (const d of plan) {
      lines.push(`${d.day}-kun — ${d.district === 'Navoiy' ? 'Navoiy viloyati' : d.district + ' tumani'}`);
      if (d.places.length) lines.push(`   🏛️ Ko'riladigan joylar: ${d.places.join(', ')}`);
      if (d.stay) lines.push(`   🛏️ Tunash: ${d.stay.name} (⭐${d.stay.rating?.toFixed?.(1) || d.stay.rating})`);
      lines.push('');
    }
    lines.push('🌤️ Eng maqbul mavsum: ' + REGION_SEASON);
    lines.push("💡 Olomon kam bo'lishi uchun joylarga erta tongda yoki ish kunlari boring.");
    return res.json({
      reply: lines.join('\n'),
      plan,
      attractions: attractions.slice(0, 3).map(toAttractionCard),
      hotels: plan
        .filter((d) => d.stay)
        .map((d) => toHotelCard(hotels.find((h) => h._id.toString() === d.stay._id.toString())))
        .filter(Boolean)
        .slice(0, 4),
    });
  }

  // ── 2) NARX / BYUDJET ────────────────────────────────────────────
  if (/narx|byudjet|arzon|qimmat|tejamkor|necha pul|qancha tur|so'm|som\b|ming\b|cheap|price/.test(text)) {
    const priced = hotelPool
      .map((h) => ({ ...h, _price: cheapestPrice(h) }))
      .filter((h) => Number.isFinite(h._price));
    if (!priced.length) {
      return res.json({ reply: "Narx ma'lumoti ko'rsatilmagan maskanlar. Mehmonxona sahifasida xonalar narxini ko'ring.", suggestions: SUGGESTIONS });
    }
    const budget = extractBudget(text);
    const wantsExpensive = /qimmat|hashamatli|lyuks|eng yaxshi narx/.test(text);

    let list;
    let head;
    if (budget) {
      list = priced.filter((h) => h._price <= budget).sort((a, b) => a._price - b._price);
      head = list.length
        ? `${fmtSom(budget)} gacha ${list.length} ta maskan topildi${mentionedDistrict ? ` (${mentionedDistrict})` : ''}:`
        : `${fmtSom(budget)} gacha mos maskan topilmadi. Eng arzonlari:`;
      if (!list.length) list = [...priced].sort((a, b) => a._price - b._price);
    } else {
      list = [...priced].sort((a, b) => (wantsExpensive ? b._price - a._price : a._price - b._price));
      head = wantsExpensive
        ? `Eng yuqori darajadagi (hashamatli) maskanlar${mentionedDistrict ? ` — ${mentionedDistrict}` : ''}:`
        : `Eng arzon maskanlar${mentionedDistrict ? ` — ${mentionedDistrict}` : ''}:`;
    }
    if (priced.length === 1) head = `${priced[0].name} narxi:`;
    const lines = [head, ''];
    for (const h of list.slice(0, 4)) {
      lines.push(`🏨 ${h.name} — ${fmtSom(h._price)} dan/kecha${Number.isFinite(h.stars) ? ` · ⭐${h.stars}` : ''}`);
    }
    return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 4).map(toHotelCard) });
  }

  // ── 3) QULAYLIKLAR (amenities) ───────────────────────────────────
  // "atrofda/atrofida" bo'lsa — bu "joy atrofida nima bor" so'rovi, amenity emas
  const amenityHit = !/atrofda|atrofida|yaqin atrof/.test(text) && AMENITIES.find((m) => m.re.test(text));
  if (amenityHit) {
    const matched = hotelPool
      .filter((h) => hotelHasAmenity(h, amenityHit.keys))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!matched.length) {
      return res.json({
        reply: `Afsuski, "${amenityHit.label}" bo'lgan maskan topilmadi${mentionedDistrict ? ` (${mentionedDistrict})` : ''}.`,
        suggestions: SUGGESTIONS,
      });
    }
    return res.json(
      hotelsReply(`"${amenityHit.label}" mavjud ${matched.length} ta maskan${mentionedDistrict ? ` (${mentionedDistrict})` : ''}:`, matched)
    );
  }

  // ── 4) YULDUZLAR (stars) ─────────────────────────────────────────
  const starMatch = text.match(/([1-5])\s*yulduz/) || (/yulduz/.test(text) ? null : null);
  if (/yulduz|stars?\b/.test(text)) {
    const want = starMatch ? parseInt(starMatch[1], 10) : null;
    let list = hotelPool.filter((h) => Number.isFinite(h.stars));
    if (want) list = list.filter((h) => h.stars === want);
    list = list.sort((a, b) => (b.stars || 0) - (a.stars || 0) || (b.rating || 0) - (a.rating || 0));
    if (!list.length) {
      return res.json({ reply: want ? `${want} yulduzli maskan topilmadi.` : 'Yulduz darajasi belgilangan maskan topilmadi.', suggestions: SUGGESTIONS });
    }
    const head = want ? `${want} yulduzli ${list.length} ta maskan:` : "Yulduz darajasi bo'yicha maskanlar:";
    return res.json(hotelsReply(head, list));
  }

  // ── 5) TO'LOV USULLARI ───────────────────────────────────────────
  if (/tolov|click|payme|naqd|uzum|karta|plastik|muddatli/.test(text)) {
    let method = null;
    if (/click/.test(text)) method = 'Click';
    else if (/payme/.test(text)) method = 'Payme';
    else if (/uzum/.test(text)) method = 'Uzum Bank';
    else if (/naqd/.test(text)) method = 'Naqd';
    else if (/muddatli/.test(text)) method = "Muddatli to'lov";

    let list = hotelPool.filter((h) => h.paymentMethods?.length);
    if (method) list = list.filter((h) => h.paymentMethods.some((p) => p.toLowerCase().includes(method.toLowerCase())));
    list = list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!list.length) {
      return res.json({ reply: method ? `${method} qabul qiladigan maskan topilmadi.` : "To'lov usuli ko'rsatilmagan.", suggestions: SUGGESTIONS });
    }
    const head = method ? `${method} qabul qiladigan ${list.length} ta maskan:` : "To'lov usullari ko'rsatilgan maskanlar:";
    const lines = [head, ''];
    for (const h of list.slice(0, 4)) lines.push(`🏨 ${h.name} — 💳 ${h.paymentMethods.join(', ')}`);
    return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 4).map(toHotelCard) });
  }

  // ── 6) CHECK-IN / CHECK-OUT vaqtlari ─────────────────────────────
  if (/check.?in|check.?out|kirish vaqt|chiqish vaqt|nechada kir|nechada chiq|qachon kir|qachon chiq|joylashish vaqt/.test(text)) {
    const list = hotelPool.filter((h) => h.checkIn || h.checkOut).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!list.length) {
      return res.json({ reply: "Kirish/chiqish vaqti ko'rsatilmagan. Mehmonxona egasi bilan aniqlashtiring.", suggestions: SUGGESTIONS });
    }
    const lines = ['🕑 Kirish va chiqish vaqtlari:', ''];
    for (const h of list.slice(0, 4)) lines.push(`🏨 ${h.name}\n   ⬇️ Kirish: ${h.checkIn || '—'} · ⬆️ Chiqish: ${h.checkOut || '—'}`);
    return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 4).map(toHotelCard) });
  }

  // ── 7) XONA TURLARI ──────────────────────────────────────────────
  if (/\bxona|nomer|\broom\b|oilaviy|family|lyuks|suite|vip|yakka|single|ikki kishilik|double|king/.test(text)) {
    let roomType = null;
    let cat = null;
    if (/oilaviy|family/.test(text)) roomType = 'Family Room';
    else if (/yakka|single|bitta odam/.test(text)) roomType = 'Single Room';
    else if (/ikki kishilik|double|juft/.test(text)) roomType = 'Double Room';
    if (/lyuks|suite|vip|hashamat|luxury/.test(text)) cat = /luxury|vip/.test(text) ? 'Luxury / VIP' : 'Suite';

    const matchRoom = (r) =>
      (!roomType || r.roomType === roomType) &&
      (!cat || (r.category || '').toLowerCase().includes(cat.toLowerCase().split(' ')[0]));

    const list = hotelPool
      .map((h) => {
        const rooms = (h.rooms || []).filter(matchRoom);
        return rooms.length ? { h, room: rooms.sort((a, b) => a.pricePerNight - b.pricePerNight)[0] } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (b.h.rating || 0) - (a.h.rating || 0));

    if (!list.length) {
      const label = roomType || cat || 'so\'ralgan turdagi xona';
      return res.json({ reply: `"${label}" mavjud maskan topilmadi.`, suggestions: SUGGESTIONS });
    }
    const label = roomType || cat || 'Xonalar';
    const lines = [`🛏️ ${label} mavjud maskanlar:`, ''];
    for (const { h, room } of list.slice(0, 4)) {
      lines.push(`🏨 ${h.name} — ${room.name}${room.pricePerNight ? ` (${fmtSom(room.pricePerNight)}/kecha)` : ''}${room.capacity ? ` · ${room.capacity} kishi` : ''}`);
    }
    return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 4).map(({ h }) => toHotelCard(h)) });
  }

  // ── 8) REYTING KATEGORIYALARI (toza/xizmat/narx-sifat/joylashuv) ─
  let ratingField = null;
  let ratingLabel = '';
  if (/toza|tozalik|clean/.test(text)) { ratingField = 'cleanliness'; ratingLabel = 'tozaligi'; }
  else if (/xizmat|service|xodim/.test(text)) { ratingField = 'service'; ratingLabel = 'xizmati'; }
  else if (/narx-?sifat|qiymat|value|arzonga sifat/.test(text)) { ratingField = 'valueForMoney'; ratingLabel = 'narx-sifat nisbati'; }
  else if (/joylashuv|joylashgan yaxshi|location yaxshi/.test(text)) { ratingField = 'location'; ratingLabel = 'joylashuvi'; }
  else if (/qulaylik darajasi|qulayligi|comfort/.test(text)) { ratingField = 'comfort'; ratingLabel = 'qulayligi'; }

  if (ratingField) {
    const scored = hotelPool
      .map((h) => ({ h, v: h.ratings?.[ratingField] ?? null }))
      .filter((x) => x.v != null)
      .sort((a, b) => b.v - a.v);
    const list = scored.length ? scored : [...hotelPool].map((h) => ({ h, v: h.rating })).sort((a, b) => (b.v || 0) - (a.v || 0));
    if (!list.length) return res.json({ reply: 'Mos maskan topilmadi.', suggestions: SUGGESTIONS });
    const lines = [`Eng yuqori ${ratingLabel} bo'yicha maskanlar:`, ''];
    for (const { h, v } of list.slice(0, 4)) lines.push(`🏨 ${h.name} — ${Number.isFinite(v) ? `⭐${v.toFixed?.(1) ?? v}` : ''}`);
    return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 4).map(({ h }) => toHotelCard(h)) });
  }

  // ── 9) BOG'LANISH / MANZIL / TELEFON ─────────────────────────────
  if (/telefon|bog'lan|boglan|aloqa|manzil|qayerda joylash|qayerda joy|address|email|sayt|website|kontakt/.test(text)) {
    const list = hotelPool
      .filter((h) => h.contact?.phone || h.accessibility?.support?.supportContact || h.address)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!list.length) {
      return res.json({ reply: "Bog'lanish ma'lumoti ko'rsatilmagan. Mehmonxona sahifasini oching.", suggestions: SUGGESTIONS });
    }
    const lines = ["📞 Bog'lanish ma'lumotlari:", ''];
    for (const h of list.slice(0, 4)) {
      const phone = h.contact?.phone || h.accessibility?.support?.supportContact;
      lines.push(`🏨 ${h.name}`);
      if (h.address || h.district) lines.push(`   📍 ${[h.address, h.district || h.city].filter(Boolean).join(', ')}`);
      if (phone) lines.push(`   📞 ${phone}`);
    }
    return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 4).map(toHotelCard) });
  }

  // ── 10) ATMOSFERA / MASLAHAT (tinch / jonli / local tip) ─────────
  if (/tinch joy|sokin|romantik|jonli|gavjum joy|muhit|atmosfera|maslahat|local tip|tavsiya beradigan|qanaqa his/.test(text)) {
    const wantLively = /jonli|gavjum joy/.test(text);
    const withMood = hotelPool.filter((h) => h.atmosphere?.mood);
    let list = withMood.filter((h) => {
      const mood = (h.atmosphere?.mood || '').toLowerCase();
      return wantLively ? /jonli|gavjum/.test(mood) : /tinch|sokin|sakin|ziyorat/.test(mood);
    });
    if (!list.length) list = withMood;
    list = list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!list.length) return res.json({ reply: "Atmosfera ma'lumoti ko'rsatilmagan.", suggestions: SUGGESTIONS });
    const lines = [wantLively ? '🎉 Jonli muhitli maskanlar:' : '🌿 Tinch va sokin maskanlar:', ''];
    for (const h of list.slice(0, 3)) {
      lines.push(`🏨 ${h.name} — ${h.atmosphere.mood}`);
      if (h.atmosphere?.localTip) lines.push(`   💡 ${h.atmosphere.localTip}`);
    }
    return res.json({ reply: lines.join('\n'), hotels: list.slice(0, 3).map(toHotelCard) });
  }

  // ── 11) PIK / TINCH VAQT ─────────────────────────────────────────
  if (/\bpik\b|tinch vaqt|qachon bor|qachon kel|qachon tashrif|qaysi vaqt|qaysi payt|qancha odam|odam kam|kam odam|crowd|busy|peak/.test(text)) {
    const pool = attractionPool.length ? attractionPool : attractions;
    if (!pool.length) {
      return res.json({ reply: "Hozircha tarixiy joy ma'lumoti yo'q.", suggestions: SUGGESTIONS });
    }
    const top = pool.slice(0, 3);
    const lines = [`⏰ Tashrif uchun pik (gavjum) va tinch vaqtlar${mentionedDistrict ? (mentionedDistrict === 'Navoiy' ? ' — Navoiy viloyati' : ` — ${mentionedDistrict} tumani`) : ''}:`, ''];
    for (const a of top) {
      const pt = peakTimesFor(a);
      lines.push(`🏛️ ${a.name}`);
      lines.push(`   🔴 Pik: ${pt.peak}`);
      lines.push(`   🟢 Tinch: ${pt.quiet}`);
      if (pt.note) lines.push(`   ℹ️ ${pt.note}`);
      lines.push(`   🌤️ Mavsum: ${bestSeasonFor(a)}`);
      lines.push('');
    }
    lines.push("💡 Maslahat: tinch vaqtni tanlasangiz, navbat va olomon kamroq bo'ladi.");
    const stay = nearestStay(top[0], hotels);
    return res.json({
      reply: lines.join('\n'),
      attractions: top.map(toAttractionCard),
      hotels: stay ? [toHotelCard(stay)] : [],
    });
  }

  // ── 12) INKLYUZIV so'rovlar ──────────────────────────────────────
  let accessKind = null;
  if (/aravacha|wheelchair/.test(text)) accessKind = 'wheelchair';
  else if (/ko'rish|braille|brayl/.test(text)) accessKind = 'visual';
  else if (/eshitish|hearing|kar\b/.test(text)) accessKind = 'auditory';
  else if (/keksa|qari|elderly|nuroniy/.test(text)) accessKind = 'elderly';

  if (accessKind) {
    const matched = hotelPool.filter((h) => isAccessible(h, accessKind)).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const labels = {
      wheelchair: 'aravacha foydalanuvchilar',
      visual: "ko'rish qiyinchiligi bo'lganlar",
      auditory: "eshitish qiyinchiligi bo'lganlar",
      elderly: 'keksalar',
    };
    if (!matched.length) return res.json({ reply: `Afsuski, ${labels[accessKind]} uchun mos maskan topilmadi.`, suggestions: SUGGESTIONS });
    return res.json(hotelsReply(`${labels[accessKind]} uchun ${matched.length} ta mos maskan topildi${mentionedDistrict ? ` (${mentionedDistrict})` : ''}:`, matched));
  }

  // ── 13) ATROFDA NIMA BOR — ovqat / bozor / tabiat ────────────────
  if (/atrofda|yaqin atrof|nima bor|ovqatlan|qayerda ovqat|nima yey|bozor|choyxona|cafe|kafe/.test(text)) {
    const typeWanted = /ovqat|yey|choyxona|cafe|kafe/.test(text) ? 'ovqat'
      : /bozor/.test(text) ? 'bozor'
      : /tabiat|tog'|ko'l|daryo/.test(text) ? 'tabiat' : null;
    const pool = attractionPool.length ? attractionPool : attractions;
    const lines = [`🔎 Joylar atrofida ko'rsa/borib bo'ladigan joylar${mentionedDistrict ? ` — ${mentionedDistrict}` : ''}:`, ''];
    let any = false;
    for (const a of pool.slice(0, 4)) {
      let around = a.thingsToSeeAround || [];
      if (typeWanted) around = around.filter((t) => t.type === typeWanted);
      if (!around.length) continue;
      any = true;
      lines.push(`🏛️ ${a.name}`);
      for (const t of around.slice(0, 3)) {
        lines.push(`   • ${t.title}${t.walkingMinutes ? ` (~${t.walkingMinutes} daq piyoda)` : ''}`);
      }
      lines.push('');
    }
    if (!any) {
      return res.json({ reply: "Atrofdagi joylar bo'yicha ma'lumot hozircha kam. Tarixiy joy sahifasini oching — \"Atrofda nima bor\" bo'limida ko'rsatiladi.", suggestions: SUGGESTIONS });
    }
    return res.json({ reply: lines.join('\n'), attractions: pool.slice(0, 3).map(toAttractionCard) });
  }

  // ── 14) TARIXIY JOYLAR (+ eng yaqin tunash maskani + pik/mavsum) ─
  if (
    /tarixiy|tarix|diqqatga sazovor|ziyorat|yodgorlik|joylar|nima ko'rsa|nima korsa|ko'rsa bo'ladi|ko'rgazma/.test(text) ||
    (mentionedDistrict && !/maskan|mehmonxona|hotel|tunash|qo'nish/.test(text))
  ) {
    if (!attractionPool.length) {
      return res.json({ reply: "Hozircha bu hudud bo'yicha tarixiy joy ma'lumoti yo'q.", suggestions: SUGGESTIONS });
    }
    const top = attractionPool.slice(0, 4);
    const first = top[0];
    const pt = peakTimesFor(first);
    const stay = nearestStay(first, hotels);
    const lines = [
      `${mentionedDistrict ? `${mentionedDistrict} tumanidagi` : 'Navoiy viloyatidagi'} tarixiy va diqqatga sazovor joylar:`,
      ...top.map((a) => `🏛️ ${a.name}${a.entryFee ? ` — ${a.entryFee}` : ''}`),
      '',
      `⏰ "${first.name}" uchun: 🟢 tinch — ${pt.quiet}; 🔴 pik — ${pt.peak}.`,
      `🌤️ Mavsum: ${bestSeasonFor(first)}`,
    ];
    if (stay) {
      lines.push('', `🛏️ Eng yaqin tunash joyi: ${stay.name}${Number.isFinite(stay.distanceKm) ? ` (~${stay.distanceKm} km)` : ''}.`);
    }
    lines.push('', "Joyni ochib atrofdagilarni ko'ring, pastida yaqin tunash maskanlari chiqadi.");
    return res.json({
      reply: lines.join('\n'),
      attractions: top.map(toAttractionCard),
      hotels: stay ? [toHotelCard(stay)] : [],
    });
  }

  // ── 15) STATISTIKA / UMUMIY ──────────────────────────────────────
  if (/nechta|necha ta|qancha mehmon|qancha maskan|qancha joy|statistik|umumiy ma'lumot|royxat|qaysi tuman/.test(text)) {
    const prices = hotels.map(cheapestPrice).filter(Number.isFinite);
    const byDistrict = DISTRICTS.map((d) => `${d}: ${hotels.filter((h) => (h.district || h.city) === d).length} maskan`).join(', ');
    const lines = [
      '📊 NavaiTour bazasi (Navoiy viloyati):',
      `🏨 Maskanlar: ${hotels.length} ta`,
      `🏛️ Tarixiy joylar: ${attractions.length} ta`,
      `🗺️ Tumanlar bo'yicha: ${byDistrict}`,
    ];
    if (prices.length) lines.push(`💰 Narx oralig'i: ${fmtSom(Math.min(...prices))} – ${fmtSom(Math.max(...prices))} / kecha`);
    return res.json({ reply: lines.join('\n'), suggestions: SUGGESTIONS });
  }

  // ── 15.5) AQLLI KONTENT-QIDIRUV (egalar yozgan har qanday matndan) ─
  // Tavsif, teglar, yaqin joylar, xavfsizlik, atmosfera matnlaridan qidiradi.
  // Masalan: "tog' manzarali", "Aydarko'lga yaqin", "qo'riqlanadigan", "petrogliflar".
  {
    const found = smartSearch(text, hotels, attractions);
    if (found.length) {
      const hotelsF = found.filter((e) => e.kind === 'hotel').map((e) => e.o);
      const attrsF = found.filter((e) => e.kind === 'attraction').map((e) => e.o);
      const lines = [`🔎 So'rovingiz bo'yicha ${found.length} ta natija topildi:`, ''];
      for (const e of found.slice(0, 5)) {
        const sub = e.kind === 'hotel'
          ? `${e.o.district || e.o.city || ''}${cheapestPrice(e.o) ? ` · ${fmtSom(cheapestPrice(e.o))} dan` : ''}`
          : `${e.o.district || ''}${e.o.entryFee ? ` · ${e.o.entryFee}` : ''}`;
        lines.push(`${e.kind === 'hotel' ? '🏨' : '🏛️'} ${e.o.name}${sub ? ` — ${sub}` : ''}`);
      }
      return res.json({
        reply: lines.join('\n'),
        hotels: hotelsF.slice(0, 4).map(toHotelCard),
        attractions: attrsF.slice(0, 3).map(toAttractionCard),
      });
    }
  }

  // ── 16) ENG YAXSHI / TOP / TAVSIYA / mehmonxona (generic) ────────
  if (/eng yaxshi|yaxshi joy|top|zo'r|tavsiya|reyting|recommend|best|maskan|mehmonxona|tunash|qayerda tunay/.test(text) || mentionedDistrict) {
    const best = [...hotelPool].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!best.length) return res.json({ reply: 'Mos maskan topilmadi.', suggestions: SUGGESTIONS });
    const topHotel = best[0];
    const price = cheapestPrice(topHotel);
    return res.json({
      reply: `Eng yaxshi tanlov${mentionedDistrict ? (mentionedDistrict === 'Navoiy' ? ' Navoiy viloyatida' : ` ${mentionedDistrict} tumanida`) : ''}: ${topHotel.name} (⭐${topHotel.rating?.toFixed?.(1) || topHotel.rating})${price ? `, ${fmtSom(price)} dan/kecha` : ''}.`,
      hotels: best.slice(0, 4).map(toHotelCard),
    });
  }

  // ── 17) STANDART javob (tushunmaganda — aniq takliflar) ──────────
  return res.json({
    reply:
      "Tushunmadim 🙂 Quyidagicha so'rab ko'ring:\n• \"Tarixiy joylar\" yoki tuman nomi (Nurota, Xatirchi, Qiziltepa)\n• \"Arzon mehmonxona\" yoki \"500 ming gacha\"\n• \"Bepul Wi-Fi bormi?\", \"4 yulduzli\", \"Oilaviy xona\"\n• \"Qachon borish yaxshi?\" yoki \"3 kunlik plan yoz\"\n\nBarcha imkoniyatlarni ko'rish uchun \"Nima qila olasan?\" deb yozing.",
    suggestions: ['Nima qila olasan?', 'Tarixiy joylar', 'Arzon mehmonxona', '3 kunlik plan yoz'],
  });
});
