/**
 * Dish Service
 * 
 * This file provides backward compatibility with the original dishService.js.
 * It re-exports the unified dish service from the modular architecture.
 */
import { dishService } from './dish';
import { logDebug } from '@/utils/logger';

// Log that we're using the new modular service architecture
logDebug('[DishService] Using modular dish service architecture');

// Export for named imports
export { dishService };

// Export default for backward compatibility
export default dishService;