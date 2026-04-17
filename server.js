import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { mkdirSync } from 'fs';

import authRoutes from './routes/auth.js';
import hotelRoutes from './routes/hotels.js';
// import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
dotenv.config();

mkdirSync('uploads', { recursive: true });

const app = express();

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Full Swagger Spec (Internal)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NavaiTour Dynamic API Docs',
      version: '1.0.0',
      description: 'Role-based Dynamic Documentation. \n\n**AUTH QOIDASI:** Avval Login bo\'ling, tokenni oling va "Authorize" tugmasi orqali kiriting. Keyin sahifani (F5) yangilang.',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 5000}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const fullSwaggerSpec = swaggerJsdoc(swaggerOptions);

// Dynamic Swagger JSON endpoint
app.get('/api/docs/swagger.json', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  let role = 'GUEST';
  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here');
      role = decoded.role;
    }
  } catch (err) {
    role = 'GUEST';
  }

  // Filter paths based on tags and role
  const filteredPaths = {};
  Object.keys(fullSwaggerSpec.paths).forEach(path => {
    const methods = fullSwaggerSpec.paths[path];
    const filteredMethods = {};
    
    Object.keys(methods).forEach(method => {
      const tags = methods[method].tags || [];
      
      // Filtering logic:
      // - GUEST: Only 'Auth' and general 'Hotels' (public)
      // - CUSTOMER: Public + Bookings
      // - HOTEL_OWNER: Public + Hotels (owner actions) + Bookings
      // - ADMIN: Everything
      
      if (role === 'ADMIN') {
        filteredMethods[method] = methods[method];
      } else if (role === 'HOTEL_OWNER') {
        if (!tags.includes('Admin')) filteredMethods[method] = methods[method];
      } else if (role === 'CUSTOMER' || role === 'USER') {
        if (!tags.includes('Admin') && !methods[method].summary.includes('HotelOwner only')) {
          filteredMethods[method] = methods[method];
        }
      } else {
        // GUEST
        if (tags.includes('Auth') || methods[method].summary.includes('Public')) {
          filteredMethods[method] = methods[method];
        }
      }
    });

    if (Object.keys(filteredMethods).length > 0) {
      filteredPaths[path] = filteredMethods;
    }
  });

  const filteredSpec = { ...fullSwaggerSpec, paths: filteredPaths };
  res.json(filteredSpec);
});

// Configure Swagger UI to fetch from the dynamic JSON and pass headers
app.use('/api/docs', swaggerUi.serve, (req, res) => {
  swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/api/docs/swagger.json', // Dynamic source
      persistAuthorization: true,
      requestInterceptor: (request) => {
        // Persist token in spec request if available in local storage
        const authData = JSON.parse(localStorage.getItem('authorized') || '{}');
        const token = authData.bearerAuth?.value;
        if (token) {
          request.headers.Authorization = `Bearer ${token}`;
        }
        return request;
      }
    }
  })(req, res);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
// app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/navaitour')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
