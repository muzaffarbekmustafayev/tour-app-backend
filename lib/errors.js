/**
 * lib/errors.js — Typed application error klasslar
 *
 * Foydalanish:
 *   throw new NotFoundError('Hotel topilmadi');
 *   throw new UnauthorizedError();
 *
 * Markaziy error handler (middleware/errorHandler.js) bularni ushlaydi va
 * to'g'ri HTTP status bilan javob qaytaradi.
 */

export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    // Stack trace ni to'g'ri ko'rsatish uchun
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'So\'rov noto\'g\'ri') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Autentifikatsiya talab qilinadi') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bu amalni bajarishga ruxsatingiz yo\'q') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Topilmadi') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Konflikt: resurs allaqachon mavjud') {
    super(message, 409, 'CONFLICT');
  }
}
