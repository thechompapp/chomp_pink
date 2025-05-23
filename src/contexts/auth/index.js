/* src/contexts/auth/index.js */
/**
 * Authentication Context Index
 * 
 * Exports the AuthContext and useAuth hook for easier imports
 */
import AuthContext, { AuthProvider, useAuth } from './AuthContext';

export {
  AuthContext,
  AuthProvider,
  useAuth
};

export default AuthProvider;
