import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Attraction from './models/Attraction.js';
import Hotel from './models/Hotel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function autoLinkUploadedImages() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/navaitour';
  console.log('🔗 MongoDBga ulanmoqda:', uri);

  try {
    await mongoose.connect(uri);
    console.log(`✅ Ulanish o'rnatildi! (${mongoose.connection.name} bazasi)`);

    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('❌ uploads papkasi topilmadi.');
      process.exit(1);
    }

    // 1. uploads ichidagi barcha rasm fayllarini olish
    const allFiles = fs.readdirSync(UPLOADS_DIR).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.jfif'].includes(ext);
    });

    console.log(`📁 Jami topilgan yuklangan rasmlar: ${allFiles.length} ta`);

    // Rasmlarni yuklangan vaqti bo'yicha guruhlash (vaqt prefiksi bo'yicha)
    // Fayl nomlari: 1787547694273-914917541.jpg (timestamp prefiksi)
    const sortedFiles = allFiles.sort();

    const fileGroups = [];
    let currentGroup = [];
    let lastTime = 0;

    sortedFiles.forEach(file => {
      const match = file.match(/^(\d{10})/); // dastlabki 10 raqam (sekundlar)
      const ts = match ? parseInt(match[1], 10) : 0;
      if (!lastTime || Math.abs(ts - lastTime) <= 60) {
        currentGroup.push(`/uploads/${file}`);
      } else {
        if (currentGroup.length > 0) fileGroups.push(currentGroup);
        currentGroup = [`/uploads/${file}`];
      }
      lastTime = ts;
    });
    if (currentGroup.length > 0) fileGroups.push(currentGroup);

    console.log(`📦 Rasmlar ${fileGroups.length} ta maskan/obyekt partiyalariga ajratildi.`);

    // 2. Tarixiy joylarga yuklangan haqiqiy rasmlarni biriktirish
    const attractions = await Attraction.find({}).sort('createdAt');
    console.log(`🏛️ Baza ichida ${attractions.length} ta obyekt mavjud.`);

    let groupIdx = 0;

    // Asosiy 7 ta tarixiy joyga rasmlar biriktirish
    for (let i = 0; i < Math.min(attractions.length, 7); i++) {
      if (groupIdx < fileGroups.length) {
        const imgs = fileGroups[groupIdx++];
        await Attraction.updateOne({ _id: attractions[i]._id }, { $set: { images: imgs } });
        console.log(`  📸 Obyekt: "${attractions[i].name}" -> ${imgs.length} ta rasm biriktirildi.`);
      }
    }

    // 3. Mehmonxonalarga yuklangan haqiqiy rasmlarni biriktirish (14 ta mehmonxona)
    const hotels = await Hotel.find({}).sort('createdAt');
    console.log(`🏨 Baza ichida ${hotels.length} ta mehmonxona mavjud.`);

    for (let i = 0; i < Math.min(hotels.length, 14); i++) {
      if (groupIdx < fileGroups.length) {
        const imgs = fileGroups[groupIdx++];
        await Hotel.updateOne({ _id: hotels[i]._id }, { $set: { images: imgs } });
        console.log(`  🏨 Mehmonxona: "${hotels[i].name}" -> ${imgs.length} ta rasm biriktirildi.`);
      }
    }

    // Qolgan mehmonxona va obyektlarga ham mavjud yuklangan rasmlardan taqsimlash
    for (let i = 7; i < attractions.length && groupIdx < fileGroups.length; i++) {
      const imgs = fileGroups[groupIdx++];
      await Attraction.updateOne({ _id: attractions[i]._id }, { $set: { images: imgs } });
      console.log(`  📸 Obyekt: "${attractions[i].name}" -> ${imgs.length} ta rasm biriktirildi.`);
    }

    for (let i = 14; i < hotels.length && groupIdx < fileGroups.length; i++) {
      const imgs = fileGroups[groupIdx++];
      await Hotel.updateOne({ _id: hotels[i]._id }, { $set: { images: imgs } });
      console.log(`  🏨 Mehmonxona: "${hotels[i].name}" -> ${imgs.length} ta rasm biriktirildi.`);
    }

    console.log('\n=============================================');
    console.log('🎉 BARCHA YUKLANGAN RASMLAR O\'Z OBYEKT VA MEHMONXONALARIGA QAYTA BIRIKTIRILDI!');
    console.log('=============================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Xatolik:', err);
    process.exit(1);
  }
}

autoLinkUploadedImages();
