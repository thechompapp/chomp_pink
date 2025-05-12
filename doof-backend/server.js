// doof-backend/server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import pino from 'pino';

// Route Imports - All should be default exports from their respective files
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import dishRoutes from './routes/dishes.js';
import listRoutes from './routes/lists.js';
import userRoutes from './routes/users.js';
import filterRoutes from './routes/filters.js';
import hashtagRoutes from './routes/hashtags.js';
import searchRoutes from './routes/search.js';
import placesRoutes from './routes/places.js';
import submissionRoutes from './routes/submissions.js';
import adminRoutes from './routes/admin.js';
import engageRoutes from './routes/engage.js';
import trendingRoutes from './routes/trending.js';
import neighborhoodRoutes from './routes/neighborhoods.js';
import analyticsRoutes from './routes/analytics.js';

import { optionalAuth } from './middleware/auth.js'; // Named import
import db from './db/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});
const httpLogger = pinoHttp({ logger });
app.use(httpLogger);

// Allow multiple frontend origins for development flexibility
const frontendUrls = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',  // In case Vite uses this port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];
console.log(`Frontend URLs configured for CORS:`, frontendUrls);
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (frontendUrls.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Forwarded-Host', 'X-Auth-Authenticated'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/users', userRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/engage', engageRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/neighborhoods', neighborhoodRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/db-test', async (req, res) => {
  try {
    const time = await db.query('SELECT NOW()');
    res.json({ success: true, dbTime: time.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', optionalAuth, (req, res) => {
    if (req.user) {
        logger.info({ user: req.user, message: 'Authenticated user accessed health check.' });
    } else {
        logger.info('Anonymous user accessed health check.');
    }
    res.status(200).json({ status: 'UP', message: 'Backend is healthy and running!' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../chomp_frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../chomp_frontend/dist', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  req.log.error({ err, req: req, res: res }, 'Unhandled error caught by global error handler');
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 ?
                  'An unexpected error occurred on the server.' : err.message;
  res.status(statusCode).json({
      success: false,
      message: message || 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' && { errorDetails: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running smoothly on port ${PORT}`);
});
