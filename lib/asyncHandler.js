/**
 * lib/asyncHandler.js — Async route wrapper
 *
 * Express async route'larda try/catch takrorlanishini oldini oladi.
 * Barcha async xatolar markaziy errorHandler'ga yo'naltiriladi.
 *
 * Foydalanish:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
