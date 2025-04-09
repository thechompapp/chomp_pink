/* src/config.ts */

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_PLACES_API_KEY?: string;
  readonly DEV: boolean;
}

const env = import.meta.env as ImportMetaEnv;

const API_BASE_URL: string = env.VITE_API_URL || 'http://localhost:5001';

const GOOGLE_PLACES_API_KEY: string = (() => {
  const key = env.VITE_GOOGLE_PLACES_API_KEY;
  if (!key) {
      if (env.DEV) {
          console.warn(
              '\n\nWARNING: VITE_GOOGLE_PLACES_API_KEY is not set in your .env file.\n' +
              'Google Places features (e.g., Quick Add suggestions) will not work in development.\n' +
              'Set it in your .env file with "VITE_GOOGLE_PLACES_API_KEY=your_key_here".\n\n'
          );
          return ''; // Return empty string in dev to allow testing without crashing
      } else {
          throw new Error(
              'VITE_GOOGLE_PLACES_API_KEY is not set in your environment variables. ' +
              'This is required for Google Places functionality in production.'
          );
      }
  }
  return key;
})();

export { API_BASE_URL, GOOGLE_PLACES_API_KEY };