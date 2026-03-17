# NavaiTour — Backend

Node.js + Express + MongoDB asosidagi REST API.

## Texnologiyalar

- **Express** — HTTP server
- **Mongoose** — MongoDB ORM
- **JWT** — autentifikatsiya
- **Multer** — fayl yuklash
- **bcryptjs** — parol shifrlash

## O'rnatish

```bash
cd backend
npm install
```

## Sozlash

`.env.example` faylini nusxalab `.env` yarating:

```bash
cp .env.example .env
```

`.env` ichida to'ldiring:

```
MONGO_URI=mongodb://localhost:27017/navaitour
JWT_SECRET=your_secret_key
PORT=5000
```

## Ishga tushirish

```bash
# Development
npm run dev

# Production
npm start

# Ma'lumotlar bazasini to'ldirish
npm run seed
```

## API Endpointlar

| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/auth/register` | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | Kirish |
| GET | `/api/tours` | Barcha turlar |
| GET | `/api/tours/:id` | Bitta tur |
| POST | `/api/tours` | Tur qo'shish (admin) |
| PUT | `/api/tours/:id` | Turni tahrirlash (admin) |
| DELETE | `/api/tours/:id` | Turni o'chirish (admin) |
| GET | `/api/bookings` | Bronlar (auth) |
| POST | `/api/bookings` | Bron qilish (auth) |
