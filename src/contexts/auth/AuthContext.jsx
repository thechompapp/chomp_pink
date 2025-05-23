/* src/contexts/auth/AuthContext.jsx */
/**
 * Authentication Context
 * 
 * Provides a unified interface for authentication state and operations:
 * - User authentication state
 * - Login/logout/register operations
 * - Token management
 * - Loading and error states
 * - Offline mode support
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '@/services/auth/authService';
import tokenManager from '@/services/auth/tokenManager';
import { logDebug, logError, logInfo } from '@/utils/logger';
import { AUTH_ERROR_TYPES } from '@/utils/auth/errorHandler';

// Create context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Admin/superuser state
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [superuserStatusReady, setSuperuserStatusReady] = useState(false);
  
  // Offline mode state
  const [isOffline, setIsOffline] = useState(
    localStorage.getItem('offline_mode') === 'true'
  );
  
  /**
   * Check authentication status
   */
  const checkAuthStatus = useCallback(async (forceCheck = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Skip check if user explicitly logged out
      const userExplicitlyLoggedOut = localStorage.getItem('user_explicitly_logged_out') === 'true';
      if (userExplicitlyLoggedOut && !forceCheck) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Check if we have valid tokens
      const hasValidTokens = tokenManager.hasValidTokens();
      if (!hasValidTokens) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Check development mode override
      const devModeBypass = process.env.NODE_ENV === 'development' && 
                           localStorage.getItem('bypass_auth_check') === 'true';
      
      if (devModeBypass) {
        logInfo('[AuthContext] Using development mode auth bypass');
        
        // Set authenticated state with admin user
        setIsAuthenticated(true);
        setUser({
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          account_type: 'superuser',
          permissions: ['admin', 'create', 'edit', 'delete']
        });
        
        // Set superuser status
        setIsSuperuser(true);
        setSuperuserStatusReady(true);
        
        setIsLoading(false);
        return;
      }
      
      // Fetch current user
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // Check superuser status
        const userIsSuperuser = 
          currentUser.account_type === 'superuser' || 
          currentUser.role === 'admin';
        
        setIsSuperuser(userIsSuperuser);
        setSuperuserStatusReady(true);
        
        // Clear explicit logout flag
        localStorage.removeItem('user_explicitly_logged_out');
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsSuperuser(false);
        setSuperuserStatusReady(true);
      }
    } catch (error) {
      logError('[AuthContext] Error checking auth status:', error);
      
      // Handle token errors by clearing tokens
      if (error.type === AUTH_ERROR_TYPES.TOKEN_ERROR) {
        tokenManager.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
      }
      
      // Handle offline mode
      if (error.type === AUTH_ERROR_TYPES.OFFLINE_ERROR || error.type === AUTH_ERROR_TYPES.NETWORK_ERROR) {
        setIsOffline(true);
        
        // Keep existing auth state in offline mode
        if (tokenManager.hasValidTokens()) {
          setIsAuthenticated(true);
        }
      } else {
        setError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Login handler
   */
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear offline mode
      setIsOffline(false);
      localStorage.removeItem('offline_mode');
      
      // Perform login
      const result = await authService.login(credentials);
      
      // Update state with user data
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Check superuser status
      const userIsSuperuser = 
        result.user.account_type === 'superuser' || 
        result.user.role === 'admin';
      
      setIsSuperuser(userIsSuperuser);
      setSuperuserStatusReady(true);
      
      // Clear explicit logout flag
      localStorage.removeItem('user_explicitly_logged_out');
      
      return result.user;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Register handler
   */
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear offline mode
      setIsOffline(false);
      localStorage.removeItem('offline_mode');
      
      // Perform registration
      const result = await authService.register(userData);
      
      // Update state with user data
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Set superuser status (new users are not superusers)
      setIsSuperuser(false);
      setSuperuserStatusReady(true);
      
      // Clear explicit logout flag
      localStorage.removeItem('user_explicitly_logged_out');
      
      return result.user;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Perform logout
      await authService.logout();
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      setIsSuperuser(false);
      
      // Set explicit logout flag
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      return { success: true };
    } catch (error) {
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      setIsSuperuser(false);
      
      // Set explicit logout flag
      localStorage.setItem('user_explicitly_logged_out', 'true');
      
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Update profile handler
   */
  const updateProfile = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Perform profile update
      const updatedUser = await authService.updateProfile(userData);
      
      // Update state with user data
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Change password handler
   */
  const changePassword = useCallback(async (passwordData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Perform password change
      const result = await authService.changePassword(passwordData);
      
      return result;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((permission) => {
    // No permissions if not authenticated
    if (!isAuthenticated || !user) return false;
    
    // Superusers have all permissions
    if (isSuperuser) return true;
    
    // Development mode override
    if (process.env.NODE_ENV === 'development' && 
        (localStorage.getItem('admin_access_enabled') === 'true' || 
         localStorage.getItem('superuser_override') === 'true')) {
      return true;
    }
    
    // Check for specific permissions
    if (typeof permission === 'string') {
      return Boolean(user.permissions?.includes(permission));
    }
    
    // Check for any of the permissions in the array
    if (Array.isArray(permission)) {
      return permission.some(p => user.permissions?.includes(p));
    }
    
    return false;
  }, [isAuthenticated, user, isSuperuser]);
  
  /**
   * Listen for auth events from other tabs/windows
   */
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'auth-storage') {
        logDebug('[AuthContext] Auth storage changed in another tab/window');
        checkAuthStatus();
      }
      
      if (event.key === 'offline_mode') {
        setIsOffline(event.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthStatus]);
  
  /**
   * Listen for auth logout events
   */
  useEffect(() => {
    const handleLogout = (event) => {
      logDebug('[AuthContext] Received logout event:', event.detail);
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      setIsSuperuser(false);
      
      // Set explicit logout flag
      localStorage.setItem('user_explicitly_logged_out', 'true');
    };
    
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);
  
  /**
   * Listen for online/offline events
   */
  useEffect(() => {
    const handleOnline = () => {
      logInfo('[AuthContext] Browser is online');
      setIsOffline(false);
      localStorage.removeItem('offline_mode');
      
      // Check auth status when coming back online
      checkAuthStatus();
    };
    
    const handleOffline = () => {
      logInfo('[AuthContext] Browser is offline');
      setIsOffline(true);
      localStorage.setItem('offline_mode', 'true');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkAuthStatus]);
  
  /**
   * Check auth status on mount
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // Authentication state
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Admin/superuser state
    isSuperuser,
    superuserStatusReady,
    
    // Offline mode state
    isOffline,
    
    // Authentication operations
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus,
    
    // Permission checking
    hasPermission,
  }), [
    user,
    isAuthenticated,
    isLoading,
    error,
    isSuperuser,
    superuserStatusReady,
    isOffline,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus,
    hasPermission,
  ]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
