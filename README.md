# NavaiTour Backend

Node.js + Express + MongoDB asosidagi REST API.

## Texnologiyalar

- `Express` - HTTP server
- `Mongoose` - MongoDB ORM
- `JWT` - autentifikatsiya
- `Multer` - fayl yuklash
- `bcryptjs` - parolni xeshlash
- `Swagger` - API hujjatlari

## Ornatish

```bash
cd backend
npm install
```

## Sozlash

`.env` fayl yarating:

```env
MONGO_URI=mongodb://localhost:27017/navaitour
JWT_SECRET=your_secret_key
PORT=5000
```

## Ishga tushirish

```bash
npm run dev
```

Seed ma'lumotlar uchun:

```bash
npm run seed
```

## Asosiy endpointlar

| Method | URL | Tavsif |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Royxatdan otish |
| `POST` | `/api/auth/login` | Kirish |
| `GET` | `/api/hotels` | Mehmonxonalarni qidirish va filterlash |
| `GET` | `/api/hotels/:id` | Bitta mehmonxona |
| `GET` | `/api/hotels/:id/availability` | Mavjudlikni tekshirish |
| `POST` | `/api/hotels` | Mehmonxona yaratish |
| `PUT` | `/api/hotels/:id` | Mehmonxonani tahrirlash |
| `DELETE` | `/api/hotels/:id` | Mehmonxonani ochirish |
| `GET` | `/api/bookings` | Bronlar royxati |
| `POST` | `/api/bookings` | Bron yaratish |

## Inclusive Implementation Plan

Backend faqat umumiy qidiruv emas, balki turli ehtiyojga ega foydalanuvchilar uchun ishonchli signal berishi kerak. Hozirgi implementation quyidagi yo'nalishlarga tayangan holda rivojlantirildi:

1. Accessibility ma'lumotlarini toifalash.
   Mobility, visual, auditory, cognitive, family/elderly va digital inclusion maydonlari alohida saqlanadi.
2. Filterlarni real ehtiyojga boglash.
   Foydalanuvchi "wheelchair accessible" yoki "quiet zone" kabi aniq talab bilan qidira olishi kerak.
3. Inclusive ma'lumotni tekshiriladigan qilish.
   Rampa qiyaligi, lift eni, taktil belgilash, captioned media va support policy kabi maydonlar aniq fieldlar bilan saqlanadi.
4. Past bandwidth va assistive tech foydalanuvchilarini qollab-quvvatlash.
   Offline data support, low data mode va screen-reader-friendly media tavsiflari alohida kuzatiladi.

## Inclusive improvements added

Quyidagi ehtiyojlar endi plan darajasida aniqroq qamrab olingan:

- Harakatlanish ehtiyojlari uchun `stepFreeRoute`, `accessibleToilet`, `accessibleParking`, `accessibleRooms`
- Korish ehtiyojlari uchun `brailleSigns`, `tactilePaving`, `highContrastSignage`
- Eshitish ehtiyojlari uchun `hearingLoop`, `audioGuides`, `vibrationAlerts`, `signLanguageStaff`
- Kognitiv va sensor ehtiyojlar uchun `quietZones`, `easyToReadSignage`, `consistentLayout`, `sensoryFriendlyHours`
- Xizmatdan foydalanish tengligi uchun `serviceAnimalFriendly`, `supportPersonPolicy`, `supportContact`
- Raqamli inkluzivlik uchun `captionedVideoTour`, `screenReaderDescription`, `offlineDataSupport`, `lowDataMode`

## Tavsiya etilgan keyingi qadamlar

1. Admin panelda accessibility maydonlarini checkbox emas, izoh va o'lchov bilan kiriting.
2. Moderatorlar uchun "self-reported" va "verified" accessibility statuslarini ajrating.
3. Frontend qidiruv filtrlarini backenddagi accessibility query paramlari bilan bir xil nomda ishlating.
4. Booking flow ichida maxsus ehtiyojlarni oldindan yuborish uchun notes yoki accommodation request qo'shing.
