// src/config.js (Removed fallback API key)

// Ensure your VITE_API_URL is set in your .env file (e.g., VITE_API_URL=http://localhost:5001)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001"; // Keep fallback for local dev

// Ensure your VITE_GOOGLE_PLACES_API_KEY is set in your .env file for frontend Places features
// Remove the fallback empty string - if the key isn't set, features requiring it should handle its absence gracefully.
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Log a warning if the Places API key is missing during development
if (import.meta.env.DEV && !GOOGLE_PLACES_API_KEY) {
  console.warn(
    "config.js: VITE_GOOGLE_PLACES_API_KEY is not set in your .env file. " +
    "Google Places features in the frontend (like Quick Add suggestions) may not work."
  );
}

export { API_BASE_URL, GOOGLE_PLACES_API_KEY };