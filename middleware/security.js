/**
 * security.js — Xavfsizlik middleware'lari (NoSQL Injection Sanitization & Data Cleansing)
 */

// MongoDB operator injection ($ bo'lgan operatorlar yoki dot notation) kalitlarini tozalash
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  const cleanObj = {};
  for (const key of Object.keys(obj)) {
    // $gt, $ne, $where kabi MongoDB query injection operatorlarini bloklash
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleanObj[key] = sanitize(obj[key]);
  }
  return cleanObj;
}

export const sanitizeNoSql = (req, _res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};
