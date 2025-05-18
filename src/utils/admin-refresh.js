/**
 * Admin authentication refresh utility
 * 
 * This script can be imported and executed to force refresh the admin authentication state
 * It's especially useful when automatically syncing doesn't work as expected
 */

import { logInfo, logDebug, logWarn } from './logger';
import { initializeAdminAuth } from './adminAuth';
import useAuthStore from '@/stores/useAuthStore';

/**
 * Forces a refresh of the admin authentication state
 * @returns {boolean} True if successful, false otherwise
 */
export function forceRefreshAdminAuth() {
  if (process.env.NODE_ENV !== 'development') {
    logWarn('[AdminRefresh] This utility should only be used in development mode');
    return false;
  }
  
  try {
    // Get current auth state
    const authState = useAuthStore.getState();
    
    if (!authState.isAuthenticated) {
      logWarn('[AdminRefresh] Cannot refresh admin auth, not authenticated');
      return false;
    }
    
    if (!authState.isSuperuser && !authState.user?.account_type === 'superuser') {
      logWarn('[AdminRefresh] Cannot refresh admin auth, not a superuser');
      return false;
    }
    
    // Ensure localStorage has all necessary admin keys
    localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
    localStorage.setItem('bypass_auth_check', 'true');
    localStorage.setItem('superuser_override', 'true');
    localStorage.setItem('admin_access_enabled', 'true');
    
    // Initialize admin auth
    const success = initializeAdminAuth();
    
    if (success) {
      logInfo('[AdminRefresh] Successfully refreshed admin authentication');
      
      // Force navbar update by dispatching a state change
      // This won't actually change the state, but will trigger subscriptions
      useAuthStore.setState({
        isSuperuser: true,
        isAuthenticated: true
      });
      
      // Reload the current page to apply changes
      window.location.reload();
      
      return true;
    } else {
      logWarn('[AdminRefresh] Failed to refresh admin authentication');
      return false;
    }
  } catch (error) {
    logWarn('[AdminRefresh] Error refreshing admin authentication:', error);
    return false;
  }
}

/**
 * Checks if the current user should have admin privileges
 * @returns {boolean} True if the user should have admin privileges
 */
export function shouldHaveAdminPrivileges() {
  const authState = useAuthStore.getState();
  
  // User should have admin privileges if they are a superuser or have account_type 'superuser'
  return authState.isAuthenticated && 
    (authState.isSuperuser || authState.user?.account_type === 'superuser');
}

/**
 * Checks if admin authentication is currently enabled
 * @returns {boolean} True if admin authentication is enabled
 */
export function isAdminAuthEnabled() {
  return localStorage.getItem('admin_access_enabled') === 'true' &&
    localStorage.getItem('admin_api_key') === 'doof-admin-secret-key-dev';
}

/**
 * Checks if the admin authentication is inconsistent with the auth state
 * @returns {boolean} True if admin authentication is inconsistent
 */
export function isAdminAuthInconsistent() {
  const shouldHaveAdmin = shouldHaveAdminPrivileges();
  const hasAdminAuth = isAdminAuthEnabled();
  
  // There's an inconsistency if the user should have admin privileges but doesn't have admin auth
  // or if the user shouldn't have admin privileges but has admin auth
  return (shouldHaveAdmin && !hasAdminAuth) || (!shouldHaveAdmin && hasAdminAuth);
}

// Auto-execute on import in development mode
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // We want to execute this script as quickly as possible
  // So we check localStorage first before using the store
  const isAuthenticated = localStorage.getItem('auth-storage') !== null;
  const isSuperuser = localStorage.getItem('superuser_override') === 'true';
  
  if (isAuthenticated && isSuperuser) {
    // Run after a short delay to ensure the store is initialized
    setTimeout(() => {
      logDebug('[AdminRefresh] Auto-executing admin auth refresh');
      
      // Check if admin auth is inconsistent before refreshing
      if (isAdminAuthInconsistent()) {
        logInfo('[AdminRefresh] Detected inconsistent admin auth state, refreshing');
        forceRefreshAdminAuth();
      } else {
        logDebug('[AdminRefresh] Admin auth state is consistent, no refresh needed');
      }
    }, 1000);
  } else {
    logDebug('[AdminRefresh] Skipping auto-refresh, not authenticated or not superuser');
  }
}

export default {
  forceRefreshAdminAuth,
  shouldHaveAdminPrivileges,
  isAdminAuthEnabled,
  isAdminAuthInconsistent
}; 