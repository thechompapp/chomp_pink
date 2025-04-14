/* src/config.js */
/* REMOVED: TypeScript interface and type annotations */

// REMOVED: interface ImportMetaEnv { ... }

// Access import.meta.env directly without type assertion
const env = import.meta.env; // REMOVED: as ImportMetaEnv;

// Define API_BASE_URL without type annotation
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:5001'; // REMOVED: : string

// VITE_GOOGLE_PLACES_API_KEY related code is already commented out or removed,
// as it's handled by the backend proxy.

// Export the needed config variable
export { API_BASE_URL };