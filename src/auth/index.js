/**
 * Authentication Module
 * 
 * Main export file for the authentication module.
 * Provides easy access to all authentication-related components and utilities.
 */

// Context (from main contexts directory)
export { AuthProvider, useAuth } from '@/contexts/auth';

// Components
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { default as AdminRoute } from './components/AdminRoute';

// Hooks
export { default as useAuthRedirect } from './hooks/useAuthRedirect';

// Services (use consolidated service from services directory)
export { default as authService } from '@/services/auth/authService';

// Utils
export { default as tokenUtils } from './utils/tokenUtils';
export { default as rbacUtils } from './utils/rbacUtils';

// Default export for convenient imports
export default {
  AuthProvider,
  useAuth,
  ProtectedRoute,
  AdminRoute,
  useAuthRedirect,
  authService,
  tokenUtils,
  rbacUtils
};
