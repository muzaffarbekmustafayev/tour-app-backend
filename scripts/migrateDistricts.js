/**
 * scripts/migrateDistricts.js — Bir martalik migratsiya
 *
 * Maqsad: tuman (district) maydonini MAJBURIY qilishdan oldin eski
 * mehmonxonalarni moslashtirish:
 *   1) district bo'sh bo'lsa — uni `city` qiymatidan to'ldirish (agar city
 *      aynan 3 tumandan biri bo'lsa).
 *   2) geo (GeoJSON Point) bo'sh bo'lsa — location.lat/lng dan hosil qilish.
 *
 * Ishga tushirish:  node scripts/migrateDistricts.js
 *                   (yoki: npm run migrate:districts)
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Hotel from '../models/Hotel.js';

const DISTRICTS = ['Navoiy shahri', 'Nurota', 'Xatirchi', 'Qiziltepa'];

// Erkin yozilgan tuman/shahar nomini 3 tumandan biriga moslashtirishga urinish
function guessDistrict(value) {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  for (const d of DISTRICTS) {
    if (v.includes(d.toLowerCase())) return d;
  }
  return null;
}

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('🔌 MongoDB ga ulandi');

  // Validatsiyani chetlab o'tish uchun to'g'ridan-to'g'ri kolleksiya bilan ishlaymiz
  const hotels = await Hotel.find({}).lean();
  console.log(`📦 Jami ${hotels.length} ta mehmonxona topildi`);

  let fixedDistrict = 0;
  let fixedGeo = 0;
  const unresolved = [];

  for (const h of hotels) {
    const set = {};

    // 1) district
    if (!DISTRICTS.includes(h.district)) {
      const guess = guessDistrict(h.district) || guessDistrict(h.city) || guessDistrict(h.address);
      if (guess) {
        set.district = guess;
        fixedDistrict++;
      } else {
        unresolved.push({ id: String(h._id), name: h.name, city: h.city });
      }
    }

    // 2) geo
    const hasGeo = Array.isArray(h.geo?.coordinates) && h.geo.coordinates.length === 2;
    if (!hasGeo && Number.isFinite(h.location?.lat) && Number.isFinite(h.location?.lng)) {
      set.geo = { type: 'Point', coordinates: [h.location.lng, h.location.lat] };
      fixedGeo++;
    }

    if (Object.keys(set).length > 0) {
      await Hotel.collection.updateOne({ _id: h._id }, { $set: set });
    }
  }

  console.log(`✅ district to'ldirildi: ${fixedDistrict} ta`);
  console.log(`✅ geo to'ldirildi:     ${fixedGeo} ta`);

  if (unresolved.length) {
    console.log(`\n⚠️  Tuman avtomatik aniqlanmagan ${unresolved.length} ta mehmonxona —`);
    console.log('    ularni admin paneldan tahrirlab, qo\'lda tuman tanlang:');
    unresolved.forEach((u) => console.log(`    • ${u.name} (city: ${u.city || '—'}) [${u.id}]`));
  } else {
    console.log('\n🎉 Barcha mehmonxonalar tumanga ega.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migratsiya xatosi:', err);
  process.exit(1);
});
