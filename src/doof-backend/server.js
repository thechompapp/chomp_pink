/* src/doof-backend/server.js */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Local file imports require .js extension
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import filtersRoutes from './routes/filters.js';
import adminRoutes from './routes/admin.js';
import neighborhoodsRoutes from './routes/neighborhoods.js'; // Added neighborhoods route
import listsRoutes from './routes/lists.js';
import trendingRoutes from './routes/trending.js';
import placesRoutes from './routes/places.js';
import submissionsRoutes from './routes/submissions.js';
import restaurantsRoutes from './routes/restaurants.js';
import dishesRoutes from './routes/dishes.js';
import searchRoutes from './routes/search.js';
import engageRoutes from './routes/engage.js';
import analyticsSuperuserRouter, { publicAnalyticsRouter } from './routes/analytics.js';
import db from './db/index.js';

dotenv.config();

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

app.set('db', db); // Make DB accessible via req.app.get('db') if needed in routes

// --- Route Mounting ---
// Consider grouping or adding comments for clarity
// Public/Optional Auth Routes
app.use('/api/places', placesRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/neighborhoods', neighborhoodsRoutes); // Added public neighborhoods route
app.use('/api/trending', trendingRoutes);
app.use('/api/search', searchRoutes); // Optional auth is handled inside the route file if needed
app.use('/api/engage', engageRoutes); // Optional auth is handled inside the route file
app.use('/api/analytics', publicAnalyticsRouter); // Public analytics routes

// Auth Routes
app.use('/api/auth', authRoutes);

// Standard Authenticated Routes
app.use('/api/users', usersRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/restaurants', restaurantsRoutes); // GET might be public, POST/PUT/DELETE needs auth (handled in route)
app.use('/api/dishes', dishesRoutes); // GET might be public, POST/PUT/DELETE needs auth (handled in route)

// Admin Routes (already have auth + superuser checks internally)
app.use('/api/admin', adminRoutes); // Generic admin CRUD
app.use('/api/analytics', analyticsSuperuserRouter); // Admin analytics routes

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Global Error Handler] Path: ${req.path}, Status: ${err.status || 500}, Error:`, err.message || err);

    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : 500;

    // Use a more generic message for non-dev environments or sensitive errors
    let message = (statusCode < 500 && err.message) ? err.message : 'An internal server error occurred.';
    if (process.env.NODE_ENV === 'development' && err.message && statusCode >= 500) {
        message = err.message; // Show detailed error in dev
        // console.error(err.stack); // Optionally log stack trace in dev
    }

    // Ensure consistent error response format
    res.status(statusCode).json({
         success: false, // Indicate failure
         error: message, // Use 'error' key
         message: message // Also include 'message' if frontend expects it
        });
});

// Server Startup
const portEnv = process.env.PORT;
const PORT = portEnv ? parseInt(portEnv, 10) : 5001;

if (isNaN(PORT)) {
    console.error('\x1b[31mERROR:\x1b[0m Invalid PORT environment variable. Please set a valid port number.');
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `Backend server running smoothly on port ${PORT}`);
    console.log(`\x1b[33m%s\x1b[0m`, `Frontend URL configured for CORS: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\x1b[31mERROR:\x1b[0m Port ${PORT} is already in use. Please ensure no other process is using this port.`);
    } else {
        console.error('\x1b[31mServer startup error:\x1b[0m', err);
    }
    process.exit(1);
});

export default app;