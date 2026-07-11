# NavaiTour Backend 🇺🇿

Bu NavaiTour platformasining server qismi (API) bo'lib, REST API, ma'lumotlar bazasi bilan ishlash, rasm yuklash va autentifikatsiya (Auth) jarayonlarini o'z ichiga oladi. Asosan Node.js, Express va MongoDB yordamida yozilgan.

## Texnologiyalar
- **[Node.js](https://nodejs.org/en/) & [Express.js](https://expressjs.com/)** - Asosiy server arxitekturasi
- **[MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)** - NoSQL Ma'lumotlar bazasi
- **[JSON Web Token (JWT)](https://jwt.io/)** - Foydalanuvchi autentifikatsiyasi uchun (Access token)
- **[Multer](https://www.npmjs.com/package/multer)** - Rasmlar (fayllar) ni yuklash uchun
- **[Helmet](https://helmetjs.github.io/)** - Xavfsizlik sarlavhalari (Security headers)
- **[Bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Parollarni xesh qilish (heshi) uchun
- **Express-Rate-Limit** - Brute-force hamlelaridan (ddos) himoya

## Tizimni Ishga Tushirish

Backend dasturini local muhitda ishlash uchun quyidagi amallarni bajaring:

### 1. Modullarni o'rnatish
Terminal (CLI) yordamida ushbu backend papkasiga kiring va modullarni yuklang:
```bash
npm install
```

### 2. .env (Muhit o'zgaruvchilari) faylini yaratish
Loyiha root papkasida `.env` faylini yarating va quyidagilarni o'zingizning mahalliy sirlaringizga ko'ra to'ldiring:
```env
# Server porti
PORT=5000

# MongoDB ulanish havolasi (Local yoki Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/navaitour

# JWT xavfsizlik kaliti (o'zboshimcha qiyin so'z/kod)
JWT_SECRET=maxfiy_kalitim_qanaqadir_qiyin_narsa_2026

# Frontend ulanish manzili (CORS uchun)
CLIENT_URL=http://localhost:5173
```

### 3. Serverni yurgizish
Dasturni development muhitida, har doim yangilanadigan qilib ishga tushirish uchun:
```bash
npm run dev
```

Agar barcha jarayonlar to'g'ri sozlangan bo'lsa, konsolda `Server running on port 5000` hamda `MongoDB connected` degan xabarlar chiqadi.

## Ma'lumotlar bazasi arxitekturasi (Modellar)
- **User**: Foydalanuvchilar (sayyoh, mehmonxona egasi, admin) modeli.
- **Hotel**: Mehmonxonalar, yotoqxonalar (hostel), dalahovlilar haqida batafsil ma'lumotlar.
- **Attraction**: Tarixiy va diqqatga sazovor joylar (faqat admin tomonidan boshqariladi).
- **Review**: Mehmonxonaga bildirilgan fikr-mulohazalar (rating).
- **District/City**: Tumanlar hamda qishloq/shahar nomlari va ularning geolokatsiyalari.

## Litsenziya
MIT
