/**
 * Cleanup Rules Index
 * 
 * Central export for all cleanup rules organized by resource type.
 * This replaces the monolithic CLEANUP_RULES object from cleanupService.js
 */

import { restaurantRules } from './RestaurantRules.js';
import { dishRules } from './DishRules.js';
import { neighborhoodRules } from './NeighborhoodRules.js';
import { cityRules } from './CityRules.js';
import { userRules } from './UserRules.js';
import { hashtagRules } from './HashtagRules.js';
import { submissionRules } from './SubmissionRules.js';
import { restaurantChainRules } from './RestaurantChainRules.js';

export const CLEANUP_RULES = {
  restaurants: restaurantRules,
  dishes: dishRules,
  neighborhoods: neighborhoodRules,
  cities: cityRules,
  users: userRules,
  hashtags: hashtagRules,
  submissions: submissionRules,
  restaurant_chains: restaurantChainRules
};

// Individual exports for direct access
export {
  restaurantRules,
  dishRules,
  neighborhoodRules,
  cityRules,
  userRules,
  hashtagRules,
  submissionRules,
  restaurantChainRules
}; 