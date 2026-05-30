/**
 * middleware/errorHandler.js — Markaziy error handler
 *
 * Barcha xatolarni bir joyda ushlaydi:
 * - AppError (biznes xatolar) → to'g'ri statusCode qaytaradi
 * - Mongoose ValidationError → 400
 * - Mongoose CastError (noto'g'ri ID) → 404
 * - Kutilmagan xatolar → 500 (DETALLAR clientga chiqmaydi!)
 *
 * MUHIM: Stack trace va DB xato matnini hech qachon clientga qaytarma.
 */

import { AppError } from '../lib/errors.js';

const isDev = process.env.NODE_ENV === 'development';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // 1. Biznes xatolari (throw new NotFoundError(...) va h.k.)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
  }

  // 2. Mongoose validatsiya xatosi
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join('; ');
    return res.status(400).json({ code: 'VALIDATION', message });
  }

  // 3. Mongoose noto'g'ri ObjectId (masalan: GET /hotels/abc)
  if (err.name === 'CastError') {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Noto\'g\'ri ID formati' });
  }

  // 4. MongoDB duplicate key (email allaqachon mavjud)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'maydon';
    return res.status(409).json({ code: 'CONFLICT', message: `Bu ${field} allaqachon mavjud` });
  }

  // 5. Kutilmagan xato — log qil, lekin detallarni leak QILMA
  console.error('[errorHandler] Kutilmagan xato:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    code: 'INTERNAL',
    message: 'Server xatosi yuz berdi. Keyinroq qayta urinib ko\'ring.',
    // Dev muhitida qo'shimcha ma'lumot (production'da ko'rinmaydi)
    ...(isDev && { detail: err.message }),
  });
};
