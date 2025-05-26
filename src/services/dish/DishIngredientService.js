/**
 * Dish Ingredient Service
 * 
 * Handles operations related to dish ingredients, allergens, and nutritional information.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * Dish Ingredient Service class
 */
class DishIngredientService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/dishes');
  }
  
  /**
   * Get ingredients for a dish
   * @param {string|number} dishId - Dish ID
   * @returns {Promise<Object>} Response with ingredients
   */
  async getDishIngredients(dishId) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: []
      };
    }
    
    logDebug(`[DishIngredientService] Getting ingredients for dish ID: ${dishId}`);
    
    try {
      const result = await this.get(`/${dishId}/ingredients`);
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[DishIngredientService] No ingredients found for dish ID: ${dishId}`);
        return {
          success: false,
          message: 'No ingredients found for this dish',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Ingredients retrieved successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error getting dish ingredients:`, error);
      return {
        success: false,
        message: 'Failed to retrieve dish ingredients',
        data: []
      };
    }
  }
  
  /**
   * Update ingredients for a dish
   * @param {string|number} dishId - Dish ID
   * @param {Array<Object>} ingredients - Array of ingredient objects
   * @returns {Promise<Object>} Response with updated ingredients
   */
  async updateDishIngredients(dishId, ingredients) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: null
      };
    }
    
    if (!Array.isArray(ingredients)) {
      return {
        success: false,
        message: 'Ingredients must be an array',
        data: null
      };
    }
    
    logDebug(`[DishIngredientService] Updating ingredients for dish ID: ${dishId}`);
    
    try {
      const result = await this.put(`/${dishId}/ingredients`, { ingredients });
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: 'Failed to update ingredients',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Ingredients updated successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error updating dish ingredients:`, error);
      return {
        success: false,
        message: 'Failed to update ingredients',
        data: null
      };
    }
  }
  
  /**
   * Get allergens for a dish
   * @param {string|number} dishId - Dish ID
   * @returns {Promise<Object>} Response with allergens
   */
  async getDishAllergens(dishId) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: []
      };
    }
    
    logDebug(`[DishIngredientService] Getting allergens for dish ID: ${dishId}`);
    
    try {
      const result = await this.get(`/${dishId}/allergens`);
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[DishIngredientService] No allergens found for dish ID: ${dishId}`);
        return {
          success: false,
          message: 'No allergens found for this dish',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Allergens retrieved successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error getting dish allergens:`, error);
      return {
        success: false,
        message: 'Failed to retrieve dish allergens',
        data: []
      };
    }
  }
  
  /**
   * Update allergens for a dish
   * @param {string|number} dishId - Dish ID
   * @param {Array<Object>} allergens - Array of allergen objects
   * @returns {Promise<Object>} Response with updated allergens
   */
  async updateDishAllergens(dishId, allergens) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: null
      };
    }
    
    if (!Array.isArray(allergens)) {
      return {
        success: false,
        message: 'Allergens must be an array',
        data: null
      };
    }
    
    logDebug(`[DishIngredientService] Updating allergens for dish ID: ${dishId}`);
    
    try {
      const result = await this.put(`/${dishId}/allergens`, { allergens });
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: 'Failed to update allergens',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Allergens updated successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error updating dish allergens:`, error);
      return {
        success: false,
        message: 'Failed to update allergens',
        data: null
      };
    }
  }
  
  /**
   * Get nutritional information for a dish
   * @param {string|number} dishId - Dish ID
   * @returns {Promise<Object>} Response with nutritional information
   */
  async getDishNutrition(dishId) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: null
      };
    }
    
    logDebug(`[DishIngredientService] Getting nutrition info for dish ID: ${dishId}`);
    
    try {
      const result = await this.get(`/${dishId}/nutrition`);
      
      if (!result.success || !result.data) {
        logWarn(`[DishIngredientService] No nutrition info found for dish ID: ${dishId}`);
        return {
          success: false,
          message: 'No nutrition information found for this dish',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Nutrition information retrieved successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error getting dish nutrition info:`, error);
      return {
        success: false,
        message: 'Failed to retrieve nutrition information',
        data: null
      };
    }
  }
  
  /**
   * Update nutritional information for a dish
   * @param {string|number} dishId - Dish ID
   * @param {Object} nutritionData - Nutritional information
   * @returns {Promise<Object>} Response with updated nutritional information
   */
  async updateDishNutrition(dishId, nutritionData) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: null
      };
    }
    
    if (!nutritionData || typeof nutritionData !== 'object') {
      return {
        success: false,
        message: 'Invalid nutrition data',
        data: null
      };
    }
    
    logDebug(`[DishIngredientService] Updating nutrition info for dish ID: ${dishId}`);
    
    try {
      const result = await this.put(`/${dishId}/nutrition`, nutritionData);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: 'Failed to update nutrition information',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Nutrition information updated successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error updating dish nutrition info:`, error);
      return {
        success: false,
        message: 'Failed to update nutrition information',
        data: null
      };
    }
  }
  
  /**
   * Get dishes by ingredient
   * @param {string} ingredientName - Ingredient name
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with dishes
   */
  async getDishesByIngredient(ingredientName, { page = 1, limit = 20 } = {}) {
    if (!ingredientName) {
      return {
        success: false,
        message: 'Ingredient name is required',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[DishIngredientService] Finding dishes with ingredient: ${ingredientName}`);
    
    try {
      const result = await this.get('/by-ingredient', {
        params: {
          ingredient: ingredientName,
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishIngredientService] No dishes found with ingredient: ${ingredientName}`);
        return {
          success: false,
          message: `No dishes found with ingredient: ${ingredientName}`,
          data: {
            dishes: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes found successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error finding dishes by ingredient:`, error);
      return {
        success: false,
        message: 'Failed to find dishes by ingredient',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Get dishes without specific allergens
   * @param {Array<string>} allergens - Array of allergen names to exclude
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Response with dishes
   */
  async getDishesByExcludedAllergens(allergens, { page = 1, limit = 20 } = {}) {
    if (!Array.isArray(allergens) || allergens.length === 0) {
      return {
        success: false,
        message: 'Allergens must be a non-empty array',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[DishIngredientService] Finding dishes without allergens: ${allergens.join(', ')}`);
    
    try {
      const result = await this.get('/without-allergens', {
        params: {
          allergens: allergens.join(','),
          page,
          limit
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.dishes)) {
        logWarn(`[DishIngredientService] No dishes found without specified allergens`);
        return {
          success: false,
          message: 'No dishes found without specified allergens',
          data: {
            dishes: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Dishes found successfully'
      };
    } catch (error) {
      logError(`[DishIngredientService] Error finding dishes by excluded allergens:`, error);
      return {
        success: false,
        message: 'Failed to find dishes by excluded allergens',
        data: {
          dishes: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
}

// Create and export a singleton instance
export const dishIngredientService = new DishIngredientService();

export default DishIngredientService;
