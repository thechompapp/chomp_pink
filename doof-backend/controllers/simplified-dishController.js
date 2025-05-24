/**
 * Simplified Dish Controller
 * 
 * This is a simplified version of the dish controller that works with
 * our database schema for E2E testing.
 */

import * as DishModel from '../models/simplified-dishModel.js';

/**
 * Get all dishes with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllDishes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sort = 'created_at', 
      order = 'desc', 
      search,
      restaurant_id 
    } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      order,
      search,
      restaurant_id: restaurant_id ? parseInt(restaurant_id, 10) : null
    };
    
    const result = await DishModel.findAllDishes(options);
    
    res.status(200).json({
      success: true,
      data: {
        dishes: result.dishes,
        pagination: {
          total: result.total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(result.total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getAllDishes controller:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Get a dish by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dish ID'
      });
    }
    
    const dish = await DishModel.findDishById(parseInt(id, 10));
    
    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (error) {
    console.error(`Error in getDishById controller for ID ${req.params.id}:`, error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Create a new dish
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createDish = async (req, res) => {
  try {
    const { name, description, price, category, restaurant_id } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Dish name is required'
      });
    }
    
    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required'
      });
    }
    
    // Get user ID from authenticated user if available
    const created_by = req.user ? req.user.id : null;
    
    const dishData = {
      name,
      description,
      price: parseFloat(price) || 0,
      category,
      restaurant_id: parseInt(restaurant_id, 10),
      created_by
    };
    
    const dish = await DishModel.createDish(dishData);
    
    res.status(201).json({
      success: true,
      message: 'Dish created successfully',
      data: dish
    });
  } catch (error) {
    console.error('Error in createDish controller:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Update a dish
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, restaurant_id } = req.body;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dish ID'
      });
    }
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (restaurant_id !== undefined) updateData.restaurant_id = parseInt(restaurant_id, 10);
    
    const dish = await DishModel.updateDish(parseInt(id, 10), updateData);
    
    res.status(200).json({
      success: true,
      message: 'Dish updated successfully',
      data: dish
    });
  } catch (error) {
    console.error(`Error in updateDish controller for ID ${req.params.id}:`, error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Delete a dish
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dish ID'
      });
    }
    
    await DishModel.deleteDish(parseInt(id, 10));
    
    res.status(200).json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    console.error(`Error in deleteDish controller for ID ${req.params.id}:`, error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};
