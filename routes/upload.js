import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Yuklamalar papkasi — har doim backend ildizidagi `uploads/` (cwd'ga bog'liq emas).
// server.js ham aynan shu papkani statik tarqatadi.
const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    // Nom to'qnashuvini oldini olish uchun vaqt + tasodifiy qo'shimcha
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Faqat rasm fayllari qabul qilinadi'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

// 360° video uchun alohida yuklovchi — kattaroq limit
const videoUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Faqat video fayllari qabul qilinadi'));
  },
});

/**
 * Diqqat: bu yerda NISBIY (relative) URL qaytaramiz — `/uploads/<fayl>`.
 * Avval `${protocol}://${host}/uploads/...` qaytarilardi; lekin u:
 *   - reverse-proxy/HTTPS ortida noto'g'ri protokol (http) bilan saqlanib,
 *     brauzer "mixed content" sifatida rasmni bloklardi;
 *   - localhost'da yaratilgan yozuvlar serverda ham localhost'ga ishora qilardi.
 * Nisbiy URL'ni frontend o'zining API origin'iga bog'lab ko'rsatadi —
 * shu sabab domen/port o'zgarsa ham rasm topiladi.
 */
const toUrl = (filename) => `/uploads/${filename}`;

// POST /api/upload — bitta rasm
router.post('/', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Fayl yuklanmadi' });
  res.json({ url: toUrl(req.file.filename) });
});

// POST /api/upload/multiple — bir nechta rasmni bitta so'rovda yuklash
router.post('/multiple', authenticate, upload.array('images', 20), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'Fayl yuklanmadi' });
  res.json({ urls: req.files.map((f) => toUrl(f.filename)) });
});

// POST /api/upload/video — 360° video fayl yuklash (Admin/Owner)
router.post('/video', authenticate, videoUpload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Video yuklanmadi' });
  res.json({ url: toUrl(req.file.filename) });
});

export default router;
