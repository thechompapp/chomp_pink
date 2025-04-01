// src/doof-backend/server.js (Refactored)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config(); // Load .env file early

// Import routers
const filtersRouter = require('./routes/filters');
const trendingRouter = require('./routes/trending');
const listsRouter = require('./routes/lists');
const restaurantsRouter = require('./routes/restaurants');
const dishesRouter = require('./routes/dishes');
const submissionsRouter = require('./routes/submissions');
const placesRouter = require('./routes/places');
const adminRouter = require('./routes/admin');
const commonDishesRouter = require('./routes/commonDishes'); // Optional

const app = express();
const port = process.env.PORT || 5001; // Use environment variable or default

// --- Core Middleware ---
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());
// Consider adding express.urlencoded({ extended: true }) if handling form submissions
// app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get("/api/health", (req, res) => res.status(200).send("API healthy"));

app.use('/api', filtersRouter); // Mounts filter routes at /api/cities, /api/neighborhoods, etc.
app.use('/api/trending', trendingRouter); // Mounts trending routes at /api/trending/dishes, etc.
app.use('/api/lists', listsRouter); // Mounts list routes at /api/lists, /api/lists/:id, etc.
app.use('/api/restaurants', restaurantsRouter); // Mounts restaurant routes at /api/restaurants/:id, etc.
app.use('/api/dishes', dishesRouter); // Mounts dish routes at /api/dishes/:id, etc.
app.use('/api/submissions', submissionsRouter); // Mounts submission routes at /api/submissions, /api/submissions/:id/approve, etc.
app.use('/api/places', placesRouter); // Mounts Google Places routes at /api/places/autocomplete, etc.
app.use('/api/admin', adminRouter); // Mounts admin routes at /api/admin/restaurants, etc.
// Mount optional common dishes route (if table exists and file is used)
app.use('/api/common-dishes', commonDishesRouter);

// --- Optional: Serve Static Frontend ---
// If you build your React app, you can serve it from Express
// app.use(express.static(path.join(__dirname, '../../dist'))); // Adjust path to your build output
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../../dist', 'index.html'));
// });

// --- Basic Not Found Handler ---
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// --- Basic Error Handler Middleware (Could be moved to middleware/errorHandler.js) ---
app.use((err, req, res, next) => {
  console.error("--- UNHANDLED ERROR ---");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Route:", req.method, req.originalUrl);
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  console.error("---------------------");
  // Avoid sending stack trace in production
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  if (!process.env.GOOGLE_API_KEY) {
      console.warn("Warning: GOOGLE_API_KEY is not set in the environment variables. Google Places API features will not work.");
  }
});