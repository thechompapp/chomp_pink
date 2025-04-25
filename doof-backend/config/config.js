// Filename: /doof-backend/config/config.js
import 'dotenv/config'; // Ensure dotenv runs early

const config = {
    JWT_SECRET: process.env.JWT_SECRET || 'default_super_secret_key_123!', // Use environment variable or default
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h', // Token expiration time (e.g., 1 hour)
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret_key_456!', // Separate secret for refresh tokens
    REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d', // Refresh token expiration time (e.g., 7 days)
    DEFAULT_PAGE_LIMIT: parseInt(process.env.DEFAULT_PAGE_LIMIT || '10', 10), // Default pagination limit
     GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || null, // Added Google Places API Key
     PLACES_API_BASE_URL: 'https://maps.googleapis.com/maps/api/place', // Base URL for Places API

    // Add other configurations as needed
    // e.g., database connection details if not using pool defaults directly
    // DB_HOST: process.env.DB_HOST || 'localhost',
    // DB_PORT: process.env.DB_PORT || 5432,
    // DB_USER: process.env.DB_USER,
    // DB_PASSWORD: process.env.DB_PASSWORD,
    // DB_NAME: process.env.DB_NAME,
};

// Verify essential config
if (!config.JWT_SECRET || config.JWT_SECRET === 'default_super_secret_key_123!') {
     console.warn('WARNING: JWT_SECRET is using default value or is missing. Set JWT_SECRET environment variable for production.');
}
if (!config.REFRESH_TOKEN_SECRET || config.REFRESH_TOKEN_SECRET === 'default_refresh_secret_key_456!') {
     console.warn('WARNING: REFRESH_TOKEN_SECRET is using default value or is missing. Set REFRESH_TOKEN_SECRET environment variable for production.');
}
// Add check for GOOGLE_PLACES_API_KEY if it's essential
 if (!config.GOOGLE_PLACES_API_KEY) {
     console.warn('WARNING: GOOGLE_PLACES_API_KEY is missing. Places API functionality will be disabled.');
 }


export default config; // Use export default