/* src/contexts/auth/AuthContext.jsx */
/**
 * Authentication Context - Fixed for proper coordinator integration
 * 
 * React wrapper that properly syncs with AuthenticationCoordinator
 * Ensures React components re-render when authentication state changes
 */
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import useAuthenticationStore from '@/stores/auth/useAuthenticationStore';
import { logDebug, logInfo, logWarn } from '@/utils/logger';

// Context creation
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  // Use Zustand store for state management
  const authState = useAuthenticationStore();
  
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    checkAuthStatus,
    isAdmin,
    clearError
  } = authState;

  // Local state to force re-renders when coordinator updates
  const [coordinatorSync, setCoordinatorSync] = useState(0);
  // Add initialization loading state to prevent flashing
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize and sync with coordinator on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Import coordinator
        const { default: authCoordinator } = await import('@/utils/AuthenticationCoordinator');
        
        // Check if coordinator reports different state than store
        const coordinatorState = authCoordinator.getCurrentState();
        const storeState = useAuthenticationStore.getState();
        
        logInfo('[AuthContext] Checking coordinator vs store state:', {
          coordinatorAuth: coordinatorState.isAuthenticated,
          storeAuth: storeState.isAuthenticated,
          coordinatorToken: !!coordinatorState.token,
          storeToken: !!storeState.token
        });
        
        // If coordinator has authentication but store doesn't, sync store from coordinator
        if (coordinatorState.isAuthenticated && !storeState.isAuthenticated && coordinatorState.token && coordinatorState.user) {
          logInfo('[AuthContext] Syncing store from coordinator during initialization');
          storeState.syncFromCoordinator(coordinatorState);
          setCoordinatorSync(prev => prev + 1); // Force re-render
        }
        // If neither has authentication, check localStorage for valid tokens
        else if (!coordinatorState.isAuthenticated && !storeState.isAuthenticated) {
          const isExplicitLogout = localStorage.getItem('user_explicitly_logged_out') === 'true';
          
          if (!isExplicitLogout) {
            // Check if we have valid tokens that coordinator can verify
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('current_user');
            
            if (token && token !== 'null' && user && user !== 'null') {
              logInfo('[AuthContext] Found stored auth data, checking with coordinator');
              try {
                const parsedUser = JSON.parse(user);
                if (parsedUser && parsedUser.id) {
                  // Let coordinator verify the token
                  await authCoordinator.performInitialSync();
                  
                  // Check coordinator state again after verification
                  const updatedCoordinatorState = authCoordinator.getCurrentState();
                  if (updatedCoordinatorState.isAuthenticated) {
                    logInfo('[AuthContext] Coordinator verified authentication, syncing to store');
                    storeState.syncFromCoordinator(updatedCoordinatorState);
                    setCoordinatorSync(prev => prev + 1); // Force re-render
                  }
                }
              } catch (error) {
                logWarn('[AuthContext] Error parsing stored user data:', error);
              }
            }
          }
        }
        
        // Set up coordinator event listeners
        const handleCoordinatorSync = (event) => {
          logInfo('[AuthContext] Received coordinator state sync event');
          const coordinatorState = event.detail;
          const currentStoreState = useAuthenticationStore.getState();
          
          // Only sync if states differ
          if (coordinatorState.isAuthenticated !== currentStoreState.isAuthenticated ||
              coordinatorState.token !== currentStoreState.token) {
            logInfo('[AuthContext] Syncing store from coordinator event');
            currentStoreState.syncFromCoordinator(coordinatorState);
            setCoordinatorSync(prev => prev + 1); // Force re-render
          }
        };
        
        window.addEventListener('auth:state_sync', handleCoordinatorSync);
        window.addEventListener('auth:login_success', handleCoordinatorSync);
        
        // Cleanup function
        return () => {
          window.removeEventListener('auth:state_sync', handleCoordinatorSync);
          window.removeEventListener('auth:login_success', handleCoordinatorSync);
        };
        
      } catch (error) {
        logWarn('[AuthContext] Error during auth initialization:', error);
      } finally {
        // Set initialization complete immediately after first check
        setIsInitializing(false);
      }
    };

    const cleanup = initializeAuth();
    
    // Much shorter fallback timeout to ensure responsiveness  
    const timeout = setTimeout(() => {
      setIsInitializing(false);
    }, 500); // Reduced from 2000ms to 500ms
    
    return () => {
      cleanup?.then?.(cleanupFn => cleanupFn?.());
      clearTimeout(timeout);
    };
  }, []);

  /**
   * Enhanced login function
   */
  const login = useCallback(async (credentials) => {
    try {
      logInfo('[AuthContext] Login attempt');
      const success = await storeLogin(credentials);
      if (success) {
        // Force a small delay to ensure all systems have updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the updated state from the store
        const updatedState = useAuthenticationStore.getState();
        
        logInfo('[AuthContext] Login success, updated state:', {
          isAuthenticated: updatedState.isAuthenticated,
          hasUser: !!updatedState.user,
          hasToken: !!updatedState.token
        });
        
        setCoordinatorSync(prev => prev + 1); // Force re-render
        
        return { success: true, user: updatedState.user };
      } else {
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      logDebug('[AuthContext] Login error:', error);
      return { success: false, error: error.message };
    }
  }, [storeLogin]);

  /**
   * Enhanced logout function
   */
  const logout = useCallback(async () => {
    try {
      logInfo('[AuthContext] Logout attempt');
      await storeLogout();
      
      // Force a small delay to ensure all systems have updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setCoordinatorSync(prev => prev + 1); // Force re-render
      
      return { success: true };
    } catch (error) {
      logDebug('[AuthContext] Logout error:', error);
      return { success: false, error: error.message };
    }
  }, [storeLogout]);

  /**
   * Registration function
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const result = await response.json();
      return { success: true, message: result.message };
      
    } catch (error) {
      logDebug('[AuthContext] Registration error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Force auth status check
   */
  const forceAuthCheck = useCallback(async () => {
    try {
      await checkAuthStatus(true); // Force check
      setCoordinatorSync(prev => prev + 1); // Force re-render
    } catch (error) {
      logWarn('[AuthContext] Force auth check failed:', error);
    }
  }, [checkAuthStatus]);

  /**
   * Check if user has admin privileges
   */
  const isSuperuser = isAdmin();

  // Context value - include coordinatorSync to force re-renders
  const contextValue = {
    // State
    user,
    isAuthenticated,
    isLoading: isLoading || isInitializing, // Combine store loading with initialization loading
    error,
    isSuperuser,
    isAdmin: isSuperuser, // Alias for backward compatibility
    superuserStatusReady: true, // Always ready in optimized version
    _syncVersion: coordinatorSync, // Internal sync tracker

    // Actions
    login,
    logout,
    register,
    checkAuthStatus: forceAuthCheck,
    clearError,
    hasRole: (roles) => {
      if (!user) return false;
      const userRoles = [user.role, user.account_type].filter(Boolean);
      return Array.isArray(roles) 
        ? roles.some(role => userRoles.includes(role))
        : userRoles.includes(roles);
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
