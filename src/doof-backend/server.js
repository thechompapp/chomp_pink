// src/doof-backend/server.js (Refactored - Add test route)
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require('./db'); // *** ADD THIS: Import the db module ***

// Import existing routers
const filtersRouter = require('./routes/filters');
const trendingRouter = require('./routes/trending');
const listsRouter = require('./routes/lists');
const restaurantsRouter = require('./routes/restaurants');
const dishesRouter = require('./routes/dishes');
const submissionsRouter = require('./routes/submissions');
const placesRouter = require('./routes/places');
const adminRouter = require('./routes/admin');

const app = express();
const port = process.env.PORT || 5001;

// --- Core Middleware (Keep as is) ---
const corsOptions = { /* ... */ };
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => { /* Logging middleware */ next(); });


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

// Mount existing routers (Keep as is)
app.use('/api', filtersRouter);
app.use('/api/trending', trendingRouter); // Keep using the reverted complex queries for now
app.use('/api/lists', listsRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/dishes', dishesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/places', placesRouter);
app.use('/api/admin', adminRouter);

// --- Optional: Serve Static Frontend (Keep as is) ---
// app.use(express.static(...));
// app.get('*', ...);

// --- Not Found & Error Handlers (Keep as is) ---
app.use((req, res, next) => { /* 404 handler */ });
app.use((err, req, res, next) => { /* Centralized error handler */ });

// --- Start Server (Keep as is) ---
app.listen(port, () => { /* ... */ });