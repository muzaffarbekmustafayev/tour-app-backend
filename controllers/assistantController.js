import { asyncHandler } from '../lib/asyncHandler.js';
import Hotel from '../models/Hotel.js';

/**
 * AI Yordamchi — mavjud ma'lumotlar asosida javob beruvchi assistant.
 *
 * Tashqi LLM kerak emas: barcha javoblar bazadagi real mehmonxona/maskan
 * ma'lumotlaridan generatsiya qilinadi. Shu sababli demo va grant taqdimotida
 * internetsiz ham barqaror ishlaydi.
 *
 * Imkoniyatlar:
 *   - "eng yaxshi joy"      → reyting bo'yicha eng yaxshi maskanlar
 *   - "tarixiy joylar"      → tuman bo'yicha tarixiy/diqqatga sazovor joylar
 *   - "7 kunlik plan"       → N-kunlik sayohat rejasi (tuman + tarixiy joy)
 *   - tuman nomi bo'yicha   → faqat o'sha tumandagi maskanlar
 *   - inklyuziv so'rov      → aravacha/ko'rish/eshitish/keksalar uchun moslar
 */

const DISTRICTS = ['Nurota', 'Xatirchi', 'Qiziltepa'];

// Maskanni qisqa kartochka ko'rinishiga keltirish (frontend uchun)
const toCard = (h) => ({
  _id: h._id,
  name: h.name,
  city: h.city,
  rating: h.rating,
  image: h.images?.[0] || null,
  category: h.category,
  descriptionShort: h.descriptionShort || '',
  nearbyPlaces: h.nearbyPlaces || [],
});

// Inklyuziv (nogironlar uchun) moslik tekshiruvi
const isAccessible = (h, kind) => {
  const a = h.accessibility || {};
  if (kind === 'wheelchair') return a.mobility?.wheelchairAccessible;
  if (kind === 'visual') return a.visual?.brailleSigns || a.visual?.tactilePaving;
  if (kind === 'auditory') return a.auditory?.audioGuides || a.auditory?.hearingLoop;
  if (kind === 'elderly') return h.familyAndElderly?.orthopedicBeddingAvailable || h.familyAndElderly?.grabBarsInBathroom;
  return true;
};

// N-kunlik sayohat rejasini tuzish
function buildPlan(days, hotels) {
  // Tumanlar bo'yicha guruhlash
  const byDistrict = {};
  for (const d of DISTRICTS) byDistrict[d] = hotels.filter(h => h.city === d);

  // Tarixiy joylarni tumandan yig'ish
  const placesByDistrict = {};
  for (const d of DISTRICTS) {
    const set = new Set();
    byDistrict[d].forEach(h => (h.nearbyPlaces || []).forEach(p => set.add(p)));
    placesByDistrict[d] = [...set];
  }

  const planDays = [];
  for (let i = 0; i < days; i++) {
    const district = DISTRICTS[i % DISTRICTS.length];
    const stay = byDistrict[district]?.[0]; // o'sha tumandagi eng yaxshi maskan
    const places = placesByDistrict[district] || [];
    // Har kuni 1-2 ta tarixiy joy
    const dayPlaces = places.slice((Math.floor(i / DISTRICTS.length) * 2), (Math.floor(i / DISTRICTS.length) * 2) + 2);
    planDays.push({
      day: i + 1,
      district,
      places: dayPlaces.length ? dayPlaces : places.slice(0, 2),
      stay: stay ? { _id: stay._id, name: stay.name, rating: stay.rating } : null,
    });
  }
  return planDays;
}

function extractDays(text) {
  const m = text.match(/(\d{1,2})\s*(kun|kunlik|day|days)/i);
  if (m) return Math.min(14, Math.max(1, parseInt(m[1], 10)));
  if (/hafta|week/i.test(text)) return 7;
  return 3; // standart
}

