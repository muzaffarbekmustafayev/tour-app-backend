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
 * Imkoniyatlar:
 *   - kundalik suhbat (salom, rahmat, qalaysiz, xayr)
 *   - "pik / tinch vaqt"   → joyga qachon borish yaxshi (gavjum/tinch + mavsum)
 *   - "tarixiy joylar"     → tuman bo'yicha joylar + eng yaqin tunash maskani
 *   - "eng yaxshi joy"     → reyting bo'yicha eng yaxshi maskanlar
 *   - "N kunlik plan"      → N-kunlik sayohat rejasi (tuman + tarixiy joy)
 *   - tuman nomi bo'yicha  → o'sha tumandagi joylar
 *   - inklyuziv so'rov     → aravacha/ko'rish/eshitish/keksalar uchun moslar
 *   - imlo/sinonim bardoshliligi + tushunmaganda aniq takliflar
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
    .replace(/\b(mehmonhona|mehmonxna|mehonxona|mehmonhna|gostinitsa|gostinitsalar|otel|otell)\b/g, 'mehmonxona')
    .replace(/\b(tarixi|tarihiy|tarxiy|tarixy)\b/g, 'tarixiy')
    .replace(/\b(gavjum|gavjumi|gavjummi|tig'iz|tigiz|tirband|tirbandlik|qalaba|olomon|navbat|band)\b/g, 'pik')
    .replace(/\b(qulayli|qulayrok|qulayroq)\b/g, 'qulay')
    .replace(/\b(aravacha|kolyaska|invalid|nogiron)\b/g, 'aravacha');

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
  image: h.images?.[0] || null,
  category: h.category,
  descriptionShort: h.descriptionShort || '',
  nearbyPlaces: h.nearbyPlaces || [],
  distanceKm: Number.isFinite(h.distanceKm) ? h.distanceKm : undefined,
});

// Tarixiy joy (Attraction) kartochkasi — endi pik/tinch vaqt va mavsum bilan
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

const SUGGESTIONS = ['Tarixiy joylar', 'Qachon borish yaxshi?', '3 kunlik plan yoz', 'Aravacha uchun qulay'];

// Inklyuziv (nogironlar uchun) moslik tekshiruvi — Hotel
const isAccessible = (h, kind) => {
  const a = h.accessibility || {};
  if (kind === 'wheelchair') return a.mobility?.wheelchairAccessible;
  if (kind === 'visual') return a.visual?.brailleSigns || a.visual?.tactilePaving;
  if (kind === 'auditory') return a.auditory?.audioGuides || a.auditory?.hearingLoop;
  if (kind === 'elderly') return h.familyAndElderly?.orthopedicBeddingAvailable || h.familyAndElderly?.grabBarsInBathroom;
  return true;
};

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

