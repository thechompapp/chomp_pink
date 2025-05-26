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
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 30000, // 30 seconds
  validateStatus: function (status) {
    // Consider any status code less than 500 as a success
    return status < 500;
  }
});

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
