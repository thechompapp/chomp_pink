/* src/doof-backend/server.ts */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes - Explicitly add .js extension for all JS route files
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
import analyticsRoutes from './routes/analytics.js';

// Import TS files using extensionless paths or explicit .ts
import db from './db'; // Extensionless for TS should work with tsx/ts-node

// Import JS middleware files - Explicitly add .js extension
// import requireSuperuser from './middleware/requireSuperuser.js'; // REMOVED - File confirmed missing in screenshot
import authMiddleware from './middleware/auth.js';
import optionalAuthMiddleware from './middleware/optionalAuth.js';


// Load environment variables
dotenv.config();

const app: Express = express(); // Type app as Express

const corsOptions: cors.CorsOptions = { // Type cors options
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

// Make DB accessible via req.app.get('db')
app.set('db', db);
// Make middleware accessible if needed
// app.set('requireSuperuser', requireSuperuser); // REMOVED


// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/admin', adminRoutes); // This route likely needs requireSuperuser internally
app.use('/api/lists', listsRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/engage', engageRoutes);
app.use('/api/analytics', analyticsRoutes);


// Global Error Handler (Add types for Express error handling)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Global Error Handler] Path: ${req.path}, Error:`, err.message || err);

    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : 500;

    let message = (statusCode < 500 && err.message)
        ? err.message
        : 'An internal server error occurred.';

     if (process.env.NODE_ENV === 'development' && err.message && statusCode >= 500) {
         message = err.message;
     }
    res.status(statusCode).json({ error: message });
});


// Server Startup
const portEnv = process.env.PORT;
const PORT = portEnv ? parseInt(portEnv, 10) : 5001;

if (isNaN(PORT)) {
    console.error('\x1b[31mERROR:\x1b[0m Invalid PORT environment variable. Using default 5001.');
    // Optionally process.exit(1);
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