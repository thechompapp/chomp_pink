/* src/services/auth/authService.js */
/**
 * Consolidated Authentication Service
 * 
 * Optimized authentication service that handles:
 * - Login, logout, registration operations
 * - Token management with automatic refresh
 * - Development mode handling
 * - Consistent error handling
 * - Performance optimizations
 */
import httpClient from '@/services/http/httpClient';
import tokenManager from './tokenManager';
import authErrorHandler from '@/utils/auth/errorHandler';
import { logDebug, logInfo, logError } from '@/utils/logger';

// Constants
const AUTH_ENDPOINT = '/auth';
const DEV_ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'doof123'
};

// Storage keys for compatibility with different parts of the app
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  AUTH_STORAGE: 'auth-storage',
  AUTH_AUTHENTICATION_STORAGE: 'auth-authentication-storage',
  ADMIN_API_KEY: 'admin_api_key',
  CURRENT_USER: 'current_user'
};

// Cache for validation results to avoid repeated regex operations
const validationCache = new Map();

/**
 * Store tokens in multiple locations for compatibility
 * @param {Object} tokenData - Token data to store
 * @param {Object} userData - User data to store
 */
const storeTokensCompatibly = (tokenData, userData) => {
  const { accessToken, refreshToken, expiresIn } = tokenData;
  
  try {
    // Store in tokenManager (our consolidated approach)
    tokenManager.setTokens({
      accessToken,
      refreshToken,
      expiresIn
    });
    
    // Store in auth-token (expected by HTTP interceptors)
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
    
    // Store in auth-storage format (expected by some interceptors)
    const authStorageData = {
      state: {
        token: accessToken,
        refreshToken,
        user: userData,
        isAuthenticated: true,
        expiryTime: expiresIn ? Date.now() + (expiresIn * 1000) : null
      },
      version: 0
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_STORAGE, JSON.stringify(authStorageData));
    
    // Store in auth-authentication-storage (expected by Zustand auth store)
    const authenticationStorageData = {
      state: {
        token: accessToken,
        refreshToken,
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastAuthCheck: Date.now()
      },
      version: 0
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_AUTHENTICATION_STORAGE, JSON.stringify(authenticationStorageData));
    
    // Store user data separately for admin services
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
    
    logDebug('[AuthService] Tokens stored in all compatible formats');
  } catch (error) {
    logError('[AuthService] Error storing tokens:', error);
  }
};

/**
 * Clear tokens from all storage locations
 */
const clearAllTokenStorage = () => {
  try {
    // Clear tokenManager storage
    tokenManager.clearTokens();
    
    // Clear all other storage locations
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any remaining auth-related keys
    const authKeys = [
      'token',
      'refreshToken',
      'auth_access_token',
      'auth_refresh_token',
      'auth_token_expiry'
    ];
    authKeys.forEach(key => localStorage.removeItem(key));
    
    logDebug('[AuthService] All token storage cleared');
  } catch (error) {
    logError('[AuthService] Error clearing token storage:', error);
  }
};

/**
 * Optimized email validation with caching
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  if (!email) return false;
  
  if (validationCache.has(email)) {
    return validationCache.get(email);
  }
  
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  validationCache.set(email, isValid);
  
  // Prevent cache from growing too large
  if (validationCache.size > 100) {
    const firstKey = validationCache.keys().next().value;
    validationCache.delete(firstKey);
  }
  
  return isValid;
};

/**
 * Optimized password validation
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is valid
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Handle development mode admin login
 * @param {Object} credentials - Login credentials
 * @returns {Object|null} Mock admin user data or null
 */
