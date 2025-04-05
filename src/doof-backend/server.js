const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import database pool
const db = require('./db');

// Import route handlers
const authRouter = require('./routes/auth');
const listsRouter = require('./routes/lists');
const restaurantsRouter = require('./routes/restaurants');
const dishesRouter = require('./routes/dishes');
const trendingRouter = require('./routes/trending');
const filtersRouter = require('./routes/filters');
const submissionsRouter = require('./routes/submissions');
const placesRouter = require('./routes/places');
const commonDishesRouter = require('./routes/commonDishes');
const searchRouter = require('./routes/search');

const app = express();

// Environment variables
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Log environment variables for debugging
console.log('[Server] Environment Variables:');
console.log(`  PORT: ${PORT}`);
console.log(`  NODE_ENV: ${NODE_ENV}`);
console.log(`  FRONTEND_URL: ${FRONTEND_URL}`);

// Middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        console.log(`[CORS] Request Origin: ${origin}`);
        const allowedOrigin = FRONTEND_URL;
        if (!origin || origin === allowedOrigin) {
            callback(null, allowedOrigin);
        } else {
            console.error(`[CORS] Origin ${origin} not allowed. Expected: ${allowedOrigin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/lists', listsRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/dishes', dishesRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/places', placesRouter);
app.use('/api/commonDishes', commonDishesRouter);
app.use('/api/search', searchRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        const dbTime = result.rows[0]?.now || 'Unknown';
        res.status(200).json({
            status: 'OK',
            environment: NODE_ENV,
            database: 'Connected',
            dbTime,
        });
    } catch (err) {
        console.error('[Health Check] DB Error:', err);
        res.status(200).json({
            status: 'OK',
            environment: NODE_ENV,
            database: 'Disconnected',
            dbError: err.message,
        });
    }
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.stack || err.message || err);
    const status = err.status || 500;
    const message = status === 500 ? 'Internal Server Error' : err.message || 'Something went wrong';
    res.status(status).json({
        error: message,
        ...(NODE_ENV === 'development' && { details: err.stack || err.message }),
    });
});

// Start the server
const startServer = async () => {
    try {
        const result = await db.query('SELECT NOW()');
        console.log('\x1b[32m%s\x1b[0m', `[Server] Database connection successful. DB Time: ${result.rows[0].now}`);

        app.listen(PORT, () => {
            console.log(`[Server] Listening on port ${PORT} in ${NODE_ENV} mode`);
        });
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', '[Server] Failed to connect to database:', err.stack || err.message);
        process.exit(1);
    }
};

process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
    process.exit(1);
});

startServer();