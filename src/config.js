// src/config.js
import { logInfo, logDebug, logError } from './utils/logger.js';

// Get frontend port from current window URL
const getCurrentPort = () => {
  try {
    return window.location.port || '5173'; // Default to 5173 if no port found
  } catch (e) {
    return '5173'; // Default if window is not available
  }
};

// Access Vite environment variables using import.meta.env
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
let viteApiBaseUrl = rawApiBaseUrl;

// Extract host and protocol from API URL
const getApiHostComponents = (url) => {
  try {
    // Check if it already has a protocol
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol,
        host: urlObj.hostname
      };
    } else {
      // Assume http if no protocol
      return {
        protocol: 'http:',
        host: url.split('/')[0]
      };
    }
  } catch (e) {
    return { protocol: 'http:', host: 'localhost' };
  }
};

// Modify API URL to use the same port as the frontend to avoid CORS issues
const adaptApiUrlToFrontendPort = (apiUrl) => {
  const frontendPort = getCurrentPort();
  const { protocol, host } = getApiHostComponents(apiUrl);
  
  // If it's a localhost URL, adapt to frontend port
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${protocol}//${host}:${frontendPort}`;
  }
  
  return apiUrl;
};

// Adapt API host to current frontend port to avoid CORS issues
const adaptedApiHost = adaptApiUrlToFrontendPort(rawApiBaseUrl);

// Ensure the /api path is present at the end
if (adaptedApiHost.endsWith('/api')) {
  // Already ends with /api, use as is
  viteApiBaseUrl = adaptedApiHost;
} else if (adaptedApiHost.endsWith('/')) {
  // Ends with a slash, just append api
  viteApiBaseUrl = `${adaptedApiHost}api`;
} else {
  // Doesn't end with /api or /, so append /api
  viteApiBaseUrl = `${adaptedApiHost}/api`;
}

// Log configuration for debugging
try {
  logDebug('[Config] API Base URL Configuration:', {
    raw: rawApiBaseUrl,
    adapted: adaptedApiHost,
    processed: viteApiBaseUrl,
    frontendPort: getCurrentPort(),
    env: import.meta.env.MODE
  });
} catch (error) {
  console.warn('[Config] Failed to log config info:', error);
}


const config = {
  VITE_API_BASE_URL: viteApiBaseUrl,
  VITE_GOOGLE_PLACES_API_KEY: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};

if (config.DEV) {
  console.log('[Frontend Config Loaded]', config);
  if (!import.meta.env.VITE_API_BASE_URL) {
    console.warn(`[Frontend Config] VITE_API_BASE_URL is not set in .env, defaulting. Final baseURL for API calls: ${config.VITE_API_BASE_URL}`);
  } else {
    console.log(`[Frontend Config] Original VITE_API_BASE_URL from .env: ${import.meta.env.VITE_API_BASE_URL}. Final baseURL for API calls: ${config.VITE_API_BASE_URL}`);
  }
  if (!config.VITE_GOOGLE_PLACES_API_KEY) {
    console.warn('[Frontend Config] VITE_GOOGLE_PLACES_API_KEY is not set in .env. Places search will not work.');
  }
}

export default config;
