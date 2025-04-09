/* src/doof-backend/server.ts */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes - Ensure ALL local imports use .js extension
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
import analyticsRoutes from './routes/analytics.js'; // Corrected path assuming it exists
// import analyticsRoutes from './routes/analyticsRoutes.js'; // If the file is named analyticsRoutes.ts

// Import middleware - Ensure .js extension
import authMiddleware from './middleware/auth.js';
import optionalAuthMiddleware from './middleware/optionalAuth.js';

// Import DB - Ensure .js extension
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

// Route Mounting (Looks correct with .js extensions)
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/engage', engageRoutes);
app.use('/api/analytics', analyticsRoutes); // Ensure this matches the imported variable name

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