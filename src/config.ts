/* src/config.ts */

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // VITE_GOOGLE_PLACES_API_KEY is no longer needed here for the proxied requests
  // readonly VITE_GOOGLE_PLACES_API_KEY?: string;
  readonly DEV: boolean;
}

const env = import.meta.env as ImportMetaEnv;

const API_BASE_URL: string = env.VITE_API_URL || 'http://localhost:5001';

// VITE_GOOGLE_PLACES_API_KEY is removed.
// If you still need a key client-side for OTHER Google Maps SDK features
// (like displaying a map), keep it but be aware of the exposure.
// For the proxied autocomplete/details, it's not needed here anymore.
/*
const GOOGLE_PLACES_API_KEY: string = (() => {
  const key = env.VITE_GOOGLE_PLACES_API_KEY;
  if (!key) {
      if (env.DEV) {
          console.warn(
              '\n\nWARNING: VITE_GOOGLE_PLACES_API_KEY is not set in your .env file.\n' +
              'Client-side Google Maps features (like Map display) may not work.\n' +
              'Set it in your .env file with "VITE_GOOGLE_PLACES_API_KEY=your_key_here".\n\n'
          );
          return ''; // Return empty string in dev
      } else {
          // Decide if this is a fatal error for production if maps are essential
          console.error(
              'VITE_GOOGLE_PLACES_API_KEY is not set in your environment variables. ' +
              'Client-side maps may not function.'
          );
           return ''; // Or throw error depending on requirements
          // throw new Error('VITE_GOOGLE_PLACES_API_KEY is not set.');
      }
  }
  return key;
})();
*/

// Only export API_BASE_URL now (unless GOOGLE_PLACES_API_KEY is kept for other reasons)
export { API_BASE_URL }; // GOOGLE_PLACES_API_KEY removed