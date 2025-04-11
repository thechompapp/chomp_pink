/* src/doof-backend/server.ts */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Corrected imports - Add .js extension back for local files
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import filtersRoutes from './routes/filters.js';
import adminRoutes from './routes/admin.js';
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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

app.set('db', db); // Make DB accessible via req.app.get('db')

// --- Route Mounting ---

// Mount public/optional auth routes first if they exist separately
app.use('/api/places', placesRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/engage', engageRoutes);
app.use('/api/analytics', publicAnalyticsRouter); // Mount public analytics routes

// Mount auth routes (register/login)
app.use('/api/auth', authRoutes);

// Mount protected routes that require standard authentication
app.use('/api/users', usersRoutes); // Profile route needs auth
app.use('/api/lists', listsRoutes); // Most list routes need auth
app.use('/api/submissions', submissionsRoutes); // Creating/viewing submissions needs auth

// Mount protected routes that require superuser authentication
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsSuperuserRouter); // Mount superuser analytics routes under the same base path
app.use('/api/restaurants', restaurantsRoutes); // Assuming POST/PUT/DELETE need superuser
app.use('/api/dishes', dishesRoutes); // Assuming POST/PUT/DELETE need superuser


// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Global Error Handler] Path: ${req.path}, Error:`, err.message || err);
    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : 500;
    let message = (statusCode < 500 && err.message) ? err.message : 'An internal server error occurred.';
    if (process.env.NODE_ENV === 'development' && err.message && statusCode >= 500) {
        message = err.message; // Show detailed error in dev
    }
    res.status(statusCode).json({ error: message });
});

// Server Startup
const portEnv = process.env.PORT;
const PORT = portEnv ? parseInt(portEnv, 10) : 5001;
if (isNaN(PORT)) {
    console.error('\x1b[31mERROR:\x1b[0m Invalid PORT environment variable. Using default 5001.');
}

app.listen(PORT, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `Backend server running smoothly on port ${PORT}`);
}).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\x1b[31mERROR:\x1b[0m Port ${PORT} is already in use.`);
    } else {
        console.error('\x1b[31mServer startup error:\x1b[0m', err);
    }
    process.exit(1);
});

export default app;