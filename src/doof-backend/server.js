// src/doof-backend/server.js (Refactored - Update trendingRouter path)
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require('./db'); // *** ADD THIS: Import the db module ***

// Import existing routers
const filtersRouter = require('./routes/filters');
// *** CHANGE: Updated path for trendingRouter ***
const trendingRouter = require('./routes/trending'); // Assuming src/data/trending.js is MOVED here
const listsRouter = require('./routes/lists');
const restaurantsRouter = require('./routes/restaurants');
const dishesRouter = require('./routes/dishes');
const submissionsRouter = require('./routes/submissions');
const placesRouter = require('./routes/places');
const adminRouter = require('./routes/admin');
// *** Potentially remove commonDishes if that feature/table was removed ***
const commonDishesRouter = require('./routes/commonDishes');

const app = express();
const port = process.env.PORT || 5001;

// --- Core Middleware (Keep as is) ---
const corsOptions = { /* ... */ }; // Define or import your cors options if needed
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});


// --- API Routes ---
app.get("/api/health", (req, res) => res.status(200).json({ status: "API healthy", timestamp: new Date().toISOString() }));

// *** ADDED TEST ROUTE ***
app.get("/api/test-restaurants", async (req, res, next) => {
    console.log("[TEST ROUTE] /api/test-restaurants hit!");
    try {
        // Very simple query directly on the Restaurants table
        const result = await db.query("SELECT id, name, adds FROM Restaurants ORDER BY adds DESC NULLS LAST LIMIT 3");
        console.log(`[TEST ROUTE] Query result rows: ${result.rowCount}`);
        res.status(200).json({
            message: "Test query executed.",
            rowCount: result.rowCount,
            rows: result.rows || []
        });
    } catch (error) {
        console.error("[TEST ROUTE] Error:", error);
        // Forward error to the centralized error handler
        next(error);
    }
});
// *** END TEST ROUTE ***

// Mount existing routers
app.use('/api', filtersRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/lists', listsRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/dishes', dishesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/places', placesRouter);
app.use('/api/admin', adminRouter);
// *** Mount commonDishes router - remove if not used ***
app.use('/api/common-dishes', commonDishesRouter);


// --- Optional: Serve Static Frontend (Keep as is or configure as needed) ---
// Example: Serve static files from a 'build' directory
// app.use(express.static(path.join(__dirname, '../../build'))); // Adjust path as needed
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../../build', 'index.html')); // Adjust path as needed
// });

// --- Not Found & Error Handlers ---
// 404 Handler (if no routes matched)
app.use((req, res, next) => {
    res.status(404).json({ error: `Not Found - ${req.originalUrl}` });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error("[Central Error Handler]", err.stack);
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({ error: message });
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `Backend server listening on port ${port}`);
});