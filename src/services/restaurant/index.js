/**
 * Restaurant Service Module
 * 
 * Unified export for all restaurant-related services.
 * Provides a backward-compatible API while using the new modular services internally.
 */
import { restaurantCrudService } from './RestaurantCrudService';
import { restaurantSearchService } from './RestaurantSearchService';
import { restaurantReviewService } from './RestaurantReviewService';
import { logDebug } from '@/utils/logger';

/**
 * Unified restaurant service that maintains backward compatibility
 * while using the new modular services internally.
 */
export const restaurantService = {
  // CRUD operations
  getRestaurantDetails: restaurantCrudService.getRestaurantDetails.bind(restaurantCrudService),
  getRestaurantById: restaurantCrudService.getRestaurantById.bind(restaurantCrudService),
  getRestaurantsByIds: restaurantCrudService.getRestaurantsByIds.bind(restaurantCrudService),
  createRestaurant: restaurantCrudService.createRestaurant.bind(restaurantCrudService),
  updateRestaurant: restaurantCrudService.updateRestaurant.bind(restaurantCrudService),
  deleteRestaurant: restaurantCrudService.deleteRestaurant.bind(restaurantCrudService),
  getFeaturedRestaurants: restaurantCrudService.getFeaturedRestaurants.bind(restaurantCrudService),
  getPopularRestaurants: restaurantCrudService.getPopularRestaurants.bind(restaurantCrudService),
  
  // Search operations
  searchRestaurants: restaurantSearchService.searchRestaurants.bind(restaurantSearchService),
  getRestaurantSuggestions: restaurantSearchService.getRestaurantSuggestions.bind(restaurantSearchService),
  searchRestaurantsByLocation: restaurantSearchService.searchRestaurantsByLocation.bind(restaurantSearchService),
  searchRestaurantsByCuisine: restaurantSearchService.searchRestaurantsByCuisine.bind(restaurantSearchService),
  getSimilarRestaurants: restaurantSearchService.getSimilarRestaurants.bind(restaurantSearchService),
  getTrendingRestaurants: restaurantSearchService.getTrendingRestaurants.bind(restaurantSearchService),
  
  // Review operations
  getRestaurantReviews: restaurantReviewService.getRestaurantReviews.bind(restaurantReviewService),
  addRestaurantReview: restaurantReviewService.addRestaurantReview.bind(restaurantReviewService),
  updateRestaurantReview: restaurantReviewService.updateRestaurantReview.bind(restaurantReviewService),
  deleteRestaurantReview: restaurantReviewService.deleteRestaurantReview.bind(restaurantReviewService),
  getRestaurantRatingSummary: restaurantReviewService.getRestaurantRatingSummary.bind(restaurantReviewService),
  voteOnReview: restaurantReviewService.voteOnReview.bind(restaurantReviewService),
  reportReview: restaurantReviewService.reportReview.bind(restaurantReviewService)
};

// Export individual services for direct use
export { 
  restaurantCrudService,
  restaurantSearchService,
  restaurantReviewService
};
