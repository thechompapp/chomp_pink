// Centralized axios configuration for tests
import axios from 'axios';

// Create a configured axios instance
const testAxios = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
if (process.env.DEBUG_TESTS) {
  testAxios.interceptors.request.use(
    (config) => {
      console.log(`[TEST] Sending ${config.method.toUpperCase()} to ${config.url}`);
      return config;
    },
    (error) => {
      console.error('[TEST] Request error:', error.message);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  testAxios.interceptors.response.use(
    (response) => {
      console.log(`[TEST] Received ${response.status} from ${response.config.url}`);
      return response;
    },
    (error) => {
      if (error.response) {
        console.error(
          `[TEST] Response error ${error.response.status} from ${error.config.url}:`,
          error.response.data
        );
      } else {
        console.error('[TEST] Network error:', error.message);
      }
      return Promise.reject(error);
    }
  );
}

export default testAxios;
