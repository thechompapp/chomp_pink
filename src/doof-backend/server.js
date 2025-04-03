// src/doof-backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require('./db'); // Ensure db module is imported

// Import existing routers
const filtersRouter = require('./routes/filters');
const trendingRouter = require('./routes/trending');
const listsRouter = require('./routes/lists');
const restaurantsRouter = require('./routes/restaurants');
const dishesRouter = require('./routes/dishes');
const submissionsRouter = require('./routes/submissions');
const placesRouter = require('./routes/places');
const adminRouter = require('./routes/admin');
const commonDishesRouter = require('./routes/commonDishes'); // Keep or remove based on usage
// *** IMPORT Auth Router ***
const authRouter = require('./routes/auth');

const app = express();
const port = process.env.PORT || 5001;

// --- Core Middleware ---
// Define or import your cors options if needed
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow cookies/headers if needed for auth sessions
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' })); // For parsing application/json
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // For parsing application/x-www-form-urlencoded

// Simple request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});


// --- API Routes ---
app.get("/api/health", (req, res) => res.status(200).json({ status: "API healthy", timestamp: new Date().toISOString() }));

// Test database connection route (optional)
app.get("/api/test-restaurants", async (req, res, next) => {
    console.log("[TEST ROUTE] /api/test-restaurants hit!");
    try {
        const result = await db.query("SELECT id, name, adds FROM Restaurants ORDER BY adds DESC NULLS LAST LIMIT 3");
        console.log(`[TEST ROUTE] Query result rows: ${result.rowCount}`);
        res.status(200).json({
            message: "Test query executed.",
            rowCount: result.rowCount,
            rows: result.rows || []
        });
    } catch (error) {
        console.error("[TEST ROUTE] Error:", error);
        next(error); // Forward error to the centralized handler
    }
});

// *** Mount Auth Router ***
// Authentication endpoints (e.g., /api/auth/register, /api/auth/login)
app.use('/api/auth', authRouter);

// Mount other routers
// Public or partially public routes
app.use('/api', filtersRouter); // Generic filters
app.use('/api/trending', trendingRouter); // Trending data
app.use('/api/restaurants', restaurantsRouter); // Public restaurant details (POST/PUT/DELETE might need auth)
app.use('/api/dishes', dishesRouter); // Public dish details (POST/PUT/DELETE might need auth)
app.use('/api/places', placesRouter); // Google Places proxy

// Routes likely requiring authentication (apply middleware later)
app.use('/api/lists', listsRouter); // Creating/managing lists
app.use('/api/submissions', submissionsRouter); // Submitting requires user context
app.use('/api/admin', adminRouter); // Admin panel access
// Optional: common dishes route
// app.use('/api/common-dishes', commonDishesRouter);


// --- Optional: Serve Static Frontend ---
// Uncomment and adjust path if needed for production deployment
// const frontendBuildPath = path.join(__dirname, '../../dist'); // Example assuming Vite builds to 'dist'
// console.log(`Serving static files from: ${frontendBuildPath}`);
// app.use(express.static(frontendBuildPath));
// Catch-all to serve index.html for client-side routing
// app.get('*', (req, res) => {
//   // Avoid sending index.html for API routes
//   if (!req.originalUrl.startsWith('/api')) {
//       res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
//   } else {
//       // If it's an API route not matched above, let the 404 handler below take care of it
//       res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
//   }
// });


// --- Not Found & Error Handlers ---
// 404 Handler (if no routes matched)
app.use((req, res, next) => {
    // Check if it was an API route that wasn't found
    if (req.originalUrl.startsWith('/api')) {
        console.warn(`404 Not Found: API route - ${req.method} ${req.originalUrl}`);
        return res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
    }
    // If not an API route, and static file serving didn't catch it,
    // potentially let client-side routing handle it (depends on setup)
    // For now, just send a generic 404
    console.warn(`404 Not Found: Non-API route - ${req.method} ${req.originalUrl}`);
    res.status(404).send('Resource not found.'); // Simple text response for non-API 404
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error("[Central Error Handler] Status:", err.status || err.statusCode || 500);
    console.error("[Central Error Handler] Message:", err.message);
    console.error("[Central Error Handler] Stack:", err.stack);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Avoid sending stack trace in production
    const errorResponse = { error: message };
    if (process.env.NODE_ENV !== 'production') {
        // errorResponse.stack = err.stack; // Optionally include stack in dev
    }

    res.status(statusCode).json(errorResponse);
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `Backend server listening on port ${port}`);
    console.log(`Access API at http://localhost:${port}/api`);
});