const handleDevModeAdminLogin = (credentials) => {
  // Always return null to force real API login
  // This ensures we get real JWT tokens that work with admin endpoints
  return null;
  
  /* OLD CODE - commenting out to force real API login
  if (process.env.NODE_ENV !== 'development') return null;
  
  // Skip development mode bypass during E2E testing to ensure real API calls are made
  if (typeof window !== 'undefined' && localStorage.getItem('e2e_testing_mode') === 'true') {
    logInfo('[AuthService] E2E testing mode detected - skipping development mode bypass');
    return null;
  }
  
  if (credentials.email === DEV_ADMIN_CREDENTIALS.email && 
      credentials.password === DEV_ADMIN_CREDENTIALS.password) {
    
    logInfo('[AuthService] Using admin credentials in development mode');
    
    // Set admin flags for development mode
    const devFlags = {
      'admin_access_enabled': 'true',
      'superuser_override': 'true',
      'bypass_auth_check': 'true',
      'admin_api_key': 'doof-admin-secret-key-dev'
    };
    
    Object.entries(devFlags).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    const userData = {
      id: 1,
      email: credentials.email,
      name: 'Admin User',
      username: 'admin',
      account_type: 'superuser',
      role: 'superuser',
      permissions: ['admin', 'create', 'edit', 'delete']
    };
    
    const tokenData = {
      accessToken: 'dev-mode-token',
      refreshToken: 'dev-mode-refresh-token',
      expiresIn: 86400 // 24 hours
    };
    
    return {
      user: userData,
      tokens: tokenData
    };
  }
  
  return null;
  */
};

/**
 * Clear offline mode flags efficiently
 */
const clearOfflineMode = () => {
  const offlineKeys = ['offline_mode', 'offline-mode'];
  
  offlineKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  localStorage.setItem('force_online', 'true');
};

/**
 * Validate credentials object
 * @param {Object} credentials - Credentials to validate
 * @returns {Object} Validation result
 */
