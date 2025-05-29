/* src/contexts/auth/AuthContext.jsx */
/**
 * Authentication Context
 * 
 * Provides a unified interface for authentication state and operations:
 * - User authentication state management
 * - Login/logout/register operations
 * - Token management and refresh
 * - Loading and error states
 * - Offline mode support
 * - Admin/superuser role management
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import authService from '@/services/authService';
import { logDebug, logError, logInfo } from '@/utils/logger';

// Context creation
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [superuserStatusReady, setSuperuserStatusReady] = useState(false);
  
  // Offline mode state
  const [isOffline, setIsOffline] = useState(
    localStorage.getItem('offline_mode') === 'true'
  );
  
  // Refresh token state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use ref to prevent infinite loops
  const authCheckInProgress = useRef(false);
  const mounted = useRef(true);

  /**
   * Check authentication status
   */
  const checkAuthStatus = useCallback(async (forceCheck = false) => {
    // Prevent concurrent auth checks
    if (authCheckInProgress.current && !forceCheck) {
      logDebug('[AuthContext] Auth check already in progress, skipping');
      return false;
    }
    
    // Check if component is still mounted
    if (!mounted.current) {
      return false;
    }
    
    authCheckInProgress.current = true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Skip check if user explicitly logged out
      const userExplicitlyLoggedOut = localStorage.getItem('user_explicitly_logged_out') === 'true';
      if (userExplicitlyLoggedOut && !forceCheck) {
        logDebug('[AuthContext] User explicitly logged out, skipping auth check');
        setIsAuthenticated(false);
        setUser(null);
        setIsSuperuser(false);
        setIsAdmin(false);
        setRoles([]);
        setPermissions([]);
        setSuperuserStatusReady(true);
        setIsLoading(false);
        return false;
      }
      
      // Check if we have a valid token
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('current_user');
      
      if (!token) {
        logDebug('[AuthContext] No auth token found');
        setIsAuthenticated(false);
        setUser(null);
        setIsSuperuser(false);
        setIsAdmin(false);
        setRoles([]);
        setPermissions([]);
        setSuperuserStatusReady(true);
        setIsLoading(false);
        return false;
      }
      
      // If we have saved user data, use it immediately for UI responsiveness
      if (savedUser && !forceCheck) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          updateUserRoles(parsedUser);
          setIsLoading(false);
          logDebug('[AuthContext] Using cached user data');
          return true;
        } catch (error) {
          logError('[AuthContext] Error parsing saved user data:', error);
          localStorage.removeItem('current_user');
        }
      }
      
      // For force checks or when no cached data, validate with server
      try {
        const currentUser = await authService.getCurrentUser();
        
        if (currentUser && mounted.current) {
          setUser(currentUser);
          setIsAuthenticated(true);
          updateUserRoles(currentUser);
          localStorage.setItem('current_user', JSON.stringify(currentUser));
          logDebug('[AuthContext] User authenticated:', currentUser.email);
          setIsLoading(false);
          return true;
        }
      } catch (error) {
        logError('[AuthContext] Error fetching current user:', error);
        // If token is invalid, clear it
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('current_user');
        }
      }
      
      // If we get here, authentication failed
      if (mounted.current) {
        setIsAuthenticated(false);
        setUser(null);
        setIsSuperuser(false);
        setIsAdmin(false);
        setRoles([]);
        setPermissions([]);
        setSuperuserStatusReady(true);
        setIsLoading(false);
      }
      return false;
      
    } catch (error) {
      logError('[AuthContext] Error checking auth status:', error);
      if (mounted.current) {
        setError({
          code: 'AUTH_CHECK_ERROR',
          message: 'Failed to check authentication status',
          details: error.message,
          timestamp: Date.now()
        });
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
      }
      return false;
    } finally {
      authCheckInProgress.current = false;
    }
  }, []);

  /**
   * Update user roles and permissions (inline function to avoid dependencies)
   */
  const updateUserRoles = (user) => {
    if (!user) return;
    
    const userRoles = [];
    const userPermissions = [];
    
    // Determine roles
    if (user.role) userRoles.push(user.role);
    if (user.account_type) userRoles.push(user.account_type);
    
    // Add admin role if applicable
    const isAdminUser = user.role === 'admin' || user.account_type === 'admin' || 
                       user.role === 'superuser' || user.account_type === 'superuser';
    
    if (isAdminUser) {
      userRoles.push('admin');
      userPermissions.push('admin');
    }
    
    // Add superuser role if applicable
    const isSuperuserUser = user.role === 'superuser' || user.account_type === 'superuser';
    if (isSuperuserUser) {
      userRoles.push('superuser');
      userPermissions.push('superuser');
    }
    
    // Add any additional permissions from user object
    if (Array.isArray(user.permissions)) {
      user.permissions.forEach(permission => {
        if (!userPermissions.includes(permission)) {
          userPermissions.push(permission);
        }
      });
    }
    
    // Update state
    setIsSuperuser(isSuperuserUser);
    setIsAdmin(isAdminUser || isSuperuserUser);
    setRoles([...new Set(userRoles)]);
    setPermissions([...new Set(userPermissions)]);
    setSuperuserStatusReady(true);
  };
  
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
        checkAuthStatus(true); // Force check when storage changes
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
      
      // Don't check auth status when coming back online to prevent loops
      // The auth status should already be correct from the initial check
      logDebug('[AuthContext] Skipping auth check on online event to prevent loops');
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
  }, []); // Remove checkAuthStatus dependency to prevent re-creation
  
  /**
   * Check auth status on mount and cleanup
   */
  useEffect(() => {
    // Set mounted flag
    mounted.current = true;
    
    // Run initial auth check
    checkAuthStatus();
    
    return () => {
      // Cleanup on unmount
      mounted.current = false;
    };
  }, [checkAuthStatus]);
  
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // State
      user,
      isAuthenticated,
      isLoading,
      error,
      isSuperuser,
      isAdmin,
      roles,
      permissions,
      superuserStatusReady,
      isOffline,
      isRefreshing,
      
      // Methods
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      hasPermission
    }),
    [user, isAuthenticated, isLoading, error, isSuperuser, isAdmin, roles, permissions, superuserStatusReady, isOffline, isRefreshing, login, register, logout, updateProfile, changePassword, hasPermission]
  );
  
  return (
    <AuthContext.Provider value={value}>
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

// Add PropTypes for better developer experience
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthProvider;
