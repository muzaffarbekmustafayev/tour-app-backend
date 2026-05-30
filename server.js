import './config/env.js'; // ← Birinchi import: env tekshiruvi (fail-fast)

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { mkdirSync } from 'fs';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerChatSocket } from './socket/chatSocket.js';
import authRoutes from './routes/auth.js';
import hotelRoutes from './routes/hotels.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import chatRoutes from './routes/chat.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

mkdirSync('uploads', { recursive: true });

const app = express();
const httpServer = createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_URL, credentials: true },
});

// ── Xavfsizlik middleware'lari ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// TODO: productiondan oldin rate-limit yoqish
const authLimiter = (_req, _res, next) => next();

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

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
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/hotels',  hotelRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/chat',    chatRoutes);

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
