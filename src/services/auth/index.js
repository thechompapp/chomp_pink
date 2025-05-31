/**
 * Authentication Services Index
 * 
 * Exports all authentication-related service modules
 */
import authService from './authService'; // Use consolidated auth service
import TokenService from './TokenService';
import PasswordService from './PasswordService';
import RegistrationService from './RegistrationService';
import AuthInterceptorService from './AuthInterceptorService';

// Export individual services
export {
  authService,
  TokenService,
  PasswordService,
  RegistrationService,
  AuthInterceptorService
};

// Export consolidated service as default
export default authService;
