import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'navaitour_jwt_secret_2025';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token topilmadi. Iltimos, tizimga kiring.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token muddati tugagan. Qayta kiring.' });
    }
    return res.status(401).json({ message: 'Yaroqsiz token.' });
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bu amalni bajarishga ruxsatingiz yo'q." });
    }
    next();
  };
};
