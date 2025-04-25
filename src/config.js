/*
 * Filename: root/src/config.js
 * Description: Centralized configuration for the frontend React application.
 * Uses Vite's environment variable handling (import.meta.env).
 * Environment variables prefixed with VITE_ are exposed to the client-side code.
 * See: https://vitejs.dev/guide/env-and-mode.html
 */

// Default values can be provided if environment variables are not set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''; // Example for Places API Key if needed client-side

// Add other frontend-specific configurations as needed
const config = {
  API_BASE_URL,
  GOOGLE_API_KEY, // Only include if required directly on the client
  // Example: Feature flags from environment variables
  // ENABLE_NEW_FEATURE: import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true',
};

// Basic check/warning for essential client-side config (optional)
if (!config.API_BASE_URL) {
    console.warn('WARNING: VITE_API_BASE_URL is not set in environment variables. Using default.');
}
// Note: Avoid exposing sensitive keys directly in client-side config if possible.
// The backend proxy for Google Places API is generally a better pattern.
// if (!config.GOOGLE_API_KEY) {
//     console.warn('WARNING: VITE_GOOGLE_PLACES_API_KEY is not set. Places Autocomplete/Details might not work directly from client.');
// }


export default config;