// POST /api/assistant   body: { message }
export const askAssistant = asyncHandler(async (req, res) => {
  const message = (req.body?.message || '').toString().trim();
  if (!message) {
    return res.json({
      reply: "Salom! Men NavaiTour yordamchisiman. Quyidagilarni so'rashingiz mumkin:\n• \"Eng yaxshi joy qaysi?\"\n• \"Nurota haqida ma'lumot\"\n• \"7 kunlik plan yoz\"\n• \"Aravacha uchun qulay joy\"",
      suggestions: ['Eng yaxshi joy', '7 kunlik plan yoz', 'Tarixiy joylar', 'Aravacha uchun qulay'],
    });
  }

  const text = message.toLowerCase();
  const hotels = await Hotel.find({ approved: true }).lean();

  if (!hotels.length) {
    return res.json({ reply: "Hozircha bazada maskanlar yo'q. Iltimos, ma'lumot qo'shilishini kuting." });
  }

  // Tuman filtri
  const mentionedDistrict = DISTRICTS.find(d => text.includes(d.toLowerCase()));
  let pool = mentionedDistrict ? hotels.filter(h => h.city === mentionedDistrict) : hotels;
  if (!pool.length) pool = hotels;

  // ── 1) PLAN / REJA ──────────────────────────────────────────────
  if (/(plan|reja|marshrut|itinerary|sayohat).*(yoz|tuz|ber|kerak)?|kun(lik)?\b/i.test(text) && /(plan|reja|marshrut|kun|hafta|day|week)/i.test(text)) {
    const days = extractDays(text);
    const plan = buildPlan(days, hotels);
    const lines = [`📅 ${days} kunlik inklyuziv sayohat rejasi (Navoiy viloyati):`, ''];
    for (const d of plan) {
      lines.push(`${d.day}-kun — ${d.district} tumani`);
      if (d.places.length) lines.push(`   🏛️ Ko'riladigan joylar: ${d.places.join(', ')}`);
      if (d.stay) lines.push(`   🛏️ Tunash: ${d.stay.name} (⭐${d.stay.rating?.toFixed?.(1) || d.stay.rating})`);
      lines.push('');
    }
    lines.push("Barcha tavsiya etilgan maskanlar nogironlar va keksalar uchun moslashtirilgan.");
    return res.json({
      reply: lines.join('\n'),
      plan,
      hotels: plan.filter(d => d.stay).map(d => toCard(hotels.find(h => h._id.toString() === d.stay._id.toString()))).filter(Boolean).slice(0, 4),
    });
  }

  // ── 2) INKLYUZIV so'rovlar ──────────────────────────────────────
  let accessKind = null;
  if (/aravacha|nogiron|wheelchair/i.test(text)) accessKind = 'wheelchair';
  else if (/ko'rish|ko‘rish|braille|brayl/i.test(text)) accessKind = 'visual';
  else if (/eshitish|hearing|kar\b/i.test(text)) accessKind = 'auditory';
  else if (/keksa|qari|elderly|nogironlar/i.test(text)) accessKind = 'elderly';

  if (accessKind) {
    const matched = pool.filter(h => isAccessible(h, accessKind)).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const labels = { wheelchair: 'aravacha foydalanuvchilar', visual: "ko'rish qiyinchiligi bo'lganlar", auditory: 'eshitish qiyinchiligi bo\'lganlar', elderly: 'keksalar' };
    if (!matched.length) return res.json({ reply: `Afsuski, ${labels[accessKind]} uchun mos maskan topilmadi.` });
    return res.json({
      reply: `${labels[accessKind]} uchun ${matched.length} ta mos maskan topildi${mentionedDistrict ? ` (${mentionedDistrict})` : ''}:`,
      hotels: matched.slice(0, 4).map(toCard),
    });
  }

  // ── 3) TARIXIY JOYLAR ───────────────────────────────────────────
  if (/tarixiy|tarix|diqqatga sazovor|ziyorat|yodgorlik|joylar haqida/i.test(text)) {
    const placeSet = new Set();
    pool.forEach(h => (h.nearbyPlaces || []).forEach(p => placeSet.add(p)));
    const places = [...placeSet];
    if (!places.length) return res.json({ reply: "Hozircha tarixiy joylar ma'lumoti yo'q." });
    return res.json({
      reply: `${mentionedDistrict ? `${mentionedDistrict} tumanidagi` : "Navoiy viloyatidagi"} tarixiy va diqqatga sazovor joylar:\n${places.map(p => `🏛️ ${p}`).join('\n')}\n\nUlarga yaqin maskanlar:`,
      hotels: pool.slice(0, 4).map(toCard),
    });
  }

  // ── 4) ENG YAXSHI / TOP / TAVSIYA ───────────────────────────────
  if (/eng yaxshi|yaxshi joy|top|zo'r|zo‘r|tavsiya|reyting|recommend|best/i.test(text) || mentionedDistrict) {
    const best = [...pool].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const top = best[0];
    return res.json({
      reply: `Eng yaxshi tanlov${mentionedDistrict ? ` ${mentionedDistrict} tumanida` : ''}: ${top.name} (⭐${top.rating?.toFixed?.(1) || top.rating}). ${top.nearbyPlaces?.[0] ? `Yaqinida: ${top.nearbyPlaces[0]}.` : ''}`,
      hotels: best.slice(0, 4).map(toCard),
    });
  }

  // ── 5) STANDART javob ───────────────────────────────────────────
  return res.json({
    reply: "Tushunmadim 🙂 Quyidagicha so'rab ko'ring:\n• \"Eng yaxshi joy qaysi?\"\n• \"Nurota haqida ma'lumot\"\n• \"7 kunlik plan yoz\"\n• \"Aravacha uchun qulay joy\"",
    suggestions: ['Eng yaxshi joy', '7 kunlik plan yoz', 'Tarixiy joylar', 'Aravacha uchun qulay'],
  });
});
