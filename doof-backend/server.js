/* src/doof-backend/server.js */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import pinoPretty from 'pino-pretty';
import crypto from 'crypto';

// Log to verify after dotenv/config runs
console.log(`[SERVER START] Reading GOOGLE_PLACES_API_KEY after dotenv: ->${process.env.GOOGLE_PLACES_API_KEY}<-`);

// Import Routers
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import dishRoutes from './routes/dishes.js';
import filterRoutes from './routes/filters.js';
import searchRoutes from './routes/search.js';
import listRoutes from './routes/lists.js';
import userRoutes from './routes/users.js';
import engageRoutes from './routes/engage.js';
import adminRoutes from './routes/admin.js';
import submissionRoutes from './routes/submissions.js';
import trendingRoutes from './routes/trending.js';
import analyticsRoutes from './routes/analytics.js';
import placesRoutes from './routes/places.js';
import neighborhoodRoutes from './routes/neighborhoods.js';
import hashtagRoutes from './routes/hashtags.js';


// Determine __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Logger Setup
const stream = process.env.NODE_ENV !== 'production' ? pinoPretty({ colorize: true }) : process.stdout;
const logger = pinoHttp({
  stream: stream,
  level: process.env.LOG_LEVEL || 'info',
  genReqId: function (req, res) {
    const existingId = req.id ?? req.headers["x-request-id"];
    if (existingId) return existingId;
    const id = crypto.randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
});
app.use(logger);

// CORS Setup
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [frontendUrl, 'http://127.0.0.1:5173'];
console.log(`Frontend URL configured for CORS: ${frontendUrl}`);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy does not allow access from origin ${origin}`), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
  optionsSuccessStatus: 204,
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/users', userRoutes);
app.use('/api/engage', engageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/neighborhoods', neighborhoodRoutes);
app.use('/api/hashtags', hashtagRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
  const log = req.log || console;
  log.error(err, 'Global Error Handler Caught:');

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Something went wrong on the server.';
  const errorDetail = process.env.NODE_ENV !== 'production' ? err.stack : undefined;

  res.status(statusCode).json({
    success: false,
    error: message,
    detail: errorDetail,
  });
});

// Database Connection Check
import pool from './db/index.js';
(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Successfully connected to the database pool (startup check).');
    console.log('Database startup query test successful. DB Time:', result.rows[0].now);
  } catch (err) {
    console.error('!!! Database Connection Failed on Startup !!!', err);
  }
})();

// Server Start
app.listen(PORT, () => {
  console.log(`Backend server running smoothly on port ${PORT}`);
});