/**
 * Dish Service Module
 * 
 * Unified export for all dish-related services.
 * Provides a backward-compatible API while using the new modular services internally.
 */
import { dishCrudService } from './DishCrudService';
import { dishSearchService } from './DishSearchService';
import { dishReviewService } from './DishReviewService';
import { dishIngredientService } from './DishIngredientService';
import { logDebug } from '@/utils/logger';

/**
 * Unified dish service that maintains backward compatibility
 * while using the new modular services internally.
 */
export const dishService = {
  // CRUD operations
  getDishDetails: dishCrudService.getDishDetails.bind(dishCrudService),
  getDishesByIds: dishCrudService.getDishesByIds.bind(dishCrudService),
  getDishesByRestaurantId: dishCrudService.getDishesByRestaurantId.bind(dishCrudService),
  createDish: dishCrudService.createDish.bind(dishCrudService),
  updateDish: dishCrudService.updateDish.bind(dishCrudService),
  deleteDish: dishCrudService.deleteDish.bind(dishCrudService),
  getFeaturedDishes: dishCrudService.getFeaturedDishes.bind(dishCrudService),
  getPopularDishes: dishCrudService.getPopularDishes.bind(dishCrudService),
  
  // Search operations
  searchDishes: dishSearchService.searchDishes.bind(dishSearchService),
  getDishSuggestions: dishSearchService.getDishSuggestions.bind(dishSearchService),
  searchDishesByCuisine: dishSearchService.searchDishesByCuisine.bind(dishSearchService),
  getSimilarDishes: dishSearchService.getSimilarDishes.bind(dishSearchService),
  getTrendingDishes: dishSearchService.getTrendingDishes.bind(dishSearchService),
  searchDishesByPriceRange: dishSearchService.searchDishesByPriceRange.bind(dishSearchService),
  searchDishesByDietaryRestrictions: dishSearchService.searchDishesByDietaryRestrictions.bind(dishSearchService),
  
  // Review operations
  getDishReviews: dishReviewService.getDishReviews.bind(dishReviewService),
  addDishReview: dishReviewService.addDishReview.bind(dishReviewService),
  updateDishReview: dishReviewService.updateDishReview.bind(dishReviewService),
  deleteDishReview: dishReviewService.deleteDishReview.bind(dishReviewService),
  getDishRatingSummary: dishReviewService.getDishRatingSummary.bind(dishReviewService),
  getTopRatedDishes: dishReviewService.getTopRatedDishes.bind(dishReviewService),
  reactToDishReview: dishReviewService.reactToDishReview.bind(dishReviewService),
  removeReactionFromDishReview: dishReviewService.removeReactionFromDishReview.bind(dishReviewService),
  
  // Ingredient operations
  getDishIngredients: dishIngredientService.getDishIngredients.bind(dishIngredientService),
  updateDishIngredients: dishIngredientService.updateDishIngredients.bind(dishIngredientService),
  getDishAllergens: dishIngredientService.getDishAllergens.bind(dishIngredientService),
  updateDishAllergens: dishIngredientService.updateDishAllergens.bind(dishIngredientService),
  getDishNutrition: dishIngredientService.getDishNutrition.bind(dishIngredientService),
  updateDishNutrition: dishIngredientService.updateDishNutrition.bind(dishIngredientService),
  getDishesByIngredient: dishIngredientService.getDishesByIngredient.bind(dishIngredientService),
  getDishesByExcludedAllergens: dishIngredientService.getDishesByExcludedAllergens.bind(dishIngredientService)
};

// Export individual services for direct use
export { 
  dishCrudService,
  dishSearchService,
  dishReviewService,
  dishIngredientService
};

