/* src/doof-backend/server.ts */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes - REMOVE .js extension for internal .ts routes/middleware
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import filtersRoutes from './routes/filters';
import adminRoutes from './routes/admin';
import listsRoutes from './routes/lists';
import trendingRoutes from './routes/trending';
import placesRoutes from './routes/places';
import submissionsRoutes from './routes/submissions';
import restaurantsRoutes from './routes/restaurants';
import dishesRoutes from './routes/dishes';
import searchRoutes from './routes/search';
import engageRoutes from './routes/engage';
import analyticsRoutes from './routes/analytics';
import authMiddleware from './middleware/auth';
import optionalAuthMiddleware from './middleware/optionalAuth';

// Keep .js for compiled output if necessary (e.g., from db/index.ts -> db/index.js)
// Or if tsx resolves it directly: import db from './db';
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

// Route Mounting
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
app.use('/api/analytics', analyticsRoutes);

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