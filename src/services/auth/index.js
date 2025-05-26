/**
 * Authentication Services Index
 * 
 * Exports all authentication-related service modules
 */
import TokenService from './TokenService';
import UserAuthService from './UserAuthService';
import PasswordService from './PasswordService';
import RegistrationService from './RegistrationService';
import AuthInterceptorService from './AuthInterceptorService';

// Create a unified authService object for backward compatibility
const authService = {
  // User authentication methods
  login: UserAuthService.login,
  logout: UserAuthService.logout,
  getCurrentUser: UserAuthService.getCurrentUser,
  isAuthenticated: UserAuthService.isAuthenticated,
  
  // Registration methods
  register: RegistrationService.register,
  startEmailVerification: RegistrationService.startEmailVerification,
  completeEmailVerification: RegistrationService.completeEmailVerification,
  verifyEmail: RegistrationService.verifyEmail,
  checkUsernameAvailability: RegistrationService.checkUsernameAvailability,
  checkEmailAvailability: RegistrationService.checkEmailAvailability,
  validateRegistrationData: RegistrationService.validateRegistrationData,
  
  // Password methods
  requestPasswordReset: PasswordService.requestPasswordReset,
  resetPassword: PasswordService.resetPassword,
  changePassword: PasswordService.changePassword,
  validatePasswordStrength: PasswordService.validatePasswordStrength,
  
  // Token methods
  refreshToken: TokenService.refreshToken,
  clearTokens: TokenService.clearTokens,
  
  // Interceptor setup
  setupAuthInterceptors: AuthInterceptorService.setupAuthInterceptors
};

// Export individual services
export {
  TokenService,
  UserAuthService,
  PasswordService,
  RegistrationService,
  AuthInterceptorService
};

// Export unified service for backward compatibility
export { authService };

// Default export for backward compatibility
export default authService;
