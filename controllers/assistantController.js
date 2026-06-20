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
 *   - "tarixiy joylar"     → tuman bo'yicha tarixiy/diqqatga sazovor joylar
 *   - "eng yaxshi joy"     → reyting bo'yicha eng yaxshi maskanlar
 *   - "N kunlik plan"      → N-kunlik sayohat rejasi (tuman + tarixiy joy)
 *   - tuman nomi bo'yicha  → o'sha tumandagi joylar
 *   - inklyuziv so'rov     → aravacha/ko'rish/eshitish/keksalar uchun moslar
 */

const DISTRICTS = ['Nurota', 'Xatirchi', 'Qiziltepa'];

// Matnni normallashtirish (kichik harf + apostroflarni birlashtirish)
const normalize = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .trim();

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
});

// Tarixiy joy (Attraction) kartochkasi
const toAttractionCard = (a) => ({
  _id: a._id,
  name: a.name,
  district: a.district,
  rating: a.rating,
  image: a.images?.[0] || null,
  descriptionShort: a.descriptionShort || '',
  entryFee: a.entryFee || '',
  type: 'attraction',
});

const SUGGESTIONS = ['Tarixiy joylar', 'Eng yaxshi joy', '3 kunlik plan yoz', 'Aravacha uchun qulay'];

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
        "Salom! Men NavaiTour yordamchisiman. Quyidagilarni so'rashingiz mumkin:\n• \"Tarixiy joylar\"\n• \"Nurota haqida ma'lumot\"\n• \"3 kunlik plan yoz\"\n• \"Aravacha uchun qulay joy\"",
      suggestions: SUGGESTIONS,
    });
  }

  const text = normalize(message);

  // ── 0) KUNDALIK SUHBAT (small talk) ──────────────────────────────
  if (/^(salom|assalom|assalomu alaykum|hayrli kun|hayrli tong|hi|hello)/.test(text)) {
    return res.json({
      reply: "Va alaykum assalom! 🙂 Men NavaiTour yordamchisiman. Navoiy viloyatidagi tarixiy joylar va ularga yaqin tunash maskanlari bo'yicha yordam beraman. Nimadan boshlaymiz?",
      suggestions: SUGGESTIONS,
    });
  }
  if (/(rahmat|tashakkur|raxmat|katta rahmat)/.test(text)) {
    return res.json({ reply: 'Arzimaydi 🙂 Yana savolingiz bo\'lsa, bemalol so\'rang.', suggestions: SUGGESTIONS });
  }
  if (/(qalaysiz|yaxshimisiz|qalesiz|ahvoling|how are you)/.test(text)) {
    return res.json({ reply: 'Rahmat, men yaxshiman! Sizga sayohat rejasini tuzishda yordam berishga tayyorman. 🌄', suggestions: SUGGESTIONS });
  }
  if (/^(xayr|ko'rishguncha|korishguncha|salomat bo'ling|bye)/.test(text)) {
    return res.json({ reply: 'Xayr! Sayohatingiz yoqimli o\'tsin. 👋' });
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
  const hotelPool = mentionedDistrict
    ? hotels.filter((h) => (h.district || h.city) === mentionedDistrict)
    : hotels;
  const attractionPool = mentionedDistrict
    ? attractions.filter((a) => a.district === mentionedDistrict)
    : attractions;

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
    lines.push('Barcha tavsiya etilgan maskanlar nogironlar va keksalar uchun moslashtirilgan.');
    return res.json({
      reply: lines.join('\n'),
      plan,
      attractions: attractions.slice(0, 3).map(toAttractionCard),
      hotels: plan.filter((d) => d.stay)
        .map((d) => toHotelCard(hotels.find((h) => h._id.toString() === d.stay._id.toString())))
        .filter(Boolean)
        .slice(0, 4),
    });
  }

  // ── 2) INKLYUZIV so'rovlar ───────────────────────────────────────
  let accessKind = null;
  if (/aravacha|nogiron|wheelchair/.test(text)) accessKind = 'wheelchair';
  else if (/ko'rish|braille|brayl/.test(text)) accessKind = 'visual';
  else if (/eshitish|hearing|kar\b/.test(text)) accessKind = 'auditory';
  else if (/keksa|qari|elderly/.test(text)) accessKind = 'elderly';

  if (accessKind) {
    const matched = hotelPool.filter((h) => isAccessible(h, accessKind)).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const labels = {
      wheelchair: 'aravacha foydalanuvchilar',
      visual: "ko'rish qiyinchiligi bo'lganlar",
      auditory: 'eshitish qiyinchiligi bo\'lganlar',
      elderly: 'keksalar',
    };
    if (!matched.length) return res.json({ reply: `Afsuski, ${labels[accessKind]} uchun mos maskan topilmadi.`, suggestions: SUGGESTIONS });
    return res.json({
      reply: `${labels[accessKind]} uchun ${matched.length} ta mos maskan topildi${mentionedDistrict ? ` (${mentionedDistrict})` : ''}:`,
      hotels: matched.slice(0, 4).map(toHotelCard),
    });
  }

  // ── 3) TARIXIY JOYLAR ────────────────────────────────────────────
  if (/tarixiy|tarix|diqqatga sazovor|ziyorat|yodgorlik|joylar|nima ko'rsa|nima korsa|ko'rsa bo'ladi/.test(text) || (mentionedDistrict && !/maskan|mehmonxona|hotel|tunash|qo'nish/.test(text))) {
    if (!attractionPool.length) {
      return res.json({ reply: "Hozircha bu hudud bo'yicha tarixiy joy ma'lumoti yo'q.", suggestions: SUGGESTIONS });
    }
    const top = attractionPool.slice(0, 4);
    return res.json({
      reply: `${mentionedDistrict ? `${mentionedDistrict} tumanidagi` : 'Navoiy viloyatidagi'} tarixiy va diqqatga sazovor joylar:\n${top.map((a) => `🏛️ ${a.name}${a.entryFee ? ` — ${a.entryFee}` : ''}`).join('\n')}\n\nJoyni ochib 360° video va atrofdagilarni ko'ring, pastida yaqin tunash maskanlari chiqadi.`,
      attractions: top.map(toAttractionCard),
    });
  }

  // ── 4) ENG YAXSHI / TOP / TAVSIYA ────────────────────────────────
  if (/eng yaxshi|yaxshi joy|top|zo'r|tavsiya|reyting|recommend|best|maskan|mehmonxona|tunash/.test(text) || mentionedDistrict) {
    const best = [...hotelPool].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (!best.length) return res.json({ reply: 'Mos maskan topilmadi.', suggestions: SUGGESTIONS });
    const topHotel = best[0];
    return res.json({
      reply: `Eng yaxshi tanlov${mentionedDistrict ? ` ${mentionedDistrict} tumanida` : ''}: ${topHotel.name} (⭐${topHotel.rating?.toFixed?.(1) || topHotel.rating}).`,
      hotels: best.slice(0, 4).map(toHotelCard),
    });
  }

  // ── 5) STANDART javob ────────────────────────────────────────────
  return res.json({
    reply: "Tushunmadim 🙂 Quyidagicha so'rab ko'ring:\n• \"Tarixiy joylar\"\n• \"Nurota haqida ma'lumot\"\n• \"3 kunlik plan yoz\"\n• \"Aravacha uchun qulay joy\"",
    suggestions: SUGGESTIONS,
  });
});
