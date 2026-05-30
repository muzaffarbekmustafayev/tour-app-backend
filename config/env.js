/**
 * config/env.js — Fail-fast env validation
 * Server ishga tushishda kerakli env o'zgaruvchilarni tekshiradi.
 * Biror o'zgaruvchi yo'q bo'lsa — darrov crash qiladi (production'da late failure oldini oladi).
 */
import 'dotenv/config';

const REQUIRED = ['JWT_SECRET', 'MONGODB_URI'];

for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[env] FATAL: "${key}" env o'zgaruvchisi topilmadi. .env faylini tekshiring.`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('[env] FATAL: JWT_SECRET kamida 32 belgi bo\'lishi kerak.');
  process.exit(1);
}

export const env = {
  NODE_ENV:      process.env.NODE_ENV      || 'development',
  PORT:          parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI:   process.env.MONGODB_URI,
  JWT_SECRET:    process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL:    process.env.CLIENT_URL    || 'http://localhost:5173',
  APP_NAME:      process.env.APP_NAME      || 'NavaiTour',
  LOG_LEVEL:     process.env.LOG_LEVEL     || 'info',
};
