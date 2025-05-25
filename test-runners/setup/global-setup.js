/**
 * Global Setup for E2E Tests
 * 
 * This file contains setup and teardown functions that run once before
 * and after all tests. It handles database initialization, server startup,
 * and other global test prerequisites.
 */

import { initializeTestDatabase, closeDbConnections } from './db-utils.js';
import { config } from './config.js';
import apiClient, { handleApiRequest } from './api-client.js';

/**
 * Setup function that runs before all tests
 * Vitest expects this to return a teardown function
 */
export default async () => {
  console.log('🚀 Starting global test setup...');
  
  try {
    // Check if API is available
    console.log('Checking API availability...');
    try {
      // First try the health endpoint
      const healthCheck = await handleApiRequest(
        () => apiClient.get('/health'),
        'API Health Check'
      );
      
      if (healthCheck.success) {
        console.log('✅ API health endpoint is available');
      } else {
        // If health endpoint fails, try another common endpoint
        console.log('⚠️ Health endpoint not found, trying alternative endpoint...');
        const altCheck = await handleApiRequest(
          () => apiClient.get('/'),
          'Alternative API Check'
        );
        
        if (altCheck.success) {
          console.log('✅ API is available via alternative endpoint');
        } else {
          console.warn('⚠️ API may not be fully available. Some tests may fail.');
          console.log(`API base URL: ${config.api.baseUrl}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ API check error: ${error.message}`);
      console.log(`API base URL: ${config.api.baseUrl}`);
      console.log('Make sure the development server is running with: npm run dev');
    }
    
    // Skip database initialization for real API testing
    console.log('ℹ️ Using existing database for real API testing');
    
    // Vitest expects the setup function to return a teardown function
    return async () => {
      console.log('🧹 Starting global test teardown...');
      
      try {
        // No need to clean up the database when using the real API
        console.log('ℹ️ No database cleanup needed for real API testing');
        
        console.log('✅ Global teardown completed');
      } catch (error) {
        console.error(`❌ Global teardown failed: ${error.message}`);
        // Don't throw the error to allow tests to complete
        console.error('Continuing despite error...');
      }
    };
  } catch (error) {
    console.error(`❌ Global setup failed: ${error.message}`);
    // Instead of failing, we'll return a minimal teardown function
    console.warn('Continuing with minimal setup...');
    return async () => {
      console.log('Minimal teardown completed');
    };
  }
};
