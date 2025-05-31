/**
 * Authentication Service
 * 
 * This file provides backward compatibility with the original authService.js.
 * It re-exports the consolidated auth service.
 */
import authService from './auth/authService';
import { logDebug } from '@/utils/logger';

// Log that we're using the consolidated auth service
logDebug('[AuthService] Using consolidated auth service');

// Export for named imports
export { authService };

// Export default for backward compatibility
export default authService;
