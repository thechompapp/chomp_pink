// src/doof-backend/server.js (Refactored)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser"); // body-parser is built-in with Express 4.16+
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
// const commonDishesRouter = require('./routes/commonDishes'); // REMOVED

const app = express();
const port = process.env.PORT || 5001; // Use environment variable or default

// --- Core Middleware ---
// Configure CORS properly for your frontend URL
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", // Use env variable
    credentials: true, // Allow cookies/auth headers if needed
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions));

// Use Express's built-in JSON and URL-encoded body parsers
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // For form data if needed


// --- Logging Middleware (Optional but helpful) ---
app.use((req, res, next) => {
    console.log(`[Request] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});


// --- API Routes ---
app.get("/api/health", (req, res) => res.status(200).json({ status: "API healthy", timestamp: new Date().toISOString() }));

app.use('/api', filtersRouter); // Mounts filter routes at /api/cities, /api/neighborhoods, etc.
app.use('/api/trending', trendingRouter); // Mounts trending routes at /api/trending/dishes, etc.
app.use('/api/lists', listsRouter); // Mounts list routes at /api/lists, /api/lists/:id, etc.
app.use('/api/restaurants', restaurantsRouter); // Mounts restaurant routes at /api/restaurants/:id, etc.
app.use('/api/dishes', dishesRouter); // Mounts dish routes at /api/dishes/:id, etc.
app.use('/api/submissions', submissionsRouter); // Mounts submission routes at /api/submissions, /api/submissions/:id/approve, etc.
app.use('/api/places', placesRouter); // Mounts Google Places routes at /api/places/autocomplete, etc.
app.use('/api/admin', adminRouter); // Mounts admin routes at /api/admin/restaurants, etc.
// REMOVED common dishes route mounting
// app.use('/api/common-dishes', commonDishesRouter);


// --- Optional: Serve Static Frontend ---
// If you build your React app (`npm run build`), you can serve it from Express
// const frontendBuildPath = path.join(__dirname, '../../dist'); // Adjust path to your build output
// console.log(`Serving static files from: ${frontendBuildPath}`);
// app.use(express.static(frontendBuildPath));
// // Handle SPA routing: fallback to index.html for non-API routes
// app.get('*', (req, res) => {
//     // Check if the request looks like an API call or a file request
//     if (req.originalUrl.startsWith('/api/') || req.originalUrl.includes('.')) {
//         // Let the 404 handler below catch it if it's not a recognized API route or file
//         return res.status(404).json({ error: 'Resource not found.' });
//     }
//     // Otherwise, serve the main index.html file for SPA routing
//     res.sendFile(path.resolve(frontendBuildPath, 'index.html'));
// });


// --- Basic Not Found Handler (AFTER API routes and static serving) ---
app.use((req, res, next) => {
  // Respond with a JSON 404 for API-like paths, or HTML 404 otherwise
  if (req.accepts('json') && !req.accepts('html')) { // Check if likely API call
       res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
  } else {
      res.status(404).send('<h1>404 - Page Not Found</h1>'); // Simple HTML 404
  }
});


// --- Centralized Error Handler Middleware (MUST be last middleware) ---
app.use((err, req, res, next) => {
  // Log the error details
  console.error("--- UNHANDLED ERROR ---");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Route:", req.method, req.originalUrl);
  console.error("Error Status:", err.status || 500);
  console.error("Error Message:", err.message);
  console.error("Error Stack:", err.stack);
  console.error("---------------------");

  // Set status code
  const statusCode = err.status || 500; // Use error status or default to 500
  res.status(statusCode);

  // Send JSON response
  res.json({
    error: "Internal Server Error",
    // Only include detailed message in non-production environments
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    // Optionally include stack trace in development
    // stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`\n🚀 Server running on \x1b[36mhttp://localhost:${port}\x1b[0m`); // Added color/emoji
  if (!process.env.GOOGLE_API_KEY && process.env.NODE_ENV !== 'test') {
      console.warn("\x1b[33m%s\x1b[0m", "⚠️ Warning: GOOGLE_API_KEY environment variable is not set. Google Places API features will not work.");
  }
   if (!process.env.DB_PASSWORD && process.env.NODE_ENV !== 'test') {
       console.warn("\x1b[33m%s\x1b[0m", "⚠️ Warning: DB_PASSWORD environment variable is not set. Database connection may fail.");
   }
});