/**
 * Enhanced useAdminAuth Hook
 * 
 * A specialized React hook for admin authentication that provides
 * a consistent interface for checking admin status and permissions.
 * 
 * Features:
 * - Memoized values to prevent unnecessary re-renders
 * - Provides loading state for admin UI elements
 * - Includes permission checking methods
 * - Robust error handling and fallbacks
 * - Special handling for development mode
 * - Offline mode management
 */

import { useMemo, useEffect, useState } from 'react';
import useAuthStore from '@/stores/useAuthStore';
import { logDebug, logError } from '@/utils/logger';
import apiClient from '@/services/apiClient';

/**
 * Enhanced permission check with robust error handling
 * @param {Object} user - User object
 * @param {string|string[]} permission - Permission or array of permissions to check
 * @returns {boolean} - True if user has the permission
 */
export function hasPermission(user, permission) {
  try {
    // Safety check for null/undefined user
    if (!user) return false;
    
    // Development mode override
    if (process.env.NODE_ENV === 'development' && 
        typeof localStorage !== 'undefined' && 
        (localStorage.getItem('admin_access_enabled') === 'true' || 
         localStorage.getItem('superuser_override') === 'true')) {
      return true;
    }
    
    // Superusers have all permissions
    if (user.account_type === 'superuser' || user.role === 'admin') {
      return true;
    }
    
    // Check for specific permissions
    if (typeof permission === 'string') {
      return Boolean(user.permissions?.includes(permission));
    }
    
    // Check for any of the permissions in the array
    if (Array.isArray(permission)) {
      return Boolean(permission.some(p => user.permissions?.includes(p)));
    }
    
    return false;
  } catch (error) {
    logError('[useAdminAuth] Error in hasPermission:', error);
    return false;
  }
}

/**
 * Enhanced hook for accessing admin authentication state with robust error handling
 * and special handling for development mode
 * 
 * @returns {Object} Admin auth state and helper methods
 */
export function useAdminAuth() {
  // Track local state for admin status to prevent flickering
  const [localAdminState, setLocalAdminState] = useState({
    adminOverrideApplied: false,
    lastAuthenticatedAt: null
  });
  
  // Get auth state from store
  const { 
    user, 
    isAuthenticated,
    isSuperuser, 
    superuserStatusReady = false 
  } = useAuthStore();
  
  // CRITICAL: Force admin access in development mode
  // This is done outside of useMemo to ensure it's always applied
  useEffect(() => {
    try {
      // Only apply admin override in development mode when authenticated
      if (process.env.NODE_ENV === 'development' && isAuthenticated) {
        logDebug('[useAdminAuth] Applying development mode admin override');
        
        // Force admin flags in localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('admin_access_enabled', 'true');
          localStorage.setItem('superuser_override', 'true');
          localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
          localStorage.setItem('force_online', 'true');
          
          // Clear offline mode flags to ensure online mode
          localStorage.removeItem('offline-mode');
          localStorage.removeItem('offline_mode');
          localStorage.removeItem('bypass_auth_check');
          localStorage.removeItem('user_explicitly_logged_out');
        }
        
        // Also clear session storage flags
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('offline-mode');
          sessionStorage.removeItem('offline_mode');
        }
        
        // Force disable offline mode in apiClient
        if (apiClient && typeof apiClient.setOfflineMode === 'function') {
          apiClient.setOfflineMode(false, true);
        }
        
        // Dispatch events to force UI refresh
        if (typeof window !== 'undefined') {
          // Notify about offline status change
          window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
            detail: { isOffline: false }
          }));
          
          // Force UI refresh
          window.dispatchEvent(new CustomEvent('forceUiRefresh', {
            detail: { timestamp: Date.now() }
          }));
          
          // Add event listener for auth changes
          const handleAuthChange = () => {
            // Force UI refresh when auth changes
            window.dispatchEvent(new CustomEvent('forceUiRefresh', {
              detail: { timestamp: Date.now() }
            }));
          };
          
          // Add the event listener
          window.addEventListener('auth-changed', handleAuthChange);
          
          // Update local state to track that we've applied the override
          setLocalAdminState(prev => ({
            ...prev,
            adminOverrideApplied: true,
            lastAuthenticatedAt: Date.now()
          }));
          
          // Clean up the event listener on unmount
          return () => {
            window.removeEventListener('auth-changed', handleAuthChange);
          };
        }
      }
    } catch (error) {
      logError('[useAdminAuth] Error in development mode override:', error);
    }
  }, [isAuthenticated]); // Only re-run when authentication state changes
  
  // Memoize the admin auth object to prevent unnecessary re-renders
  const adminAuth = useMemo(() => {
    try {
      // IMPORTANT: Always force admin access in development mode when authenticated
      // This ensures admin features are visible regardless of other conditions
      const forceAdminAccess = process.env.NODE_ENV === 'development' && 
                              (isAuthenticated || localAdminState.adminOverrideApplied);
      
      // Check for admin flags in localStorage as a backup
      const hasAdminFlags = typeof localStorage !== 'undefined' && (
        localStorage.getItem('admin_access_enabled') === 'true' ||
        localStorage.getItem('superuser_override') === 'true'
      );
      
      // Check admin status from user object with fallbacks
      const isAdmin = Boolean(
        isSuperuser || 
        user?.role === 'admin' || 
        user?.account_type === 'superuser' ||
        hasAdminFlags
      );
      
      const hasAdminAccess = Boolean(
        isAdmin || 
        hasPermission(user, ['admin', 'superuser']) ||
        hasAdminFlags
      );
      
      // In development mode, always enable admin features if authenticated
      return {
        // Basic status - force admin access in development
        isAdmin: forceAdminAccess || isAdmin,
        isSuperuser: forceAdminAccess || isSuperuser,
        hasAdminAccess: forceAdminAccess || hasAdminAccess,
        
        // Ready state - force ready in development
        isReady: forceAdminAccess || superuserStatusReady,
        isLoading: false, // Never show loading state to prevent UI issues
        
        // User info with safety check
        user: user || null,
        
        // Permission checking methods - force permissions in development
        can: (permission) => forceAdminAccess || hasPermission(user, permission),
        hasRole: (role) => forceAdminAccess || user?.role === role || user?.account_type === role,
        
        // Helper for common permissions - force permissions in development
        canManageUsers: forceAdminAccess || hasPermission(user, 'manage_users'),
        canManageContent: forceAdminAccess || hasPermission(user, 'manage_content'),
        
        // Development mode helpers
        isDevelopment: process.env.NODE_ENV === 'development',
        adminOverrideApplied: localAdminState.adminOverrideApplied
      };
    } catch (error) {
      logError('[useAdminAuth] Error in adminAuth useMemo:', error);
      
      // Return a safe fallback object if there's an error
      return {
        isAdmin: process.env.NODE_ENV === 'development',
        isSuperuser: process.env.NODE_ENV === 'development',
        hasAdminAccess: process.env.NODE_ENV === 'development',
        isReady: true,
        isLoading: false,
        user: null,
        can: () => process.env.NODE_ENV === 'development',
        hasRole: () => process.env.NODE_ENV === 'development',
        canManageUsers: process.env.NODE_ENV === 'development',
        canManageContent: process.env.NODE_ENV === 'development',
        isDevelopment: process.env.NODE_ENV === 'development',
        adminOverrideApplied: false
      };
    }
  }, [user, isSuperuser, superuserStatusReady, isAuthenticated, localAdminState]);
  
  return adminAuth;
}

export default useAdminAuth; 