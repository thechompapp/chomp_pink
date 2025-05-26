/**
 * Restaurant Service
 * 
 * This file provides backward compatibility with the original restaurantService.js.
 * It re-exports the unified restaurant service from the modular architecture.
 */
import { restaurantService } from './restaurant';
import { logDebug } from '@/utils/logger';

// Log that we're using the new modular service architecture
logDebug('[RestaurantService] Using modular restaurant service architecture');

// Export for named imports
export { restaurantService };

// Export default for backward compatibility
export default restaurantService;