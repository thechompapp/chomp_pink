// File: src/config.js
import logger from './utils/logger';

const APP_ENV = import.meta.env.VITE_APP_ENV || 'development';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const MOCK_API = import.meta.env.VITE_MOCK_API === 'true';

const IS_DEVELOPMENT = APP_ENV === 'development';
const IS_PRODUCTION = APP_ENV === 'production';
const IS_TESTING = APP_ENV === 'test';

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";

const FEATURE_TRENDING_PAGE_ENABLED = import.meta.env.VITE_FEATURE_TRENDING_PAGE_ENABLED === 'true';
const FEATURE_BULK_ADD_ENABLED = import.meta.env.VITE_FEATURE_BULK_ADD_ENABLED === 'true';
const FEATURE_USER_PROFILE_ENHANCEMENTS = import.meta.env.VITE_FEATURE_USER_PROFILE_ENHANCEMENTS === 'true';

const SEARCH_DEBOUNCE_MS = parseInt(import.meta.env.VITE_SEARCH_DEBOUNCE_MS, 10) || 300;
const INPUT_DEBOUNCE_MS = parseInt(import.meta.env.VITE_INPUT_DEBOUNCE_MS, 10) || 250;

const DEFAULT_PAGE_LIMIT = parseInt(import.meta.env.VITE_DEFAULT_PAGE_LIMIT, 10) || 10;
const MAX_UPLOAD_SIZE_MB = parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB, 10) || 5;

// API Retry Policy Constants
const MAX_API_RETRIES = parseInt(import.meta.env.VITE_MAX_API_RETRIES, 10) || 3;
const API_RETRY_DELAY_MS = parseInt(import.meta.env.VITE_API_RETRY_DELAY_MS, 10) || 1000;

if (IS_DEVELOPMENT) {
  logger.debug('Application is running in development mode');
  logger.debug('API Base URL:', API_BASE_URL);
  logger.debug('Mock API Enabled:', MOCK_API);
  if (!GOOGLE_PLACES_API_KEY) {
    logger.warn('Google Places API Key (VITE_GOOGLE_PLACES_API_KEY) is not set. Maps and place features may not work.');
  }
  logger.debug('Feature Trending Page:', FEATURE_TRENDING_PAGE_ENABLED);
  logger.debug('Feature Bulk Add:', FEATURE_BULK_ADD_ENABLED);
  logger.debug('Max API Retries:', MAX_API_RETRIES);
  logger.debug('API Retry Delay (ms):', API_RETRY_DELAY_MS);
}

if (IS_PRODUCTION) {
  if (!GOOGLE_PLACES_API_KEY) {
    logger.error('CRITICAL: Google Places API Key (VITE_GOOGLE_PLACES_API_KEY) is MISSING for production build.');
  }
  if (!API_BASE_URL.startsWith('https://') && !API_BASE_URL.includes('localhost')) {
    logger.warn('Production API_BASE_URL does not appear to be HTTPS or localhost. Ensure this is intentional.');
  }
}

export {
  APP_ENV,
  API_BASE_URL,
  MOCK_API,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  IS_TESTING,
  GOOGLE_PLACES_API_KEY,
  FEATURE_TRENDING_PAGE_ENABLED,
  FEATURE_BULK_ADD_ENABLED,
  FEATURE_USER_PROFILE_ENHANCEMENTS,
  SEARCH_DEBOUNCE_MS,
  INPUT_DEBOUNCE_MS,
  DEFAULT_PAGE_LIMIT,
  MAX_UPLOAD_SIZE_MB,
  MAX_API_RETRIES,      // Added export
  API_RETRY_DELAY_MS,   // Added export
};