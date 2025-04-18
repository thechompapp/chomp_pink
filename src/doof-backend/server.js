/* src/doof-backend/server.js */
import 'dotenv/config'; // <-- ADD THIS LINE AT THE VERY TOP

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import pinoPretty from 'pino-pretty';
import crypto from 'crypto'; // Needed by pino-http for req id

// --- Log to verify after dotenv/config runs ---
console.log(`[SERVER START] Reading GOOGLE_PLACES_API_KEY after dotenv: ->${process.env.GOOGLE_PLACES_API_KEY}<-`);
// ----------------------------------------------

// Import Routers
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import dishRoutes from './routes/dishes.js'; // Import dish routes
import filterRoutes from './routes/filters.js'; // Import filter routes
import searchRoutes from './routes/search.js'; // Import search routes
import listRoutes from './routes/lists.js'; // Import list routes
import userRoutes from './routes/users.js'; // Import user routes
import engageRoutes from './routes/engage.js'; // Import engage routes
import adminRoutes from './routes/admin.js'; // Import admin routes
import submissionRoutes from './routes/submissions.js'; // Import submission routes
import trendingRoutes from './routes/trending.js'; // Import trending routes
import analyticsRoutes from './routes/analytics.js'; // Import analytics routes
import placesRoutes from './routes/places.js'; // Import places routes
import neighborhoodRoutes from './routes/neighborhoods.js'; // Import neighborhood routes

// Determine __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001; // PORT can also be set in .env

// --- Logger Setup ---
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
// --- End Logger Setup ---

// --- CORS Setup ---
// Use FRONTEND_URL from .env or default to localhost:5173
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [frontendUrl, 'http://127.0.0.1:5173']; // Add other origins if needed
console.log(`Frontend URL configured for CORS: ${frontendUrl}`); // Log the URL being used
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            const msg = `CORS policy does not allow access from origin ${origin}`;
            callback(new Error(msg), false);
        }
    },
    credentials: true
}));
// --- End CORS Setup ---


// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- End Middleware ---


// --- Routes ---
app.get('/health', (req, res) => { /* ... health check ... */ res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() }); });
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes); // Use dish routes
app.use('/api/filters', filterRoutes); // Use filter routes
app.use('/api/search', searchRoutes); // Use search routes
app.use('/api/lists', listRoutes); // Use list routes
app.use('/api/users', userRoutes); // Use user routes
app.use('/api/engage', engageRoutes); // Use engage routes
app.use('/api/admin', adminRoutes); // Use admin routes
app.use('/api/submissions', submissionRoutes); // Use submission routes
app.use('/api/trending', trendingRoutes); // Use trending routes
app.use('/api/analytics', analyticsRoutes); // Use analytics routes
app.use('/api/places', placesRoutes); // Use places routes
app.use('/api/neighborhoods', neighborhoodRoutes); // Use neighborhood routes
// --- End Routes ---


// --- Global Error Handler ---
app.use((err, req, res, next) => {
    // Use req.log provided by pino-http, fallback to console if not available
    const log = req.log || console;
    log.error(err, 'Global Error Handler Caught:');

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Something went wrong on the server.';
    const errorDetail = process.env.NODE_ENV !== 'production' ? err.stack : undefined;

    res.status(statusCode).json({
        success: false,
        error: message,
        detail: errorDetail
    });
});
// --- End Global Error Handler ---

// --- Database Connection Check ---
// Assuming db pool is exported from db/index.js and has a test query method
import pool from './db/index.js';
(async () => {
  try {
      const result = await pool.query('SELECT NOW()');
      console.log('Successfully connected to the database pool (startup check).');
      console.log('Database startup query test successful. DB Time:', result.rows[0].now);
  } catch (err) {
      console.error('!!! Database Connection Failed on Startup !!!', err);
      // Optionally exit if DB connection is critical for startup
      // process.exit(1);
  }
})();
// --- End Database Connection Check ---

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Backend server running smoothly on port ${PORT}`);
});
// --- End Server Start ---