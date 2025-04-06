// src/doof-backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Use the exported pool wrapper
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const dishRoutes = require('./routes/dishes');
const filterRoutes = require('./routes/filters');
const listRoutes = require('./routes/lists');
const placesRoutes = require('./routes/places');
const restaurantRoutes = require('./routes/restaurants');
const searchRoutes = require('./routes/search');
const submissionRoutes = require('./routes/submissions');
const trendingRoutes = require('./routes/trending');
const adminRoutes = require('./routes/admin');
// REMOVED: commonDishesRoutes import

const app = express();

// Make the database pool available via req.app.get('db')
// This pattern is less common now with module imports, but keep if routes use it
// Alternatively, routes can directly import the db module from './db'
app.set('db', db); // Pass the imported db module (which exports query/getClient)

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Logging Middleware (Keep for basic request info)
app.use((req, res, next) => {
  console.log(`[Server Request] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// --- Mount API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/admin', adminRoutes);
// REMOVED: Common Dishes route usage

// Health check endpoint
app.get('/health', async (req, res) => { // Made async for DB check
  try {
      // Optional DB health check
      await db.query('SELECT 1'); // Simple query to check connectivity
      res.status(200).json({ status: 'OK', message: 'Server and DB connection healthy' });
  } catch (dbError) {
      console.error('[Health Check] Database connection error:', dbError);
      res.status(503).json({ status: 'Service Unavailable', message: 'Database connection failed' });
  }
});

// --- Centralized Error Handling Middleware ---
// Should be defined AFTER all other app.use() and routes
app.use((err, req, res, next) => {
  // Log only the error message in production for sensitive errors
  // Log the full stack in development
  if (process.env.NODE_ENV !== 'production') {
     console.error(`[Server Error] Path: ${req.method} ${req.originalUrl} | Error:`, err);
  } else {
     // In prod, log less detail by default, but consider a logging service
     console.error(`[Server Error] Path: ${req.method} ${req.originalUrl} | Message: ${err.message}`);
  }

  // Determine status code: use error's status, specific pg codes, or default to 500
  let statusCode = err.status || err.statusCode || 500;
  if (err.code === '23505') { // Example: PostgreSQL unique violation
      statusCode = 409; // Conflict
  } else if (err.code === '23503') { // Example: PostgreSQL foreign key violation
      statusCode = 400; // Bad Request
  } else if (err.code === '42P01') { // Example: PostgreSQL undefined table
        statusCode = 500; // Internal error
  }
  // Add more specific PG error code handling if needed

  // Determine response message: Use error's message if safe, otherwise generic
  // err.expose is a convention from http-errors module
  const message = (err.expose || process.env.NODE_ENV !== 'production' || statusCode < 500)
                  ? err.message
                  : 'Internal Server Error';

  res.status(statusCode).json({
     error: message,
     // Optionally include error code or other details in non-prod
     code: process.env.NODE_ENV !== 'production' ? err.code : undefined,
     // details: process.env.NODE_ENV !== 'production' ? err.stack : undefined, // Avoid sending stack
  });
});

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`\x1b[32m%s\x1b[0m`, `Server running on port ${PORT}`);
});

// Graceful shutdown (no changes needed here)
const gracefulShutdown = async (signal) => { /* ... */ };
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));