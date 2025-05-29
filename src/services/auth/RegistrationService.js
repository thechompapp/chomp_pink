/**
 * Registration Service
 * 
 * Handles user registration and email verification
 */
import { getDefaultApiClient } from '@/services/http';
import { logDebug, logError } from '@/utils/logger';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import TokenService from './TokenService';

const API_ENDPOINT = '/auth';

/**
 * RegistrationService - Handles user registration and email verification
 */
const RegistrationService = {
  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user data or error object
   */
  async register(userData) {
    logDebug('[RegistrationService] Attempting user registration');
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/register`, userData),
      'RegistrationService.register'
    );
    
    if (result.success && result.data) {
      logDebug('[RegistrationService] User registered successfully');
      
      // Store tokens if provided
      if (result.data.token) {
        TokenService.storeTokens({
          token: result.data.token,
          refreshToken: result.data.refreshToken
        });
      }
    } else {
      logDebug('[RegistrationService] User registration failed');
    }
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Starts the email verification process
   * @param {string} email - Email to verify
   * @returns {Promise<Object>} Verification token or error object
   */
  async startEmailVerification(email) {
    logDebug('[RegistrationService] Starting email verification for:', email);
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/verify-email/start`, { email }),
      'RegistrationService.startEmailVerification'
    );
    
    if (result.success) {
      logDebug('[RegistrationService] Email verification initiated');
    } else {
      logDebug('[RegistrationService] Failed to initiate email verification');
    }
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Completes the email verification process
   * @param {string} email - Email being verified
   * @param {string} code - Verification code
   * @param {string} verificationToken - Token from startEmailVerification
   * @returns {Promise<Object>} Success status or error object
   */
  async completeEmailVerification(email, code, verificationToken) {
    logDebug('[RegistrationService] Completing email verification');
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/verify-email/complete`, {
        email,
        code,
        verificationToken
      }),
      'RegistrationService.completeEmailVerification'
    );
    
    if (result.success) {
      logDebug('[RegistrationService] Email verification completed successfully');
    } else {
      logDebug('[RegistrationService] Failed to complete email verification');
    }
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Verifies an email address using a verification token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Success status
   */
  async verifyEmail(token) {
    logDebug('[RegistrationService] Verifying email with token');
    
    if (!token) {
      return { success: false, error: 'Verification token is required' };
    }
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/verify-email`, { token }),
      'RegistrationService.verifyEmail'
    );
    
    if (result.success) {
      logDebug('[RegistrationService] Email verified successfully');
    } else {
      logDebug('[RegistrationService] Failed to verify email');
    }
    
    return result.success 
      ? { success: true, message: 'Email verified successfully' }
      : { success: false, error: result.error };
  },

  /**
   * Checks if a username is available
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} Whether the username is available
   */
  async checkUsernameAvailability(username) {
    logDebug('[RegistrationService] Checking username availability:', username);
    
    if (!username) {
      return false;
    }
    
    try {
      const response = await apiClient.get(`${API_ENDPOINT}/check-username/${username}`);
      return response.data && response.data.available === true;
    } catch (error) {
      logError('[RegistrationService] Error checking username availability:', error);
      return false;
    }
  },

  /**
   * Checks if an email is available
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Whether the email is available
   */
  async checkEmailAvailability(email) {
    logDebug('[RegistrationService] Checking email availability:', email);
    
    if (!email) {
      return false;
    }
    
    try {
      const response = await apiClient.get(`${API_ENDPOINT}/check-email/${encodeURIComponent(email)}`);
      return response.data && response.data.available === true;
    } catch (error) {
      logError('[RegistrationService] Error checking email availability:', error);
      return false;
    }
  },

  /**
   * Validates registration data
   * @param {Object} userData - User registration data
   * @returns {Object} Validation result
   */
  validateRegistrationData(userData) {
    const errors = {};
    
    // Validate email
    if (!userData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Validate username
    if (!userData.username) {
      errors.username = 'Username is required';
    } else if (userData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Validate password
    if (!userData.password) {
      errors.password = 'Password is required';
    } else if (userData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default RegistrationService;
