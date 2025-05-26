/**
 * Authentication Test Helper
 * 
 * Provides utilities for testing authentication flows with the real API
 */

import testApiClient from './test-api-client.js';

// Simple logger for tests
const logInfo = (message, data) => {
  if (process.env.DEBUG) {
    console.log(`[INFO] ${message}`, data || '');
  }
};

/**
 * Logs in a test user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const loginTestUser = async (email, password) => {
  console.log(`[DEBUG] Attempting login with email: ${email}`);
  try {
    const response = await testApiClient.post('/auth/login', {
      email,
      password
    });
    
    console.log('[DEBUG] Login successful:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Received data' : 'No data',
      hasToken: !!response.data?.token,
      hasUser: !!response.data?.user
    });
    
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('[DEBUG] Login failed:', {
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      },
      stack: error.stack
    });
    
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Logs out the current user
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const logoutTestUser = async () => {
  console.log('[DEBUG] Attempting logout');
  try {
    const response = await testApiClient.post('/auth/logout');
    console.log('[DEBUG] Logout successful:', {
      status: response.status,
      statusText: response.statusText
    });
    return { success: true, error: null };
  } catch (error) {
    console.error('[DEBUG] Logout failed:', {
      message: error.message,
      response: error.response?.data
    });
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Registers a new test user
 * @param {Object} userData - User registration data
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const registerTestUser = async (userData) => {
  console.log('[DEBUG] Attempting registration:', { email: userData.email, username: userData.username });
  try {
    const response = await testApiClient.post('/auth/register', userData);
    
    console.log('[DEBUG] Registration successful:', {
      status: response.status,
      statusText: response.statusText,
      hasUser: !!response.data?.user
    });
    
    return {
      success: true,
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('[DEBUG] Registration failed:', {
      message: error.message,
      response: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Gets the current authenticated user
 * @returns {Promise<{success: boolean, user: Object|null, error: string|null}>}
 */
export const getCurrentUser = async () => {
  console.log('[DEBUG] Fetching current user');
  try {
    const response = await testApiClient.get('/auth/me');
    
    console.log('[DEBUG] Current user:', {
      status: response.status,
      hasUser: !!response.data,
      userId: response.data?.id
    });
    
    return {
      success: true,
      user: response.data,
      error: null
    };
  } catch (error) {
    console.error('[DEBUG] Failed to get current user:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return {
      success: false,
      user: null,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Cleans up test users
 * @param {Array<string>} emails - Array of email addresses to clean up
 * @returns {Promise<void>}
 */
export const cleanupTestUsers = async (emails) => {
  // This would call a test cleanup endpoint if available
  // For now, we'll just log the cleanup
  logInfo('Cleaning up test users', { emails });
};