// POST /api/assistant   body: { message }
export const askAssistant = asyncHandler(async (req, res) => {
  const message = (req.body?.message || '').toString().trim();
  if (!message) {
    return res.json({
      reply:
        "Salom! Men NavaiTour yordamchisiman. Quyidagilarni so'rashingiz mumkin:\n• \"Tarixiy joylar\"\n• \"Qachon borish yaxshi?\" (pik/tinch vaqt)\n• \"3 kunlik plan yoz\"\n• \"Aravacha uchun qulay joy\"",
      suggestions: SUGGESTIONS,
    });
  }

  const text = applySynonyms(normalize(message));

  // ── 0) KUNDALIK SUHBAT (small talk) ──────────────────────────────
  if (/^(salom|assalom|assalomu alaykum|hayrli kun|hayrli tong|hi|hello)/.test(text)) {
    return res.json({
      reply:
        "Va alaykum assalom! 🙂 Men NavaiTour yordamchisiman. Navoiy viloyatidagi tarixiy joylar, ularga eng yaqin tunash maskanlari va qachon borish (pik/tinch vaqt) bo'yicha yordam beraman. Nimadan boshlaymiz?",
      suggestions: SUGGESTIONS,
    });
  }
  if (/(rahmat|tashakkur|raxmat|katta rahmat)/.test(text)) {
    return res.json({ reply: "Arzimaydi 🙂 Yana savolingiz bo'lsa, bemalol so'rang.", suggestions: SUGGESTIONS });
  }
  if (/(qalaysiz|yaxshimisiz|qalesiz|ahvoling|how are you)/.test(text)) {
    return res.json({ reply: 'Rahmat, men yaxshiman! Sizga sayohat rejasini tuzishda yordam berishga tayyorman. 🌄', suggestions: SUGGESTIONS });
  }
  if (/^(xayr|ko'rishguncha|korishguncha|salomat bo'ling|bye)/.test(text)) {
    return res.json({ reply: "Xayr! Sayohatingiz yoqimli o'tsin. 👋" });
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
  const hotelPool = mentionedDistrict ? hotels.filter((h) => (h.district || h.city) === mentionedDistrict) : hotels;
  const attractionPool = mentionedDistrict ? attractions.filter((a) => a.district === mentionedDistrict) : attractions;

  // ── 1) PLAN / REJA ───────────────────────────────────────────────
  if (/(plan|reja|marshrut|itinerary|sayohat)/.test(text) || /kun(lik)?\b/.test(text) || /hafta|week/.test(text)) {
    const days = extractDays(text);
    const plan = buildPlan(days, hotels, attractions);
    const lines = [`📅 ${days} kunlik inklyuziv sayohat rejasi (Navoiy viloyati):`, ''];
    for (const d of plan) {
      lines.push(`${d.day}-kun — ${d.district} tumani`);
      if (d.places.length) lines.push(`   🏛️ Ko'riladigan joylar: ${d.places.join(', ')}`);
      if (d.stay) lines.push(`   🛏️ Tunash: ${d.stay.name} (⭐${d.stay.rating?.toFixed?.(1) || d.stay.rating})`);
      lines.push('');
    }
    lines.push("🌤️ Eng maqbul mavsum: " + REGION_SEASON);
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

  // ── 2) PIK / TINCH VAQT — "qachon borish yaxshi", "qaysi joy gavjum" ──
  if (/\bpik\b|tinch vaqt|qachon bor|qachon kel|qachon tashrif|qaysi vaqt|qaysi payt|qancha odam|odam kam|kam odam|crowd|busy|peak/.test(text)) {
    const pool = attractionPool.length ? attractionPool : attractions;
    if (!pool.length) {
      return res.json({ reply: "Hozircha tarixiy joy ma'lumoti yo'q.", suggestions: SUGGESTIONS });
    }
    const top = pool.slice(0, 3);
    const lines = [`⏰ Tashrif uchun pik (gavjum) va tinch vaqtlar${mentionedDistrict ? ` — ${mentionedDistrict} tumani` : ''}:`, ''];
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
    // Birinchi joyga eng yaqin tunash maskanini ham qo'shamiz
    const stay = nearestStay(top[0], hotels);
    return res.json({
      reply: lines.join('\n'),
      attractions: top.map(toAttractionCard),
      hotels: stay ? [toHotelCard(stay)] : [],
    });
  }

  // ── 3) INKLYUZIV so'rovlar ───────────────────────────────────────
  let accessKind = null;
  if (/aravacha|wheelchair/.test(text)) accessKind = 'wheelchair';
  else if (/ko'rish|braille|brayl/.test(text)) accessKind = 'visual';
  else if (/eshitish|hearing|kar\b/.test(text)) accessKind = 'auditory';
  else if (/keksa|qari|elderly/.test(text)) accessKind = 'elderly';

  if (accessKind) {
    const matched = hotelPool.filter((h) => isAccessible(h, accessKind)).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const labels = {
      wheelchair: 'aravacha foydalanuvchilar',
      visual: "ko'rish qiyinchiligi bo'lganlar",
      auditory: "eshitish qiyinchiligi bo'lganlar",
      elderly: 'keksalar',
    };
    if (!matched.length) return res.json({ reply: `Afsuski, ${labels[accessKind]} uchun mos maskan topilmadi.`, suggestions: SUGGESTIONS });
    return res.json({
      reply: `${labels[accessKind]} uchun ${matched.length} ta mos maskan topildi${mentionedDistrict ? ` (${mentionedDistrict})` : ''}:`,
      hotels: matched.slice(0, 4).map(toHotelCard),
    });
  }

  // ── 4) TARIXIY JOYLAR (+ eng yaqin tunash maskani + pik/mavsum) ──
  if (
    /tarixiy|tarix|diqqatga sazovor|ziyorat|yodgorlik|joylar|nima ko'rsa|nima korsa|ko'rsa bo'ladi/.test(text) ||
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
    lines.push('', 'Joyni ochib 360° video va atrofdagilarni ko\'ring, pastida yaqin tunash maskanlari chiqadi.');
    return res.json({
      reply: lines.join('\n'),
      attractions: top.map(toAttractionCard),
      hotels: stay ? [toHotelCard(stay)] : [],
    });
  }

  // ── 5) ENG YAXSHI / TOP / TAVSIYA ────────────────────────────────
  if (/eng yaxshi|yaxshi joy|top|zo'r|tavsiya|reyting|recommend|best|maskan|mehmonxona|tunash/.test(text) || mentionedDistrict) {
    const best = [...hotelPool].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!best.length) return res.json({ reply: 'Mos maskan topilmadi.', suggestions: SUGGESTIONS });
    const topHotel = best[0];
    return res.json({
      reply: `Eng yaxshi tanlov${mentionedDistrict ? ` ${mentionedDistrict} tumanida` : ''}: ${topHotel.name} (⭐${topHotel.rating?.toFixed?.(1) || topHotel.rating}).`,
      hotels: best.slice(0, 4).map(toHotelCard),
    });
  }

  // ── 6) STANDART javob (tushunmaganda — aniq takliflar) ───────────
  return res.json({
    reply:
      "Tushunmadim 🙂 Quyidagicha so'rab ko'ring:\n• \"Tarixiy joylar\" yoki tuman nomi (Nurota, Xatirchi, Qiziltepa)\n• \"Qachon borish yaxshi?\" — pik va tinch vaqtlar\n• \"3 kunlik plan yoz\"\n• \"Aravacha uchun qulay joy\"",
    suggestions: ['Tarixiy joylar', 'Qachon borish yaxshi?', 'Nurota', '3 kunlik plan yoz'],
  });
});
