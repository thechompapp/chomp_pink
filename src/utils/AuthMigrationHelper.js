/**
 * Authentication Migration Helper
 * 
 * Provides a compatibility layer for components transitioning from useAuthStore
 * to the new coordinated authentication system.
 * 
 * This allows existing components to continue working while we migrate them
 * to use the centralized AuthenticationCoordinator.
 */

import { useAuth } from '@/contexts/auth/AuthContext';
import { logWarn } from '@/utils/logger';

/**
 * Compatibility hook that mimics the old useAuthStore API
 * but uses the new coordinated authentication system under the hood.
 * 
 * @param {Function} selector - Optional selector function for specific state
 * @returns {Object} Authentication state and methods
 */
export function useAuthStoreCompat(selector) {
  const { isAuthenticated, user, coordinator } = useAuth();
  
  // Get coordinator state
  const coordinatorState = coordinator.getCurrentState();
  
  // Create compatibility object that matches old useAuthStore API
  const compatState = {
    // Core authentication state
    token: coordinatorState.token,
    isAuthenticated: coordinatorState.isAuthenticated,
    user: coordinatorState.user,
    isLoading: coordinatorState.isLoading || false,
    error: coordinatorState.error,
    lastAuthCheck: coordinatorState.lastVerified,
    
    // Superuser state (for admin components)
    isSuperuser: coordinatorState.isSuperuser || false,
    superuserStatusReady: true,
    
    // Core authentication methods (use coordinator's actual method names)
    checkAuthStatus: coordinator.checkAuthStatus ? 
      coordinator.checkAuthStatus.bind(coordinator) : 
      async () => coordinatorState.isAuthenticated,
    login: coordinator.coordinateLogin ? 
      coordinator.coordinateLogin.bind(coordinator) : 
      async () => ({ success: false, error: 'Login not available' }),
    logout: coordinator.coordinateLogout ? 
      coordinator.coordinateLogout.bind(coordinator) : 
      async () => ({ success: false, error: 'Logout not available' }),
    
    // Getters (for compatibility)
    getCurrentUser: () => coordinatorState.user,
    getIsAuthenticated: () => coordinatorState.isAuthenticated,
    getIsLoading: () => coordinatorState.isLoading || false,
    getIsSuperuser: () => coordinatorState.isSuperuser || false,
    getSuperuserStatusReady: () => true,
    
    // Token methods (now available directly on coordinator)
    setToken: coordinator.setToken ? 
      coordinator.setToken.bind(coordinator) : 
      () => logWarn('[AuthMigration] setToken not available on coordinator'),
    getToken: () => coordinatorState.token,
    
    // Error methods (now available directly on coordinator)
    setError: coordinator.setError ? 
      coordinator.setError.bind(coordinator) : 
      () => logWarn('[AuthMigration] setError not available on coordinator'),
    clearError: coordinator.clearError ? 
      coordinator.clearError.bind(coordinator) : 
      () => logWarn('[AuthMigration] clearError not available on coordinator')
  };
  
  // Log deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    logWarn('[AuthMigration] Component is using deprecated useAuthStore. Please migrate to useAuth() from AuthContext.');
  }
  
  // If a selector is provided, use it (for compatibility with Zustand pattern)
  if (typeof selector === 'function') {
    return selector(compatState);
  }
  
  // Return the full state object
  return compatState;
}

/**
 * Migration wrapper for the old useAuthStore default export
 * This allows existing imports to continue working during migration
 */
export default useAuthStoreCompat;

/**
 * Named export for components that use named imports
 */
export { useAuthStoreCompat as useAuthStore };

/**
 * Utility function to check if a component needs migration
 * @param {string} componentName - Name of the component
 * @returns {boolean} Whether the component needs migration
 */
export function needsMigration(componentName) {
  const migratedComponents = new Set([
    'EnhancedAdminPanelDemo',
    'AuthContext',
    'ProtectedRoute'
  ]);
  
  return !migratedComponents.has(componentName);
}

/**
 * Migration status tracker
 */
export const migrationStatus = {
  totalComponents: 0,
  migratedComponents: 0,
  pendingComponents: [],
  
  addComponent(componentName) {
    this.totalComponents++;
    if (!needsMigration(componentName)) {
      this.migratedComponents++;
    } else {
      this.pendingComponents.push(componentName);
    }
  },
  
  markMigrated(componentName) {
    const index = this.pendingComponents.indexOf(componentName);
    if (index > -1) {
      this.pendingComponents.splice(index, 1);
      this.migratedComponents++;
    }
  },
  
  getProgress() {
    return {
      total: this.totalComponents,
      migrated: this.migratedComponents,
      pending: this.pendingComponents.length,
      percentage: this.totalComponents > 0 ? 
        Math.round((this.migratedComponents / this.totalComponents) * 100) : 0
    };
  }
}; 