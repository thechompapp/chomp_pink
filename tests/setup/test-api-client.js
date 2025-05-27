import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables from .env.test
config({ path: '.env.test' });

// Create a new axios instance with default config
const baseURL = 'http://localhost:5001/api';
console.log(`[DEBUG] Creating API client with baseURL: ${baseURL}`);

const testApiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    // Add test mode header to help identify test requests
    'X-Test-Mode': 'true'
  },
  timeout: 30000, // 30 seconds
  // Let axios handle status codes normally (throw for >= 300)
  validateStatus: null
});

// Always log test API requests in test mode
testApiClient.interceptors.request.use(
  config => {
    console.log(`[TEST] ${config.method.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  error => {
    console.error('[TEST] Request error:', error);
    return Promise.reject(error);
  }
);

// Always log test API responses in test mode
testApiClient.interceptors.response.use(
  response => {
    console.log(`[TEST] Response ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, {
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    if (error.response) {
      console.error(`[TEST] Response error ${error.response.status}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('[TEST] No response received:', error.request);
    } else {
      console.error('[TEST] Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Add request interceptor for logging
if (process.env.DEBUG) {
  testApiClient.interceptors.request.use(
    config => {
      console.log(`[DEBUG] ${config.method.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
      return config;
    },
    error => {
      console.error('[DEBUG] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  testApiClient.interceptors.response.use(
    response => {
      console.log(`[DEBUG] Response ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, {
        data: response.data
      });
      return response;
    },
    error => {
      if (error.response) {
        console.error(`[DEBUG] API Error ${error.response.status}:`, {
          url: error.config.url,
          method: error.config.method,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('[DEBUG] No response received:', error.request);
      } else {
        console.error('[DEBUG] Request setup error:', error.message);
      }
      return Promise.reject(error);
    }
  );
}

export default testApiClient;
