/**
 * Authentication Service
 * 
 * This file provides backward compatibility with the original authService.js.
 * It re-exports the unified auth service from the modular architecture.
 */
import { authService } from './auth';
import { logDebug } from '@/utils/logger';

// Log that we're using the new modular service architecture
logDebug('[AuthService] Using modular auth service architecture');

// Export for named imports
export { authService };

// Export default for backward compatibility
export default authService;
