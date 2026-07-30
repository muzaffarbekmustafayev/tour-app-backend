import './config/env.js'; // ← Birinchi import: env tekshiruvi (fail-fast)

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizeNoSql } from './middleware/security.js';
import { registerChatSocket } from './socket/chatSocket.js';
import authRoutes from './routes/auth.js';
import hotelRoutes from './routes/hotels.js';
import attractionRoutes from './routes/attractions.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import assistantRoutes from './routes/assistant.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
const httpServer = createServer(app);

// Reverse-proxy (Nginx/Render/Railway...) ortida to'g'ri protokol/IP aniqlash uchun
app.set('trust proxy', 1);

// ── Secure & Flexible CORS Sozlamalari ─────────────────────────────────────────
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  'https://tourism-for-everyone.uz',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Mobil ilova native so'rovlari yoki server-to-server so'rovlarida origin bo'lmaydi
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
};

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  path: '/api/socket.io/',
  cors: corsOptions,
});

// ── Xavfsizlik middleware'lari (Helmet + CORS + NoSQL Sanitization) ────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    xFrameOptions: { action: 'sameorigin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  })
);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeNoSql);

// Yuklangan rasm/videolar.
//  - helmet sukut bo'yicha `Cross-Origin-Resource-Policy: same-origin` qo'yadi —
//    bu frontend boshqa domenda bo'lsa <img> ni bloklaydi. Shu sabab CORP'ni
//    `cross-origin` ga o'zgartiramiz.
//  - Ikkala yo'lda ham tarqatamiz: `/uploads` (to'g'ridan-to'g'ri) va
//    `/api/uploads`. Reverse-proxy (nginx) ko'pincha faqat `/api` ni backendga
//    uzatadi — shuning uchun rasmlar `/api/uploads/<fayl>` orqali ishonchli yetadi.
const uploadsStatic = express.static(UPLOADS_DIR, {
  maxAge: '7d',
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  },
});
app.use('/uploads', uploadsStatic);
app.use('/api/uploads', uploadsStatic);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Swagger ──────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: `${env.APP_NAME} API Docs`, version: '1.0.0' },
    servers: [{ url: `http://localhost:${env.PORT}` }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
  },
  apis: ['./routes/*.js'],
};

const fullSwaggerSpec = swaggerJsdoc(swaggerOptions);

app.get('/api/docs/swagger.json', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  let role = 'GUEST';
  try {
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      role = decoded.role;
    }
  } catch { /* token yo'q yoki yaroqsiz — GUEST */ }

  const filteredPaths = {};
  for (const [path, methods] of Object.entries(fullSwaggerSpec.paths)) {
    const filteredMethods = {};
    for (const [method, op] of Object.entries(methods)) {
      const tags = op.tags || [];
      const isAdmin    = role === 'ADMIN';
      const isOwner    = role === 'HOTEL_OWNER';
      const isCustomer = role === 'CUSTOMER' || role === 'USER';

      if (isAdmin) {
        filteredMethods[method] = op;
      } else if (isOwner && !tags.includes('Admin')) {
        filteredMethods[method] = op;
      } else if (isCustomer && !tags.includes('Admin') && !op.summary?.includes('HotelOwner only')) {
        filteredMethods[method] = op;
      } else if (!isAdmin && !isOwner && !isCustomer) {
        if (tags.includes('Auth') || op.summary?.includes('Public')) {
          filteredMethods[method] = op;
        }
      }
    }
    if (Object.keys(filteredMethods).length) filteredPaths[path] = filteredMethods;
  }

  res.json({ ...fullSwaggerSpec, paths: filteredPaths });
});

app.use('/api/docs', swaggerUi.serve, (req, res) => {
  swaggerUi.setup(null, {
    swaggerOptions: { url: '/api/docs/swagger.json', persistAuthorization: true },
  })(req, res);
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/hotels',  hotelRoutes);
app.use('/api/attractions', attractionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/assistant', assistantRoutes);

// ── Markaziy error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ── Socket.io auth middleware ─────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Auth token missing'));
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.userId = decoded.id || decoded._id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Chat socket handlerlarini ro'yxatdan o'tkazish (socket/chatSocket.js)
registerChatSocket(io);

// ── MongoDB + Start ───────────────────────────────────────────────────────────
mongoose.connect(env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(err => {
    console.error('❌ MongoDB ulanish xatosi:', err.message);
    process.exit(1);
  });

httpServer.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 Server ${env.PORT}-portda ishga tushdi [${env.NODE_ENV}]`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n[${signal}] Server yopilmoqda...`);
  httpServer.close(async () => {
    await mongoose.connection.close();
    console.log('✅ Barcha ulanishlar yopildi.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('⚠️ Graceful shutdown vaqti o\'tdi. Majburiy chiqish.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => { console.error('[unhandledRejection]', reason); });
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.message, err.stack);
  process.exit(1);
});
