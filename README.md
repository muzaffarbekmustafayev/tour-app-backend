<div align="center">

# 🏨 NavaiTour — Backend API

**Navoiy viloyatidagi mehmonxonalar uchun RESTful API server**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Swagger](https://img.shields.io/badge/Swagger-Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:5000/api/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[🎨 Frontend](https://github.com/muzaffarbekmustafayev/tour-app-frontend) · [📋 Issues](https://github.com/muzaffarbekmustafayev/tour-app-backend/issues)

</div>

---

## 📑 Mundarija

- [Xususiyatlar](#-xususiyatlar)
- [Texnologiyalar](#-texnologiyalar)
- [Tezkor boshlash](#-tezkor-boshlash)
- [Muhit o'zgaruvchilari](#-muhit-ozgaruvchilari)
- [API Endpointlar](#-api-endpointlar)
- [Loyiha tuzilmasi](#-loyiha-tuzilmasi)
- [Swagger hujjatlari](#-swagger-hujjatlari)
- [Hissa qo'shish](#-hissa-qoshish)

---

## ✨ Xususiyatlar

| Xususiyat | Tavsif |
|-----------|--------|
| 🔐 **JWT autentifikatsiya** | Ro'yxatdan o'tish, kirish, token bilan himoya |
| 👥 **Rol asosida ruxsat** | `ADMIN`, `HOTEL_OWNER`, `CUSTOMER` rollari |
| 🏨 **Mehmonxona CRUD** | Yaratish, tahrirlash, o'chirish + rasm yuklash |
| ♿ **Inklyuziv filtrlar** | Nogironlar uchun maxsus filtrlash |
| ⭐ **Sharhlar tizimi** | Reyting va izohlar |
| 📊 **Admin panel** | Statistika va mehmonxona tasdiqlash |
| 📖 **Swagger Docs** | Rol asosida dinamik API hujjatlari |
| 🌱 **Seed data** | Bitta buyruq bilan test ma'lumotlar |

---

## 🛠 Texnologiyalar

| Paket | Maqsad |
|-------|--------|
| Express 4.x | HTTP server va marshrutlash |
| Mongoose 8.x | MongoDB ODM |
| jsonwebtoken | JWT token yaratish/tekshirish |
| bcryptjs | Parolni xavfsiz xeshlash |
| multer 2.x | Fayl (rasm) yuklash |
| cors | Cross-Origin ruxsati |
| dotenv | Muhit o'zgaruvchilari |
| swagger-jsdoc | API hujjatlar generatsiyasi |
| swagger-ui-express | Interaktiv API UI |
| nodemon | Dev — avtomatik restart |

---

## 🚀 Tezkor boshlash

### Talablar

- **Node.js** 18+
- **MongoDB** (mahalliy yoki [Atlas](https://www.mongodb.com/atlas))

### O'rnatish

```bash
git clone https://github.com/muzaffarbekmustafayev/tour-app-backend.git
cd tour-app-backend
npm install

cp .env.example .env
# .env faylini tahrirlang
```

### Ishga tushirish

```bash
npm run dev      # Development (nodemon)
npm start        # Production
npm run seed     # Test ma'lumotlar yuklash
```

> Server: `http://localhost:5000`

---

## 🔧 Muhit o'zgaruvchilari

| O'zgaruvchi | Tavsif | Standart |
|-------------|--------|----------|
| `APP_NAME` | Ilova nomi | `NavaiTour` |
| `NODE_ENV` | Muhit rejimi | `development` |
| `PORT` | Server porti | `5000` |
| `MONGODB_URI` | MongoDB havolasi | `mongodb://localhost:27017/navaitour` |
| `JWT_SECRET` | Shifrlash kaliti (min 32 belgi) | — |
| `JWT_EXPIRES_IN` | Token muddati | `7d` |
| `CLIENT_URL` | Frontend manzili (CORS) | `http://localhost:5173` |

> ⚠️ `.env` faylini **hech qachon** GitHub'ga yuklamang!

**Xavfsiz JWT kalit yaratish:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📡 API Endpointlar

### 🔑 Auth — `/api/auth`

| Method | URL | Tavsif | Ruxsat |
|--------|-----|--------|--------|
| `POST` | `/api/auth/register` | Ro'yxatdan o'tish | Hammaga |
| `POST` | `/api/auth/login` | Kirish | Hammaga |
| `GET` | `/api/auth/me` | Joriy foydalanuvchi | 🔒 Token |
| `PUT` | `/api/auth/profile` | Profilni tahrirlash | 🔒 Token |
| `POST` | `/api/auth/favorites/:id` | Sevimlilarga qo'shish | 🔒 Token |
| `DELETE` | `/api/auth/favorites/:id` | Sevimlilardan olish | 🔒 Token |

### 🏨 Hotels — `/api/hotels`

| Method | URL | Tavsif | Ruxsat |
|--------|-----|--------|--------|
| `GET` | `/api/hotels` | Hammasi (filter) | Hammaga |
| `GET` | `/api/hotels/:id` | Bitta mehmonxona | Hammaga |
| `POST` | `/api/hotels` | Yangi yaratish | 🔒 HOTEL_OWNER |
| `PUT` | `/api/hotels/:id` | Tahrirlash | 🔒 HOTEL_OWNER |
| `DELETE` | `/api/hotels/:id` | O'chirish | 🔒 OWNER/ADMIN |
| `GET` | `/api/hotels/:id/availability` | Mavjudlik | Hammaga |

### ⭐ Reviews — `/api/reviews`

| Method | URL | Tavsif | Ruxsat |
|--------|-----|--------|--------|
| `POST` | `/api/reviews` | Sharh qoldirish | 🔒 Token |
| `GET` | `/api/reviews/hotel/:id` | Sharhlar | Hammaga |

### 🛡️ Admin — `/api/admin`

| Method | URL | Tavsif | Ruxsat |
|--------|-----|--------|--------|
| `GET` | `/api/admin/stats` | Statistika | 🔒 ADMIN |
| `PATCH` | `/api/admin/hotels/:id/approve` | Tasdiqlash | 🔒 ADMIN |

### 🩺 Health

| Method | URL | Tavsif |
|--------|-----|--------|
| `GET` | `/api/health` | Server holati |

---

## 📁 Loyiha tuzilmasi

```
tour-app-backend/
├── controllers/              # Biznes logika
│   ├── adminController.js
│   ├── authController.js
│   ├── bookingController.js
│   ├── hotelController.js
│   └── reviewController.js
├── middleware/
│   └── auth.js               # JWT + rol nazorati
├── models/                   # Mongoose sxemalar
│   ├── User.js
│   ├── Hotel.js
│   ├── Review.js
│   ├── Booking.js
│   └── Payment.js
├── routes/                   # Express marshrutlari + Swagger
│   ├── auth.js
│   ├── hotels.js
│   ├── reviews.js
│   ├── admin.js
│   ├── bookings.js
│   └── upload.js
├── uploads/                  # Yuklangan rasmlar (.gitignore)
├── seed.js                   # Test data generator
├── server.js                 # ⭐ Kirish nuqtasi
├── .env.example              # Muhit namunasi
└── package.json
```

---

## 📖 Swagger hujjatlari

Server ishga tushgandan so'ng: **http://localhost:5000/api/docs**

Swagger UI **rol asosida dinamik** ishlaydi:

| Rol | Ko'rinadigan endpointlar |
|-----|-------------------------|
| **GUEST** | Auth + umumiy Hotels |
| **CUSTOMER** | Public + profil |
| **HOTEL_OWNER** | Yuqoridagilar + CRUD |
| **ADMIN** | Hammasi |

---

## 🤝 Hissa qo'shish

```bash
git checkout -b feature/yangi-xususiyat
git commit -m "feat: yangi endpoint"
git push origin feature/yangi-xususiyat
# Pull Request oching
```

**Commit formati:** `feat:` | `fix:` | `docs:` | `refactor:` | `test:` | `chore:`

---

## 📄 Litsenziya

[MIT](LICENSE) © 2025 NavaiTour
