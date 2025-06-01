/**
 * Authentication Operations Module
 * 
 * FIXED: Now delegates to AuthenticationCoordinator for single source of truth
 * This eliminates the multiple storage mechanism problem.
 */

import { logInfo, logWarn, logError, logDebug } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';

// Import the SINGLE authentication coordinator
let authCoordinator = null;

// Lazy load the coordinator to avoid circular dependencies
const getAuthCoordinator = async () => {
  if (!authCoordinator) {
    const { default: coordinatorInstance } = await import('@/utils/AuthenticationCoordinator');
    authCoordinator = coordinatorInstance;
  }
  return authCoordinator;
};

/**
 * Check authentication status - delegates to coordinator
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @param {boolean} forceCheck - Force a fresh check ignoring cache
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
export async function checkAuthStatus(set, get, forceCheck = false) {
  logInfo('[AuthOperations checkAuthStatus] Delegating to AuthenticationCoordinator');
  
  try {
    const coordinator = await getAuthCoordinator();
    const result = await coordinator.checkAuthStatus();
    
    // Sync the Zustand store with coordinator state
    const coordinatorState = coordinator.getCurrentState();
    
    set({
      token: coordinatorState.token,
      isAuthenticated: coordinatorState.isAuthenticated,
      user: coordinatorState.user,
      isLoading: false,
      error: null,
      lastAuthCheck: Date.now()
    });
    
    logInfo('[AuthOperations checkAuthStatus] State synced with coordinator:', coordinatorState);
    return result;
    
  } catch (error) {
    logError('[AuthOperations checkAuthStatus] Error checking auth status:', error);
    
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: error.message,
      lastAuthCheck: Date.now()
    });
    
    return false;
  }
}

/**
 * Login with email and password - delegates to coordinator
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @param {Object} formData - User credentials
 * @returns {Promise<boolean>} Whether login was successful
 */
export async function login(set, get, formData) {
  logInfo('[AuthOperations login] Delegating to AuthenticationCoordinator');
  
  set({ isLoading: true, error: null });
  
  try {
    const coordinator = await getAuthCoordinator();
    const result = await coordinator.coordinateLogin(formData);
    
    if (result.success) {
      // Sync the Zustand store with coordinator state
      set({
        token: result.token,
        isAuthenticated: true,
        user: result.user,
        isLoading: false,
        error: null,
        lastAuthCheck: Date.now()
      });
      
      logInfo('[AuthOperations login] Login successful, state synced');
      return true;
    } else {
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: result.error || 'Login failed',
        lastAuthCheck: Date.now()
      });
      
      return false;
    }
    
  } catch (error) {
    logError('[AuthOperations login] Login error:', error);
    
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: error.message || 'Login failed',
      lastAuthCheck: Date.now()
    });
    
    return false;
  }
}

/**
 * Logout - delegates to coordinator
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 * @returns {Promise<boolean>} Whether logout was successful
 */
export async function logout(set, get) {
  logInfo('[AuthOperations logout] Delegating to AuthenticationCoordinator');
  
  set({ isLoading: true, error: null });
  
  try {
    const coordinator = await getAuthCoordinator();
    await coordinator.performCoordinatedLogout();
    
    // Clear Zustand state
    set({
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastAuthCheck: Date.now()
    });
    
    logInfo('[AuthOperations logout] Logout successful, state cleared');
    return true;
    
  } catch (error) {
    logError('[AuthOperations logout] Logout error:', error);
    
    // Still clear state even if API call failed
    set({
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      lastAuthCheck: Date.now()
    });
    
    return true; // Always return true for logout
  }
} 