/**
 * Registration Store Module
 * 
 * Handles user registration logic
 */
import { create } from 'zustand';
import { getDefaultApiClient } from '@/services/http';
import { logInfo, logWarn, logError } from '@/utils/logger.js';
import ErrorHandler from '@/utils/ErrorHandler';
import useAuthenticationStore from './useAuthenticationStore';

// Create a render limiter to prevent excessive re-renders in development mode
let lastStateUpdate = 0;
const THROTTLE_INTERVAL = 500; // ms

/**
 * Centralized error handler for registration operations
 * 
 * @param {Error} error - The error object
 * @param {string} operation - Name of the operation
 * @param {Function} setFn - State setter function
 * @returns {string} - Error message for return value
 */
const handleRegistrationError = (error, operation, setFn) => {
  const errorInfo = ErrorHandler.handle(error, `RegistrationStore.${operation}`, {
    showToast: true,
    includeStack: process.env.NODE_ENV === 'development'
  });
  
  setFn({ 
    isLoading: false, 
    error: errorInfo?.message || errorInfo || 'Unknown error'
  });
  // Always return a string for error message
  return (errorInfo && errorInfo.message) || errorInfo || 'Unknown error';
};

// Function to throttle state updates
const throttledSet = (originalSet) => (newState) => {
  const now = Date.now();
  if (process.env.NODE_ENV === 'development' && 
      now - lastStateUpdate < THROTTLE_INTERVAL) {
    return;
  }
  lastStateUpdate = now;
  originalSet(newState);
};

/**
 * Registration Store
 * 
 * Handles user registration logic
 */
const useRegistrationStore = create((set, get) => ({
  // Initial state
  registrationStep: 1,
  registrationData: {},
  verificationToken: null,
  isLoading: false,
  error: null,
  
  // Use throttled set to prevent excessive re-renders
  set: throttledSet(set),

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<boolean>} - Whether registration was successful
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      logInfo('[RegistrationStore register] Attempting registration with userData:', userData);
      
      const response = await apiClient.post('/auth/register', userData);
      
      if (response.data && response.data.success && response.data.data) {
        const user = response.data.data;
        
        // Determine if auto-login is needed
        const autoLogin = userData.autoLogin !== false;
        
        if (autoLogin) {
          // Auto-login after successful registration
          useAuthenticationStore.setState({
            isAuthenticated: true,
            user: user,
            token: response.data.token || user.token || null,
            error: null,
            lastAuthCheck: Date.now()
          });
          
          // Dispatch event for login completion
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:login_complete', {
              detail: { isAuthenticated: true, user: user }
            }));
          }
        }
        
        set({
          isLoading: false,
          error: null,
          registrationData: {},
          registrationStep: 1
        });
        
        logInfo('[RegistrationStore register] Registration successful');
        return true;
      } else {
        throw new Error(response.data?.message || 'Registration failed: Unexpected response from server.');
      }
    } catch (error) {
      return handleRegistrationError(error, 'register', set);
    }
  },

  /**
   * Start email verification process
   * @param {string} email - Email to verify
   * @returns {Promise<boolean>} - Whether verification was initiated successfully
   */
  startEmailVerification: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/verify-email/start', { email });
      
      if (response.data && response.data.success) {
        set({
          isLoading: false,
          error: null,
          verificationToken: response.data.verificationToken || null
        });
        
        logInfo('[RegistrationStore startEmailVerification] Email verification initiated');
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to start email verification');
      }
    } catch (error) {
      return handleRegistrationError(error, 'startEmailVerification', set);
    }
  },

  /**
   * Complete email verification process
   * @param {string} email - Email to verify
   * @param {string} code - Verification code
   * @returns {Promise<boolean>} - Whether verification was completed successfully
   */
  completeEmailVerification: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const verificationToken = get().verificationToken;
      
      const response = await apiClient.post('/auth/verify-email/complete', { 
        email,
        code,
        verificationToken
      });
      
      if (response.data && response.data.success) {
        set({
          isLoading: false,
          error: null,
          verificationToken: null
        });
        
        logInfo('[RegistrationStore completeEmailVerification] Email verification completed');
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to complete email verification');
      }
    } catch (error) {
      return handleRegistrationError(error, 'completeEmailVerification', set);
    }
  },

  /**
   * Check if username is available
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - Whether username is available
   */
  checkUsernameAvailability: async (username) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/auth/check-username/${username}`);
      
      set({ isLoading: false, error: null });
      
      return response.data && response.data.available === true;
    } catch (error) {
      handleRegistrationError(error, 'checkUsernameAvailability', set);
      return false;
    }
  },

  /**
   * Check if email is available
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - Whether email is available
   */
  checkEmailAvailability: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/auth/check-email/${encodeURIComponent(email)}`);
      
      set({ isLoading: false, error: null });
      
      return response.data && response.data.available === true;
    } catch (error) {
      handleRegistrationError(error, 'checkEmailAvailability', set);
      return false;
    }
  },

  /**
   * Update registration data
   * @param {Object} data - Registration data to update
   * @returns {void}
   */
  updateRegistrationData: (data) => {
    const currentData = get().registrationData;
    set({ registrationData: { ...currentData, ...data } });
  },

  /**
   * Set registration step
   * @param {number} step - Registration step
   * @returns {void}
   */
  setRegistrationStep: (step) => {
    set({ registrationStep: step });
  },

  /**
   * Reset registration state
   * @returns {void}
   */
  resetRegistration: () => {
    set({
      registrationStep: 1,
      registrationData: {},
      verificationToken: null,
      isLoading: false,
      error: null
    });
  },

  /**
   * Get current registration step
   * @returns {number} - Current registration step
   */
  getRegistrationStep: () => get().registrationStep,

  /**
   * Get registration data
   * @returns {Object} - Current registration data
   */
  getRegistrationData: () => get().registrationData,

  /**
   * Check if registration is loading
   * @returns {boolean} - Whether registration is loading
   */
  getIsLoading: () => get().isLoading,

  /**
   * Get registration error
   * @returns {string|null} - Registration error or null if no error
   */
  getError: () => get().error
}));

// Add named exports for better IDE support
export const getRegistrationStep = () => useRegistrationStore.getState().getRegistrationStep();
export const getRegistrationData = () => useRegistrationStore.getState().getRegistrationData();

export default useRegistrationStore;
