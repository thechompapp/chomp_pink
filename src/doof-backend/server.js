import express from 'express';
import cors from 'cors';
import { check, validationResult } from 'express-validator';
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
import analyticsRoutes from './routes/analytics.js'; // <<< Import the new analytics routes
import db from './db/index.js';

const app = express();

const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

// General request validator (example, adjust as needed)
const validateRequest = [
    // Example: Optional validation for name or ID if present in body/params
    // Note: Specific routes often handle their own more detailed validation
    check('*.name').optional().trim().notEmpty().withMessage('Name cannot be empty if provided'),
    check('*.id').optional().isInt({ gt: 0 }).withMessage('ID must be a positive integer if provided'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Log validation errors for debugging
            console.warn(`[Validation Error] Path: ${req.path}, Errors:`, errors.array());
            // Return only the first error message for a cleaner response
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    },
];

// --- Route Mounting ---
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
app.use('/api/analytics', analyticsRoutes); // <<< Mount the new analytics routes

// --- Database Connection ---
app.set('db', db);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error(`[Global Error Handler] Path: ${req.path}, Error:`, err);
    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
    const message = (process.env.NODE_ENV === 'development' || statusCode < 500) && err.message
        ? err.message
        : 'Internal Server Error';
    res.status(statusCode).json({ error: message });
});


// --- Server Startup ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use.`);
    } else {
        console.error('Server startup error:', err);
    }
    process.exit(1);
});