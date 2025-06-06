// doof-backend/config/config.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the path to the .env file based on the current file's location
// This assumes .env is in the root of the 'doof-backend' directory,
// and config.js is inside a 'config' directory within 'doof-backend'.
// Adjust if your .env file is elsewhere relative to this config.js file.
// If config.js is in the root of doof-backend, then path.resolve(__dirname, '.env') is fine.
// If config.js is in doof-backend/config, then path.resolve(__dirname, '../.env')
const envPath = path.resolve(__dirname, '../.env'); // Assuming .env is in parent (doof-backend)

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env file from config.js:", result.error, "Attempted path:", envPath);
  // Potentially fall back to direct process.env or throw error if critical vars are missing
} else {
  console.log(".env file loaded successfully from config.js. Path:", envPath);
  // console.log("Parsed .env content:", result.parsed); // For debugging, shows what was loaded
}


// Determine if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';

// Use a consistent test secret when in test mode
const testJwtSecret = 'test-jwt-secret-for-api-testing-environments-only';

const config = {
  port: process.env.PORT || 5001,
  // Use test JWT secret in test environments, otherwise use environment variable
  jwtSecret: isTestEnvironment ? testJwtSecret : process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '24h', // Extended from 1h to 24h for better UX
  jwtCookieExpiration: parseInt(process.env.JWT_COOKIE_EXPIRATION_MS || (24 * 60 * 60 * 1000), 10), // 24 hours in ms
  refreshTokenExpirationDays: parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || '7', 10),
  refreshTokenCookieExpiration: parseInt(process.env.REFRESH_TOKEN_COOKIE_EXPIRATION_MS || (7 * 24 * 60 * 60 * 1000), 10), // 7 days in ms
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL || 'info',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  // Add other configurations as needed
  DEFAULT_PAGE_LIMIT: parseInt(process.env.DEFAULT_PAGE_LIMIT || '12', 10),

  // Database configuration (ensure these are correctly set in .env)
  db: {
    user: process.env.DB_USER || 'doof_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'doof_db',
    password: process.env.DB_PASSWORD || 'your_db_password', // Replace with your actual default or ensure it's in .env
    port: parseInt(process.env.DB_PORT || '5432', 10),
  },
};

// Critical check for JWT_SECRET
if (!config.jwtSecret) {
  if (isTestEnvironment) {
    console.warn('[Config] JWT_SECRET not found in environment, but test mode is enabled. Using test secret.');
    config.jwtSecret = testJwtSecret; // Ensure we have a secret for tests
  } else {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables or .env file.');
    // process.exit(1); // Optionally exit if the secret is absolutely critical for startup
  }
} else {
  console.log(`[Config] JWT_SECRET loaded successfully. ${isTestEnvironment ? '(Using test secret)' : ''}`);
}


export default config;
