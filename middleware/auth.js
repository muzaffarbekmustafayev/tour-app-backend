import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token topilmadi. Iltimos, tizimga kiring.');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token muddati tugagan. Qayta kiring.');
    }
    throw new UnauthorizedError('Yaroqsiz token.');
  }
});

export const authorize = (roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ForbiddenError("Bu amalni bajarishga ruxsatingiz yo'q."));
  }
  next();
};
