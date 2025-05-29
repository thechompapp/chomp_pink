/**
 * Admin Panel Modules Index
 * 
 * Main entry point for all admin panel modules.
 * Provides a clean API for the refactored AdminPanel functionality.
 */

// Data Management
export {
  TAB_CONFIG,
  DataProcessor,
  DataValidator,
  DataFilter,
  PerformanceMonitor,
  default as AdminDataManager
} from './AdminDataManager';

// State Management
export {
  INITIAL_STATE,
  StateValidator,
  StateTransitions,
  useAdminPanelState,
  StatePersistence,
  default as AdminStateManager
} from './AdminStateManager';

// Cleanup Management
export {
  DataCleanupManager,
  ChangeValidator,
  CleanupWorkflow,
  CleanupFeedback,
  CleanupState,
  default as AdminCleanupManager
} from './AdminCleanupManager';

// Authentication Management
export {
  AuthVerifier,
  AuthNavigator,
  DevAuthManager,
  useAdminAuthentication,
  AuthErrorHandler,
  default as AdminAuthManager
} from './AdminAuthManager';

// Combined utilities for easy access
export const AdminModules = {
  Data: {
    TAB_CONFIG,
    DataProcessor,
    DataValidator,
    DataFilter,
    PerformanceMonitor
  },
  State: {
    INITIAL_STATE,
    StateValidator,
    StateTransitions,
    StatePersistence
  },
  Cleanup: {
    DataCleanupManager,
    ChangeValidator,
    CleanupWorkflow,
    CleanupFeedback,
    CleanupState
  },
  Auth: {
    AuthVerifier,
    AuthNavigator,
    DevAuthManager,
    AuthErrorHandler
  }
};

// Hooks collection
export const useAdminPanelModules = () => ({
  state: useAdminPanelState(),
  auth: useAdminAuthentication()
});

// Default export with all modules
export default {
  AdminDataManager,
  AdminStateManager,
  AdminCleanupManager,
  AdminAuthManager,
  AdminModules,
  useAdminPanelModules
}; 