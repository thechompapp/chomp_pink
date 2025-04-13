/* src/doof-backend/server.ts */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Corrected imports - Ensure .js extension for local files if needed by your setup
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import filtersRoutes from './routes/filters.js';
import adminRoutes from './routes/admin.js';
import neighborhoodsRoutes from './routes/neighborhoods.js'; // General neighborhood routes
// Removed adminNeighborhoodsRoutes as they are now part of admin.ts or neighborhoods.ts
import listsRoutes from './routes/lists.js';
import trendingRoutes from './routes/trending.js';
import placesRoutes from './routes/places.js';
import submissionsRoutes from './routes/submissions.js';
import restaurantsRoutes from './routes/restaurants.js';
import dishesRoutes from './routes/dishes.js';
import searchRoutes from './routes/search.js';
import engageRoutes from './routes/engage.js';
// Corrected: Use default export and named export for analytics routers
import analyticsSuperuserRouter, { publicAnalyticsRouter } from './routes/analytics.js';

// Corrected imports for middleware
import authMiddleware from './middleware/auth.js';
import optionalAuthMiddleware from './middleware/optionalAuth.js';

// Corrected import for DB
import db from './db/index.js';

// Load environment variables
dotenv.config();

const app: Express = express();

const corsOptions: cors.CorsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow frontend origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies/auth headers
    optionsSuccessStatus: 204, // For preflight requests
};

app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// Make DB accessible via req.app.get('db') if needed in handlers (though models should use direct import)
app.set('db', db);

// --- Route Mounting ---

// Mount public/optional auth routes first
app.use('/api/places', placesRoutes); // Google Places proxy
app.use('/api/filters', filtersRoutes); // Filters (cities, etc.)
app.use('/api/neighborhoods', neighborhoodsRoutes); // Public neighborhood lookups (e.g., by zipcode)
app.use('/api/trending', trendingRoutes); // Trending items
app.use('/api/search', optionalAuthMiddleware, searchRoutes); // Search might need optional auth
app.use('/api/engage', optionalAuthMiddleware, engageRoutes); // Engagements might need optional auth
app.use('/api/analytics', publicAnalyticsRouter); // Public analytics routes

// Mount auth routes (register/login/refresh)
app.use('/api/auth', authRoutes);

// Mount routes requiring standard authentication (authMiddleware applied within the route files or here)
// Note: If authMiddleware is applied within the route file, don't apply it here again.
// Example: Assuming authMiddleware is applied inside usersRoutes, listsRoutes, submissionsRoutes
app.use('/api/users', usersRoutes); // User profiles, etc.
app.use('/api/lists', listsRoutes); // List creation/management
app.use('/api/submissions', submissionsRoutes); // Submitting dishes/restaurants

// Mount general restaurant/dish routes (e.g., GET requests might be public or need optional auth)
// Apply middleware within the specific routes as needed (e.g., optionalAuth for GET, requireSuperuser for POST/PUT/DELETE)
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/dishes', dishesRoutes);

// Mount protected admin routes (already have requireSuperuser applied within admin.ts)
app.use('/api/admin', adminRoutes); // Handles generic admin CRUD, submission approval, user roles, AND NOW restaurant admin actions
app.use('/api/analytics', analyticsSuperuserRouter); // Superuser-specific analytics

// Global Error Handler - Must be defined LAST
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Global Error Handler] Path: ${req.path}, Status: ${err.status || 500}, Error:`, err.message || err);

    // Use error status if available and valid, otherwise default to 500
    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : 500;

    // Provide a generic message for server errors, but pass client error messages
    let message = (statusCode < 500 && err.message) ? err.message : 'An internal server error occurred.';

    // Optionally expose more detail in development
    if (process.env.NODE_ENV === 'development' && err.message && statusCode >= 500) {
        message = err.message; // Show detailed internal error message in dev
        // You might want to include stack trace here only in dev for debugging
        // console.error(err.stack);
    }

    // Set Content-Type for error response
    res.status(statusCode).json({
         // Use 'message' key consistent with validation errors
         message: message
        });
});

// Server Startup
const portEnv = process.env.PORT;
const PORT = portEnv ? parseInt(portEnv, 10) : 5001; // Default port

if (isNaN(PORT)) {
    console.error('\x1b[31mERROR:\x1b[0m Invalid PORT environment variable. Please set a valid port number.');
    process.exit(1); // Exit if port is invalid
}

app.listen(PORT, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `Backend server running smoothly on port ${PORT}`);
    console.log(`\x1b[33m%s\x1b[0m`, `Frontend URL configured for CORS: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
}).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\x1b[31mERROR:\x1b[0m Port ${PORT} is already in use. Please ensure no other process is using this port.`);
    } else {
        console.error('\x1b[31mServer startup error:\x1b[0m', err);
    }
    process.exit(1); // Exit on critical startup errors
});

export default app; // Export for potential testing or programmatic use