const validateCredentials = (credentials) => {
  if (!credentials) {
    return { isValid: false, error: 'Credentials are required' };
  }
  
  if (!credentials.email || !credentials.password) {
    return { isValid: false, error: 'Email and password are required' };
  }
  
  if (!isValidEmail(credentials.email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (!isValidPassword(credentials.password)) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  
  return { isValid: true };
};

/**
 * Validate user registration data
 * @param {Object} userData - User data to validate
 * @returns {Object} Validation result
 */
const validateUserData = (userData) => {
  if (!userData) {
    return { isValid: false, error: 'User data is required' };
  }
  
  const requiredFields = ['email', 'password'];
  const missingFields = requiredFields.filter(field => !userData[field]);
  
  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    };
  }
  
  if (!isValidEmail(userData.email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (!isValidPassword(userData.password)) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  
  return { isValid: true };
};

const authService = {
  /**
   * Optimized login with improved error handling
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} User data and tokens
   */
  login: async (credentials) => {
    try {
      // Clear offline mode flags
      clearOfflineMode();
      
      // Validate credentials
      const validation = validateCredentials(credentials);
      if (!validation.isValid) {
        throw authErrorHandler.createValidationError(validation.error);
      }
      
      // Handle development mode admin login
      const devModeResult = handleDevModeAdminLogin(credentials);
      if (devModeResult) {
        // Store tokens using compatible storage
        storeTokensCompatibly(devModeResult.tokens, devModeResult.user);
        
        // Return in the same format as API response
        return {
          success: true,
          data: {
            user: devModeResult.user,
            token: devModeResult.tokens.accessToken,
            expiresIn: devModeResult.tokens.expiresIn
          }
        };
      }
      
      logDebug('[AuthService] Attempting login for:', credentials.email);
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/login`, credentials);
      
      logDebug('[AuthService] Raw login response:', {
        hasData: !!response.data,
        hasSuccess: !!response.data?.success,
        hasToken: !!(response.data?.data?.token || response.data?.token),
        hasUser: !!(response.data?.data?.user || response.data?.user),
        responseStructure: Object.keys(response.data || {})
      });
      
      // Extract token and user data from response
      let tokenData, userData;
      if (response.data?.data) {
        // New format: { success: true, data: { token: '...', user: {...} } }
        tokenData = {
          accessToken: response.data.data.token,
          refreshToken: response.data.data.refreshToken || null,
          expiresIn: response.data.data.expiresIn || 86400 // Default 24 hours
        };
        userData = response.data.data.user;
      } else {
        // Legacy format: { token: '...', user: {...} }
        tokenData = {
          accessToken: response.data.token,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn || 86400
        };
        userData = response.data.user;
      }
      
      logInfo('[AuthService] Login successful, storing tokens');
      
      // Store tokens using compatible method
      storeTokensCompatibly(tokenData, userData);
      
      return {
        success: true,
        data: {
          user: userData,
          token: tokenData.accessToken,
          expiresIn: tokenData.expiresIn
        }
      };
    } catch (error) {
      logError('[AuthService] Login error:', error.message);
      const formattedError = authErrorHandler.handleError(error, 'login');
      throw formattedError;
    }
  },
  
  /**
   * Optimized registration with improved validation
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and tokens
   */
  register: async (userData) => {
    try {
      // Clear offline mode flags
      clearOfflineMode();
      
      // Validate user data
      const validation = validateUserData(userData);
      if (!validation.isValid) {
        throw authErrorHandler.createValidationError(validation.error);
      }
      
      logDebug('[AuthService] Attempting registration for:', userData.email);
      
      // Make API request
      const response = await httpClient.post(`${AUTH_ENDPOINT}/register`, userData);
      
      // Extract and validate response data
      const { user, accessToken, refreshToken, expiresIn } = response.data.data || response.data;
      
      if (!user) {
        throw new Error('Invalid response from server: missing user data');
      }
      
      // Store tokens if provided (some registrations may require email verification first)
      if (accessToken) {
        const tokenData = {
          accessToken,
          refreshToken,
          expiresIn
        };
        storeTokensCompatibly(tokenData, user);
      }
      
      logInfo('[AuthService] Registration successful for:', userData.email);
      
      return {
        user,
        tokens: accessToken ? {
          accessToken,
          refreshToken,
          expiresIn
        } : null
      };
    } catch (error) {
      logError('[AuthService] Registration error:', error.message);
      const formattedError = authErrorHandler.handleError(error, 'register');
      throw formattedError;
    }
  },
  
  /**
   * Optimized logout with improved cleanup
   * @returns {Promise<Object>} Logout result
   */
  logout: async () => {
    try {
      // Get current token for the request
      const token = tokenManager.getAccessToken() || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // Clear tokens first to prevent any issues if the request fails
      clearAllTokenStorage();
      
      // Only make the API call if we have a token and we're not in offline mode
      const isOfflineMode = localStorage.getItem('offline_mode') === 'true';
      
      if (token && !isOfflineMode) {
        try {
          // Make API request with the token
          await httpClient.post(`${AUTH_ENDPOINT}/logout`, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          logDebug('[AuthService] Logout API call successful');
        } catch (apiError) {
          // Log but don't throw - we still want to clear local tokens
          logError('[AuthService] Error during logout API call:', apiError.message);
        }
      }
      
      // Clear development mode flags efficiently
      if (process.env.NODE_ENV === 'development') {
        const devFlags = ['admin_access_enabled', 'superuser_override', 'bypass_auth_check', 'admin_api_key'];
        devFlags.forEach(flag => localStorage.removeItem(flag));
      }
      
      // Set explicit logout flag
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      logInfo('[AuthService] Logout completed successfully');
      
      return { success: true };
    } catch (error) {
      logError('[AuthService] Logout error:', error.message);
      
      // Still clear tokens even if there was an error
      clearAllTokenStorage();
      
      const formattedError = authErrorHandler.handleError(error, 'logout');
      throw formattedError;
    }
  },
  
  /**
   * Get current authentication status
   * @returns {Promise<Object>} Auth status
   */
  getAuthStatus: async () => {
    try {
      const response = await httpClient.get(`${AUTH_ENDPOINT}/status`);
      return response.data;
    } catch (error) {
      logError('[AuthService] Auth status check failed:', error.message);
      return { isAuthenticated: false, user: null };
    }
  },
  
  /**
   * Get current authenticated user's profile
   * @returns {Promise<Object>} User profile data
   */
  getCurrentUser: async () => {
    try {
      // Check if we have a valid token
      if (!tokenManager.isTokenValid() && !localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) {
        throw new Error('Not authenticated');
      }
      
      const response = await httpClient.get(`${AUTH_ENDPOINT}/me`);
      
      logDebug('[AuthService] Current user fetched successfully');
      return response.data;
    } catch (error) {
      logError('[AuthService] Failed to fetch current user:', error.message);
      const formattedError = authErrorHandler.handleError(error, 'getCurrentUser');
      throw formattedError;
    }
  },
  
  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Whether the user is authenticated
   */
  isAuthenticated: async () => {
    try {
      // First check if we have a valid token in any storage location
      const hasTokenManager = tokenManager.isTokenValid();
      const hasAuthToken = !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const hasAuthStorage = !!localStorage.getItem(STORAGE_KEYS.AUTH_STORAGE);
      
      if (!hasTokenManager && !hasAuthToken && !hasAuthStorage) {
        return false;
      }
      
      // Verify with the server
      const authStatus = await this.getAuthStatus();
      return authStatus.isAuthenticated === true;
    } catch (error) {
      logError('[AuthService] Error checking authentication status:', error.message);
      return false;
    }
  },
  
  /**
   * Refresh authentication token
   * @returns {Promise<Object>} New token data
   */
  refreshToken: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken() || 
        (() => {
          try {
            const authStorage = localStorage.getItem(STORAGE_KEYS.AUTH_STORAGE);
            return authStorage ? JSON.parse(authStorage).state?.refreshToken : null;
          } catch {
            return null;
          }
        })();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await httpClient.post(`${AUTH_ENDPOINT}/refresh-token`, {
        refreshToken
      });
      
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
      
      // Update stored tokens using compatible storage
      const tokenData = {
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        expiresIn
      };
      
      // Get existing user data
      let userData = null;
      try {
        userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      } catch {
        userData = null;
      }
      
      storeTokensCompatibly(tokenData, userData);
      
      logDebug('[AuthService] Token refreshed successfully');
      
      return tokenData;
    } catch (error) {
      logError('[AuthService] Token refresh failed:', error.message);
      
      // Clear tokens on refresh failure
      clearAllTokenStorage();
      
      const formattedError = authErrorHandler.handleError(error, 'refreshToken');
      throw formattedError;
    }
  },
  
  // Token management methods (delegated to tokenManager for backward compatibility)
  getAccessToken: () => tokenManager.getAccessToken() || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
  getRefreshToken: () => tokenManager.getRefreshToken(),
  isTokenValid: () => tokenManager.isTokenValid() || !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
  clearTokens: () => clearAllTokenStorage(),
  
  /**
   * Store authentication tokens in all expected locations for compatibility
   * @param {Object} authData - Authentication data with token and user info
   */
  storeAuthTokens(authData) {
    if (!authData?.token) {
      logError('[AuthService] No token provided to store');
      return;
    }

    try {
      // Store in all the different formats expected by different parts of the app
      
      // 1. For httpClient/tokenManager compatibility
      tokenManager.setTokens({
        accessToken: authData.token,
        refreshToken: authData.refreshToken || null,
        expiresIn: authData.expiresIn || 3600 // 1 hour default
      });
      
      // 2. For AuthHeaders service (auth-token key)
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authData.token);
      
      // 3. For auth-storage compatibility  
      const authStorageData = {
        token: authData.token,
        user: authData.user,
        isAuthenticated: true,
        expiresAt: authData.expiresAt || (Date.now() + (authData.expiresIn || 3600) * 1000)
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_STORAGE, JSON.stringify(authStorageData));
      
      // 4. For Zustand auth store compatibility
      const zustandData = {
        state: {
          token: authData.token,
          user: authData.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        },
        version: 0
      };
      localStorage.setItem(STORAGE_KEYS.AUTH_AUTHENTICATION_STORAGE, JSON.stringify(zustandData));
      
      logDebug('[AuthService] Tokens stored in all formats successfully');
    } catch (error) {
      logError('[AuthService] Error storing auth tokens:', error);
    }
  }
};

export default authService;
