/* src/config.ts */

// Define types for environment variables for clarity
interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
    readonly VITE_GOOGLE_PLACES_API_KEY?: string;
    readonly DEV: boolean; // Assuming import.meta.env.DEV is available (Vite specific)
  }
  
  // Type assertion for import.meta.env
  const env = import.meta.env as ImportMetaEnv;
  
  // Ensure your VITE_API_URL is set in your .env file (e.g., VITE_API_URL=http://localhost:5001)
  // Provide a default type (string) and handle potential undefined value
  const API_BASE_URL: string = env.VITE_API_URL || 'http://localhost:5001'; // Keep fallback for local dev
  
  // Ensure your VITE_GOOGLE_PLACES_API_KEY is set in your .env file
  // Type is string | undefined as it might be missing
  const GOOGLE_PLACES_API_KEY: string | undefined = env.VITE_GOOGLE_PLACES_API_KEY;
  
  // Log a warning if the Places API key is missing during development
  if (env.DEV && !GOOGLE_PLACES_API_KEY) {
    console.warn(
      'config.ts: VITE_GOOGLE_PLACES_API_KEY is not set in your .env file. ' +
        'Google Places features in the frontend (like Quick Add suggestions) may not work.'
    );
  }
  
  export { API_BASE_URL, GOOGLE_PLACES_API_KEY };