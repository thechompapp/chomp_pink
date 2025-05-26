/**
 * Authentication Module
 * 
 * Main export file for the authentication module.
 * Provides easy access to all authentication-related components and utilities.
 */

// Context
export { AuthProvider, useAuth } from './context/AuthContext';

// Components
export { default as ProtectedRoute } from './components/ProtectedRoute';

// Hooks
export { default as useAuthRedirect } from './hooks/useAuthRedirect';

// Services
export { authService } from './services/authService';

// Utils
export { default as tokenUtils } from './utils/tokenUtils';
export { default as rbacUtils } from './utils/rbacUtils';

// Default export for convenient imports
export default {
  AuthProvider: AuthProvider,
  useAuth: useAuth,
  ProtectedRoute: ProtectedRoute,
  useAuthRedirect: useAuthRedirect,
  authService: authService,
  tokenUtils: tokenUtils,
  rbacUtils: rbacUtils
};
