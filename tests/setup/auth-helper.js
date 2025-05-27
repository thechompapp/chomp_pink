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
 * @returns {Promise<{success: boolean, data: Object|null, error: string|Object|null}>}
 */
export const loginTestUser = async (email, password) => {
  const loginData = {
    email: email.toLowerCase().trim(),
    password: password.trim()
  };
  
  console.log('Login request data:', JSON.stringify({
    ...loginData,
    password: '***' // Don't log actual password
  }, null, 2));
  
  console.log('Sending login request to /auth/login');
  
  try {
    const response = await testApiClient.post('/auth/login', loginData);
    
    console.log('Login response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: Object.keys(response.headers || {})
    });
    
    // Check if the response has data
    if (!response.data) {
      console.error('No data in login response');
      return {
        success: false,
        data: null,
        error: {
          message: 'No data in response',
          status: response.status,
          statusText: response.statusText
        }
      };
    }
    
    // The API returns success/error in the response data
    const { success, message, data, error } = response.data;
    
    const result = {
      success: success === true,
      data: data || response.data, // Return the full response data
      error: error || null,
      message: message || null,
      status: response.status,
      headers: response.headers
    };
    
    console.log('Processed login result:', JSON.stringify({
      success: result.success,
      hasToken: !!(result.data?.token || result.token),
      hasUser: !!(result.data?.user || result.user),
      error: result.error,
      status: result.status
    }, null, 2));
    
    return result;
  } catch (error) {
    console.error('Login request failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
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
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

/**
 * Logs out the current user
 * @returns {Promise<{success: boolean, error: string|Object|null, message: string|null}>}
 */
export const logoutTestUser = async () => {
  console.log('Attempting logout');
  try {
    const response = await testApiClient.post('/auth/logout');
    
    console.log('Logout response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    
    // The API returns success/error in the response data
    const { success, message, error } = response.data || {};
    
    return {
      success: success === true || response.status === 200,
      error: error || null,
      message: message || 'Logout successful'
    };
  } catch (error) {
    console.error('Logout failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      },
      stack: error.stack
    });
    
    // If we get a 401, it might mean the user is already logged out
    if (error.response?.status === 401) {
      return {
        success: true,
        error: null,
        message: 'User already logged out'
      };
    }
    
    return {
      success: false,
      error: error.response?.data || error.message,
      message: error.response?.data?.message || 'Logout failed'
    };
  }
};

/**
 * Registers a new test user
 * @param {Object} userData - User registration data
 * @returns {Promise<{success: boolean, data: Object|null, error: string|Object|null}>}
 */
export const registerTestUser = async (userData) => {
  const registrationData = {
    ...userData,
    // Ensure we don't log the actual password
    password: userData.password ? '***' : undefined,
    confirmPassword: userData.confirmPassword ? '***' : undefined
  };
  
  console.log('Registering test user with data:', JSON.stringify(registrationData, null, 2));
  
  try {
    console.log('Sending registration request to /auth/register');
    const response = await testApiClient.post('/auth/register', userData);
    
    console.log('Registration response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? {
        ...response.data,
        // Don't log sensitive data
        token: response.data.token ? '***' : undefined,
        user: response.data.user ? {
          ...response.data.user,
          // Don't log sensitive user data
          password: undefined,
          password_hash: undefined
        } : undefined
      } : null,
      headers: Object.keys(response.headers || {})
    });
    
    // Check if the response has the expected structure
    if (!response.data) {
      console.error('No data in registration response');
      return {
        success: false,
        data: null,
        error: {
          message: 'No data in response',
          status: response.status,
          statusText: response.statusText
        }
      };
    }
    
    // The API returns token and user directly in the response
    const { success, message, data, error } = response.data;
    
    const result = {
      success: success === true,
      data: data || response.data, // Return the full response data
      error: error || null,
      message: message || null,
      status: response.status,
      headers: response.headers
    };
    
    console.log('Processed registration result:', JSON.stringify({
      success: result.success,
      hasToken: !!(result.data?.token || result.token),
      hasUser: !!(result.data?.user || result.user),
      error: result.error,
      status: result.status
    }, null, 2));
    
    return result;
  } catch (error) {
    console.error('Registration request failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
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
      error: error.response?.data || error.message,
      status: error.response?.status
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
