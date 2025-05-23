/* src/contexts/auth/AuthMigrationWrapper.jsx */
/**
 * Authentication Migration Wrapper
 * 
 * Provides a compatibility layer between the old and new authentication systems
 * to enable gradual migration without breaking existing functionality.
 */
import React, { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import useAuthStore from '@/stores/useAuthStore';
import migrationHelper from '@/utils/auth/migrationHelper';
import { logDebug, logInfo, logWarn } from '@/utils/logger';

/**
 * Inner component that syncs state between old and new auth systems
 */
const AuthSyncComponent = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    isSuperuser,
    superuserStatusReady,
    checkAuthStatus,
    login,
    logout
  } = useAuth();
  
  // Track if we've done the initial sync
  const initialSyncDone = useRef(false);
  
  // Create a ref to the updateContext function
  const updateContextRef = useRef(null);
  
  // Sync from new context to old store when auth state changes
  useEffect(() => {
    if (!initialSyncDone.current) {
      // Skip the first render to avoid circular updates
      initialSyncDone.current = true;
      return;
    }
    
    migrationHelper.syncOldStoreFromContext({ 
      user, 
      isAuthenticated, 
      isLoading, 
      error, 
      isSuperuser,
      superuserStatusReady
    });
  }, [user, isAuthenticated, isLoading, error, isSuperuser, superuserStatusReady]);
  
  // Set up proxy for old auth store
  useEffect(() => {
    try {
      // Create a function to update context state that we can pass to the migration helper
      updateContextRef.current = (newState) => {
        // We can't directly update context state, but we can trigger a re-check
        if (newState.user !== user || newState.isAuthenticated !== isAuthenticated) {
          logDebug('[AuthMigrationWrapper] Triggering auth check from old store update');
          checkAuthStatus(true);
        }
      };
      
      // Initialize migration helper with the auth store
      migrationHelper.initialize(useAuthStore);
      
      // Patch the old auth store's methods to use the new system
      const oldLogin = useAuthStore.getState().login;
      const oldLogout = useAuthStore.getState().logout;
      
      useAuthStore.setState({
        login: async (credentials) => {
          logInfo('[AuthMigrationWrapper] Login called from old auth store');
          try {
            // Use the new login function
            const result = await login(credentials);
            
            // Call the original login for any side effects
            if (oldLogin && typeof oldLogin === 'function') {
              oldLogin(credentials);
            }
            
            return result;
          } catch (error) {
            logWarn('[AuthMigrationWrapper] Error in proxied login:', error);
            throw error;
          }
        },
        logout: async () => {
          logInfo('[AuthMigrationWrapper] Logout called from old auth store');
          try {
            // Use the new logout function
            await logout();
            
            // Call the original logout for any side effects
            if (oldLogout && typeof oldLogout === 'function') {
              oldLogout();
            }
            
            return { success: true };
          } catch (error) {
            logWarn('[AuthMigrationWrapper] Error in proxied logout:', error);
            throw error;
          }
        }
      });
      
      logInfo('[AuthMigrationWrapper] Successfully patched old auth store methods');
      
      // Sync initial state from new context to old store
      migrationHelper.syncOldStoreFromContext({ 
        user, 
        isAuthenticated, 
        isLoading, 
        error, 
        isSuperuser,
        superuserStatusReady
      });
      
      // Clean up function
      return () => {
        // Restore original methods if possible
        if (oldLogin && oldLogout) {
          useAuthStore.setState({
            login: oldLogin,
            logout: oldLogout
          });
        }
      };
    } catch (error) {
      logWarn('[AuthMigrationWrapper] Error setting up auth store proxy:', error);
    }
  }, [user, isAuthenticated, isLoading, error, isSuperuser, superuserStatusReady, login, logout, checkAuthStatus]);
  
  // Listen for auth events from old store
  useEffect(() => {
    const handleAuthEvent = () => {
      try {
        if (updateContextRef.current) {
          migrationHelper.syncContextFromOldStore(updateContextRef.current);
        }
      } catch (error) {
        logWarn('[AuthMigrationWrapper] Error handling auth event:', error);
      }
    };
    
    // Subscribe to auth events
    window.addEventListener('auth-changed', handleAuthEvent);
    window.addEventListener('auth:login_complete', handleAuthEvent);
    window.addEventListener('auth:logout_complete', handleAuthEvent);
    
    return () => {
      window.removeEventListener('auth-changed', handleAuthEvent);
      window.removeEventListener('auth:login_complete', handleAuthEvent);
      window.removeEventListener('auth:logout_complete', handleAuthEvent);
    };
  }, []);
  
  return <>{children}</>;
};

/**
 * Authentication Migration Wrapper Component
 * Wraps the application with both old and new auth systems
 */
const AuthMigrationWrapper = ({ children }) => {
  return (
    <AuthProvider>
      <AuthSyncComponent>
        {children}
      </AuthSyncComponent>
    </AuthProvider>
  );
};

export default AuthMigrationWrapper;
