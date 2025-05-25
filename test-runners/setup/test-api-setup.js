/**
 * Test API Setup
 * 
 * This file configures the API client for tests to ensure it uses the correct backend URL.
 * It overrides the default API base URL to point to the backend server running on port 5001.
 */

import axios from 'axios';
import { apiClient, BACKEND_URL } from './enhanced-test-setup.js';

// Create a custom axios instance for tests that points to the correct backend URL
const testApiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Override the apiClient's request methods to use our custom instance
apiClient.get = (url, config) => testApiClient.get(url, config);
apiClient.post = (url, data, config) => testApiClient.post(url, data, config);
apiClient.put = (url, data, config) => testApiClient.put(url, data, config);
apiClient.delete = (url, config) => testApiClient.delete(url, config);
apiClient.patch = (url, data, config) => testApiClient.patch(url, data, config);

// Verify backend server is available
export async function verifyBackendServer() {
  try {
    console.log(`Checking connection to ${BACKEND_URL}/api/health...`);
    const response = await testApiClient.get('/api/health', { timeout: 5000 });
    
    if (response.status !== 200) {
      throw new Error(`Backend server returned status ${response.status}`);
    }
    
    console.log('✅ Backend server is connected and ready for tests');
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ BACKEND SERVER IS NOT AVAILABLE');
    console.error('Error details:', error.message);
    throw new Error('Backend server MUST be running to execute these tests. Please start the server and try again.');
  }
}

export { testApiClient };
